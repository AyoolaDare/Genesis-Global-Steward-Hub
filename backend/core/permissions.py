import hmac as _hmac

from django.conf import settings as django_settings
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')


class IsMedicalTeam(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ('ADMIN', 'MEDICAL'))


class IsFollowUpTeam(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ('ADMIN', 'FOLLOWUP'))


CELL_GROUP_ROLES = ('CELL_LEADER', 'CELL_ASST')


class IsCellAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in ('ADMIN', *CELL_GROUP_ROLES)
        )


DEPT_EXEC_ROLES = ('HOD', 'ASST_HOD', 'WELFARE', 'PRO')


class IsDeptLeader(BasePermission):
    """Grants access to all 4 department executive roles (HOD, ASST_HOD, WELFARE, PRO)."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in ('ADMIN', 'HOD', 'ASST_HOD', 'WELFARE', 'PRO')
        )


class IsHRTeam(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ('ADMIN', 'HR'))


class CronKeyPermission(BasePermission):
    """
    Allows GitHub Actions scheduled workflows to trigger cron endpoints
    without requiring a JWT session.  Set CRON_SECRET in the App Service
    environment, then send:  X-Cron-Secret: <secret>
    """
    def has_permission(self, request, view):
        secret = getattr(django_settings, 'CRON_SECRET', '')
        if not secret:
            return False
        incoming = request.headers.get('X-Cron-Secret', '')
        return _hmac.compare_digest(incoming, secret)


class CanReadMedicalRecord(BasePermission):
    """Medical team + Admin can read all. HR reads workers only."""

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in ('ADMIN', 'MEDICAL', 'HR')
        )

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role in ('ADMIN', 'MEDICAL'):
            return True
        if user.role == 'HR':
            return obj.person.status == 'WORKER'
        return False
