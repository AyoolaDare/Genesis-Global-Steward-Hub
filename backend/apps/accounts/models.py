import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models


class SystemUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user  = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra):
        extra.setdefault('role', 'ADMIN')
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra)


class SystemUser(AbstractBaseUser, PermissionsMixin):

    class Role(models.TextChoices):
        ADMIN      = 'ADMIN',      'Admin'
        MEDICAL    = 'MEDICAL',    'Medical Team'
        FOLLOWUP   = 'FOLLOWUP',   'Follow Up Team'
        CELL_LEADER = 'CELL_LEADER', 'Cell Leader'
        CELL_ASST   = 'CELL_ASST',   'Cell Lead Assistant'
        HOD        = 'HOD',        'Head of Department'
        ASST_HOD   = 'ASST_HOD',   'Assistant Head of Department'
        WELFARE    = 'WELFARE',    'Welfare Officer'
        PRO        = 'PRO',        'Public Relations Officer'
        HR         = 'HR',         'HR Team'

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person        = models.OneToOneField(
                      'persons.Person',
                      null=True, blank=True,
                      on_delete=models.SET_NULL,
                      related_name='system_user',
                    )
    department    = models.ForeignKey(
                      'departments.Department',
                      null=True, blank=True,
                      on_delete=models.SET_NULL,
                      related_name='users',
                    )
    username      = models.CharField(max_length=100, unique=True)
    email         = models.EmailField(unique=True)
    role          = models.CharField(max_length=30, choices=Role.choices, default=Role.FOLLOWUP, db_index=True)
    module_access = models.JSONField(default=list)
    must_reset_password = models.BooleanField(default=False)
    is_active     = models.BooleanField(default=True)
    is_staff      = models.BooleanField(default=False)
    last_login    = models.DateTimeField(null=True, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    objects = SystemUserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'system_users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.email} ({self.role})"
