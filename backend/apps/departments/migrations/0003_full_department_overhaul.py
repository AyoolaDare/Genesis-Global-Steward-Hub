"""
Migration 0003 — Full department overhaul per DEPARTMENT.md spec.

Changes:
  - Remove team_leader / asst_leader FKs from Department
  - Add DepartmentExecutive model (portal access: HOD/ASST_HOD/WELFARE/PRO)
  - Simplify DepartmentMember.role to MEMBER/VOLUNTEER; add removal_reason, removed_by, updated_at
  - Replace DepartmentAttendance with DepartmentSession (new table; adds REHEARSAL type)
  - Rebuild AttendanceRecord: link to DepartmentSession, add department FK + marked_by FK
  - Add DepartmentMessage model (full approval pipeline)
  - Add MessageRecipient model
"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('departments', '0002_departmentmember_role_choices'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('persons', '0001_initial'),
    ]

    operations = [

        # ── 1. Remove old leader FKs from Department ──────────────────────
        migrations.RemoveField(model_name='department', name='team_leader'),
        migrations.RemoveField(model_name='department', name='asst_leader'),

        # ── 2. DepartmentExecutive (new table) ────────────────────────────
        migrations.CreateModel(
            name='DepartmentExecutive',
            fields=[
                ('id',         models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ('role',       models.CharField(
                                    max_length=20,
                                    choices=[
                                        ('HOD',      'Head of Department'),
                                        ('ASST_HOD', 'Assistant Head of Department'),
                                        ('WELFARE',  'Welfare Officer'),
                                        ('PRO',      'Public Relations Officer'),
                                    ]
                               )),
                ('granted_at', models.DateTimeField(auto_now_add=True)),
                ('revoked_at', models.DateTimeField(blank=True, null=True)),
                ('is_active',  models.BooleanField(default=True)),
                ('department', models.ForeignKey(
                                   on_delete=django.db.models.deletion.CASCADE,
                                   related_name='executives',
                                   to='departments.department',
                               )),
                ('person',     models.ForeignKey(
                                   on_delete=django.db.models.deletion.CASCADE,
                                   related_name='executive_roles',
                                   to='persons.person',
                               )),
                ('system_user', models.ForeignKey(
                                   blank=True, null=True,
                                   on_delete=django.db.models.deletion.SET_NULL,
                                   related_name='executive_access',
                                   to=settings.AUTH_USER_MODEL,
                               )),
                ('granted_by', models.ForeignKey(
                                   blank=True, null=True,
                                   on_delete=django.db.models.deletion.SET_NULL,
                                   related_name='granted_executives',
                                   to=settings.AUTH_USER_MODEL,
                               )),
            ],
            options={'db_table': 'department_executives'},
        ),
        migrations.AddConstraint(
            model_name='departmentexecutive',
            constraint=models.UniqueConstraint(
                fields=['department', 'role'],
                name='unique_dept_role',
                condition=models.Q(is_active=True),
            ),
        ),

        # ── 3. DepartmentMember: simplify role choices + add fields ───────
        migrations.AlterField(
            model_name='departmentmember',
            name='role',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('MEMBER',    'Member'),
                    ('VOLUNTEER', 'Volunteer'),
                ],
                default='MEMBER',
            ),
        ),
        migrations.AddField(
            model_name='departmentmember',
            name='removal_reason',
            field=models.TextField(blank=True, default=''),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='departmentmember',
            name='removed_by',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='dept_members_removed',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='departmentmember',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),

        # ── 4. DepartmentSession (replaces DepartmentAttendance) ──────────
        migrations.CreateModel(
            name='DepartmentSession',
            fields=[
                ('id',           models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ('session_name', models.CharField(max_length=255)),
                ('session_date', models.DateField()),
                ('session_type', models.CharField(
                                     max_length=20,
                                     choices=[
                                         ('REGULAR',   'Regular Meeting'),
                                         ('TRAINING',  'Training Session'),
                                         ('SPECIAL',   'Special Event'),
                                         ('REHEARSAL', 'Rehearsal'),
                                     ],
                                     default='REGULAR',
                                 )),
                ('notes',        models.TextField(blank=True)),
                ('created_at',   models.DateTimeField(auto_now_add=True)),
                ('department',   models.ForeignKey(
                                     on_delete=django.db.models.deletion.CASCADE,
                                     related_name='sessions',
                                     to='departments.department',
                                 )),
                ('created_by',   models.ForeignKey(
                                     blank=True, null=True,
                                     on_delete=django.db.models.deletion.SET_NULL,
                                     related_name='sessions_created',
                                     to=settings.AUTH_USER_MODEL,
                                 )),
            ],
            options={'db_table': 'department_sessions', 'ordering': ['-session_date']},
        ),

        # ── 5. Rebuild AttendanceRecord ────────────────────────────────────
        # Drop old table entirely and recreate with correct FKs.
        # (Dev environment — no production data to preserve.)
        migrations.DeleteModel(name='AttendanceRecord'),
        migrations.DeleteModel(name='DepartmentAttendance'),

        migrations.CreateModel(
            name='AttendanceRecord',
            fields=[
                ('id',            models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ('status',        models.CharField(
                                      max_length=10,
                                      choices=[
                                          ('PRESENT', 'Present'),
                                          ('ABSENT',  'Absent'),
                                          ('EXCUSED', 'Excused'),
                                          ('LATE',    'Late'),
                                      ],
                                  )),
                ('excuse_reason', models.TextField(blank=True)),
                ('created_at',    models.DateTimeField(auto_now_add=True)),
                ('session',       models.ForeignKey(
                                      on_delete=django.db.models.deletion.CASCADE,
                                      related_name='records',
                                      to='departments.departmentsession',
                                  )),
                ('department',    models.ForeignKey(
                                      on_delete=django.db.models.deletion.CASCADE,
                                      related_name='attendance_records',
                                      to='departments.department',
                                  )),
                ('person',        models.ForeignKey(
                                      on_delete=django.db.models.deletion.CASCADE,
                                      related_name='attendance_records',
                                      to='persons.person',
                                  )),
                ('marked_by',     models.ForeignKey(
                                      blank=True, null=True,
                                      on_delete=django.db.models.deletion.SET_NULL,
                                      related_name='attendance_marked',
                                      to=settings.AUTH_USER_MODEL,
                                  )),
            ],
            options={'db_table': 'attendance_records'},
        ),
        migrations.AddConstraint(
            model_name='attendancerecord',
            constraint=models.UniqueConstraint(
                fields=['session', 'person'],
                name='unique_session_person',
            ),
        ),

        # ── 6. DepartmentMessage ───────────────────────────────────────────
        migrations.CreateModel(
            name='DepartmentMessage',
            fields=[
                ('id',                      models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ('subject',                 models.CharField(max_length=255)),
                ('body',                    models.TextField()),
                ('message_type',            models.CharField(
                                                max_length=20,
                                                choices=[
                                                    ('ANNOUNCEMENT',   'Announcement'),
                                                    ('REMINDER',       'Reminder'),
                                                    ('WELFARE_CHECK',  'Welfare Check'),
                                                    ('PRAYER_REQUEST', 'Prayer Request'),
                                                    ('URGENT',         'Urgent'),
                                                ],
                                            )),
                ('priority',                models.CharField(
                                                max_length=10,
                                                choices=[
                                                    ('NORMAL', 'Normal'),
                                                    ('HIGH',   'High'),
                                                    ('URGENT', 'Urgent'),
                                                ],
                                                default='NORMAL',
                                            )),
                ('recipient_scope',         models.CharField(
                                                max_length=20,
                                                choices=[
                                                    ('ALL',       'All Department Members'),
                                                    ('SPECIFIC',  'Specific Members'),
                                                    ('ABSENTEES', 'Last Session Absentees'),
                                                ],
                                                default='ALL',
                                            )),
                ('approval_stage',          models.CharField(
                                                max_length=20,
                                                choices=[
                                                    ('DRAFT',          'Draft'),
                                                    ('PENDING_LEVEL1', 'Pending Level 1'),
                                                    ('PENDING_ADMIN',  'Pending Admin'),
                                                    ('APPROVED',       'Approved'),
                                                    ('SENT',           'Sent'),
                                                    ('REJECTED_L1',    'Rejected at Level 1'),
                                                    ('REJECTED_ADMIN', 'Rejected by Admin'),
                                                ],
                                                default='DRAFT',
                                            )),
                ('level1_reviewed_at',      models.DateTimeField(blank=True, null=True)),
                ('level1_rejection_reason', models.TextField(blank=True)),
                ('admin_reviewed_at',       models.DateTimeField(blank=True, null=True)),
                ('admin_rejection_reason',  models.TextField(blank=True)),
                ('sent_at',                 models.DateTimeField(blank=True, null=True)),
                ('created_at',              models.DateTimeField(auto_now_add=True)),
                ('updated_at',              models.DateTimeField(auto_now=True)),
                ('department',              models.ForeignKey(
                                                on_delete=django.db.models.deletion.CASCADE,
                                                related_name='messages',
                                                to='departments.department',
                                            )),
                ('level1_reviewed_by',      models.ForeignKey(
                                                blank=True, null=True,
                                                on_delete=django.db.models.deletion.SET_NULL,
                                                related_name='l1_reviewed_messages',
                                                to=settings.AUTH_USER_MODEL,
                                            )),
                ('admin_reviewed_by',       models.ForeignKey(
                                                blank=True, null=True,
                                                on_delete=django.db.models.deletion.SET_NULL,
                                                related_name='admin_reviewed_messages',
                                                to=settings.AUTH_USER_MODEL,
                                            )),
                ('created_by',              models.ForeignKey(
                                                blank=True, null=True,
                                                on_delete=django.db.models.deletion.SET_NULL,
                                                related_name='authored_dept_messages',
                                                to=settings.AUTH_USER_MODEL,
                                            )),
            ],
            options={'db_table': 'department_messages', 'ordering': ['-created_at']},
        ),

        # ── 7. MessageRecipient ────────────────────────────────────────────
        migrations.CreateModel(
            name='MessageRecipient',
            fields=[
                ('id',           models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ('delivered_at', models.DateTimeField(blank=True, null=True)),
                ('read_at',      models.DateTimeField(blank=True, null=True)),
                ('message',      models.ForeignKey(
                                     on_delete=django.db.models.deletion.CASCADE,
                                     related_name='recipients',
                                     to='departments.departmentmessage',
                                 )),
                ('person',       models.ForeignKey(
                                     on_delete=django.db.models.deletion.CASCADE,
                                     related_name='dept_message_receipts',
                                     to='persons.person',
                                 )),
            ],
            options={'db_table': 'message_recipients'},
        ),
        migrations.AddConstraint(
            model_name='messagerecipient',
            constraint=models.UniqueConstraint(
                fields=['message', 'person'],
                name='unique_message_person',
            ),
        ),
    ]
