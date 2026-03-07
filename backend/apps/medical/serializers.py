from rest_framework import serializers
from .models import MedicalRecord, MedicalVisit


class MedicalRecordSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source='person.full_name', read_only=True)

    class Meta:
        model  = MedicalRecord
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class MedicalVisitSerializer(serializers.ModelSerializer):
    person_name      = serializers.CharField(source='person.full_name', read_only=True)
    attended_by_name = serializers.CharField(source='attended_by.username', read_only=True)

    class Meta:
        model  = MedicalVisit
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class MedicalVisitCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MedicalVisit
        fields = ['person', 'medical_record', 'visit_date', 'visit_type', 'complaint',
                  'diagnosis', 'treatment', 'prescription', 'next_visit_date',
                  'blood_pressure', 'weight_kg', 'height_cm', 'temperature_c',
                  'pulse_rate', 'attachments', 'notes']
