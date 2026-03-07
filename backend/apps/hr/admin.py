from django.contrib import admin
from .models import WorkerProfile


@admin.register(WorkerProfile)
class WorkerProfileAdmin(admin.ModelAdmin):
    list_display    = ['worker_id', 'person', 'job_title', 'department', 'employment_status', 'hire_date']
    list_filter     = ['employment_status', 'employment_type']
    search_fields   = ['worker_id', 'person__first_name', 'person__last_name', 'job_title']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering        = ['-created_at']
