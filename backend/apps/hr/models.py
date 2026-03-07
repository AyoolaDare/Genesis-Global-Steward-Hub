import uuid
from django.db import models


class WorkerProfile(models.Model):

    class EmploymentType(models.TextChoices):
        FULL_TIME       = 'FULL_TIME',       'Full Time'
        PART_TIME       = 'PART_TIME',       'Part Time'
        CONTRACT        = 'CONTRACT',        'Contract'
        VOLUNTEER_STAFF = 'VOLUNTEER_STAFF', 'Volunteer Staff'

    class EmploymentStatus(models.TextChoices):
        ACTIVE     = 'ACTIVE',     'Active'
        ON_LEAVE   = 'ON_LEAVE',   'On Leave'
        SUSPENDED  = 'SUSPENDED',  'Suspended'
        TERMINATED = 'TERMINATED', 'Terminated'

    class OnboardingStatus(models.TextChoices):
        PENDING     = 'PENDING',     'Pending'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED   = 'COMPLETED',   'Completed'

    id                = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person            = models.OneToOneField(
                          'persons.Person', on_delete=models.RESTRICT,
                          related_name='worker_profile'
                        )
    worker_id         = models.CharField(max_length=50, unique=True)
    job_title         = models.CharField(max_length=255, blank=True)
    department        = models.ForeignKey(
                          'departments.Department', null=True, blank=True,
                          on_delete=models.SET_NULL, related_name='workers'
                        )
    employment_type   = models.CharField(max_length=30, choices=EmploymentType.choices, blank=True)
    employment_status = models.CharField(
                          max_length=30, choices=EmploymentStatus.choices,
                          default=EmploymentStatus.ACTIVE, db_index=True
                        )
    onboarding_status = models.CharField(
                          max_length=20, choices=OnboardingStatus.choices,
                          default=OnboardingStatus.PENDING, db_index=True
                        )
    hire_date         = models.DateField()
    probation_end     = models.DateField(null=True, blank=True)
    termination_date  = models.DateField(null=True, blank=True)
    exit_reason       = models.TextField(blank=True)
    salary_amount     = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    salary_currency   = models.CharField(max_length=5, default='NGN')
    pay_frequency     = models.CharField(max_length=20, default='MONTHLY')
    bank_name         = models.CharField(max_length=100, blank=True)
    account_number    = models.CharField(max_length=50, blank=True)
    account_name      = models.CharField(max_length=255, blank=True)
    contract_url      = models.TextField(blank=True)
    id_document_url   = models.TextField(blank=True)
    created_by        = models.ForeignKey(
                          'accounts.SystemUser', null=True, blank=True,
                          on_delete=models.SET_NULL, related_name='workers_created'
                        )
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'worker_profiles'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.worker_id} — {self.person.full_name}"
