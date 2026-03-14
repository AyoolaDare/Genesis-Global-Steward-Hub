from django.contrib import admin
from .models import (
    Department, DepartmentExecutive, DepartmentMember,
    DepartmentSession, AttendanceRecord, DepartmentMessage, MessageRecipient,
)


class DepartmentMemberInline(admin.TabularInline):
    model  = DepartmentMember
    extra  = 0
    fields = ['person', 'role', 'is_active']


class DepartmentExecutiveInline(admin.TabularInline):
    model  = DepartmentExecutive
    extra  = 0
    fields = ['person', 'system_user', 'role', 'is_active']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display    = ['name', 'category', 'is_active', 'created_at']
    list_filter     = ['is_active', 'category']
    search_fields   = ['name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    inlines         = [DepartmentExecutiveInline, DepartmentMemberInline]


@admin.register(DepartmentExecutive)
class DepartmentExecutiveAdmin(admin.ModelAdmin):
    list_display  = ['person', 'department', 'role', 'is_active', 'granted_at']
    list_filter   = ['role', 'is_active', 'department']
    search_fields = ['person__first_name', 'person__last_name']


@admin.register(DepartmentMember)
class DepartmentMemberAdmin(admin.ModelAdmin):
    list_display  = ['person', 'department', 'role', 'is_active', 'joined_date']
    list_filter   = ['role', 'is_active']
    search_fields = ['person__first_name', 'person__last_name']


@admin.register(DepartmentSession)
class DepartmentSessionAdmin(admin.ModelAdmin):
    list_display  = ['department', 'session_name', 'session_date', 'session_type']
    list_filter   = ['session_type', 'department']
    ordering      = ['-session_date']


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display  = ['person', 'session', 'status']
    list_filter   = ['status']


@admin.register(DepartmentMessage)
class DepartmentMessageAdmin(admin.ModelAdmin):
    list_display  = ['subject', 'department', 'message_type', 'approval_stage', 'created_at']
    list_filter   = ['approval_stage', 'message_type', 'department']
    search_fields = ['subject', 'body']
