from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.utils import timezone

from core.permissions import IsHRTeam, IsAdmin
from .models import WorkerProfile
from .serializers import (
    WorkerProfileSerializer, WorkerProfileListSerializer,
    WorkerCreateSerializer, PromoteToWorkerSerializer,
    OnboardingSerializer, TerminateWorkerSerializer,
)


class WorkerProfileViewSet(viewsets.ModelViewSet):
    queryset = WorkerProfile.objects.select_related('person', 'department')
    permission_classes = [IsHRTeam | IsAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['employment_status', 'employment_type']
    search_fields = [
        'worker_id',
        'job_title',
        'person__first_name',
        'person__last_name',
        'person__phone',
    ]

    def get_serializer_class(self):
        if self.action == 'list':   return WorkerProfileListSerializer
        if self.action == 'create': return WorkerCreateSerializer
        return WorkerProfileSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def promote(self, request):
        serializer = PromoteToWorkerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        from apps.persons.models import Person
        try:
            person = Person.objects.get(pk=data['person_id'], deleted_at__isnull=True)
        except Person.DoesNotExist:
            return Response({'error': 'Person not found.'}, status=status.HTTP_404_NOT_FOUND)

        if WorkerProfile.objects.filter(person=person).exists():
            return Response({'error': 'Worker profile already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate worker ID safely — lock the latest row for this year to prevent
        # two concurrent promotions from producing the same ID (count()+1 is racy).
        hire_year  = data['hire_date'].year
        year_prefix = f"CHU-{hire_year}-"
        last = (
            WorkerProfile.objects
            .filter(worker_id__startswith=year_prefix)
            .select_for_update()
            .order_by('-worker_id')
            .values_list('worker_id', flat=True)
            .first()
        )
        if last:
            try:
                next_seq = int(last.split('-')[-1]) + 1
            except (ValueError, IndexError):
                next_seq = WorkerProfile.objects.count() + 1
        else:
            next_seq = 1
        worker_id = f"{year_prefix}{next_seq:04d}"

        dept = None
        if data.get('department'):
            from apps.departments.models import Department
            try:
                dept = Department.objects.get(pk=data['department'])
            except Department.DoesNotExist:
                pass

        profile = WorkerProfile.objects.create(
            person=person,
            worker_id=worker_id,
            job_title=data['job_title'],
            department=dept,
            employment_type=data['employment_type'],
            hire_date=data['hire_date'],
            salary_amount=data.get('salary_amount'),
            pay_frequency=data.get('pay_frequency') or 'MONTHLY',
            probation_end=data.get('probation_end'),
            bank_name=data.get('bank_name', ''),
            account_number=data.get('account_number', ''),
            account_name=data.get('account_name', ''),
            created_by=request.user,
        )

        # Promote person status
        person.status = Person.Status.WORKER
        person.save(update_fields=['status', 'updated_at'])

        from apps.notifications.services import NotificationService
        NotificationService.dispatch(
            event='WORKER_CREATED',
            entity=person,
            triggered_by=request.user,
            target_roles=['HR', 'ADMIN'],
        )
        return Response(WorkerProfileSerializer(profile).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        from datetime import date as date_type
        profile = self.get_object()
        new_status = request.data.get('employment_status')
        if new_status not in [s[0] for s in WorkerProfile.EmploymentStatus.choices]:
            return Response({'error': 'Invalid employment status.'}, status=status.HTTP_400_BAD_REQUEST)
        profile.employment_status = new_status
        update_fields = ['employment_status', 'updated_at']
        if new_status == WorkerProfile.EmploymentStatus.TERMINATED:
            raw_date = request.data.get('termination_date')
            if raw_date:
                try:
                    from datetime import datetime
                    termination_date = datetime.strptime(raw_date, '%Y-%m-%d').date()
                except (ValueError, TypeError):
                    return Response(
                        {'error': 'termination_date must be in YYYY-MM-DD format.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                termination_date = timezone.now().date()
            profile.termination_date = termination_date
            profile.exit_reason = request.data.get('reason', profile.exit_reason)
            update_fields.extend(['termination_date', 'exit_reason'])
            profile.person.status = 'MEMBER'
            profile.person.save(update_fields=['status', 'updated_at'])
        profile.save(update_fields=update_fields)
        return Response(WorkerProfileSerializer(profile).data)

    @action(detail=True, methods=['patch'])
    def onboard(self, request, pk=None):
        profile = self.get_object()
        serializer = OnboardingSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(WorkerProfileSerializer(profile).data)

    @action(detail=True, methods=['post'])
    def terminate(self, request, pk=None):
        profile = self.get_object()
        serializer = TerminateWorkerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile.employment_status = WorkerProfile.EmploymentStatus.TERMINATED
        profile.termination_date = serializer.validated_data.get('termination_date', timezone.now().date())
        profile.exit_reason = serializer.validated_data.get('exit_reason', '')
        profile.save(update_fields=['employment_status', 'termination_date', 'exit_reason', 'updated_at'])

        profile.person.status = 'MEMBER'
        profile.person.save(update_fields=['status', 'updated_at'])
        return Response(WorkerProfileSerializer(profile).data)
