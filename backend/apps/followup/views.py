from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from core.permissions import IsFollowUpTeam, IsAdmin
from .models import FollowUpTask
from .serializers import (
    FollowUpTaskSerializer, FollowUpTaskCreateSerializer,
    AssignTaskSerializer, CompleteTaskSerializer,
)
from .services import FollowUpService


class FollowUpTaskViewSet(viewsets.ModelViewSet):
    queryset = FollowUpTask.objects.select_related('person', 'assigned_to').order_by('-created_at')
    permission_classes = [IsFollowUpTeam | IsAdmin]

    def get_serializer_class(self):
        if self.action == 'create':
            return FollowUpTaskCreateSerializer
        return FollowUpTaskSerializer

    def get_queryset(self):
        qs      = super().get_queryset()
        status_ = self.request.query_params.get('status')
        if status_:
            qs = qs.filter(status=status_)
        user = self.request.user
        if user.role == 'FOLLOWUP':
            qs = qs.filter(Q(assigned_to=user) | Q(status='UNASSIGNED'))
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, triggered_by='MANUAL')

    @action(detail=True, methods=['patch'])
    def assign(self, request, pk=None):
        task       = self.get_object()
        serializer = AssignTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        from apps.accounts.models import SystemUser
        try:
            assignee = SystemUser.objects.get(pk=serializer.validated_data['assigned_to'])
        except SystemUser.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        task = FollowUpService.assign_task(task, assignee, request.user)
        return Response(FollowUpTaskSerializer(task).data)

    @action(detail=True, methods=['patch'])
    def complete(self, request, pk=None):
        task       = self.get_object()
        serializer = CompleteTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = FollowUpService.complete_task(task, serializer.validated_data['outcome'], request.user)
        return Response(FollowUpTaskSerializer(task).data)
