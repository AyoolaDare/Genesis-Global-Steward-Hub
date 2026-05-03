import hashlib
import hmac
import json
from decimal import Decimal

from django.conf import settings
from django.db.models import Sum, Q
from django.db import transaction
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsAdmin, CronKeyPermission
from .models import Sponsor, SponsorshipCommitment, SponsorshipPayment, SponsorMessage
from .serializers import (
    SponsorListSerializer, SponsorDetailSerializer,
    SponsorCreateSerializer, SponsorshipPaymentSerializer,
    SponsorshipCommitmentSerializer, SponsorMessageSerializer,
    AddPaymentSerializer, AddCommitmentSerializer,
)
from .services import SponsorService


class SponsorViewSet(viewsets.ModelViewSet):
    queryset = (
        Sponsor.objects
        .select_related('person')
        .prefetch_related('commitments', 'payments', 'messages')
    )
    permission_classes = [IsAdmin]
    filter_backends    = [DjangoFilterBackend, SearchFilter]
    filterset_fields   = ['status', 'sponsor_type']
    search_fields      = ['name', 'email', 'phone', 'sponsor_id']

    def get_serializer_class(self):
        if self.action == 'list':    return SponsorListSerializer
        if self.action == 'create':  return SponsorCreateSerializer
        return SponsorDetailSerializer

    def perform_create(self, serializer):
        year   = timezone.now().year
        prefix = f"SPO-{year}-"
        last   = (
            Sponsor.objects
            .filter(sponsor_id__startswith=prefix)
            .order_by('-sponsor_id')
            .values_list('sponsor_id', flat=True)
            .first()
        )
        if last:
            try:
                seq = int(last.split('-')[-1]) + 1
            except (ValueError, IndexError):
                seq = Sponsor.objects.count() + 1
        else:
            seq = 1
        serializer.save(
            sponsor_id=f"{prefix}{seq:04d}",
            created_by=self.request.user,
        )

    # ── Stats ──────────────────────────────────────────────────────────────

    @action(detail=False, methods=['get'])
    def stats(self, request):
        qs = Sponsor.objects.all()
        total_sponsors  = qs.count()
        active_sponsors = qs.filter(status=Sponsor.SponsorStatus.ACTIVE).count()
        total_committed = float(
            SponsorshipCommitment.objects.filter(is_active=True)
                                        .aggregate(s=Sum('amount'))['s'] or 0
        )
        total_paid = float(
            SponsorshipPayment.objects.filter(status=SponsorshipPayment.PaymentStatus.CONFIRMED)
                                     .aggregate(s=Sum('amount'))['s'] or 0
        )
        return Response({
            'total_sponsors':  total_sponsors,
            'active_sponsors': active_sponsors,
            'total_committed': total_committed,
            'total_paid':      total_paid,
            'outstanding':     max(0, total_committed - total_paid),
        })

    # ── Payment pipeline ───────────────────────────────────────────────────

    @action(detail=False, methods=['get'])
    def pipeline(self, request):
        return Response(SponsorService.get_pipeline())

    # ── Payment CRUD ───────────────────────────────────────────────────────

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def add_payment(self, request, pk=None):
        sponsor    = self.get_object()
        serializer = AddPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        commitment = None
        if data.get('commitment'):
            try:
                commitment = SponsorshipCommitment.objects.get(pk=data['commitment'], sponsor=sponsor)
            except SponsorshipCommitment.DoesNotExist:
                return Response(
                    {'error': 'Commitment not found for this sponsor.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        payment = SponsorshipPayment.objects.create(
            sponsor        = sponsor,
            commitment     = commitment,
            amount         = data['amount'],
            currency       = data.get('currency', 'NGN'),
            payment_method = data['payment_method'],
            payment_date   = data['payment_date'],
            reference      = data.get('reference', ''),
            status         = data.get('status', SponsorshipPayment.PaymentStatus.CONFIRMED),
            notes          = data.get('notes', ''),
            recorded_by    = request.user,
        )

        # Auto thank-you for confirmed payments
        if payment.status == SponsorshipPayment.PaymentStatus.CONFIRMED:
            SponsorService.send_thank_you(payment, sent_by=request.user)

        return Response(SponsorshipPaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def add_commitment(self, request, pk=None):
        sponsor    = self.get_object()
        serializer = AddCommitmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        commitment = SponsorshipCommitment.objects.create(
            sponsor    = sponsor,
            project    = data.get('project', ''),
            amount     = data['amount'],
            currency   = data.get('currency', 'NGN'),
            frequency  = data['frequency'],
            start_date = data['start_date'],
            end_date   = data.get('end_date'),
            notes      = data.get('notes', ''),
        )
        return Response(SponsorshipCommitmentSerializer(commitment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        sponsor  = self.get_object()
        payments = sponsor.payments.order_by('-payment_date', '-created_at')
        return Response(SponsorshipPaymentSerializer(payments, many=True).data)

    # ── Messaging ──────────────────────────────────────────────────────────

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        sponsor  = self.get_object()
        msgs     = sponsor.messages.order_by('-sent_at')
        return Response(SponsorMessageSerializer(msgs, many=True).data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        sponsor      = self.get_object()
        message_type = request.data.get('message_type', '').upper()

        dispatch = {
            'THANK_YOU': None,   # requires a payment — not applicable as manual
            'GREETING':  lambda: SponsorService.send_greeting(sponsor, sent_by=request.user),
            'PRAYER':    lambda: SponsorService.send_prayer(sponsor, sent_by=request.user),
        }

        if message_type not in dispatch or message_type == 'THANK_YOU':
            return Response(
                {'error': 'message_type must be GREETING or PRAYER.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        success = dispatch[message_type]()
        return Response({'success': success, 'message_type': message_type})

    # ── Bulk broadcasts ────────────────────────────────────────────────────

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin | CronKeyPermission])
    def bulk_prayers(self, request):
        result = SponsorService.bulk_send_weekly_prayers()
        return Response(result)

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin | CronKeyPermission])
    def bulk_greetings(self, request):
        result = SponsorService.bulk_send_greetings()
        return Response(result)


# ── Paystack webhook ───────────────────────────────────────────────────────

@csrf_exempt
def paystack_webhook(request):
    """
    Paystack sends a POST with x-paystack-signature header.
    We verify the HMAC-SHA512 signature, record the payment,
    and fire a thank-you SMS automatically.
    """
    if request.method != 'POST':
        return HttpResponse(status=405)

    payload   = request.body
    signature = request.headers.get('x-paystack-signature', '')
    secret    = getattr(settings, 'PAYSTACK_SECRET_KEY', '')

    # Reject all webhook events when the secret is not configured — fail closed.
    if not secret:
        return HttpResponse(status=500)

    expected = hmac.new(
        secret.encode('utf-8'),
        payload,
        digestmod=hashlib.sha512,
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        return HttpResponse(status=400)

    try:
        event = json.loads(payload)
    except (json.JSONDecodeError, ValueError):
        return HttpResponse(status=400)

    if event.get('event') == 'charge.success':
        data      = event.get('data', {})
        reference = data.get('reference', '')
        amount    = Decimal(data.get('amount', 0)) / 100
        email     = data.get('customer', {}).get('email', '')

        if not SponsorshipPayment.objects.filter(reference=reference).exists():
            sponsor = (
                Sponsor.objects.filter(email__iexact=email).first()
                if email else None
            )
            if sponsor:
                payment = SponsorshipPayment.objects.create(
                    sponsor        = sponsor,
                    amount         = amount,
                    currency       = 'NGN',
                    payment_method = SponsorshipPayment.PaymentMethod.PAYSTACK,
                    payment_date   = timezone.now().date(),
                    reference      = reference,
                    status         = SponsorshipPayment.PaymentStatus.CONFIRMED,
                    notes          = 'Auto-recorded via Paystack webhook',
                )
                # Auto thank-you (best-effort — webhook must respond fast)
                try:
                    SponsorService.send_thank_you(payment)
                except Exception:
                    pass

    return HttpResponse(status=200)
