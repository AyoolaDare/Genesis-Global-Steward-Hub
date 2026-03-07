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
    def batch_phone_lookup(phones: list) -> dict:
        from core.utils.phone import normalize_phone
        normalized = [normalize_phone(p) for p in phones]
        found_qs   = Person.objects.filter(phone__in=normalized, deleted_at__isnull=True)
        found_map  = {p.phone: p for p in found_qs}

        results = {'found': [], 'not_found': []}
        for phone in normalized:
            if phone in found_map:
                results['found'].append({
                    'phone':  phone,
                    'person': PersonListSerializer(found_map[phone]).data,
                })
            else:
                results['not_found'].append({'phone': phone})
        return results


# Avoid circular import — import here
from apps.persons.serializers import PersonListSerializer  # noqa: E402
