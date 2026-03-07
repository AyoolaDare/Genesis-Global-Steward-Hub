from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display    = ['action', 'user', 'user_role', 'entity_type', 'ip_address', 'created_at']
    list_filter     = ['user_role', 'entity_type']
    search_fields   = ['action', 'user__email']
    readonly_fields = [f.name for f in AuditLog._meta.get_fields()]
    ordering        = ['-created_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
