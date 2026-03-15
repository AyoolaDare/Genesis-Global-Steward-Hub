from django.db import transaction
from django.utils import timezone
from .models import Person


class PersonService:

    @staticmethod
    def approve_profile(person: Person, approved_by) -> Person:
        if person.status != Person.Status.PENDING_APPROVAL:
            raise ValueError('Only PENDING_APPROVAL profiles can be approved.')

        person.status = Person.Status.NEW_MEMBER
        person.save(update_fields=['status', 'updated_at'])

        from apps.notifications.services import NotificationService
        NotificationService.dispatch(
            event='MEMBER_APPROVED',
            entity=person,
            triggered_by=approved_by,
            target_roles=['FOLLOWUP'],
        )

        from apps.followup.services import FollowUpService
        FollowUpService.create_task(
            person=person,
            task_type='NEW_MEMBER_OUTREACH',
            triggered_by='ADMIN',
            source_id=str(approved_by.id),
            created_by=approved_by,
        )
        return person

    @staticmethod
    @transaction.atomic
    def merge_profiles(source_id, target_id, merged_by) -> Person:
        source = Person.objects.get(pk=source_id)
        target = Person.objects.get(pk=target_id)

        # Re-point medical visits
        source.medical_visits.update(person=target)

        # Re-point follow-up tasks
        source.followup_tasks.update(person=target)

        # Remove duplicate cell memberships before re-pointing
        from apps.cellgroups.models import CellGroupMember
        CellGroupMember.objects.filter(
            person=source,
            cell_group__in=CellGroupMember.objects.filter(person=target).values('cell_group'),
        ).delete()
        CellGroupMember.objects.filter(person=source).update(person=target)

        # Re-point department memberships
        from apps.departments.models import DepartmentMember
        DepartmentMember.objects.filter(
            person=source,
            department__in=DepartmentMember.objects.filter(person=target).values('department'),
        ).delete()
        DepartmentMember.objects.filter(person=source).update(person=target)

        # Transfer medical record if target has none
        if hasattr(source, 'medical_record') and not hasattr(target, 'medical_record'):
            source.medical_record.person = target
            source.medical_record.save()

        source.merged_from = target
        source.deleted_at  = timezone.now()
        source.save(update_fields=['merged_from', 'deleted_at'])

        from apps.notifications.services import NotificationService
        NotificationService.dispatch(
            event='MEMBER_MERGED',
            entity=target,
            triggered_by=merged_by,
            target_roles=['ADMIN'],
        )
        return target

    @staticmethod
    @transaction.atomic
    def bulk_import_csv(rows: list, imported_by) -> dict:
        """
        Validate and bulk-create Person records from CSV row dicts.
        Returns a summary of created / skipped / error rows.
        Each row dict uses lowercase column names matching BulkImportRowSerializer.
        """
        from .serializers import BulkImportRowSerializer

        created_count = 0
        skipped: list = []
        errors: list  = []

        # Pre-load existing phones & emails to avoid per-row DB hits
        existing_phones = set(
            Person.objects.filter(deleted_at__isnull=True).values_list('phone', flat=True)
        )
        existing_emails = set(
            Person.objects.filter(
                deleted_at__isnull=True,
                email__isnull=False,
            ).exclude(email='').values_list('email', flat=True)
        )

        persons_to_create: list = []

        for i, raw_row in enumerate(rows, start=2):  # row 1 is the CSV header
            serializer = BulkImportRowSerializer(data=raw_row)
            if not serializer.is_valid():
                errors.append({
                    'row': i,
                    'data': {
                        'first_name': raw_row.get('first_name', ''),
                        'last_name':  raw_row.get('last_name', ''),
                        'phone':      raw_row.get('phone', ''),
                    },
                    'errors': [
                        f"{field}: {', '.join(msgs)}"
                        for field, msgs in serializer.errors.items()
                    ],
                })
                continue

            data  = serializer.validated_data
            phone = data['phone']
            email = data.get('email') or None

            if phone in existing_phones:
                skipped.append({'row': i, 'phone': phone, 'reason': 'Duplicate phone'})
                continue

            if email and email in existing_emails:
                errors.append({
                    'row': i,
                    'data': {
                        'first_name': data['first_name'],
                        'last_name':  data['last_name'],
                        'phone':      phone,
                    },
                    'errors': [f"email: {email} is already registered."],
                })
                continue

            existing_phones.add(phone)
            if email:
                existing_emails.add(email)

            persons_to_create.append(Person(
                first_name=data['first_name'],
                last_name=data['last_name'],
                other_names=data.get('other_names', ''),
                phone=phone,
                email=email,
                gender=data.get('gender', ''),
                date_of_birth=data.get('date_of_birth'),
                source=data.get('source', Person.Source.ADMIN),
                address=data.get('address', ''),
                landmark=data.get('landmark', ''),
                state=data.get('state', ''),
                occupation=data.get('occupation', ''),
                marital_status=data.get('marital_status', ''),
                status=data.get('status', Person.Status.NEW_MEMBER),
            ))

        if persons_to_create:
            Person.objects.bulk_create(persons_to_create)
            created_count = len(persons_to_create)

        return {
            'created': created_count,
            'skipped': len(skipped),
            'skipped_details': skipped,
            'errors': errors,
        }

    @staticmethod
    def batch_phone_lookup(phones: list) -> dict:
        from core.utils.phone import normalize_phone
        from .serializers import PersonListSerializer  # local import avoids circular dependency

        normalized = [normalize_phone(p) for p in phones]
        found_qs   = Person.objects.filter(phone__in=normalized, deleted_at__isnull=True)
        found_map  = {p.phone: p for p in found_qs}

        results_list = []
        found        = []
        not_found    = []
        for phone in normalized:
            if phone in found_map:
                entry = {'phone': phone, 'person': PersonListSerializer(found_map[phone]).data}
                results_list.append(entry)
                found.append(entry)
            else:
                results_list.append({'phone': phone, 'person': None})
                not_found.append({'phone': phone})
        return {'results': results_list, 'found': found, 'not_found': not_found}
