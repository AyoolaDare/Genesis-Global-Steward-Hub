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

    # Collect all target roles for NEW_MEMBER_CREATED and send in one dispatch
    # (previously fired 2 separate dispatches = 4 DB queries for medical/cell/followup sources)
    new_member_roles = ['ADMIN']
    if instance.source in ('MEDICAL', 'CELL', 'FOLLOWUP'):
        new_member_roles.append('FOLLOWUP')

    NotificationService.dispatch(
        event='NEW_MEMBER_CREATED',
        entity=instance,
        target_roles=new_member_roles,
    )

    # PENDING_APPROVAL is a distinct event with its own notification — keep separate
    if instance.status == 'PENDING_APPROVAL':
        NotificationService.dispatch(
            event='PROFILE_PENDING_APPROVAL',
            entity=instance,
            target_roles=['ADMIN'],
        )
