import uuid
from django.db import models
from django.conf import settings


class SMSCampaign(models.Model):

    class Status(models.TextChoices):
        PENDING  = 'PENDING',  'Pending Approval'
        APPROVED = 'APPROVED', 'Approved & Sent'
        REJECTED = 'REJECTED', 'Rejected'

    class Channel(models.TextChoices):
        SMS       = 'SMS',       'SMS'
        WHATSAPP  = 'WHATSAPP',  'WhatsApp'

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title        = models.CharField(max_length=200)
    message      = models.TextField()
    channel      = models.CharField(max_length=20, choices=Channel.choices, default=Channel.SMS)
    recipients   = models.ManyToManyField(
                     'persons.Person',
                     related_name='sms_campaigns',
                     blank=True,
                   )
    status       = models.CharField(
                     max_length=20, choices=Status.choices,
                     default=Status.PENDING, db_index=True,
                   )
    created_by   = models.ForeignKey(
                     settings.AUTH_USER_MODEL,
                     on_delete=models.SET_NULL, null=True,
                     related_name='created_campaigns',
                   )
    reviewed_by  = models.ForeignKey(
                     settings.AUTH_USER_MODEL,
                     on_delete=models.SET_NULL, null=True, blank=True,
                     related_name='reviewed_campaigns',
                   )
    review_note  = models.TextField(blank=True)
    sent_count   = models.PositiveIntegerField(default=0)
    failed_count = models.PositiveIntegerField(default=0)
    created_at   = models.DateTimeField(auto_now_add=True)
    reviewed_at  = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'messaging_campaigns'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} [{self.status}] by {self.created_by}"

    @property
    def recipient_count(self):
        return self.recipients.count()
