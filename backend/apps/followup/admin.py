from django.contrib import admin
from .models import FollowUpTask


@admin.register(FollowUpTask)
class FollowUpTaskAdmin(admin.ModelAdmin):
    list_display    = ['person', 'task_type', 'status', 'priority', 'assigned_to', 'created_at']
    list_filter     = ['status', 'task_type', 'priority']
    search_fields   = ['person__first_name', 'person__last_name', 'person__phone']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering        = ['-created_at']
