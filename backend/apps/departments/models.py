import uuid
from django.db import models


class Department(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name        = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    category    = models.CharField(max_length=100, blank=True)
    is_active   = models.BooleanField(default=True)
    created_by  = models.ForeignKey(
                    'accounts.SystemUser', null=True, blank=True,
                    on_delete=models.SET_NULL, related_name='departments_created'
                  )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'departments'
        ordering = ['name']

    def __str__(self):
        return self.name


class DepartmentExecutive(models.Model):
    """
    Tracks who has portal (login) access to a department.
    Four roles per spec: HOD, ASST_HOD, WELFARE, PRO.
    One person per role per department.
    """

    class Role(models.TextChoices):
        HOD      = 'HOD',      'Head of Department'
        ASST_HOD = 'ASST_HOD', 'Assistant Head of Department'
        WELFARE  = 'WELFARE',  'Welfare Officer'
        PRO      = 'PRO',      'Public Relations Officer'

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    department  = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='executives')
    person      = models.ForeignKey(
                    'persons.Person', on_delete=models.CASCADE, related_name='executive_roles'
                  )
    system_user = models.ForeignKey(
                    'accounts.SystemUser', null=True, blank=True,
                    on_delete=models.SET_NULL, related_name='executive_access'
                  )
    role        = models.CharField(max_length=20, choices=Role.choices)
    granted_by  = models.ForeignKey(
                    'accounts.SystemUser', null=True, blank=True,
                    on_delete=models.SET_NULL, related_name='granted_executives'
                  )
    granted_at  = models.DateTimeField(auto_now_add=True)
    revoked_at  = models.DateTimeField(null=True, blank=True)
    is_active   = models.BooleanField(default=True)

    class Meta:
        db_table        = 'department_executives'
        unique_together = [('department', 'role')]

    def __str__(self):
        return f"{self.person.full_name} — {self.role} ({self.department.name})"


class DepartmentMember(models.Model):
    """
    Regular members on a department's roster.
    Does NOT confer portal access — that is DepartmentExecutive.
    """

    class MemberRole(models.TextChoices):
        MEMBER    = 'MEMBER',    'Member'
        VOLUNTEER = 'VOLUNTEER', 'Volunteer'

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    department     = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='members')
    person         = models.ForeignKey(
                       'persons.Person', on_delete=models.CASCADE, related_name='department_memberships'
                     )
    role           = models.CharField(max_length=20, choices=MemberRole.choices, default=MemberRole.MEMBER)
    joined_date    = models.DateField(auto_now_add=True)
    left_date      = models.DateField(null=True, blank=True)
    removal_reason = models.TextField(blank=True)
    is_active      = models.BooleanField(default=True)
    notes          = models.TextField(blank=True)
    added_by       = models.ForeignKey(
                       'accounts.SystemUser', null=True, blank=True,
                       on_delete=models.SET_NULL, related_name='dept_members_added'
                     )
    removed_by     = models.ForeignKey(
                       'accounts.SystemUser', null=True, blank=True,
                       on_delete=models.SET_NULL, related_name='dept_members_removed'
                     )
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table        = 'department_members'
        unique_together = [('department', 'person')]

    def __str__(self):
        return f"{self.person.full_name} — {self.department.name}"


class DepartmentSession(models.Model):
    """An attendance session. Replaces old DepartmentAttendance."""

    class SessionType(models.TextChoices):
        REGULAR   = 'REGULAR',   'Regular Meeting'
        TRAINING  = 'TRAINING',  'Training Session'
        SPECIAL   = 'SPECIAL',   'Special Event'
        REHEARSAL = 'REHEARSAL', 'Rehearsal'

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    department   = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='sessions')
    session_name = models.CharField(max_length=255)
    session_date = models.DateField()
    session_type = models.CharField(
                     max_length=20, choices=SessionType.choices, default=SessionType.REGULAR
                   )
    notes        = models.TextField(blank=True)
    created_by   = models.ForeignKey(
                     'accounts.SystemUser', null=True, blank=True,
                     on_delete=models.SET_NULL, related_name='sessions_created'
                   )
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'department_sessions'
        ordering = ['-session_date']

    def __str__(self):
        return f"{self.department.name} — {self.session_name} ({self.session_date})"


class AttendanceRecord(models.Model):

    class Status(models.TextChoices):
        PRESENT = 'PRESENT', 'Present'
        ABSENT  = 'ABSENT',  'Absent'
        EXCUSED = 'EXCUSED', 'Excused'
        LATE    = 'LATE',    'Late'

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session       = models.ForeignKey(DepartmentSession, on_delete=models.CASCADE, related_name='records')
    department    = models.ForeignKey(
                      Department, on_delete=models.CASCADE, related_name='attendance_records'
                    )
    person        = models.ForeignKey(
                      'persons.Person', on_delete=models.CASCADE, related_name='attendance_records'
                    )
    status        = models.CharField(max_length=10, choices=Status.choices)
    excuse_reason = models.TextField(blank=True)
    marked_by     = models.ForeignKey(
                      'accounts.SystemUser', null=True, blank=True,
                      on_delete=models.SET_NULL, related_name='attendance_marked'
                    )
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'attendance_records'
        unique_together = [('session', 'person')]

    def __str__(self):
        return f"{self.person.full_name} — {self.status}"


class DepartmentMessage(models.Model):

    class MessageType(models.TextChoices):
        ANNOUNCEMENT   = 'ANNOUNCEMENT',   'Announcement'
        REMINDER       = 'REMINDER',       'Reminder'
        WELFARE_CHECK  = 'WELFARE_CHECK',  'Welfare Check'
        PRAYER_REQUEST = 'PRAYER_REQUEST', 'Prayer Request'
        URGENT         = 'URGENT',         'Urgent'

    class ApprovalStage(models.TextChoices):
        DRAFT          = 'DRAFT',          'Draft'
        PENDING_LEVEL1 = 'PENDING_LEVEL1', 'Pending Level 1'
        PENDING_ADMIN  = 'PENDING_ADMIN',  'Pending Admin'
        APPROVED       = 'APPROVED',       'Approved'
        SENT           = 'SENT',           'Sent'
        REJECTED_L1    = 'REJECTED_L1',    'Rejected at Level 1'
        REJECTED_ADMIN = 'REJECTED_ADMIN', 'Rejected by Admin'

    class Priority(models.TextChoices):
        NORMAL = 'NORMAL', 'Normal'
        HIGH   = 'HIGH',   'High'
        URGENT = 'URGENT', 'Urgent'

    class RecipientScope(models.TextChoices):
        ALL       = 'ALL',       'All Department Members'
        SPECIFIC  = 'SPECIFIC',  'Specific Members'
        ABSENTEES = 'ABSENTEES', 'Last Session Absentees'

    id                      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    department              = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='messages')
    subject                 = models.CharField(max_length=255)
    body                    = models.TextField()
    message_type            = models.CharField(max_length=20, choices=MessageType.choices)
    priority                = models.CharField(max_length=10, choices=Priority.choices, default=Priority.NORMAL)
    recipient_scope         = models.CharField(max_length=20, choices=RecipientScope.choices, default=RecipientScope.ALL)
    approval_stage          = models.CharField(
                                max_length=20, choices=ApprovalStage.choices, default=ApprovalStage.DRAFT
                              )
    # Level 1 review (HOD / ASST_HOD)
    level1_reviewed_by      = models.ForeignKey(
                                'accounts.SystemUser', null=True, blank=True,
                                on_delete=models.SET_NULL, related_name='l1_reviewed_messages'
                              )
    level1_reviewed_at      = models.DateTimeField(null=True, blank=True)
    level1_rejection_reason = models.TextField(blank=True)
    # Level 2 review (Admin)
    admin_reviewed_by       = models.ForeignKey(
                                'accounts.SystemUser', null=True, blank=True,
                                on_delete=models.SET_NULL, related_name='admin_reviewed_messages'
                              )
    admin_reviewed_at       = models.DateTimeField(null=True, blank=True)
    admin_rejection_reason  = models.TextField(blank=True)

    sent_at    = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
                   'accounts.SystemUser', null=True, blank=True,
                   on_delete=models.SET_NULL, related_name='authored_dept_messages'
                 )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'department_messages'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.subject} ({self.department.name})"


class MessageRecipient(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message      = models.ForeignKey(DepartmentMessage, on_delete=models.CASCADE, related_name='recipients')
    person       = models.ForeignKey(
                     'persons.Person', on_delete=models.CASCADE, related_name='dept_message_receipts'
                   )
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at      = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table        = 'message_recipients'
        unique_together = [('message', 'person')]

    def __str__(self):
        return f"{self.person.full_name} ← {self.message.subject}"
