from rest_framework import serializers
from apps.persons.serializers import PersonListSerializer
from .models import CellGroup, CellGroupMember


class CellGroupMemberSerializer(serializers.ModelSerializer):
    person_detail = PersonListSerializer(source='person', read_only=True)

    class Meta:
        model  = CellGroupMember
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'joined_date']


class CellGroupListSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    admin_name   = serializers.CharField(source='admin.username', read_only=True)

    class Meta:
        model  = CellGroup
        fields = ['id', 'name', 'purpose', 'status', 'admin_name', 'member_count',
                  'meeting_schedule', 'meeting_location', 'created_at']

    def get_member_count(self, obj):
        return obj.members.filter(is_active=True).count()


class CellGroupDetailSerializer(serializers.ModelSerializer):
    members      = CellGroupMemberSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model  = CellGroup
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.members.filter(is_active=True).count()


class CellGroupCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CellGroup
        fields = ['name', 'description', 'purpose', 'meeting_schedule', 'meeting_location', 'admin']


class DisbandSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=5)


class AddMembersSerializer(serializers.Serializer):
    person_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)
