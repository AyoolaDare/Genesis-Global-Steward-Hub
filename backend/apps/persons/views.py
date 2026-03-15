from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from core.permissions import IsAdmin, IsFollowUpTeam, IsMedicalTeam, IsCellAdmin, IsDeptLeader
from core.throttles import PhoneLookupThrottle, SearchThrottle
from core.mixins import SoftDeleteMixin
from .models import Person
from .serializers import (
    PersonListSerializer, PersonDetailSerializer,
    PersonCreateSerializer, PersonUpdateSerializer,
    PhoneLookupSerializer, MergeSerializer,
)
from .services import PersonService
from .filters import PersonFilter


class PersonViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = Person.objects.filter(deleted_at__isnull=True).select_related('medical_record')
    filter_backends  = [DjangoFilterBackend]
    filterset_class  = PersonFilter

    def get_serializer_class(self):
        if self.action == 'list':    return PersonListSerializer
        if self.action == 'create':  return PersonCreateSerializer
        if self.action in ('update', 'partial_update'): return PersonUpdateSerializer
        return PersonDetailSerializer

    def get_permissions(self):
        if self.action in ('destroy', 'approve', 'merge'):
            return [IsAdmin()]
        if self.action in ('stats', 'growth'):
            return [IsAdmin()]
        return [(IsMedicalTeam | IsFollowUpTeam | IsAdmin | IsCellAdmin | IsDeptLeader)()]

    def get_queryset(self):
        qs   = super().get_queryset()
        user = self.request.user
        if user.role in ('CELL_LEADER', 'CELL_ASST'):
            from apps.cellgroups.models import CellGroupMember
            # Find the groups this user leads/assists, then return all active members
            managed_group_ids = CellGroupMember.objects.filter(
                person_id=user.person_id,
                is_active=True,
                role__in=['LEADER', 'ASSISTANT'],
            ).values_list('cell_group_id', flat=True)
            qs = qs.filter(
                cellgroup_memberships__cell_group_id__in=managed_group_ids,
                cellgroup_memberships__is_active=True,
            )
        elif user.role in ('HOD', 'ASST_HOD', 'WELFARE', 'PRO'):
            # Dept executives can search all registered church members to add to their dept
            from .models import Person
            qs = qs.filter(status__in=[
                Person.Status.NEW_MEMBER, Person.Status.MEMBER, Person.Status.WORKER
            ])
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = self._apply_person_search(qs, search)
        return qs.distinct()

    def _apply_person_search(self, qs, term: str):
        from core.utils.phone import normalize_phone

        normalized_phone = normalize_phone(term)
        digits = ''.join(ch for ch in term if ch.isdigit())

        phone_candidates = {normalized_phone} if normalized_phone else set()
        if digits and len(digits) == 10:
            phone_candidates.add(f'0{digits}')

        phone_q = Q()
        for candidate in phone_candidates:
            if candidate:
                phone_q |= Q(phone__icontains=candidate)

        text_q = (
            Q(first_name__icontains=term) |
            Q(last_name__icontains=term) |
            Q(other_names__icontains=term) |
            Q(email__icontains=term)
        )
        return qs.filter(phone_q | text_q)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def approve(self, request, pk=None):
        person = self.get_object()
        try:
            person = PersonService.approve_profile(person, approved_by=request.user)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(PersonDetailSerializer(person).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def merge(self, request, pk=None):
        serializer = MergeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = PersonService.merge_profiles(
                source_id=pk,
                target_id=serializer.validated_data['target_id'],
                merged_by=request.user,
            )
        except Person.DoesNotExist:
            return Response({'error': 'Person not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(PersonDetailSerializer(result).data)

    @action(detail=False, methods=['post'], throttle_classes=[PhoneLookupThrottle])
    def phone_lookup(self, request):
        serializer = PhoneLookupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        results = PersonService.batch_phone_lookup(serializer.validated_data['phones'])
        return Response(results)

    @action(
        detail=False, methods=['post'],
        permission_classes=[IsAdmin],
        url_path='bulk_import',
        url_name='bulk-import',
    )
    def bulk_import(self, request):
        import csv
        import io

        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response(
                {'error': 'No file uploaded. Send the CSV as form-data field "file".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not csv_file.name.lower().endswith('.csv'):
            return Response(
                {'error': 'File must be a .csv file.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if csv_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'File too large. Maximum allowed size is 5 MB.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # utf-8-sig strips the BOM character Excel adds to CSV exports
            content = csv_file.read().decode('utf-8-sig')
        except UnicodeDecodeError:
            return Response(
                {'error': 'File encoding not supported. Save the CSV as UTF-8 and try again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reader = csv.DictReader(io.StringIO(content))

        if not reader.fieldnames:
            return Response(
                {'error': 'CSV file is empty or missing a header row.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Normalise column names: strip whitespace, lowercase
        normalized_fields = [f.strip().lower() for f in reader.fieldnames]
        required_cols = {'first_name', 'last_name', 'phone'}
        missing = required_cols - set(normalized_fields)
        if missing:
            return Response(
                {'error': f'Missing required columns: {", ".join(sorted(missing))}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rows = [
            {k.strip().lower(): (v or '').strip() for k, v in row.items()}
            for row in reader
        ]

        if not rows:
            return Response(
                {'error': 'CSV has no data rows.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(rows) > 500:
            return Response(
                {'error': f'Too many rows ({len(rows)}). Maximum is 500 per import.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = PersonService.bulk_import_csv(rows=rows, imported_by=request.user)
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='board')
    def board(self, request, pk=None):
        # Use get_object() for permission/404 checking, then re-fetch with full prefetches
        self.get_object()
        person = (
            Person.objects
            .filter(pk=pk, deleted_at__isnull=True)
            .select_related('medical_record', 'worker_profile__department')
            .prefetch_related(
                'cellgroup_memberships__cell_group',
                'department_memberships__department',
            )
            .get()
        )

        cell_memberships = [
            {
                'id':         str(m.id),
                'group_id':   str(m.cell_group_id),
                'group_name': m.cell_group.name,
                'role':       m.role,
                'is_active':  m.is_active,
                'joined_date': m.joined_date,
            }
            for m in person.cellgroup_memberships.all()
        ]

        department_memberships = [
            {
                'id':              str(m.id),
                'department_id':   str(m.department_id),
                'department_name': m.department.name,
                'role':            m.role,
                'is_active':       m.is_active,
                'joined_date':     m.joined_date,
            }
            for m in person.department_memberships.all()
        ]

        # Materialise once — avoids hitting the DB twice (summary loop + [:10] slice)
        attendance_rows = list(
            person.attendance_records
            .select_related('session', 'department')
            .order_by('-created_at')
        )
        attendance_summary = {'PRESENT': 0, 'ABSENT': 0, 'EXCUSED': 0, 'LATE': 0}
        for row in attendance_rows:
            if row.status in attendance_summary:
                attendance_summary[row.status] += 1
        recent_attendance = [
            {
                'id':              str(a.id),
                'status':          a.status,
                'session_name':    a.session.session_name,
                'session_date':    a.session.session_date,
                'department_name': a.department.name,
            }
            for a in attendance_rows[:10]
        ]

        # ── Role-based data access (A01 / OWASP Broken Access Control) ──────────
        # Medical records contain PII (diagnoses, medications, vitals) — restrict
        # to roles that explicitly need clinical data.
        # Worker profile contains salary and bank details — restrict to HR / Admin.
        user_role = request.user.role
        can_see_medical = user_role in ('ADMIN', 'MEDICAL')
        can_see_worker_detail = user_role in ('ADMIN', 'HR')

        medical_record = getattr(person, 'medical_record', None)
        medical_record_data = None
        if medical_record and can_see_medical:
            medical_record_data = {
                'id':                       str(medical_record.id),
                'blood_group':              medical_record.blood_group,
                'genotype':                 medical_record.genotype,
                'allergies':                medical_record.allergies,
                'chronic_conditions':       medical_record.chronic_conditions,
                'disabilities':             medical_record.disabilities,
                'current_medications':      medical_record.current_medications,
                'preferred_hospital':       medical_record.preferred_hospital,
                'health_insurance_provider': medical_record.health_insurance_provider,
                'health_insurance_number':  medical_record.health_insurance_number,
            }

        medical_visits = []
        if can_see_medical:
            medical_visits = [
                {
                    'id':               str(v.id),
                    'visit_date':       v.visit_date,
                    'visit_type':       v.visit_type,
                    'complaint':        v.complaint,
                    'diagnosis':        v.diagnosis,
                    'treatment':        v.treatment,
                    'prescription':     v.prescription,
                    'blood_pressure':   v.blood_pressure,
                    'blood_sugar_level': v.blood_sugar_level,
                    'weight_kg':        str(v.weight_kg) if v.weight_kg is not None else '',
                    'height_cm':        str(v.height_cm) if v.height_cm is not None else '',
                    'temperature_c':    str(v.temperature_c) if v.temperature_c is not None else '',
                    'pulse_rate':       str(v.pulse_rate) if v.pulse_rate is not None else '',
                    'notes':            v.notes,
                }
                for v in person.medical_visits.order_by('-visit_date', '-created_at')[:10]
            ]

        worker = getattr(person, 'worker_profile', None)
        worker_data = None
        if worker:
            # Base fields visible to any authorised viewer (confirms worker status)
            worker_data = {
                'id':                str(worker.id),
                'worker_id':         worker.worker_id,
                'job_title':         worker.job_title,
                'employment_type':   worker.employment_type,
                'employment_status': worker.employment_status,
                'onboarding_status': worker.onboarding_status,
                'department_name':   worker.department.name if worker.department else '',
                'hire_date':         worker.hire_date,
            }
            # Salary and bank details are HR / Admin only
            if can_see_worker_detail:
                worker_data.update({
                    'salary_amount':  str(worker.salary_amount) if worker.salary_amount else None,
                    'pay_frequency':  worker.pay_frequency,
                    'bank_name':      worker.bank_name,
                    'account_number': worker.account_number,
                    'account_name':   worker.account_name,
                })

        return Response({
            'member': PersonDetailSerializer(person).data,
            'cell_groups': cell_memberships,
            'departments': department_memberships,
            'attendance_summary': attendance_summary,
            'attendance_total': sum(attendance_summary.values()),
            'recent_attendance': recent_attendance,
            'medical_record': medical_record_data,
            'medical_visits': medical_visits,
            'worker_profile': worker_data,
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def stats(self, request):
        from django.db.models import Count
        from django.utils import timezone
        from apps.cellgroups.models import CellGroup
        from apps.departments.models import Department
        from apps.hr.models import WorkerProfile
        from apps.followup.models import FollowUpTask
        from apps.medical.models import MedicalVisit

        now         = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Single query for all Person counts instead of three separate COUNTs
        person_agg = Person.objects.filter(deleted_at__isnull=True).aggregate(
            total=Count('id'),
            new_members=Count('id', filter=Q(status='NEW_MEMBER')),
            pending_approval=Count('id', filter=Q(status='PENDING_APPROVAL')),
        )

        return Response({
            'total_persons':             person_agg['total'],
            'new_members':               person_agg['new_members'],
            'pending_approval':          person_agg['pending_approval'],
            'active_workers':            WorkerProfile.objects.filter(employment_status='ACTIVE').count(),
            'active_cells':              CellGroup.objects.filter(status='ACTIVE').count(),
            'departments':               Department.objects.filter(is_active=True).count(),
            # UNASSIGNED + ASSIGNED + IN_PROGRESS are the "open" states (PENDING never existed)
            'open_followups':            FollowUpTask.objects.filter(
                status__in=['UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS']
            ).count(),
            'medical_visits_this_month': MedicalVisit.objects.filter(
                created_at__gte=month_start
            ).count(),
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def growth(self, request):
        from django.db.models import Count
        from django.db.models.functions import TruncMonth

        data = (
            Person.objects
            .filter(deleted_at__isnull=True)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        return Response([
            {'month': entry['month'].strftime('%b %Y'), 'count': entry['count']}
            for entry in data
        ])


class GlobalSearchView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [SearchThrottle]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if len(q) < 2 or len(q) > 100:
            return Response({'results': []})

        from apps.cellgroups.models import CellGroup
        from apps.departments.models import Department

        from core.utils.phone import normalize_phone
        normalized_phone = normalize_phone(q)
        digits = ''.join(ch for ch in q if ch.isdigit())
        phone_candidates = {normalized_phone} if normalized_phone else set()
        if digits and len(digits) == 10:
            phone_candidates.add(f'0{digits}')

        phone_q = Q()
        for candidate in phone_candidates:
            if candidate:
                phone_q |= Q(phone__icontains=candidate)

        persons = Person.objects.filter(
            (
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(other_names__icontains=q) |
                Q(email__icontains=q) |
                phone_q
            ),
            deleted_at__isnull=True,
        )[:10]

        from django.db.models import Count as _Count
        groups = CellGroup.objects.filter(
            Q(name__icontains=q) | Q(purpose__icontains=q),
            status='ACTIVE',
        ).annotate(
            active_member_count=_Count('members', filter=Q(members__is_active=True))
        )[:5]

        depts = Department.objects.filter(
            Q(name__icontains=q) | Q(description__icontains=q),
            is_active=True,
        )[:5]

        results = []
        for p in persons:
            results.append({
                'id':       str(p.id),
                'type':     'person',
                'title':    f'{p.first_name} {p.last_name}',
                'subtitle': p.phone or p.email or p.status,
            })
        for g in groups:
            results.append({
                'id':       str(g.id),
                'type':     'cell_group',
                'title':    g.name,
                'subtitle': g.purpose or f'{g.active_member_count} members',
            })
        for d in depts:
            results.append({
                'id':       str(d.id),
                'type':     'department',
                'title':    d.name,
                'subtitle': d.description or d.category or '',
            })

        return Response({'results': results})
