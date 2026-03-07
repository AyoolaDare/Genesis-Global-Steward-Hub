from django.contrib import admin
from .models import CellGroup, CellGroupMember


class CellGroupMemberInline(admin.TabularInline):
    model  = CellGroupMember
    extra  = 0
    fields = ['person', 'role', 'is_active', 'joined_date']


@admin.register(CellGroup)
class CellGroupAdmin(admin.ModelAdmin):
    list_display    = ['name', 'admin', 'status', 'created_at']
    list_filter     = ['status']
    search_fields   = ['name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    inlines         = [CellGroupMemberInline]


@admin.register(CellGroupMember)
class CellGroupMemberAdmin(admin.ModelAdmin):
    list_display  = ['person', 'cell_group', 'role', 'is_active', 'joined_date']
    list_filter   = ['role', 'is_active']
    search_fields = ['person__first_name', 'person__last_name', 'cell_group__name']
