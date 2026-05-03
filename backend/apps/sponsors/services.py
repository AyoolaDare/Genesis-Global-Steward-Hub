"""Sponsor messaging and pipeline service."""
import logging
from datetime import timedelta

from django.db.models import Exists, OuterRef
from django.utils import timezone

logger = logging.getLogger(__name__)

THANK_YOU_TEMPLATE = (
    "Dear {name}, thank you so much for your generous contribution of "
    "₦{amount:,.0f} to Genesis Global Church. "
    "Your faithfulness is deeply appreciated. May God reward you abundantly! 🙏"
)

GREETING_TEMPLATE = (
    "Hi {name}, this is a warm greeting from all of us at Genesis Global Church. "
    "We are grateful for your continued support and partnership. "
    "God's blessings upon you and your household! 🙌"
)

PRAYER_TEMPLATE = (
    "Dear {name}, we are keeping you in our prayers this week. "
    "May God's grace, peace, and abundance overflow in every area of your life. "
    "We are truly grateful for you. — Genesis Global Church 🙏"
)


class SponsorService:

    @staticmethod
    def _resolve_phone(sponsor) -> str | None:
        if sponsor.phone:
            return sponsor.phone
        if sponsor.person and sponsor.person.phone:
            return sponsor.person.phone
        return None

    @classmethod
    def _send_sms(cls, phone: str, body: str) -> bool:
        try:
            from core.utils.phone import to_international                    # noqa: PLC0415
            from apps.notifications.providers.termii import TermiiProvider   # noqa: PLC0415
            return TermiiProvider().send_sms(to=to_international(phone), message=body)
        except Exception:
            logger.exception("SMS send failed to=%s", phone)
            return False

    @classmethod
    def _record_message(cls, *, sponsor, msg_type, body, phone, success,
                        payment=None, sent_by=None):
        from .models import SponsorMessage  # noqa: PLC0415
        SponsorMessage.objects.create(
            sponsor=sponsor,
            payment=payment,
            message_type=msg_type,
            body=body,
            phone=phone,
            success=success,
            sent_by=sent_by,
        )

    # ── Per-sponsor message methods ────────────────────────────────────────

    @classmethod
    def send_thank_you(cls, payment, sent_by=None) -> bool:
        from .models import SponsorMessage  # noqa: PLC0415
        sponsor = payment.sponsor
        phone = cls._resolve_phone(sponsor)
        if not phone:
            logger.warning("No phone for sponsor %s — thank-you skipped.", sponsor.pk)
            return False
        body = THANK_YOU_TEMPLATE.format(name=sponsor.name, amount=float(payment.amount))
        success = cls._send_sms(phone, body)
        cls._record_message(
            sponsor=sponsor, payment=payment,
            msg_type=SponsorMessage.MessageType.THANK_YOU,
            body=body, phone=phone, success=success, sent_by=sent_by,
        )
        return success

    @classmethod
    def send_greeting(cls, sponsor, sent_by=None) -> bool:
        from .models import SponsorMessage  # noqa: PLC0415
        phone = cls._resolve_phone(sponsor)
        if not phone:
            return False
        body = GREETING_TEMPLATE.format(name=sponsor.name)
        success = cls._send_sms(phone, body)
        cls._record_message(
            sponsor=sponsor, msg_type=SponsorMessage.MessageType.GREETING,
            body=body, phone=phone, success=success, sent_by=sent_by,
        )
        return success

    @classmethod
    def send_prayer(cls, sponsor, sent_by=None) -> bool:
        from .models import SponsorMessage  # noqa: PLC0415
        phone = cls._resolve_phone(sponsor)
        if not phone:
            return False
        body = PRAYER_TEMPLATE.format(name=sponsor.name)
        success = cls._send_sms(phone, body)
        cls._record_message(
            sponsor=sponsor, msg_type=SponsorMessage.MessageType.PRAYER,
            body=body, phone=phone, success=success, sent_by=sent_by,
        )
        return success

    # ── Bulk broadcast methods ─────────────────────────────────────────────

    @classmethod
    def bulk_send_weekly_prayers(cls) -> dict:
        from .models import Sponsor  # noqa: PLC0415
        sponsors = Sponsor.objects.filter(
            status=Sponsor.SponsorStatus.ACTIVE
        ).select_related('person')
        sent = failed = skipped = 0
        for s in sponsors:
            phone = cls._resolve_phone(s)
            if not phone:
                skipped += 1
                continue
            if cls.send_prayer(s):
                sent += 1
            else:
                failed += 1
        return {'sent': sent, 'failed': failed, 'skipped': skipped}

    @classmethod
    def bulk_send_greetings(cls) -> dict:
        from .models import Sponsor  # noqa: PLC0415
        sponsors = Sponsor.objects.filter(
            status=Sponsor.SponsorStatus.ACTIVE
        ).select_related('person')
        sent = failed = skipped = 0
        for s in sponsors:
            phone = cls._resolve_phone(s)
            if not phone:
                skipped += 1
                continue
            if cls.send_greeting(s):
                sent += 1
            else:
                failed += 1
        return {'sent': sent, 'failed': failed, 'skipped': skipped}

    # ── Payment pipeline ───────────────────────────────────────────────────

    @classmethod
    def get_pipeline(cls) -> dict:
        """
        Bucket active sponsors into:
        - paid_this_month  : CONFIRMED payment in the last 30 days
        - pending          : PENDING payment, no confirmed in last 30 days
        - overdue          : active commitment, no confirmed/pending payment in last 30 days
        """
        from .models import Sponsor, SponsorshipCommitment, SponsorshipPayment  # noqa: PLC0415

        today     = timezone.now().date()
        month_ago = today - timedelta(days=30)

        active = Sponsor.objects.filter(
            status=Sponsor.SponsorStatus.ACTIVE
        ).select_related('person').prefetch_related('commitments', 'payments')

        recent_confirmed = SponsorshipPayment.objects.filter(
            sponsor=OuterRef('pk'),
            status=SponsorshipPayment.PaymentStatus.CONFIRMED,
            payment_date__gte=month_ago,
        )
        pending_payment = SponsorshipPayment.objects.filter(
            sponsor=OuterRef('pk'),
            status=SponsorshipPayment.PaymentStatus.PENDING,
        )
        active_commitment = SponsorshipCommitment.objects.filter(
            sponsor=OuterRef('pk'),
            is_active=True,
        )

        paid_qs    = active.filter(Exists(recent_confirmed))
        pending_qs = active.exclude(Exists(recent_confirmed)).filter(Exists(pending_payment))
        overdue_qs = (
            active
            .exclude(Exists(recent_confirmed))
            .exclude(Exists(pending_payment))
            .filter(Exists(active_commitment))
        )

        def _serialize(qs):
            return [
                {
                    'id':          str(s.pk),
                    'sponsor_id':  s.sponsor_id,
                    'name':        s.name,
                    'phone':       cls._resolve_phone(s) or '',
                    'person_name': (
                        getattr(s.person, 'full_name', None) or
                        f"{s.person.first_name} {s.person.last_name}".strip()
                        if s.person else None
                    ),
                    'total_paid':  s.total_paid,
                    'outstanding': s.outstanding,
                    'status':      s.status,
                }
                for s in qs
            ]

        paid    = _serialize(paid_qs)
        pending = _serialize(pending_qs)
        overdue = _serialize(overdue_qs)

        return {
            'paid_this_month': {'count': len(paid),    'sponsors': paid},
            'pending':         {'count': len(pending), 'sponsors': pending},
            'overdue':         {'count': len(overdue), 'sponsors': overdue},
        }
