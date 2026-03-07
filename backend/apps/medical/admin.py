from django.contrib import admin
from .models import MedicalRecord, MedicalVisit


class MedicalVisitInline(admin.TabularInline):
    model         = MedicalVisit
    extra         = 0
    readonly_fields = ['id', 'created_at']
    fields        = ['visit_date', 'visit_type', 'complaint', 'diagnosis', 'attended_by', 'created_at']


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display    = ['person', 'blood_group', 'genotype', 'created_at']
    search_fields   = ['person__first_name', 'person__last_name', 'person__phone']
    readonly_fields = ['id', 'created_at', 'updated_at']
    inlines         = [MedicalVisitInline]


@admin.register(MedicalVisit)
class MedicalVisitAdmin(admin.ModelAdmin):
    list_display    = ['person', 'visit_date', 'visit_type', 'attended_by', 'created_at']
    list_filter     = ['visit_type', 'visit_date']
    search_fields   = ['person__first_name', 'person__last_name', 'person__phone']
    readonly_fields = ['id', 'created_at']
    ordering        = ['-visit_date']
