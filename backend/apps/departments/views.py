from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from core.permissions import IsAdmin, IsDeptLeader
from .models import Department, DepartmentMember, DepartmentAttendance, AttendanceRecord
from .serializers import (
    DepartmentListSerializer, DepartmentDetailSerializer, DepartmentCreateSerializer,
    DepartmentMemberSerializer, MarkAttendanceSerializer, AttendanceSessionSerializer,
)


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.filter(is_active=True)
    permission_classes = [IsDeptLeader | IsAdmin]

    def get_serializer_class(self):
        if self.action == 'list':   return DepartmentListSerializer
        if self.action == 'create': return DepartmentCreateSerializer
        return DepartmentDetailSerializer

    def get_queryset(self):
        qs   = super().get_queryset()
        user = self.request.user
        if user.role in ('DEPT_LEADER', 'DEPT_ASST'):
            if hasattr(user, 'person') and user.person:
                qs = qs.filter(team_leader=user.person) | qs.filter(asst_leader=user.person)
        return qs

    def get_permissions(self):
        if self.action in ('create', 'destroy'):
            return [IsAdmin()]
        return [(IsDeptLeader | IsAdmin)()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        dept      = self.get_object()
        person_id = request.data.get('person_id')
        role      = request.data.get('role', 'VOLUNTEER')
        if not person_id:
            return Response({'error': 'person_id required'}, status=status.HTTP_400_BAD_REQUEST)
        from apps.persons.models import Person
        try:
            person = Person.objects.get(pk=person_id, deleted_at__isnull=True)
        except Person.DoesNotExist:
            return Response({'error': 'Person not found.'}, status=status.HTTP_404_NOT_FOUND)
        member, _ = DepartmentMember.objects.get_or_create(
            department=dept, person=person,
            defaults={'role': role, 'added_by': request.user}
        )
        return Response(DepartmentMemberSerializer(member).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='members/(?P<person_id>[^/.]+)')
    def remove_member(self, request, pk=None, person_id=None):
        dept = self.get_object()
        try:
            member = DepartmentMember.objects.get(department=dept, person_id=person_id)
            member.is_active = False
            member.left_date = timezone.now().date()
            member.save(update_fields=['is_active', 'left_date'])
            return Response(status=status.HTTP_204_NO_CONTENT)
        except DepartmentMember.DoesNotExist:
            return Response({'error': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def mark_attendance(self, request, pk=None):
        dept       = self.get_object()
        serializer = MarkAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        session = DepartmentAttendance.objects.create(
            department=dept,
            session_name=data['session_name'],
            session_date=data['session_date'],
            session_type=data['session_type'],
            notes=data.get('notes', ''),
            marked_by=request.user,
        )
        AttendanceRecord.objects.bulk_create([
            AttendanceRecord(
                attendance=session,
                person_id=rec['person_id'],
                status=rec['status'],
                excuse_reason=rec.get('excuse_reason', ''),
            )
            for rec in data['records']
        ])
        return Response(AttendanceSessionSerializer(session).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def attendance_history(self, request, pk=None):
        dept     = self.get_object()
        sessions = DepartmentAttendance.objects.filter(department=dept).order_by('-session_date')
        return Response(AttendanceSessionSerializer(sessions, many=True).data)
