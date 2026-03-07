import uuid
from django.db import models


class FollowUpTask(models.Model):

    class TaskType(models.TextChoices):
        NEW_MEMBER_OUTREACH = 'NEW_MEMBER_OUTREACH', 'New Member Outreach'
        INACTIVE_MEMBER     = 'INACTIVE_MEMBER',     'Inactive Member'
        PRAYER              = 'PRAYER',              'Prayer'
        VISIT               = 'VISIT',               'Visit'
        CALL                = 'CALL',                'Call'
        OTHER               = 'OTHER',               'Other'

    class Priority(models.TextChoices):
        LOW    = 'LOW',    'Low'
        NORMAL = 'NORMAL', 'Normal'
        HIGH   = 'HIGH',   'High'
        URGENT = 'URGENT', 'Urgent'

    class Status(models.TextChoices):
        UNASSIGNED  = 'UNASSIGNED',  'Unassigned'
        ASSIGNED    = 'ASSIGNED',    'Assigned'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED   = 'COMPLETED',   'Completed'
        CLOSED      = 'CLOSED',      'Closed'

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person       = models.ForeignKey(
                     'persons.Person', on_delete=models.CASCADE,
                     related_name='followup_tasks'
                   )
    task_type    = models.CharField(max_length=50, choices=TaskType.choices, default=TaskType.NEW_MEMBER_OUTREACH)
    priority     = models.CharField(max_length=20, choices=Priority.choices, default=Priority.NORMAL)
    status       = models.CharField(max_length=30, choices=Status.choices, default=Status.UNASSIGNED, db_index=True)
    description  = models.TextField(blank=True)
    outcome      = models.TextField(blank=True)
    assigned_to  = models.ForeignKey(
                     'accounts.SystemUser', null=True, blank=True,
                     on_delete=models.SET_NULL, related_name='assigned_tasks'
                   )
    assigned_at  = models.DateTimeField(null=True, blank=True)
    due_date     = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    triggered_by = models.CharField(max_length=30, blank=True)
    source_id    = models.UUIDField(null=True, blank=True)
    created_by   = models.ForeignKey(
                     'accounts.SystemUser', null=True, blank=True,
                     on_delete=models.SET_NULL, related_name='tasks_created'
                   )
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'follow_up_tasks'
        ordering = ['-created_at']

    def __str__(self):
        return f"FollowUp — {self.person.full_name} [{self.status}]"
