from django.contrib import admin
from .models import Person


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display    = ['full_name', 'phone', 'email', 'status', 'source', 'created_at']
    list_filter     = ['status', 'source', 'gender', 'baptized']
    search_fields   = ['first_name', 'last_name', 'phone', 'email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering        = ['-created_at']
    list_per_page   = 50

    fieldsets = (
        ('Identity',   {'fields': ('id', 'first_name', 'last_name', 'other_names', 'gender', 'date_of_birth', 'profile_photo')}),
        ('Contact',    {'fields': ('phone', 'email', 'address', 'state', 'country')}),
        ('Emergency',  {'fields': ('emergency_contact_name', 'emergency_contact_phone')}),
        ('Church',     {'fields': ('status', 'source', 'joined_date', 'baptized', 'baptism_date')}),
        ('System',     {'fields': ('is_profile_complete', 'merged_from', 'deleted_at', 'created_at', 'updated_at')}),
    )
