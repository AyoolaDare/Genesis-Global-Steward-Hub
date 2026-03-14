from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
import random


class Command(BaseCommand):
    help = 'Seeds the database with initial data: admin user, departments, and sample members.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')
        with transaction.atomic():
            self._create_superuser()
            self._create_system_users()
            depts = self._create_departments()
            persons = self._create_persons()
            self._create_cell_group(persons)
            self._create_followup_tasks(persons)
            self._create_dept_members(depts, persons)
        self.stdout.write(self.style.SUCCESS('Database seeded successfully.'))

    def _create_superuser(self):
        from apps.accounts.models import SystemUser
        if not SystemUser.objects.filter(email='admin@church.org').exists():
            SystemUser.objects.create_superuser(
                email='admin@church.org',
                password='Admin1234!',
                username='admin',
                role='ADMIN',
            )
            self.stdout.write('  ✓ Superuser: admin@church.org / Admin1234!')
        else:
            self.stdout.write('  - Superuser already exists')

    def _create_system_users(self):
        from apps.accounts.models import SystemUser
        users = [
            {'email': 'medical@church.org',  'username': 'dr_grace',    'role': 'MEDICAL',     'password': 'Medical123!'},
            {'email': 'followup@church.org', 'username': 'pastor_james', 'role': 'FOLLOWUP',    'password': 'Followup123!'},
            {'email': 'hr@church.org',       'username': 'hr_manager',   'role': 'HR',          'password': 'HRteam123!'},
            {'email': 'cell@church.org',     'username': 'cell_admin',   'role': 'CELL_LEADER', 'password': 'Cell1234!'},
            {'email': 'dept@church.org',     'username': 'dept_leader',  'role': 'HOD',         'password': 'Dept1234!'},
        ]
        for u in users:
            if not SystemUser.objects.filter(email=u['email']).exists():
                pw = u.pop('password')
                user = SystemUser(**u)
                user.set_password(pw)
                user.save()
                self.stdout.write(f"  ✓ User: {u['email']}")

    def _create_departments(self):
        from apps.departments.models import Department
        from apps.accounts.models import SystemUser
        admin = SystemUser.objects.filter(role='ADMIN').first()
        dept_data = [
            {'name': 'Choir & Worship',    'category': 'MINISTRY', 'description': 'Leads musical worship during services.'},
            {'name': 'Media & Technology', 'category': 'MEDIA',    'description': 'Handles sound, visuals, and livestreams.'},
            {'name': 'Ushering',           'category': 'SUPPORT',  'description': 'Welcomes members and manages seating.'},
            {'name': 'Children Ministry',  'category': 'MINISTRY', 'description': 'Coordinates children programs and Sunday school.'},
            {'name': 'Welfare',            'category': 'ADMIN',    'description': 'Supports members in financial need.'},
        ]
        depts = []
        for d in dept_data:
            dept, created = Department.objects.get_or_create(
                name=d['name'],
                defaults={**d, 'created_by': admin}
            )
            depts.append(dept)
            if created:
                self.stdout.write(f"  ✓ Department: {dept.name}")
        return depts

    def _create_persons(self):
        from apps.persons.models import Person
        from core.utils.phone import normalize_phone

        sample_persons = [
            # Full members
            {'first_name': 'Adaeze',  'last_name': 'Okonkwo',  'phone': '08031234001', 'gender': 'FEMALE', 'status': 'MEMBER',           'source': 'ADMIN'},
            {'first_name': 'Chukwuemeka', 'last_name': 'Nwosu','phone': '08031234002', 'gender': 'MALE',   'status': 'MEMBER',           'source': 'ADMIN'},
            {'first_name': 'Ngozi',   'last_name': 'Eze',       'phone': '08031234003', 'gender': 'FEMALE', 'status': 'MEMBER',           'source': 'FOLLOWUP'},
            {'first_name': 'Tunde',   'last_name': 'Adeleke',   'phone': '08031234004', 'gender': 'MALE',   'status': 'MEMBER',           'source': 'ADMIN'},
            {'first_name': 'Amaka',   'last_name': 'Obi',       'phone': '08031234005', 'gender': 'FEMALE', 'status': 'MEMBER',           'source': 'MEDICAL'},
            # Workers
            {'first_name': 'Emeka',   'last_name': 'Chukwu',    'phone': '08031234006', 'gender': 'MALE',   'status': 'WORKER',           'source': 'ADMIN'},
            {'first_name': 'Blessing','last_name': 'Okoro',      'phone': '08031234007', 'gender': 'FEMALE', 'status': 'WORKER',           'source': 'ADMIN'},
            # New/Pending
            {'first_name': 'Samuel',  'last_name': 'Ibrahim',   'phone': '08031234008', 'gender': 'MALE',   'status': 'PENDING_APPROVAL', 'source': 'MEDICAL'},
            {'first_name': 'Fatima',  'last_name': 'Musa',      'phone': '08031234009', 'gender': 'FEMALE', 'status': 'PENDING_APPROVAL', 'source': 'CELL'},
            {'first_name': 'Kelechi', 'last_name': 'Onyeka',    'phone': '08031234010', 'gender': 'MALE',   'status': 'NEW_MEMBER',       'source': 'FOLLOWUP'},
            {'first_name': 'Chioma',  'last_name': 'Nzelu',     'phone': '08031234011', 'gender': 'FEMALE', 'status': 'NEW_MEMBER',       'source': 'MEDICAL'},
            # Inactive
            {'first_name': 'Dare',    'last_name': 'Adeyemi',   'phone': '08031234012', 'gender': 'MALE',   'status': 'INACTIVE',         'source': 'ADMIN'},
        ]

        persons = []
        for p in sample_persons:
            p['phone'] = normalize_phone(p['phone'])
            person, created = Person.objects.get_or_create(
                phone=p['phone'],
                defaults={k: v for k, v in p.items() if k != 'phone'}
            )
            persons.append(person)
            if created:
                self.stdout.write(f"  ✓ Person: {person.full_name} [{person.status}]")
        return persons

    def _create_cell_group(self, persons):
        from apps.cellgroups.models import CellGroup, CellGroupMember
        from apps.accounts.models import SystemUser
        cell_admin = SystemUser.objects.filter(role='CELL_LEADER').first()
        admin      = SystemUser.objects.filter(role='ADMIN').first()

        group, created = CellGroup.objects.get_or_create(
            name='Grace Connect',
            defaults={
                'description':      'A small group focused on discipleship and community.',
                'purpose':          'Spiritual growth and fellowship',
                'meeting_schedule': 'Every Saturday 4PM',
                'meeting_location': 'Church Hall B',
                'admin':            cell_admin,
                'created_by':       admin,
            }
        )
        if created:
            self.stdout.write('  ✓ Cell Group: Grace Connect')

        members_to_add = [p for p in persons if p.status in ('MEMBER', 'WORKER')][:4]
        for person in members_to_add:
            CellGroupMember.objects.get_or_create(
                cell_group=group, person=person,
                defaults={'added_by': admin, 'added_via': 'ADMIN'}
            )

    def _create_followup_tasks(self, persons):
        from apps.followup.models import FollowUpTask
        from apps.accounts.models import SystemUser
        followup_user = SystemUser.objects.filter(role='FOLLOWUP').first()
        admin         = SystemUser.objects.filter(role='ADMIN').first()

        pending_persons = [p for p in persons if p.status in ('PENDING_APPROVAL', 'NEW_MEMBER')]
        for person in pending_persons:
            existing = (
                FollowUpTask.objects
                .filter(person=person, task_type='NEW_MEMBER_OUTREACH')
                .order_by('created_at')
                .first()
            )
            if existing:
                continue

            FollowUpTask.objects.create(
                person=person,
                task_type='NEW_MEMBER_OUTREACH',
                status='ASSIGNED',
                priority='NORMAL',
                description=f'Initial outreach for new contact {person.full_name}.',
                assigned_to=followup_user,
                assigned_at=timezone.now(),
                triggered_by='AUTO',
                created_by=admin,
            )
            self.stdout.write(f"  ✓ FollowUp task: {person.full_name}")

    def _create_dept_members(self, depts, persons):
        from apps.departments.models import DepartmentMember
        from apps.accounts.models import SystemUser
        admin   = SystemUser.objects.filter(role='ADMIN').first()
        members = [p for p in persons if p.status in ('MEMBER', 'WORKER')]

        for i, dept in enumerate(depts[:3]):
            chunk = members[i*2:(i+1)*2] if members else []
            for person in chunk:
                DepartmentMember.objects.get_or_create(
                    department=dept, person=person,
                    defaults={'role': 'VOLUNTEER', 'added_by': admin}
                )
            if chunk:
                self.stdout.write(f"  ✓ Members added to {dept.name}")
