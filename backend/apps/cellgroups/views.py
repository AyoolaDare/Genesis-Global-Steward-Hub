from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from core.permissions import IsAdmin, IsCellAdmin
from .models import CellGroup, CellGroupMember
from .serializers import (
    CellGroupListSerializer, CellGroupDetailSerializer,
    CellGroupCreateSerializer, DisbandSerializer, AddMembersSerializer,
)


CELL_MANAGER_MEMBER_ROLES = {
    CellGroupMember.Role.LEADER,
    CellGroupMember.Role.ASSISTANT,
}


def _get_cell_role(user, group):
    if user.role == 'ADMIN':
        return 'ADMIN'
    if not user.person_id:
        return None
    membership = CellGroupMember.objects.filter(
        cell_group=group,
        person_id=user.person_id,
        is_active=True,
        role__in=CELL_MANAGER_MEMBER_ROLES,
    ).first()
    return membership.role if membership else None


class CellGroupViewSet(viewsets.ModelViewSet):
    queryset = CellGroup.objects.filter(status__in=['ACTIVE', 'SUSPENDED'])
    permission_classes = [IsCellAdmin | IsAdmin]

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy', 'disband'):
            return [IsAdmin()]
        return [(IsCellAdmin | IsAdmin)()]

    def get_serializer_class(self):
        if self.action == 'list':   return CellGroupListSerializer
        if self.action == 'create': return CellGroupCreateSerializer
        return CellGroupDetailSerializer

    def get_queryset(self):
        qs   = super().get_queryset()
        user = self.request.user
        if user.role in ('CELL_LEADER', 'CELL_ASST'):
            if not user.person_id:
                return qs.none()
            qs = qs.filter(
                members__person_id=user.person_id,
                members__is_active=True,
                members__role__in=CELL_MANAGER_MEMBER_ROLES,
            ).distinct()
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def disband(self, request, pk=None):
        group      = self.get_object()
        serializer = DisbandSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        group.status           = CellGroup.Status.DISBANDED
        group.disbanded_at     = timezone.now()
        group.disbanded_reason = serializer.validated_data['reason']
        group.save(update_fields=['status', 'disbanded_at', 'disbanded_reason', 'updated_at'])
        group.members.filter(is_active=True).update(is_active=False, left_date=timezone.now().date())
        return Response(CellGroupDetailSerializer(group).data)

    @action(detail=True, methods=['post'])
    def add_members(self, request, pk=None):
        group      = self.get_object()
        if request.user.role != 'ADMIN' and group.status != CellGroup.Status.ACTIVE:
            return Response(
                {'error': 'This group is not active. Member changes are disabled.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = AddMembersSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        from apps.persons.models import Person
        added = []
        for pid in serializer.validated_data['person_ids']:
            try:
                person = Person.objects.get(pk=pid, deleted_at__isnull=True)
                member, created = CellGroupMember.objects.get_or_create(
                    cell_group=group, person=person,
                    defaults={
                        'added_by': request.user,
                        'added_via': (
                            CellGroupMember.AddedVia.ADMIN
                            if request.user.role == 'ADMIN'
                            else CellGroupMember.AddedVia.PHONE_SEARCH
                        ),
                        'is_active': True,
                    }
                )
                if not created and not member.is_active:
                    member.is_active = True
                    member.left_date = None
                    member.added_by = request.user
                    member.added_via = (
                        CellGroupMember.AddedVia.ADMIN
                        if request.user.role == 'ADMIN'
                        else CellGroupMember.AddedVia.PHONE_SEARCH
                    )
                    member.save(update_fields=['is_active', 'left_date', 'added_by', 'added_via'])
                added.append(str(pid))
            except Person.DoesNotExist:
                pass
        return Response({'added': added, 'count': len(added)})

    @action(detail=True, methods=['patch'], url_path='members/(?P<person_id>[^/.]+)/role',
            permission_classes=[IsAdmin])
    def update_member_role(self, request, pk=None, person_id=None):
        group = self.get_object()
        role = request.data.get('role')
        valid_roles = [CellGroupMember.Role.MEMBER, CellGroupMember.Role.LEADER, CellGroupMember.Role.ASSISTANT]
        if role not in valid_roles:
            return Response({'error': f'Role must be one of: {", ".join(valid_roles)}.'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            member = CellGroupMember.objects.get(cell_group=group, person_id=person_id, is_active=True)
            member.role = role
            member.save(update_fields=['role'])
            return Response({'person_id': str(person_id), 'role': member.role})
        except CellGroupMember.DoesNotExist:
            return Response({'error': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['delete'], url_path='members/(?P<person_id>[^/.]+)')
    def remove_member(self, request, pk=None, person_id=None):
        group = self.get_object()
        user_role = _get_cell_role(request.user, group)
        if request.user.role != 'ADMIN' and user_role != CellGroupMember.Role.LEADER:
            return Response(
                {'error': 'Only the Cell Leader can remove members from this group.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            member = CellGroupMember.objects.get(cell_group=group, person_id=person_id)
            member.is_active = False
            member.left_date = timezone.now().date()
            member.save(update_fields=['is_active', 'left_date'])
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CellGroupMember.DoesNotExist:
            return Response({'error': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)
