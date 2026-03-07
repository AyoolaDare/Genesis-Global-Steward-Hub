from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import SystemUser


@admin.register(SystemUser)
class SystemUserAdmin(UserAdmin):
    list_display   = ['email', 'username', 'role', 'is_active', 'last_login', 'created_at']
    list_filter    = ['role', 'is_active']
    search_fields  = ['email', 'username']
    ordering       = ['-created_at']
    readonly_fields = ['id', 'created_at', 'updated_at']

    fieldsets = (
        (None,          {'fields': ('id', 'email', 'username', 'password')}),
        ('Role',        {'fields': ('role', 'module_access')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates',       {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields':  ('email', 'username', 'password1', 'password2', 'role'),
        }),
    )
