from rest_framework import serializers
from apps.persons.serializers import PersonDetailSerializer
from .models import WorkerProfile


class WorkerProfileSerializer(serializers.ModelSerializer):
    person_detail      = PersonDetailSerializer(source='person', read_only=True)
    department_name    = serializers.CharField(source='department.name', read_only=True)
    person_name        = serializers.CharField(source='person.full_name', read_only=True)
    person_phone       = serializers.CharField(source='person.phone', read_only=True)

    class Meta:
        model  = WorkerProfile
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class WorkerProfileListSerializer(serializers.ModelSerializer):
    person_name     = serializers.CharField(source='person.full_name', read_only=True)
    person_phone    = serializers.CharField(source='person.phone', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model  = WorkerProfile
        fields = ['id', 'worker_id', 'person_name', 'job_title', 'department_name',
                  'employment_type', 'employment_status', 'onboarding_status',
                  'person_phone', 'salary_amount', 'hire_date', 'created_at']


class WorkerCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = WorkerProfile
        fields = ['person', 'worker_id', 'job_title', 'department', 'employment_type',
                  'hire_date', 'probation_end', 'salary_amount', 'salary_currency',
                  'pay_frequency', 'bank_name', 'account_number', 'account_name']

    def validate_person(self, value):
        if WorkerProfile.objects.filter(person=value).exists():
            raise serializers.ValidationError('This person already has a worker profile.')
        return value

    def validate_worker_id(self, value):
        if WorkerProfile.objects.filter(worker_id=value).exists():
            raise serializers.ValidationError('Worker ID already exists.')
        return value


class PromoteToWorkerSerializer(serializers.Serializer):
    person_id       = serializers.UUIDField()
    job_title       = serializers.CharField(required=False, allow_blank=True)
    position        = serializers.CharField(required=False, allow_blank=True)
    department      = serializers.UUIDField(required=False, allow_null=True)
    employment_type = serializers.ChoiceField(choices=['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VOLUNTEER_STAFF'])
    hire_date       = serializers.DateField(required=False)
    start_date      = serializers.DateField(required=False)
    salary_amount   = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    salary          = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    pay_frequency   = serializers.CharField(required=False, allow_blank=True)
    probation_end   = serializers.DateField(required=False, allow_null=True)
    bank_name       = serializers.CharField(required=False, allow_blank=True)
    account_number  = serializers.CharField(required=False, allow_blank=True)
    account_name    = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        attrs['job_title'] = attrs.get('job_title') or attrs.get('position') or ''
        attrs['hire_date'] = attrs.get('hire_date') or attrs.get('start_date')
        attrs['salary_amount'] = attrs.get('salary_amount', attrs.get('salary'))

        employment_type = attrs.get('employment_type')
        if employment_type == 'VOLUNTEER':
            attrs['employment_type'] = 'VOLUNTEER_STAFF'

        if not attrs.get('hire_date'):
            raise serializers.ValidationError({'hire_date': 'hire_date or start_date is required.'})

        return attrs


class OnboardingSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerProfile
        fields = [
            'salary_amount', 'salary_currency', 'pay_frequency',
            'bank_name', 'account_number', 'account_name',
            'contract_url', 'id_document_url',
            'probation_end', 'onboarding_status',
        ]


class TerminateWorkerSerializer(serializers.Serializer):
    termination_date = serializers.DateField(required=False)
    exit_reason = serializers.CharField(required=False, allow_blank=True)
