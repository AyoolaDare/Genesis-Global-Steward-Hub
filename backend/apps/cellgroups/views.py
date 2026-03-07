from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from core.permissions import IsAdmin, IsCellAdmin
from .models import CellGroup, CellGroupMember
from .serializers import (
    CellGroupListSerializer, CellGroupDetailSerializer,
    CellGroupCreateSerializer, DisbandSerializer, AddMembersSerializer,
)


class CellGroupViewSet(viewsets.ModelViewSet):
    queryset = CellGroup.objects.filter(status__in=['ACTIVE', 'SUSPENDED'])
    permission_classes = [IsCellAdmin | IsAdmin]

    def get_serializer_class(self):
        if self.action == 'list':   return CellGroupListSerializer
        if self.action == 'create': return CellGroupCreateSerializer
        return CellGroupDetailSerializer

    def get_queryset(self):
        qs   = super().get_queryset()
        user = self.request.user
        if user.role == 'CELL_ADMIN':
            qs = qs.filter(admin=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def disband(self, request, pk=None):
        group      = self.get_object()
        serializer = DisbandSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        group.status           = CellGroup.Status.DISBANDED
        group.disbanded_at     = timezone.now()
        group.disbanded_reason = serializer.validated_data['reason']
        group.save(update_fields=['status', 'disbanded_at', 'disbanded_reason', 'updated_at'])
        group.members.filter(is_active=True).update(is_active=False, left_date=timezone.now().date())
        return Response(CellGroupDetailSerializer(group).data)

    @action(detail=True, methods=['post'])
    def add_members(self, request, pk=None):
        group      = self.get_object()
        serializer = AddMembersSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        from apps.persons.models import Person
        added = []
        for pid in serializer.validated_data['person_ids']:
            try:
                person = Person.objects.get(pk=pid, deleted_at__isnull=True)
                member, created = CellGroupMember.objects.get_or_create(
                    cell_group=group, person=person,
                    defaults={'added_by': request.user, 'added_via': 'ADMIN', 'is_active': True}
                )
                if not created and not member.is_active:
                    member.is_active = True
                    member.left_date = None
                    member.save(update_fields=['is_active', 'left_date'])
                added.append(str(pid))
            except Person.DoesNotExist:
                pass
        return Response({'added': added, 'count': len(added)})

    @action(detail=True, methods=['delete'], url_path='members/(?P<person_id>[^/.]+)')
    def remove_member(self, request, pk=None, person_id=None):
        group = self.get_object()
        try:
            member = CellGroupMember.objects.get(cell_group=group, person_id=person_id)
            member.is_active = False
            member.left_date = timezone.now().date()
            member.save(update_fields=['is_active', 'left_date'])
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CellGroupMember.DoesNotExist:
            return Response({'error': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)
