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


class IsCellAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ('ADMIN', 'CELL_ADMIN'))


class IsDeptLeader(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in ('ADMIN', 'DEPT_LEADER', 'DEPT_ASST')
        )


class IsHRTeam(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ('ADMIN', 'HR'))


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
