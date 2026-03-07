from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from core.permissions import IsMedicalTeam, IsAdmin, CanReadMedicalRecord
from .models import MedicalRecord, MedicalVisit
from .serializers import MedicalRecordSerializer, MedicalVisitSerializer, MedicalVisitCreateSerializer


class MedicalRecordViewSet(mixins.RetrieveModelMixin,
                           mixins.CreateModelMixin,
                           mixins.UpdateModelMixin,
                           mixins.ListModelMixin,
                           GenericViewSet):
    queryset           = MedicalRecord.objects.select_related('person')
    serializer_class   = MedicalRecordSerializer
    permission_classes = [CanReadMedicalRecord]

    def get_queryset(self):
        qs   = super().get_queryset()
        user = self.request.user
        if user.role == 'HR':
            qs = qs.filter(person__status='WORKER')
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='by-person/(?P<person_id>[^/.]+)')
    def by_person(self, request, person_id=None):
        try:
            record = MedicalRecord.objects.get(person_id=person_id)
            self.check_object_permissions(request, record)
            return Response(MedicalRecordSerializer(record).data)
        except MedicalRecord.DoesNotExist:
            return Response({'detail': 'No medical record found.'}, status=status.HTTP_404_NOT_FOUND)


class MedicalVisitViewSet(mixins.CreateModelMixin,
                          mixins.RetrieveModelMixin,
                          mixins.ListModelMixin,
                          GenericViewSet):
    """Visits are append-only — no update or delete."""
    queryset           = MedicalVisit.objects.select_related('person', 'attended_by')
    permission_classes = [IsMedicalTeam | IsAdmin]

    def get_serializer_class(self):
        if self.action == 'create':
            return MedicalVisitCreateSerializer
        return MedicalVisitSerializer

    def get_queryset(self):
        qs        = super().get_queryset()
        person_id = self.request.query_params.get('person_id')
        if person_id:
            qs = qs.filter(person_id=person_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(attended_by=self.request.user)
