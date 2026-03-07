import uuid
from django.db import models


class Notification(models.Model):

    NOTIFICATION_TYPES = [
        ('NEW_MEMBER_CREATED',       'New Member Created'),
        ('PROFILE_PENDING_APPROVAL', 'Profile Pending Approval'),
        ('MEMBER_APPROVED',          'Member Approved'),
        ('MEMBER_MERGED',            'Member Merged'),
        ('MEDICAL_RECORD_CREATED',   'Medical Record Created'),
        ('CELL_GROUP_NEW_MEMBER',    'Cell Group New Member'),
        ('FOLLOWUP_ASSIGNED',        'Follow-Up Assigned'),
        ('FOLLOWUP_COMPLETED',       'Follow-Up Completed'),
        ('WORKER_CREATED',           'Worker Created'),
        ('CELL_GROUP_DISBANDED',     'Cell Group Disbanded'),
        ('GENERAL',                  'General'),
    ]

    id                = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient         = models.ForeignKey(
                          'accounts.SystemUser', on_delete=models.CASCADE,
                          related_name='notifications'
                        )
    title             = models.CharField(max_length=255)
    message           = models.TextField(blank=True)
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default='GENERAL')
    entity_type       = models.CharField(max_length=50, blank=True)
    entity_id         = models.CharField(max_length=100, blank=True)
    action_url        = models.TextField(blank=True)
    is_read           = models.BooleanField(default=False, db_index=True)
    read_at           = models.DateTimeField(null=True, blank=True)
    created_at        = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} → {self.recipient.email}"
