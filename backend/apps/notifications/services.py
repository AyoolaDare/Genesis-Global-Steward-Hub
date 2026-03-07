class NotificationService:
    """
    Full implementation in Phase 3.
    Stub here so signals don't fail during Phase 1 system check.
    """

    MESSAGES = {
        'NEW_MEMBER_CREATED':       {'title': 'New person added',           'message': '{name} was added by the {source} team.'},
        'PROFILE_PENDING_APPROVAL': {'title': 'Profile pending approval',   'message': '{name} needs Admin review.'},
        'MEMBER_APPROVED':          {'title': 'Profile approved',           'message': '{name} added to follow-up queue.'},
        'MEMBER_MERGED':            {'title': 'Profiles merged',            'message': 'Duplicate profile for {name} was merged.'},
    }

    @classmethod
    def dispatch(cls, event: str, entity, triggered_by=None, target_roles: list = None):
        try:
            from apps.accounts.models import SystemUser
            from .models import Notification

            template = cls.MESSAGES.get(event, {'title': event, 'message': ''})
            title    = template['title']
            message  = template['message'].format(
                name=getattr(entity, 'full_name', str(entity)),
                source=getattr(entity, 'source', ''),
            )

            recipients = SystemUser.objects.filter(role__in=target_roles or [], is_active=True)
            Notification.objects.bulk_create([
                Notification(
                    recipient=user,
                    title=title,
                    message=message,
                    notification_type=event,
                    entity_type=entity.__class__.__name__,
                    entity_id=str(entity.pk),
                )
                for user in recipients
            ])
        except Exception:
            pass
