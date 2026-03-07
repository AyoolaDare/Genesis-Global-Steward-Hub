# BACKEND SPECIFICATION
## Church Management System (CMS) — Django + Django REST Framework

---

## 1. OVERVIEW

The CMS backend is a **RESTful API** built with **Python, Django 5.x, and Django REST Framework (DRF)**. It serves as the single source of truth for all church data — members, workers, medical records, cell groups, departments, and HR. Django's batteries-included philosophy means auth, admin, ORM, migrations, and validation are all built-in and well-integrated.

**Core Responsibilities:**
- Authentication & role-based authorization (JWT via SimpleJWT)
- All CRUD operations across every module
- Profile merge logic (New Member → Full Member)
- Trigger/notification system across teams
- Medical record access control
- Audit trail for every sensitive operation

---

## 2. TECH STACK

| Concern | Choice | Reason |
|---------|--------|--------|
| Language | **Python 3.12** | Stable LTS, excellent library ecosystem |
| Framework | **Django 5.x** | Batteries-included: ORM, admin, auth, migrations |
| API Layer | **Django REST Framework (DRF)** | Industry-standard REST in Django |
| Auth | **djangorestframework-simplejwt** | JWT access + refresh tokens, DRF-native |
| Database | **PostgreSQL 15** | Relational, full-text search, JSON fields |
| DB Adapter | **psycopg2-binary** | Django's PostgreSQL driver |
| Permissions | **DRF Permissions + Custom** | Role and object-level access |
| Validation | **DRF Serializers + custom validators** | Schema validation on every endpoint |
| File Storage | **django-cloudinary-storage** | Profile photos, medical docs via Cloudinary |
| Email | **Django email backend + SendGrid** | Notifications, welcome emails |
| CORS | **django-cors-headers** | Allow Vercel frontend origin |
| Filtering | **django-filter** | Querystring filtering on list endpoints |
| Search | **DRF SearchFilter + pg_trgm** | Full-text and fuzzy search |
| Pagination | **DRF CursorPagination** | Efficient for large datasets |
| Testing | **pytest-django + factory_boy** | Unit and integration tests |
| API Docs | **drf-spectacular (OpenAPI 3.0)** | Auto-generated Swagger/Redoc docs |
| Task Queue | **Celery + Redis** *(Phase 2)* | Async notifications, scheduled tasks |
| Env Vars | **python-decouple** | Clean `.env` management |

---

## 3. PROJECT STRUCTURE

```
backend/
├── cms/                          <- Django project root
│   ├── settings/
│   │   ├── base.py               <- Shared settings
│   │   ├── development.py        <- Local overrides
│   │   └── production.py         <- Render production settings
│   ├── urls.py                   <- Root URL config
│   ├── wsgi.py
│   └── asgi.py
│
├── apps/
│   ├── accounts/                 <- SystemUser model, login, JWT
│   ├── persons/                  <- Person model, profile management, merge logic
│   ├── medical/                  <- MedicalRecord, MedicalVisit
│   ├── followup/                 <- FollowUpTask, queue management
│   ├── cellgroups/               <- CellGroup, CellGroupMember
│   ├── departments/              <- Department, DepartmentMember, Attendance
│   ├── hr/                       <- WorkerProfile, contracts, payroll
│   ├── notifications/            <- Notification model, trigger dispatcher
│   └── audit/                    <- AuditLog model, middleware
│
├── core/
│   ├── permissions.py            <- Custom DRF permission classes
│   ├── mixins.py                 <- Shared viewset mixins
│   ├── pagination.py             <- CursorPagination config
│   ├── exceptions.py             <- Custom exception handler
│   ├── utils/
│   │   ├── phone.py              <- Phone normalization
│   │   └── response.py           <- Standardized API response helpers
│   └── signals.py                <- Django signals for trigger events
│
├── tests/
│   ├── factories/                <- factory_boy model factories
│   ├── test_persons/
│   ├── test_medical/
│   └── ...
│
├── manage.py
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
├── Procfile                      <- For Render: web: gunicorn cms.wsgi
├── runtime.txt                   <- python-3.12.x
└── .env.example
```

Each Django app follows this internal layout:

```
apps/persons/
├── models.py          <- Django ORM models
├── serializers.py     <- DRF serializers (input/output schemas)
├── views.py           <- DRF ViewSets
├── urls.py            <- App-level URL routing
├── permissions.py     <- App-specific permission classes
├── filters.py         <- django-filter FilterSet classes
├── services.py        <- Business logic (kept out of views)
├── signals.py         <- post_save / pre_save hooks
├── admin.py           <- Django Admin registration
└── tests.py
```

---

## 4. AUTHENTICATION & AUTHORIZATION

### 4.1 - Custom User Model

Always define a custom user model before the first migration:

```python
# apps/accounts/models.py
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
import uuid

class SystemUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
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
        ADMIN       = 'ADMIN',       'Admin'
        MEDICAL     = 'MEDICAL',     'Medical Team'
        FOLLOWUP    = 'FOLLOWUP',    'Follow Up Team'
        CELL_ADMIN  = 'CELL_ADMIN',  'Cell Admin'
        DEPT_LEADER = 'DEPT_LEADER', 'Department Leader'
        DEPT_ASST   = 'DEPT_ASST',   'Department Assistant'
        HR          = 'HR',          'HR Team'

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person        = models.OneToOneField(
                      'persons.Person', null=True, blank=True,
                      on_delete=models.SET_NULL, related_name='system_user'
                    )
    username      = models.CharField(max_length=100, unique=True)
    email         = models.EmailField(unique=True)
    role          = models.CharField(max_length=30, choices=Role.choices, default=Role.FOLLOWUP)
    module_access = models.JSONField(default=list)
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
```

```python
# cms/settings/base.py
AUTH_USER_MODEL = 'accounts.SystemUser'
```

### 4.2 - JWT Configuration (SimpleJWT)

```python
# cms/settings/base.py
from datetime import timedelta

INSTALLED_APPS = [
    ...
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    ...
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'core.pagination.StandardCursorPagination',
    'PAGE_SIZE': 25,
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':    timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME':   timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':    True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES':        ('Bearer',),
}
```

### 4.3 - Auth Endpoints

```python
# apps/accounts/urls.py
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, LogoutView, MeView

urlpatterns = [
    path('login/',   LoginView.as_view()),     # POST -> returns access + refresh
    path('refresh/', TokenRefreshView.as_view()),
    path('logout/',  LogoutView.as_view()),    # Blacklists refresh token
    path('me/',      MeView.as_view()),        # GET current user + role
]
```

### 4.4 - Custom Permission Classes

```python
# core/permissions.py
from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'ADMIN'

class IsMedicalTeam(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ('ADMIN', 'MEDICAL')

class IsFollowUpTeam(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ('ADMIN', 'FOLLOWUP')

class IsCellAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ('ADMIN', 'CELL_ADMIN')

class IsDeptLeader(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ('ADMIN', 'DEPT_LEADER', 'DEPT_ASST')

class IsHRTeam(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ('ADMIN', 'HR')

class CanReadMedicalRecord(BasePermission):
    """Medical team + Admin can read all. HR reads workers only."""
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role in ('ADMIN', 'MEDICAL'):
            return True
        if user.role == 'HR':
            return obj.person.status == 'WORKER'
        return False
```

### 4.5 - Role Permission Matrix

| Role | View Members | Create Member | Approve Member | Medical Records | Cell Groups | Departments | HR Records |
|------|:-----------:|:-------------:|:--------------:|:---------------:|:-----------:|:-----------:|:----------:|
| ADMIN | All | Yes | Yes | Read | Full | Full | Read |
| MEDICAL | All | Partial | No | Full | No | No | No |
| FOLLOWUP | All | Pending | No | No | No | No | No |
| CELL_ADMIN | Own group | Pending | No | No | Own only | No | No |
| DEPT_LEADER | Own dept | No | No | No | No | Own only | No |
| HR | Workers | No | No | Workers only | No | No | Full |

---

## 5. URL STRUCTURE

```python
# cms/urls.py
urlpatterns = [
    path('admin/',                admin.site.urls),
    path('api/v1/auth/',          include('apps.accounts.urls')),
    path('api/v1/persons/',       include('apps.persons.urls')),
    path('api/v1/medical/',       include('apps.medical.urls')),
    path('api/v1/followup/',      include('apps.followup.urls')),
    path('api/v1/cells/',         include('apps.cellgroups.urls')),
    path('api/v1/depts/',         include('apps.departments.urls')),
    path('api/v1/hr/',            include('apps.hr.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/search/',        include('apps.persons.search_urls')),
    path('api/v1/health/',        HealthCheckView.as_view()),

    # Auto-generated API docs
    path('api/schema/',  SpectacularAPIView.as_view(),         name='schema'),
    path('api/docs/',    SpectacularSwaggerView.as_view(url_name='schema')),
    path('api/redoc/',   SpectacularRedocView.as_view(url_name='schema')),
]
```

---

## 6. PERSON MODEL

```python
# apps/persons/models.py
class Person(models.Model):

    class Status(models.TextChoices):
        NEW_MEMBER       = 'NEW_MEMBER',       'New Member'
        PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Approval'
        MEMBER           = 'MEMBER',           'Member'
        WORKER           = 'WORKER',           'Worker'
        INACTIVE         = 'INACTIVE',         'Inactive'

    class Source(models.TextChoices):
        MEDICAL  = 'MEDICAL',  'Medical'
        FOLLOWUP = 'FOLLOWUP', 'Follow Up'
        CELL     = 'CELL',     'Cell Group'
        ADMIN    = 'ADMIN',    'Admin'

    id                      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name              = models.CharField(max_length=100)
    last_name               = models.CharField(max_length=100)
    other_names             = models.CharField(max_length=100, blank=True)
    phone                   = models.CharField(max_length=20, unique=True, db_index=True)
    email                   = models.EmailField(unique=True, null=True, blank=True)
    date_of_birth           = models.DateField(null=True, blank=True)
    gender                  = models.CharField(max_length=10, blank=True)
    profile_photo           = models.ImageField(upload_to='profiles/', null=True, blank=True)
    status                  = models.CharField(max_length=30, choices=Status.choices, default=Status.NEW_MEMBER, db_index=True)
    source                  = models.CharField(max_length=30, choices=Source.choices, blank=True)
    address                 = models.TextField(blank=True)
    state                   = models.CharField(max_length=100, blank=True)
    country                 = models.CharField(max_length=100, default='Nigeria')
    emergency_contact_name  = models.CharField(max_length=200, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    joined_date             = models.DateField(null=True, blank=True)
    baptized                = models.BooleanField(default=False)
    baptism_date            = models.DateField(null=True, blank=True)
    is_profile_complete     = models.BooleanField(default=False)
    merged_from             = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)
    deleted_at              = models.DateTimeField(null=True, blank=True)
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'persons'

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        from core.utils.phone import normalize_phone
        self.phone = normalize_phone(self.phone)
        super().save(*args, **kwargs)
```

---

## 7. SERIALIZERS

```python
# apps/persons/serializers.py
from rest_framework import serializers
from .models import Person

class PersonListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model  = Person
        fields = ['id', 'full_name', 'phone', 'email', 'status', 'profile_photo', 'created_at']


class PersonDetailSerializer(serializers.ModelSerializer):
    full_name          = serializers.ReadOnlyField()
    has_medical_record = serializers.SerializerMethodField()

    class Meta:
        model   = Person
        exclude = ['deleted_at', 'merged_from']

    def get_has_medical_record(self, obj):
        return hasattr(obj, 'medical_record')


class PersonCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Person
        fields = ['first_name', 'last_name', 'phone', 'gender', 'email', 'source']

    def validate_phone(self, value):
        from core.utils.phone import normalize_phone
        normalized = normalize_phone(value)
        if Person.objects.filter(phone=normalized).exists():
            raise serializers.ValidationError(
                "A person with this phone number already exists.",
                code='DUPLICATE_PHONE'
            )
        return normalized


class PhoneLookupSerializer(serializers.Serializer):
    phones = serializers.ListField(
        child=serializers.CharField(max_length=20),
        min_length=1,
        max_length=100
    )
```

---

## 8. VIEWS (ViewSets)

```python
# apps/persons/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from core.permissions import IsAdmin, IsFollowUpTeam, IsMedicalTeam
from .models import Person
from .serializers import PersonListSerializer, PersonDetailSerializer, PersonCreateSerializer
from .services import PersonService


class PersonViewSet(viewsets.ModelViewSet):
    queryset = Person.objects.filter(deleted_at__isnull=True).select_related('medical_record')

    def get_serializer_class(self):
        if self.action == 'list':    return PersonListSerializer
        if self.action == 'create':  return PersonCreateSerializer
        return PersonDetailSerializer

    def get_permissions(self):
        if self.action in ('destroy', 'approve', 'merge'):
            return [IsAdmin()]
        return [IsMedicalTeam() | IsFollowUpTeam() | IsAdmin()]

    def get_queryset(self):
        qs   = super().get_queryset()
        user = self.request.user
        if user.role == 'CELL_ADMIN':
            qs = qs.filter(cellgroupmember__cell_group__admin=user)
        elif user.role in ('DEPT_LEADER', 'DEPT_ASST'):
            qs = qs.filter(departmentmember__department__team_leader__system_user=user)
        return qs

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def approve(self, request, pk=None):
        person = self.get_object()
        person = PersonService.approve_profile(person, approved_by=request.user)
        return Response(PersonDetailSerializer(person).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def merge(self, request, pk=None):
        target_id = request.data.get('target_id')
        if not target_id:
            return Response({'error': 'target_id required'}, status=400)
        result = PersonService.merge_profiles(source_id=pk, target_id=target_id, merged_by=request.user)
        return Response(PersonDetailSerializer(result).data)

    @action(detail=False, methods=['post'])
    def phone_lookup(self, request):
        phones  = request.data.get('phones', [])
        results = PersonService.batch_phone_lookup(phones)
        return Response(results)
```

---

## 9. SERVICES LAYER (Business Logic)

```python
# apps/persons/services.py
from django.db import transaction
from django.utils import timezone
from .models import Person

class PersonService:

    @staticmethod
    def approve_profile(person: Person, approved_by) -> Person:
        if person.status != Person.Status.PENDING_APPROVAL:
            raise ValueError("Only PENDING_APPROVAL profiles can be approved.")

        person.status = Person.Status.NEW_MEMBER
        person.save(update_fields=['status', 'updated_at'])

        from apps.notifications.services import NotificationService
        NotificationService.dispatch(
            event='MEMBER_APPROVED',
            entity=person,
            triggered_by=approved_by,
            target_roles=['FOLLOWUP']
        )

        from apps.followup.services import FollowUpService
        FollowUpService.create_task(
            person=person,
            task_type='NEW_MEMBER_OUTREACH',
            triggered_by='ADMIN',
            source_id=str(approved_by.id)
        )
        return person

    @staticmethod
    def merge_profiles(source_id, target_id, merged_by) -> Person:
        source = Person.objects.get(pk=source_id)
        target = Person.objects.get(pk=target_id)

        with transaction.atomic():
            source.medical_visits.update(person=target)
            source.followup_tasks.update(person=target)

            # Remove duplicate cell memberships before re-pointing
            source.cellgroupmember_set.filter(
                cell_group__in=target.cellgroupmember_set.values('cell_group')
            ).delete()
            source.cellgroupmember_set.update(person=target)
            source.departmentmember_set.update(person=target)

            # Transfer medical record if target has none
            if hasattr(source, 'medical_record') and not hasattr(target, 'medical_record'):
                source.medical_record.person = target
                source.medical_record.save()

            source.merged_from = target
            source.deleted_at  = timezone.now()
            source.save(update_fields=['merged_from', 'deleted_at'])

        return target

    @staticmethod
    def batch_phone_lookup(phones: list) -> dict:
        from core.utils.phone import normalize_phone
        normalized = [normalize_phone(p) for p in phones]
        found_qs   = Person.objects.filter(phone__in=normalized, deleted_at__isnull=True)
        found_map  = {p.phone: p for p in found_qs}

        results = {'found': [], 'not_found': []}
        for phone in normalized:
            if phone in found_map:
                from .serializers import PersonListSerializer
                results['found'].append({
                    'phone':  phone,
                    'person': PersonListSerializer(found_map[phone]).data
                })
            else:
                results['not_found'].append({'phone': phone})
        return results
```

---

## 10. SIGNALS (Cross-Module Triggers)

```python
# core/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender='persons.Person')
def on_person_created(sender, instance, created, **kwargs):
    if not created:
        return

    from apps.notifications.services import NotificationService

    NotificationService.dispatch(
        event='NEW_MEMBER_CREATED',
        entity=instance,
        target_roles=['ADMIN']
    )

    if instance.status == 'PENDING_APPROVAL':
        NotificationService.dispatch(
            event='PROFILE_PENDING_APPROVAL',
            entity=instance,
            target_roles=['ADMIN']
        )

    if instance.source in ('MEDICAL', 'CELL', 'FOLLOWUP'):
        NotificationService.dispatch(
            event='NEW_MEMBER_CREATED',
            entity=instance,
            target_roles=['FOLLOWUP']
        )
```

---

## 11. NOTIFICATION SERVICE

```python
# apps/notifications/services.py
from apps.accounts.models import SystemUser
from .models import Notification

class NotificationService:

    MESSAGES = {
        'NEW_MEMBER_CREATED':      {'title': 'New person added',           'message': '{name} was added by the {source} team.'},
        'PROFILE_PENDING_APPROVAL':{'title': 'Profile pending approval',   'message': '{name} needs Admin review.'},
        'MEMBER_APPROVED':         {'title': 'Profile approved',           'message': '{name} added to follow-up queue.'},
        'MEMBER_MERGED':           {'title': 'Profiles merged',            'message': 'Duplicate profile for {name} was merged.'},
    }

    @classmethod
    def dispatch(cls, event: str, entity, triggered_by=None, target_roles: list = None):
        template = cls.MESSAGES.get(event, {'title': event, 'message': ''})
        title    = template['title']
        message  = template['message'].format(
            name=getattr(entity, 'full_name', str(entity)),
            source=getattr(entity, 'source', ''),
        )

        recipients = SystemUser.objects.filter(role__in=target_roles or [], is_active=True)
        Notification.objects.bulk_create([
            Notification(
                recipient=user,
                title=title,
                message=message,
                notification_type=event,
                entity_type=entity.__class__.__name__,
                entity_id=str(entity.pk),
            )
            for user in recipients
        ])
```

---

## 12. ERROR HANDLING

```python
# core/exceptions.py
from rest_framework.views import exception_handler
import uuid

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {
            'success':   False,
            'error': {
                'message':    _extract_message(response.data),
                'statusCode': response.status_code,
            },
            'requestId': str(uuid.uuid4()),
        }
    return response

def _extract_message(data):
    if isinstance(data, dict):
        for key in ('detail', 'non_field_errors'):
            if key in data:
                val = data[key]
                return str(val[0]) if isinstance(val, list) else str(val)
        for key, val in data.items():
            return f"{key}: {val[0] if isinstance(val, list) else val}"
    if isinstance(data, list):
        return str(data[0])
    return str(data)
```

---

## 13. AUDIT MIDDLEWARE

```python
# apps/audit/middleware.py
from .models import AuditLog

class AuditMiddleware:
    TRACKED_METHODS = ('POST', 'PUT', 'PATCH', 'DELETE')

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if (request.method in self.TRACKED_METHODS
                and hasattr(request, 'user')
                and request.user.is_authenticated
                and response.status_code < 400):

            AuditLog.objects.create(
                user=request.user,
                user_role=request.user.role,
                action=f"{request.method} {request.path}",
                ip_address=self._get_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
            )
        return response

    def _get_ip(self, request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0]
        return request.META.get('REMOTE_ADDR')
```

---

## 14. SEARCH

```python
# apps/persons/views.py
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from rest_framework.views import APIView

class PersonViewSet(viewsets.ModelViewSet):
    filter_backends  = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status', 'gender', 'source']
    search_fields    = ['first_name', 'last_name', 'phone', 'email']
    # Usage: GET /api/v1/persons/?search=john
    # Usage: GET /api/v1/persons/?status=MEMBER&gender=FEMALE


class GlobalSearchView(APIView):
    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if len(q) < 2:
            return Response({'results': []})

        from apps.persons.models import Person
        from apps.persons.serializers import PersonListSerializer

        persons = Person.objects.filter(
            Q(first_name__icontains=q) | Q(last_name__icontains=q) |
            Q(phone__icontains=q)      | Q(email__icontains=q),
            deleted_at__isnull=True
        )[:10]

        return Response({
            'results': {
                'persons': PersonListSerializer(persons, many=True).data,
            }
        })
```

---

## 15. PRODUCTION SETTINGS

```python
# cms/settings/production.py
from .base import *
from decouple import config

DEBUG         = False
SECRET_KEY    = config('SECRET_KEY')
ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=lambda v: [s.strip() for s in v.split(',')])

DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     config('DB_NAME'),
        'USER':     config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST':     config('DB_HOST'),
        'PORT':     config('DB_PORT', default='5432'),
        'OPTIONS':  {'sslmode': 'require'},
    }
}

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', cast=lambda v: v.split(','))

# WhiteNoise for static files on Render
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATIC_ROOT         = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Cloudinary
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': config('CLOUDINARY_CLOUD_NAME'),
    'API_KEY':    config('CLOUDINARY_API_KEY'),
    'API_SECRET': config('CLOUDINARY_API_SECRET'),
}

# Email via SendGrid
EMAIL_BACKEND       = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST          = 'smtp.sendgrid.net'
EMAIL_PORT          = 587
EMAIL_USE_TLS       = True
EMAIL_HOST_USER     = 'apikey'
EMAIL_HOST_PASSWORD = config('SENDGRID_API_KEY')
DEFAULT_FROM_EMAIL  = config('EMAIL_FROM')
```

---

## 16. ENVIRONMENT VARIABLES

```env
SECRET_KEY=<generate: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
DEBUG=False
ALLOWED_HOSTS=api.cms-church.onrender.com
CORS_ALLOWED_ORIGINS=https://cms.yourchurch.vercel.app

DB_NAME=cms_church
DB_USER=cms_user
DB_PASSWORD=<strong-password>
DB_HOST=<render-postgres-internal-host>
DB_PORT=5432

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SENDGRID_API_KEY=
EMAIL_FROM=noreply@yourchurch.org
```

---

## 17. RENDER DEPLOYMENT

```bash
# Build Command (Render dashboard):
pip install -r requirements/production.txt && python manage.py collectstatic --noinput && python manage.py migrate

# Start Command:
gunicorn cms.wsgi:application --bind 0.0.0.0:$PORT --workers 2

# Procfile (alternative):
web: gunicorn cms.wsgi:application --bind 0.0.0.0:$PORT

# runtime.txt:
python-3.12.3
```

---

## 18. REQUIREMENTS FILES

```
# requirements/base.txt
Django==5.0.4
djangorestframework==3.15.1
djangorestframework-simplejwt==5.3.1
django-cors-headers==4.3.1
django-filter==24.2
drf-spectacular==0.27.2
psycopg2-binary==2.9.9
python-decouple==3.8
Pillow==10.3.0
cloudinary==1.40.0
django-cloudinary-storage==0.3.0
whitenoise==6.6.0

# requirements/production.txt
-r base.txt
gunicorn==22.0.0

# requirements/development.txt
-r base.txt
pytest==8.1.1
pytest-django==4.8.0
factory-boy==3.3.0
django-debug-toolbar==4.3.0
```

---

## 19. DJANGO ADMIN (Bonus)

Django provides a free admin panel at `/admin/`. Register all models for a secondary management interface:

```python
# apps/persons/admin.py
from django.contrib import admin
from .models import Person

@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display   = ['full_name', 'phone', 'email', 'status', 'source', 'created_at']
    list_filter    = ['status', 'source', 'gender']
    search_fields  = ['first_name', 'last_name', 'phone', 'email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering       = ['-created_at']
```

This gives your team a fallback interface for data corrections without needing to build every admin screen immediately.
