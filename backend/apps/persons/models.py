import uuid
from django.db import models


class Person(models.Model):

    class Status(models.TextChoices):
        NEW_MEMBER       = 'NEW_MEMBER',       'New Member'
        PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Approval'
        MEMBER           = 'MEMBER',           'Member'
        WORKER           = 'WORKER',           'Worker'
        INACTIVE         = 'INACTIVE',         'Inactive'

    class Source(models.TextChoices):
        WALK_IN  = 'WALK_IN',  'Walk In'
        MEDICAL  = 'MEDICAL',  'Medical'
        FOLLOWUP = 'FOLLOWUP', 'Follow Up'
        CELL     = 'CELL',     'Cell Group'
        DEPARTMENT = 'DEPARTMENT', 'Department'
        ADMIN    = 'ADMIN',    'Admin'

    id                      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name              = models.CharField(max_length=100)
    last_name               = models.CharField(max_length=100)
    other_names             = models.CharField(max_length=100, blank=True)
    phone                   = models.CharField(max_length=20, unique=True, db_index=True)
    email                   = models.EmailField(unique=True, null=True, blank=True)
    date_of_birth           = models.DateField(null=True, blank=True)
    gender                  = models.CharField(
                                max_length=10, blank=True,
                                choices=[('MALE','Male'),('FEMALE','Female'),('OTHER','Other')]
                              )
    profile_photo           = models.ImageField(upload_to='profiles/', null=True, blank=True)
    status                  = models.CharField(max_length=30, choices=Status.choices, default=Status.NEW_MEMBER, db_index=True)
    source                  = models.CharField(max_length=30, choices=Source.choices, blank=True)
    address                 = models.TextField(blank=True)
    landmark                = models.CharField(max_length=255, blank=True)
    state                   = models.CharField(max_length=100, blank=True)
    occupation              = models.CharField(max_length=150, blank=True)
    marital_status          = models.CharField(max_length=30, blank=True)
    country                 = models.CharField(max_length=100, default='Nigeria')
    emergency_contact_name  = models.CharField(max_length=200, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    joined_date             = models.DateField(null=True, blank=True)
    baptized                = models.BooleanField(default=False)
    baptism_date            = models.DateField(null=True, blank=True)
    is_profile_complete     = models.BooleanField(default=False)
    merged_from             = models.ForeignKey(
                                'self', null=True, blank=True,
                                on_delete=models.SET_NULL,
                                related_name='merged_into'
                              )
    deleted_at              = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'persons'
        ordering = ['-created_at']

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return self.full_name

    def save(self, *args, **kwargs):
        from core.utils.phone import normalize_phone
        if self.phone:
            self.phone = normalize_phone(self.phone)
        super().save(*args, **kwargs)
