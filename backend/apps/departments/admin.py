from django.contrib import admin
from .models import Department, DepartmentMember, DepartmentAttendance, AttendanceRecord


class DepartmentMemberInline(admin.TabularInline):
    model  = DepartmentMember
    extra  = 0
    fields = ['person', 'role', 'is_active']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display    = ['name', 'category', 'team_leader', 'is_active', 'created_at']
    list_filter     = ['is_active', 'category']
    search_fields   = ['name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    inlines         = [DepartmentMemberInline]


@admin.register(DepartmentMember)
class DepartmentMemberAdmin(admin.ModelAdmin):
    list_display  = ['person', 'department', 'role', 'is_active']
    list_filter   = ['role', 'is_active']
    search_fields = ['person__first_name', 'person__last_name']


@admin.register(DepartmentAttendance)
class DepartmentAttendanceAdmin(admin.ModelAdmin):
    list_display  = ['department', 'session_name', 'session_date', 'session_type']
    list_filter   = ['session_type', 'department']
    ordering      = ['-session_date']


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display  = ['person', 'attendance', 'status']
    list_filter   = ['status']
