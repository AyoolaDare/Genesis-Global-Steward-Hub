from rest_framework import mixins
from rest_framework.viewsets import GenericViewSet

from rest_framework.permissions import IsAuthenticated
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, GenericViewSet):
    queryset           = AuditLog.objects.select_related('user').order_by('-created_at')
    serializer_class   = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs          = super().get_queryset()
        user        = self.request.user
        entity_type = self.request.query_params.get('entity_type')
        entity_id   = self.request.query_params.get('entity_id')
        user_id     = self.request.query_params.get('user_id')

        # Hide transport/noise events from activity feeds.
        qs = qs.exclude(action__iregex=r'^(POST|PUT|PATCH|DELETE)\s+/api/')
        qs = qs.exclude(after_state__path__in=[
            '/api/v1/auth/login/',
            '/api/v1/auth/logout/',
            '/api/v1/auth/refresh/',
            '/api/v1/persons/phone_lookup/',
        ])

        # Admin sees all activity. Other users only see their own.
        if user.role != 'ADMIN':
            qs = qs.filter(user=user)

        if entity_type:
            qs = qs.filter(entity_type=entity_type)
        if entity_id:
            qs = qs.filter(entity_id=entity_id)
        if user_id and user.role == 'ADMIN':
            qs = qs.filter(user_id=user_id)
        return qs
