"""Business logic for SMS campaign creation, approval, and dispatch."""
import logging
from django.utils import timezone
from django.db import transaction

logger = logging.getLogger(__name__)


def _personalize(message: str, person) -> str:
    """Replace merge tags in a message with the recipient's actual data."""
    full_name = f"{person.first_name} {person.last_name}".strip()
    return (
        message
        .replace('<%first_name%>', person.first_name or '')
        .replace('<%last_name%>', person.last_name or '')
        .replace('<%full_name%>', full_name)
        .replace('<%phone%>', person.phone or '')
    )


class MessagingService:

    @staticmethod
    @transaction.atomic
    def create_campaign(title, message, channel, recipient_ids, created_by):
        """Create a new campaign in PENDING status."""
        from apps.persons.models import Person  # noqa: PLC0415
        from .models import SMSCampaign         # noqa: PLC0415

        campaign = SMSCampaign.objects.create(
            title=title,
            message=message,
            channel=channel,
            created_by=created_by,
        )
        persons = Person.objects.filter(pk__in=recipient_ids, deleted_at__isnull=True)
        campaign.recipients.set(persons)
        return campaign

    @staticmethod
    @transaction.atomic
    def approve_campaign(campaign, reviewed_by):
        """Approve a PENDING campaign and immediately dispatch SMS to all recipients."""
        from core.utils.phone import to_international                    # noqa: PLC0415
        from apps.notifications.providers.termii import TermiiProvider   # noqa: PLC0415

        if campaign.status != 'PENDING':
            raise ValueError("Only PENDING campaigns can be approved.")

        campaign.status      = 'APPROVED'
        campaign.reviewed_by = reviewed_by
        campaign.reviewed_at = timezone.now()
        campaign.save(update_fields=['status', 'reviewed_by', 'reviewed_at'])

        if campaign.channel == 'SMS':
            provider   = TermiiProvider()
            sent = failed = 0
            for person in campaign.recipients.all():
                phone = to_international(person.phone or '')
                if not phone:
                    failed += 1
                    continue
                ok = provider.send_sms(to=phone, message=_personalize(campaign.message, person))
                if ok:
                    sent += 1
                else:
                    failed += 1

            campaign.sent_count   = sent
            campaign.failed_count = failed
            campaign.save(update_fields=['sent_count', 'failed_count'])
            logger.info(
                "Campaign %s approved | sent=%s failed=%s",
                campaign.pk, sent, failed,
            )

        return campaign

    @staticmethod
    def reject_campaign(campaign, reviewed_by, review_note=''):
        """Reject a PENDING campaign with an optional note."""
        if campaign.status != 'PENDING':
            raise ValueError("Only PENDING campaigns can be rejected.")

        campaign.status      = 'REJECTED'
        campaign.reviewed_by = reviewed_by
        campaign.reviewed_at = timezone.now()
        campaign.review_note = review_note
        campaign.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'review_note'])
        return campaign
