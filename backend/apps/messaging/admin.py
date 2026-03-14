from django.contrib import admin
from .models import SMSCampaign


@admin.register(SMSCampaign)
class SMSCampaignAdmin(admin.ModelAdmin):
    list_display  = ('title', 'channel', 'status', 'created_by', 'recipient_count', 'sent_count', 'failed_count', 'created_at')
    list_filter   = ('status', 'channel')
    search_fields = ('title', 'message', 'created_by__username')
    readonly_fields = ('sent_count', 'failed_count', 'reviewed_at', 'created_at')
