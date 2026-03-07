"""
Cross-module Django signals.
Wired in each app's AppConfig.ready() method.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='persons.Person')
def on_person_created(sender, instance, created, **kwargs):
    if not created:
        return

    from apps.notifications.services import NotificationService

    # Always notify Admin on new person creation
    NotificationService.dispatch(
        event='NEW_MEMBER_CREATED',
        entity=instance,
        target_roles=['ADMIN'],
    )

    # If pending approval, additionally notify Admin
    if instance.status == 'PENDING_APPROVAL':
        NotificationService.dispatch(
            event='PROFILE_PENDING_APPROVAL',
            entity=instance,
            target_roles=['ADMIN'],
        )

    # Notify Follow-Up for all non-admin-sourced entries
    if instance.source in ('MEDICAL', 'CELL', 'FOLLOWUP'):
        NotificationService.dispatch(
            event='NEW_MEMBER_CREATED',
            entity=instance,
            target_roles=['FOLLOWUP'],
        )
