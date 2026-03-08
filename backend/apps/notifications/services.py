"""Notification dispatch service for in-app notifications."""
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """Dispatch in-app notifications to system users by role."""

    MESSAGES = {
        'NEW_MEMBER_CREATED': {
            'title': 'New member added',
            'message': '{name} was added by the {source} team.',
        },
        'PROFILE_PENDING_APPROVAL': {
            'title': 'Profile pending approval',
            'message': '{name} needs Admin review.',
        },
        'MEMBER_APPROVED': {
            'title': 'Profile approved',
            'message': '{name} added to follow-up queue.',
        },
        'MEMBER_MERGED': {
            'title': 'Profiles merged',
            'message': 'Duplicate profile for {name} was merged.',
        },
    }

    @classmethod
    def dispatch(cls, event: str, entity, triggered_by=None, target_roles: list = None):
        """Create notifications for all active users with the given roles."""
        # Lazy imports to avoid circular dependency with signals.
        from apps.accounts.models import SystemUser  # noqa: PLC0415
        from .models import Notification  # noqa: PLC0415

        try:
            template = cls.MESSAGES.get(event, {'title': event, 'message': ''})
            title = template['title']
            message = template['message'].format(
                name=getattr(entity, 'full_name', str(entity)),
                source=getattr(entity, 'source', ''),
            )

            recipients = SystemUser.objects.filter(
                role__in=target_roles or [],
                is_active=True,
            )
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
        except Exception:  # noqa: BLE001
            logger.exception(
                "Failed to dispatch notification event=%s entity=%s",
                event,
                getattr(entity, 'pk', None),
            )
