import uuid
from django.db import models


class AuditLog(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user        = models.ForeignKey(
                    'accounts.SystemUser', null=True, blank=True,
                    on_delete=models.SET_NULL, related_name='audit_logs'
                  )
    user_role   = models.CharField(max_length=30, blank=True)
    action      = models.CharField(max_length=200)
    entity_type = models.CharField(max_length=50, blank=True)
    entity_id   = models.UUIDField(null=True, blank=True)
    before_state = models.JSONField(null=True, blank=True)
    after_state  = models.JSONField(null=True, blank=True)
    ip_address  = models.GenericIPAddressField(null=True, blank=True)
    user_agent  = models.TextField(blank=True)
    request_id  = models.UUIDField(null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    # No updated_at — append-only table

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} by {self.user_role} at {self.created_at}"
