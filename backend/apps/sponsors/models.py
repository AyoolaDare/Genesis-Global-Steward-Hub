import uuid
from django.db import models
from django.db.models import Sum


class Sponsor(models.Model):

    class SponsorType(models.TextChoices):
        INDIVIDUAL   = 'INDIVIDUAL',   'Individual'
        ORGANIZATION = 'ORGANIZATION', 'Organization'

    class SponsorStatus(models.TextChoices):
        ACTIVE   = 'ACTIVE',   'Active'
        INACTIVE = 'INACTIVE', 'Inactive'
        LAPSED   = 'LAPSED',   'Lapsed'

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sponsor_id   = models.CharField(max_length=50, unique=True)
    person       = models.OneToOneField(
                     'persons.Person', null=True, blank=True,
                     on_delete=models.SET_NULL, related_name='sponsor_profile'
                   )
    name         = models.CharField(max_length=255, db_index=True)
    email        = models.EmailField(blank=True)
    phone        = models.CharField(max_length=30, blank=True, db_index=True)
    sponsor_type = models.CharField(
                     max_length=20, choices=SponsorType.choices,
                     default=SponsorType.INDIVIDUAL, db_index=True
                   )
    status       = models.CharField(
                     max_length=20, choices=SponsorStatus.choices,
                     default=SponsorStatus.ACTIVE, db_index=True
                   )
    notes        = models.TextField(blank=True)
    created_by   = models.ForeignKey(
                     'accounts.SystemUser', null=True, blank=True,
                     on_delete=models.SET_NULL, related_name='sponsors_created'
                   )
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sponsors'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.sponsor_id} — {self.name}"

    @property
    def total_committed(self):
        return float(
            self.commitments.filter(is_active=True)
                            .aggregate(s=Sum('amount'))['s'] or 0
        )

    @property
    def total_paid(self):
        return float(
            self.payments.filter(status=SponsorshipPayment.PaymentStatus.CONFIRMED)
                         .aggregate(s=Sum('amount'))['s'] or 0
        )

    @property
    def outstanding(self):
        return max(0, self.total_committed - self.total_paid)


class SponsorshipCommitment(models.Model):

    class Frequency(models.TextChoices):
        ONE_TIME  = 'ONE_TIME',  'One-time'
        MONTHLY   = 'MONTHLY',   'Monthly'
        QUARTERLY = 'QUARTERLY', 'Quarterly'
        ANNUAL    = 'ANNUAL',    'Annual'

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sponsor    = models.ForeignKey(Sponsor, on_delete=models.CASCADE, related_name='commitments')
    project    = models.CharField(max_length=255, blank=True)
    amount     = models.DecimalField(max_digits=14, decimal_places=2)
    currency   = models.CharField(max_length=5, default='NGN')
    frequency  = models.CharField(
                   max_length=20, choices=Frequency.choices,
                   default=Frequency.ONE_TIME
                 )
    start_date = models.DateField()
    end_date   = models.DateField(null=True, blank=True)
    is_active  = models.BooleanField(default=True, db_index=True)
    notes      = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sponsorship_commitments'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.sponsor.name} — {self.project or 'General'} ({self.amount})"

    @property
    def total_paid(self):
        return float(
            self.payments.filter(status=SponsorshipPayment.PaymentStatus.CONFIRMED)
                         .aggregate(s=Sum('amount'))['s'] or 0
        )

    @property
    def outstanding(self):
        return max(0, float(self.amount) - self.total_paid)


class SponsorshipPayment(models.Model):

    class PaymentMethod(models.TextChoices):
        PAYSTACK      = 'PAYSTACK',      'Paystack'
        BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Transfer'
        CASH          = 'CASH',          'Cash'
        CHEQUE        = 'CHEQUE',        'Cheque'
        OTHER         = 'OTHER',         'Other'

    class PaymentStatus(models.TextChoices):
        PENDING   = 'PENDING',   'Pending'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        FAILED    = 'FAILED',    'Failed'

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sponsor        = models.ForeignKey(Sponsor, on_delete=models.CASCADE, related_name='payments')
    commitment     = models.ForeignKey(
                       SponsorshipCommitment, null=True, blank=True,
                       on_delete=models.SET_NULL, related_name='payments'
                     )
    amount         = models.DecimalField(max_digits=14, decimal_places=2)
    currency       = models.CharField(max_length=5, default='NGN')
    payment_method = models.CharField(
                       max_length=20, choices=PaymentMethod.choices,
                       default=PaymentMethod.CASH, db_index=True
                     )
    payment_date   = models.DateField(db_index=True)
    reference      = models.CharField(max_length=255, blank=True, db_index=True)
    status         = models.CharField(
                       max_length=20, choices=PaymentStatus.choices,
                       default=PaymentStatus.CONFIRMED, db_index=True
                     )
    notes          = models.TextField(blank=True)
    recorded_by    = models.ForeignKey(
                       'accounts.SystemUser', null=True, blank=True,
                       on_delete=models.SET_NULL, related_name='payments_recorded'
                     )
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sponsorship_payments'
        ordering = ['-payment_date', '-created_at']

    def __str__(self):
        return f"{self.sponsor.name} — ₦{self.amount} on {self.payment_date}"


class SponsorMessage(models.Model):

    class MessageType(models.TextChoices):
        THANK_YOU = 'THANK_YOU', 'Thank You'
        GREETING  = 'GREETING',  'Greeting'
        PRAYER    = 'PRAYER',    'Prayer'
        CUSTOM    = 'CUSTOM',    'Custom'

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sponsor      = models.ForeignKey(Sponsor, on_delete=models.CASCADE, related_name='messages')
    payment      = models.ForeignKey(
                     SponsorshipPayment, null=True, blank=True,
                     on_delete=models.SET_NULL, related_name='messages'
                   )
    message_type = models.CharField(max_length=20, choices=MessageType.choices, db_index=True)
    body         = models.TextField()
    phone        = models.CharField(max_length=30)
    success      = models.BooleanField(default=False)
    sent_by      = models.ForeignKey(
                     'accounts.SystemUser', null=True, blank=True,
                     on_delete=models.SET_NULL, related_name='sponsor_messages_sent'
                   )
    sent_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sponsor_messages'
        ordering = ['-sent_at']

    def __str__(self):
        return f"{self.get_message_type_display()} → {self.sponsor.name} ({self.sent_at.date()})"
