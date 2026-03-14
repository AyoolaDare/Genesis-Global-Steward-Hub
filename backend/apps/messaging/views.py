from rest_framework import viewsets, mixins, status
from django.db.models import Count
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsAdmin
from .models import SMSCampaign
from .serializers import (
    SMSCampaignListSerializer, SMSCampaignDetailSerializer,
    CreateCampaignSerializer, RejectCampaignSerializer,
)
from .services import MessagingService

# Roles that can compose and submit campaigns for approval.
# Cell-group users do not have access to the standalone messaging module.
_MESSAGING_ROLES = ('ADMIN', 'FOLLOWUP', 'HOD', 'ASST_HOD', 'WELFARE', 'PRO')


class IsMessagingStaff(IsAdmin):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in _MESSAGING_ROLES
        )


class SMSCampaignViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """
    list    GET  /api/v1/messaging/campaigns/
    retrieve GET /api/v1/messaging/campaigns/{id}/
    create  POST /api/v1/messaging/campaigns/          (staff roles)
    approve POST /api/v1/messaging/campaigns/{id}/approve/  (admin only)
    reject  POST /api/v1/messaging/campaigns/{id}/reject/   (admin only)
    """
    permission_classes = [IsMessagingStaff]

    def get_queryset(self):
        qs = (
            SMSCampaign.objects
            .select_related('created_by', 'reviewed_by')
            .annotate(recipient_total=Count('recipients'))
            .order_by('-created_at')
        )
        user = self.request.user
        # Non-admins only see their own campaigns.
        if user.role != 'ADMIN':
            qs = qs.filter(created_by=user)
        status_ = self.request.query_params.get('status')
        if status_:
            qs = qs.filter(status=status_)
        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SMSCampaignDetailSerializer
        return SMSCampaignListSerializer

    def create(self, request):
        serializer = CreateCampaignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        campaign = MessagingService.create_campaign(
            title=d['title'],
            message=d['message'],
            channel=d['channel'],
            recipient_ids=d['recipient_ids'],
            created_by=request.user,
        )
        return Response(
            SMSCampaignDetailSerializer(campaign).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def approve(self, request, pk=None):
        campaign = self.get_object()
        if campaign.status != 'PENDING':
            return Response(
                {'error': 'Only PENDING campaigns can be approved.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        campaign = MessagingService.approve_campaign(campaign, reviewed_by=request.user)
        return Response(SMSCampaignDetailSerializer(campaign).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def reject(self, request, pk=None):
        campaign = self.get_object()
        if campaign.status != 'PENDING':
            return Response(
                {'error': 'Only PENDING campaigns can be rejected.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = RejectCampaignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        campaign = MessagingService.reject_campaign(
            campaign,
            reviewed_by=request.user,
            review_note=serializer.validated_data.get('review_note', ''),
        )
        return Response(SMSCampaignDetailSerializer(campaign).data)
