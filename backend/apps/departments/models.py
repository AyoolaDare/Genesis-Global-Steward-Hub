import uuid
from django.db import models


class Department(models.Model):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name          = models.CharField(max_length=255, unique=True)
    description   = models.TextField(blank=True)
    category      = models.CharField(max_length=100, blank=True)
    team_leader   = models.ForeignKey(
                      'persons.Person', null=True, blank=True,
                      on_delete=models.SET_NULL, related_name='led_departments'
                    )
    asst_leader   = models.ForeignKey(
                      'persons.Person', null=True, blank=True,
                      on_delete=models.SET_NULL, related_name='asst_led_departments'
                    )
    is_active     = models.BooleanField(default=True)
    created_by    = models.ForeignKey(
                      'accounts.SystemUser', null=True, blank=True,
                      on_delete=models.SET_NULL, related_name='departments_created'
                    )
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'departments'
        ordering = ['name']

    def __str__(self):
        return self.name


class DepartmentMember(models.Model):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    department    = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='members')
    person        = models.ForeignKey('persons.Person', on_delete=models.CASCADE, related_name='department_memberships')
    role          = models.CharField(max_length=50, default='VOLUNTEER')
    joined_date   = models.DateField(auto_now_add=True)
    left_date     = models.DateField(null=True, blank=True)
    is_active     = models.BooleanField(default=True)
    notes         = models.TextField(blank=True)
    added_by      = models.ForeignKey(
                      'accounts.SystemUser', null=True, blank=True,
                      on_delete=models.SET_NULL, related_name='dept_members_added'
                    )
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'department_members'
        unique_together = [('department', 'person')]

    def __str__(self):
        return f"{self.person.full_name} — {self.department.name}"


class DepartmentAttendance(models.Model):
    SESSION_TYPES = [
        ('REGULAR',  'Regular'),
        ('SPECIAL',  'Special'),
        ('TRAINING', 'Training'),
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    department   = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='attendance_sessions')
    session_name = models.CharField(max_length=255, blank=True)
    session_date = models.DateField()
    session_type = models.CharField(max_length=50, choices=SESSION_TYPES, default='REGULAR')
    notes        = models.TextField(blank=True)
    marked_by    = models.ForeignKey(
                     'accounts.SystemUser', null=True, blank=True,
                     on_delete=models.SET_NULL, related_name='attendance_marked'
                   )
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'department_attendance'
        ordering = ['-session_date']

    def __str__(self):
        return f"{self.department.name} — {self.session_date}"


class AttendanceRecord(models.Model):
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT',  'Absent'),
        ('EXCUSED', 'Excused'),
        ('LATE',    'Late'),
    ]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attendance    = models.ForeignKey(DepartmentAttendance, on_delete=models.CASCADE, related_name='records')
    person        = models.ForeignKey('persons.Person', on_delete=models.CASCADE, related_name='attendance_records')
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES)
    excuse_reason = models.TextField(blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'attendance_records'

    def __str__(self):
        return f"{self.person.full_name} — {self.status}"
