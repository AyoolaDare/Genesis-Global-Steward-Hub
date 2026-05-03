"""Department API views — scoped per executive role per spec."""
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsAdmin, IsDeptLeader
from .models import (
    Department, DepartmentExecutive, DepartmentMember,
    DepartmentSession, AttendanceRecord, DepartmentMessage,
)
from .serializers import (
    DepartmentListSerializer, DepartmentDetailSerializer, DepartmentCreateSerializer,
    DepartmentExecutiveSerializer, GrantExecutiveSerializer, RevokeExecutiveSerializer,
    DepartmentMemberSerializer, AddMemberSerializer, RemoveMemberSerializer,
    DepartmentSessionSerializer, CreateSessionSerializer,
    DepartmentMessageSerializer, DepartmentMessagePublicSerializer,
    CreateMessageSerializer, RejectMessageSerializer,
)
from .services import MessageService, LeaderboardService


SystemUser = get_user_model()


# ── Permission helpers ─────────────────────────────────────────────────────────

def _get_exec_role(request, department):
    """
    Return the DepartmentExecutive role for this user in this dept.
    Primary: DepartmentExecutive table (post-overhaul).
    Fallback: infer from SystemUser.role ONLY when the user's formally assigned
    department matches — prevents a legacy HOD account from gaining exec rights
    across departments they were never explicitly granted (A01 Broken Access Control).
    """
    exec_obj = request.user.executive_access.filter(
        department=department, is_active=True
    ).first()
    if exec_obj:
        return exec_obj.role

    # Fallback only when this is the user's explicitly assigned department
    if (
        request.user.department_id
        and str(request.user.department_id) == str(department.pk)
    ):
        role_map = {
            'HOD':      DepartmentExecutive.Role.HOD,
            'ASST_HOD': DepartmentExecutive.Role.ASST_HOD,
            'WELFARE':  DepartmentExecutive.Role.WELFARE,
            'PRO':      DepartmentExecutive.Role.PRO,
        }
        return role_map.get(request.user.role)

    return None


def _require_roles(request, department, allowed_roles):
    """Return 403 Response if user's exec role is not in allowed_roles, else None."""
    if request.user.role == 'ADMIN':
        return None  # Admin bypasses
    role = _get_exec_role(request, department)
    if role not in allowed_roles:
        return Response(
            {'error': 'Your executive role does not permit this action.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    return None


def _build_unique_username(person):
    first = (person.first_name or '').strip().lower()
    last  = (person.last_name or '').strip().lower()
    base  = '_'.join(part for part in [first, last] if part) or f'user_{str(person.id)[:8]}'

    # Fetch all conflicting usernames in one query instead of one query per suffix
    existing = set(
        SystemUser.objects
        .filter(username__startswith=base)
        .exclude(person=person)
        .values_list('username', flat=True)
    )
    if base not in existing:
        return base
    suffix = 1
    while f'{base}_{suffix}' in existing:
        suffix += 1
    return f'{base}_{suffix}'


def _build_placeholder_email(person):
    local = _build_unique_username(person).replace('_', '.')
    email = f'{local}@local.steward'
    suffix = 1
    while SystemUser.objects.filter(email__iexact=email).exclude(person=person).exists():
        suffix += 1
        email = f'{local}.{suffix}@local.steward'
    return email


def _resolve_login_email(person):
    """Return person.email if it is not already taken by another user, else a placeholder."""
    if person.email:
        taken = SystemUser.objects.filter(
            email__iexact=person.email
        ).exclude(person=person).exists()
        if not taken:
            return person.email
    return _build_placeholder_email(person)


def _ensure_exec_system_user(person, department, role):
    user = getattr(person, 'system_user', None)
    login_email = _resolve_login_email(person)
    if user is None:
        user = SystemUser(
            person=person,
            email=login_email,
            username=_build_unique_username(person),
            role=role,
            department=department,
            module_access=[],
            is_active=True,
            must_reset_password=True,
        )
        user.set_unusable_password()
        user.save()
        return user

    user.email = login_email
    if not user.username:
        user.username = _build_unique_username(person)
    user.role = role
    user.department = department
    user.is_active = True
    user.must_reset_password = True
    user.save(update_fields=[
        'email', 'username', 'role', 'department',
        'is_active', 'must_reset_password', 'updated_at',
    ])
    return user


# ── Main ViewSet ───────────────────────────────────────────────────────────────

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset           = Department.objects.filter(is_active=True)
    permission_classes = [IsDeptLeader | IsAdmin]

    # Roles that grant portal access
    PORTAL_ROLES = {r.value for r in DepartmentExecutive.Role}

    def get_serializer_class(self):
        if self.action == 'list':   return DepartmentListSerializer
        if self.action == 'create': return DepartmentCreateSerializer
        return DepartmentDetailSerializer

    def get_queryset(self):
        qs   = super().get_queryset()
        user = self.request.user
        if user.role in ('HOD', 'ASST_HOD', 'WELFARE', 'PRO'):
            # Scope to departments where this user holds an executive role
            if user.person_id:
                dept_ids = list(DepartmentExecutive.objects.filter(
                    person_id=user.person_id,
                    is_active=True,
                ).values_list('department_id', flat=True))
                if dept_ids:
                    return qs.filter(pk__in=dept_ids)
                # Fall through to department_id if no exec records yet (legacy accounts)
            if user.department_id:
                return qs.filter(pk=user.department_id)
            return qs.none()
        return qs

    def get_permissions(self):
        if self.action in ('create', 'destroy', 'grant_executive', 'revoke_executive'):
            return [IsAdmin()]
        return [(IsDeptLeader | IsAdmin)()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    # ── Executive management (Admin only) ─────────────────────────────────────

    @action(detail=True, methods=['post'], url_path='grant_executive')
    def grant_executive(self, request, pk=None):
        """Admin grants portal access to a department member."""
        dept       = self.get_object()
        serializer = GrantExecutiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        from apps.persons.models import Person
        try:
            person = Person.objects.get(pk=data['person_id'], deleted_at__isnull=True)
        except Person.DoesNotExist:
            return Response({'error': 'Person not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            system_user = _ensure_exec_system_user(person, dept, data['role'])
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        # One row per department+role exists in practice because of the DB constraint.
        existing = DepartmentExecutive.objects.filter(
            department=dept, role=data['role']
        ).first()
        if existing and existing.is_active:
            if str(existing.person_id) == str(person.id):
                existing.system_user = system_user
                existing.granted_by = request.user
                existing.revoked_at = None
                existing.is_active = True
                existing.save(update_fields=[
                    'system_user', 'granted_by', 'revoked_at', 'is_active',
                ])
                return Response(DepartmentExecutiveSerializer(existing).data, status=status.HTTP_200_OK)
            return Response(
                {
                    'error': (
                        f"The role {data['role']} is already held by "
                        f"{existing.person.full_name}. Revoke first."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        if existing:
            existing.person = person
            existing.system_user = system_user
            existing.is_active = True
            existing.revoked_at = None
            existing.granted_by = request.user
            existing.save(update_fields=[
                'person', 'system_user', 'is_active', 'revoked_at', 'granted_by',
            ])
            return Response(DepartmentExecutiveSerializer(existing).data, status=status.HTTP_200_OK)

        try:
            exec_obj = DepartmentExecutive.objects.create(
                department=dept,
                person=person,
                role=data['role'],
                system_user=system_user,
                is_active=True,
                revoked_at=None,
                granted_by=request.user,
            )
        except IntegrityError:
            return Response(
                {'error': 'This executive role could not be assigned because the slot already exists. Revoke and retry.'},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(DepartmentExecutiveSerializer(exec_obj).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='revoke_executive')
    def revoke_executive(self, request, pk=None):
        """Admin revokes portal access from a department executive."""
        dept       = self.get_object()
        serializer = RevokeExecutiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            exec_obj = DepartmentExecutive.objects.get(
                department=dept,
                person_id=serializer.validated_data['person_id'],
                is_active=True,
            )
        except DepartmentExecutive.DoesNotExist:
            return Response({'error': 'Executive not found.'}, status=status.HTTP_404_NOT_FOUND)

        exec_obj.is_active  = False
        exec_obj.revoked_at = timezone.now()
        exec_obj.save(update_fields=['is_active', 'revoked_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── Member management ─────────────────────────────────────────────────────

    @action(detail=True, methods=['get'], url_path='members')
    def list_members(self, request, pk=None):
        dept    = self.get_object()
        members = dept.members.filter(is_active=True).select_related('person')
        return Response(DepartmentMemberSerializer(members, many=True).data)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """All exec roles can add members."""
        dept       = self.get_object()
        serializer = AddMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        from apps.persons.models import Person
        try:
            person = Person.objects.get(pk=data['person_id'], deleted_at__isnull=True)
        except Person.DoesNotExist:
            return Response({'error': 'Person not found.'}, status=status.HTTP_404_NOT_FOUND)

        member, created = DepartmentMember.objects.get_or_create(
            department=dept,
            person=person,
            defaults={
                'role':     data.get('role', 'MEMBER'),
                'notes':    data.get('notes', ''),
                'added_by': request.user,
            },
        )
        if not created and not member.is_active:
            member.is_active  = True
            member.left_date  = None
            member.added_by   = request.user
            member.save(update_fields=['is_active', 'left_date', 'added_by'])

        return Response(DepartmentMemberSerializer(member).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='members/(?P<person_id>[^/.]+)')
    def remove_member(self, request, pk=None, person_id=None):
        """Only HOD and ASST_HOD can remove members."""
        dept = self.get_object()
        err  = _require_roles(request, dept, {
            DepartmentExecutive.Role.HOD, DepartmentExecutive.Role.ASST_HOD
        })
        if err:
            return err

        serializer = RemoveMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            member = DepartmentMember.objects.get(department=dept, person_id=person_id, is_active=True)
        except DepartmentMember.DoesNotExist:
            return Response({'error': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)

        member.is_active      = False
        member.left_date      = timezone.now().date()
        member.removal_reason = serializer.validated_data['reason']
        member.removed_by     = request.user
        member.save(update_fields=['is_active', 'left_date', 'removal_reason', 'removed_by'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── Attendance / sessions ─────────────────────────────────────────────────

    @action(detail=True, methods=['get', 'post'], url_path='sessions')
    def sessions(self, request, pk=None):
        dept = self.get_object()

        if request.method == 'GET':
            qs = dept.sessions.order_by('-session_date').prefetch_related('records')
            return Response(DepartmentSessionSerializer(qs, many=True).data)

        # POST — mark attendance (HOD, ASST_HOD, WELFARE only; PRO cannot)
        err = _require_roles(request, dept, {
            DepartmentExecutive.Role.HOD,
            DepartmentExecutive.Role.ASST_HOD,
            DepartmentExecutive.Role.WELFARE,
        })
        if err:
            return err

        serializer = CreateSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        session = DepartmentSession.objects.create(
            department   = dept,
            session_name = data['session_name'],
            session_date = data['session_date'],
            session_type = data['session_type'],
            notes        = data.get('notes', ''),
            created_by   = request.user,
        )
        AttendanceRecord.objects.bulk_create([
            AttendanceRecord(
                session       = session,
                department    = dept,
                person_id     = rec['person_id'],
                status        = rec['status'],
                excuse_reason = rec.get('excuse_reason', ''),
                marked_by     = request.user,
            )
            for rec in data['records']
        ])
        return Response(DepartmentSessionSerializer(session).data, status=status.HTTP_201_CREATED)

    # ── Dashboard ─────────────────────────────────────────────────────────────

    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        dept = self.get_object()
        return Response(LeaderboardService.dashboard_stats(dept))

    # ── Leaderboards ──────────────────────────────────────────────────────────

    @action(detail=True, methods=['get'], url_path='leaderboard/regular')
    def leaderboard_regular(self, request, pk=None):
        dept   = self.get_object()
        try:
            months = min(max(int(request.query_params.get('months', 3)), 1), 24)
        except (ValueError, TypeError):
            months = 3
        return Response(LeaderboardService.top_attendance(dept.pk, months=months))

    @action(detail=True, methods=['get'], url_path='leaderboard/training')
    def leaderboard_training(self, request, pk=None):
        dept   = self.get_object()
        try:
            months = min(max(int(request.query_params.get('months', 3)), 1), 24)
        except (ValueError, TypeError):
            months = 3
        return Response(
            LeaderboardService.top_attendance(dept.pk, session_type='TRAINING', months=months)
        )

    @action(detail=True, methods=['get'])
    def alerts(self, request, pk=None):
        """Absence alerts — not visible to PRO."""
        dept = self.get_object()
        err  = _require_roles(request, dept, {
            DepartmentExecutive.Role.HOD,
            DepartmentExecutive.Role.ASST_HOD,
            DepartmentExecutive.Role.WELFARE,
        })
        if err:
            return err
        return Response(LeaderboardService.absence_alerts(dept.pk))

    # ── Messaging ─────────────────────────────────────────────────────────────

    @action(detail=True, methods=['get', 'post'], url_path='messages')
    def messages(self, request, pk=None):
        dept = self.get_object()

        if request.method == 'GET':
            user_role = _get_exec_role(request, dept)
            is_admin  = request.user.role == 'ADMIN'
            can_see_all = is_admin or user_role in (
                DepartmentExecutive.Role.HOD,
                DepartmentExecutive.Role.ASST_HOD,
                DepartmentExecutive.Role.WELFARE,
            )
            if can_see_all:
                msgs = dept.messages.all()
                return Response(DepartmentMessageSerializer(msgs, many=True).data)
            # PRO: only approved/sent messages, no internal review metadata
            msgs = dept.messages.filter(
                approval_stage__in=[
                    DepartmentMessage.ApprovalStage.APPROVED,
                    DepartmentMessage.ApprovalStage.SENT,
                ]
            )
            return Response(DepartmentMessagePublicSerializer(msgs, many=True).data)

        # POST — create a draft
        serializer = CreateMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        msg = DepartmentMessage.objects.create(
            department      = dept,
            subject         = data['subject'],
            body            = data['body'],
            message_type    = data['message_type'],
            priority        = data.get('priority', 'NORMAL'),
            recipient_scope = data.get('recipient_scope', 'ALL'),
            created_by      = request.user,
        )
        return Response(DepartmentMessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(
        detail=True, methods=['post'],
        url_path='messages/(?P<msg_id>[^/.]+)/submit'
    )
    def message_submit(self, request, pk=None, msg_id=None):
        dept = self.get_object()
        msg  = self._get_message(dept, msg_id)
        if not msg:
            return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            MessageService.submit(msg, request.user)
        except (PermissionError, ValueError) as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(DepartmentMessageSerializer(msg).data)

    @action(
        detail=True, methods=['post'],
        url_path='messages/(?P<msg_id>[^/.]+)/approve_l1'
    )
    def message_approve_l1(self, request, pk=None, msg_id=None):
        dept = self.get_object()
        err  = _require_roles(request, dept, {
            DepartmentExecutive.Role.HOD, DepartmentExecutive.Role.ASST_HOD
        })
        if err:
            return err
        msg = self._get_message(dept, msg_id)
        if not msg:
            return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            MessageService.level1_approve(msg, request.user)
        except (PermissionError, ValueError) as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(DepartmentMessageSerializer(msg).data)

    @action(
        detail=True, methods=['post'],
        url_path='messages/(?P<msg_id>[^/.]+)/reject_l1'
    )
    def message_reject_l1(self, request, pk=None, msg_id=None):
        dept = self.get_object()
        err  = _require_roles(request, dept, {
            DepartmentExecutive.Role.HOD, DepartmentExecutive.Role.ASST_HOD
        })
        if err:
            return err
        msg = self._get_message(dept, msg_id)
        if not msg:
            return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = RejectMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            MessageService.level1_reject(msg, request.user, serializer.validated_data['reason'])
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(DepartmentMessageSerializer(msg).data)

    @action(
        detail=True, methods=['post'],
        url_path='messages/(?P<msg_id>[^/.]+)/approve_admin',
        permission_classes=[IsAdmin],
    )
    def message_approve_admin(self, request, pk=None, msg_id=None):
        dept = self.get_object()
        msg  = self._get_message(dept, msg_id)
        if not msg:
            return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            MessageService.admin_approve(msg, request.user)
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(DepartmentMessageSerializer(msg).data)

    @action(
        detail=True, methods=['post'],
        url_path='messages/(?P<msg_id>[^/.]+)/reject_admin',
        permission_classes=[IsAdmin],
    )
    def message_reject_admin(self, request, pk=None, msg_id=None):
        dept       = self.get_object()
        msg        = self._get_message(dept, msg_id)
        if not msg:
            return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = RejectMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            MessageService.admin_reject(msg, request.user, serializer.validated_data['reason'])
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(DepartmentMessageSerializer(msg).data)

    def _get_message(self, dept, msg_id):
        try:
            return dept.messages.get(pk=msg_id)
        except DepartmentMessage.DoesNotExist:
            return None
