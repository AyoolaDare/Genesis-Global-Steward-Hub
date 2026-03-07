import uuid
from django.db import models


class CellGroup(models.Model):

    class Status(models.TextChoices):
        ACTIVE    = 'ACTIVE',    'Active'
        SUSPENDED = 'SUSPENDED', 'Suspended'
        DISBANDED = 'DISBANDED', 'Disbanded'

    id                = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name              = models.CharField(max_length=255)
    description       = models.TextField(blank=True)
    purpose           = models.TextField(blank=True)
    admin             = models.ForeignKey(
                          'accounts.SystemUser', null=True, blank=True,
                          on_delete=models.SET_NULL, related_name='cell_groups_administered'
                        )
    status            = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    disbanded_at      = models.DateTimeField(null=True, blank=True)
    disbanded_reason  = models.TextField(blank=True)
    meeting_schedule  = models.CharField(max_length=255, blank=True)
    meeting_location  = models.CharField(max_length=255, blank=True)
    created_by        = models.ForeignKey(
                          'accounts.SystemUser', null=True, blank=True,
                          on_delete=models.SET_NULL, related_name='cell_groups_created'
                        )
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cell_groups'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class CellGroupMember(models.Model):

    class Role(models.TextChoices):
        MEMBER    = 'MEMBER',    'Member'
        LEADER    = 'LEADER',    'Leader'
        ASSISTANT = 'ASSISTANT', 'Assistant'

    class AddedVia(models.TextChoices):
        PHONE_SEARCH = 'PHONE_SEARCH', 'Phone Search'
        MANUAL       = 'MANUAL',       'Manual'
        ADMIN        = 'ADMIN',        'Admin'

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cell_group  = models.ForeignKey(CellGroup, on_delete=models.CASCADE, related_name='members')
    person      = models.ForeignKey('persons.Person', on_delete=models.CASCADE, related_name='cellgroup_memberships')
    role        = models.CharField(max_length=30, choices=Role.choices, default=Role.MEMBER)
    joined_date = models.DateField(auto_now_add=True)
    left_date   = models.DateField(null=True, blank=True)
    is_active   = models.BooleanField(default=True)
    added_by    = models.ForeignKey(
                    'accounts.SystemUser', null=True, blank=True,
                    on_delete=models.SET_NULL, related_name='cell_members_added'
                  )
    added_via   = models.CharField(max_length=30, choices=AddedVia.choices, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'cell_group_members'
        unique_together = [('cell_group', 'person')]

    def __str__(self):
        return f"{self.person.full_name} in {self.cell_group.name}"
