from rest_framework import serializers
from apps.persons.serializers import PersonListSerializer
from .models import FollowUpTask


class FollowUpTaskSerializer(serializers.ModelSerializer):
    person_detail    = PersonListSerializer(source='person', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)

    class Meta:
        model  = FollowUpTask
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'completed_at']


class FollowUpTaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FollowUpTask
        fields = ['person', 'task_type', 'priority', 'description', 'due_date']


class AssignTaskSerializer(serializers.Serializer):
    assigned_to = serializers.UUIDField()


class CompleteTaskSerializer(serializers.Serializer):
    outcome = serializers.CharField(min_length=5)
