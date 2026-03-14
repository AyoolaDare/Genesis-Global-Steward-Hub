"""Notification dispatch service — in-app notifications + Termii SMS."""
import logging

logger = logging.getLogger(__name__)

# SMS templates sent directly to the member (entity.phone).
# Only events that the member themselves should be notified about are listed here.
_SMS_TEMPLATES = {
    'NEW_MEMBER_CREATED': (
        "Welcome to Genesis Global Church, {name}! "
        "We're so glad you're here. God bless you!"
    ),
    'MEMBER_APPROVED': (
        "Great news, {name}! Your profile has been approved. "
        "Welcome to the Genesis Global family!"
    ),
}


class NotificationService:
    """Dispatch in-app notifications to system users by role, and SMS to members."""

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
        """
        1. Create in-app Notification rows for all active staff with target_roles.
        2. If the event has an SMS template, send an SMS to the member (entity.phone).
        """
        # ── In-app notifications ───────────────────────────────────────────────
        # Lazy imports to avoid circular dependency with signals.
        from apps.accounts.models import SystemUser  # noqa: PLC0415
        from .models import Notification             # noqa: PLC0415

        try:
            template = cls.MESSAGES.get(event, {'title': event, 'message': ''})
            name     = getattr(entity, 'full_name', str(entity))
            title    = template['title']
            message  = template['message'].format(
                name=name,
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
                "Failed to dispatch in-app notification event=%s entity=%s",
                event,
                getattr(entity, 'pk', None),
            )

        # ── SMS to the member ──────────────────────────────────────────────────
        cls._send_member_sms(event, entity)

    @classmethod
    def _send_member_sms(cls, event: str, entity) -> None:
        """Send an SMS to the person (entity) if the event has an SMS template."""
        sms_template = _SMS_TEMPLATES.get(event)
        if not sms_template:
            return

        phone = getattr(entity, 'phone', None)
        if not phone:
            return

        try:
            from core.utils.phone import to_international          # noqa: PLC0415
            from .providers.termii import TermiiProvider           # noqa: PLC0415

            name           = getattr(entity, 'full_name', str(entity))
            international  = to_international(phone)
            sms_body       = sms_template.format(name=name)

            TermiiProvider().send_sms(to=international, message=sms_body)
        except Exception:  # noqa: BLE001
            logger.exception(
                "Failed to send SMS event=%s entity=%s",
                event,
                getattr(entity, 'pk', None),
            )
