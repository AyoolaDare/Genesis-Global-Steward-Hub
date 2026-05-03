from django.contrib import admin
from .models import Sponsor, SponsorshipCommitment, SponsorshipPayment, SponsorMessage


class CommitmentInline(admin.TabularInline):
    model  = SponsorshipCommitment
    extra  = 0
    fields = ['project', 'amount', 'currency', 'frequency', 'start_date', 'end_date', 'is_active']


class PaymentInline(admin.TabularInline):
    model  = SponsorshipPayment
    extra  = 0
    fields = ['amount', 'currency', 'payment_method', 'payment_date', 'reference', 'status']
    readonly_fields = ['created_at']


@admin.register(Sponsor)
class SponsorAdmin(admin.ModelAdmin):
    list_display  = ['sponsor_id', 'name', 'sponsor_type', 'status', 'email', 'phone', 'created_at']
    list_filter   = ['sponsor_type', 'status']
    search_fields = ['name', 'email', 'phone', 'sponsor_id']
    inlines       = [CommitmentInline, PaymentInline]
    readonly_fields = ['id', 'sponsor_id', 'created_at', 'updated_at']


@admin.register(SponsorshipCommitment)
class CommitmentAdmin(admin.ModelAdmin):
    list_display  = ['sponsor', 'project', 'amount', 'currency', 'frequency', 'start_date', 'is_active']
    list_filter   = ['frequency', 'is_active', 'currency']
    search_fields = ['sponsor__name', 'project']


@admin.register(SponsorshipPayment)
class PaymentAdmin(admin.ModelAdmin):
    list_display  = ['sponsor', 'amount', 'currency', 'payment_method', 'payment_date', 'status', 'reference']
    list_filter   = ['payment_method', 'status', 'currency']
    search_fields = ['sponsor__name', 'reference']
    readonly_fields = ['id', 'created_at']


@admin.register(SponsorMessage)
class SponsorMessageAdmin(admin.ModelAdmin):
    list_display    = ['sponsor', 'message_type', 'phone', 'success', 'sent_at']
    list_filter     = ['message_type', 'success']
    search_fields   = ['sponsor__name', 'phone', 'body']
    readonly_fields = ['id', 'sent_at']
