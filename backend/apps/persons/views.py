from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from core.permissions import IsAdmin, IsFollowUpTeam, IsMedicalTeam, IsCellAdmin
from core.throttles import PhoneLookupThrottle
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
        return [(IsMedicalTeam | IsFollowUpTeam | IsAdmin | IsCellAdmin)()]

    def get_queryset(self):
        qs   = super().get_queryset()
        user = self.request.user
        if user.role == 'CELL_ADMIN':
            qs = qs.filter(cellgroup_memberships__cell_group__admin=user)
        elif user.role in ('DEPT_LEADER', 'DEPT_ASST'):
            qs = qs.filter(department_memberships__department__team_leader__system_user=user)
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

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def stats(self, request):
        from django.utils import timezone
        from datetime import timedelta
        from apps.cellgroups.models import CellGroup
        from apps.departments.models import Department
        from apps.hr.models import WorkerProfile
        from apps.followup.models import FollowUpTask
        from apps.medical.models import MedicalVisit

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        return Response({
            'total_persons':    Person.objects.filter(deleted_at__isnull=True).count(),
            'new_members':      Person.objects.filter(deleted_at__isnull=True, status='NEW_MEMBER').count(),
            'pending_approval': Person.objects.filter(deleted_at__isnull=True, status='PENDING_APPROVAL').count(),
            'active_workers':   WorkerProfile.objects.filter(employment_status='ACTIVE').count(),
            'active_cells':     CellGroup.objects.filter(status='ACTIVE').count(),
            'departments':      Department.objects.filter(is_active=True).count(),
            'open_followups':   FollowUpTask.objects.filter(status__in=['PENDING', 'IN_PROGRESS']).count(),
            'medical_visits_this_month': MedicalVisit.objects.filter(created_at__gte=month_start).count(),
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
    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if len(q) < 2:
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

        groups = CellGroup.objects.filter(
            Q(name__icontains=q) | Q(purpose__icontains=q),
            status='ACTIVE',
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
                'subtitle': g.purpose or f'{g.members.filter(is_active=True).count()} members',
            })
        for d in depts:
            results.append({
                'id':       str(d.id),
                'type':     'department',
                'title':    d.name,
                'subtitle': d.description or d.category or '',
            })

        return Response({'results': results})
