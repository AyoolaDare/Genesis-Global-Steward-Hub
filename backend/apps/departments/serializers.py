from rest_framework import serializers
from apps.persons.serializers import PersonListSerializer
from .models import Department, DepartmentMember, DepartmentAttendance, AttendanceRecord


class DepartmentMemberSerializer(serializers.ModelSerializer):
    person_detail = PersonListSerializer(source='person', read_only=True)

    class Meta:
        model  = DepartmentMember
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'joined_date']


class DepartmentListSerializer(serializers.ModelSerializer):
    member_count     = serializers.SerializerMethodField()
    hod_name         = serializers.CharField(source='team_leader.full_name', read_only=True)
    assistant_hod_name = serializers.CharField(source='asst_leader.full_name', read_only=True)

    class Meta:
        model  = Department
        fields = ['id', 'name', 'category', 'description', 'is_active',
                  'hod_name', 'assistant_hod_name', 'member_count', 'created_at']

    def get_member_count(self, obj):
        return obj.members.filter(is_active=True).count()


class DepartmentDetailSerializer(serializers.ModelSerializer):
    members      = DepartmentMemberSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()
    hod_name = serializers.CharField(source='team_leader.full_name', read_only=True)
    assistant_hod_name = serializers.CharField(source='asst_leader.full_name', read_only=True)

    class Meta:
        model  = Department
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.members.filter(is_active=True).count()


class DepartmentCreateSerializer(serializers.ModelSerializer):
    hod = serializers.UUIDField(required=False, allow_null=True)
    assistant_hod = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model  = Department
        fields = ['name', 'description', 'category', 'hod', 'assistant_hod']

    def create(self, validated_data):
        hod_id = validated_data.pop('hod', None)
        assistant_hod_id = validated_data.pop('assistant_hod', None)

        from apps.persons.models import Person
        team_leader = Person.objects.filter(pk=hod_id, deleted_at__isnull=True).first() if hod_id else None
        asst_leader = Person.objects.filter(pk=assistant_hod_id, deleted_at__isnull=True).first() if assistant_hod_id else None

        return Department.objects.create(
            team_leader=team_leader,
            asst_leader=asst_leader,
            **validated_data,
        )


class AttendanceRecordInputSerializer(serializers.Serializer):
    person_id     = serializers.UUIDField()
    status        = serializers.ChoiceField(choices=['PRESENT', 'ABSENT', 'EXCUSED', 'LATE'])
    excuse_reason = serializers.CharField(required=False, allow_blank=True)


class MarkAttendanceSerializer(serializers.Serializer):
    session_name = serializers.CharField()
    session_date = serializers.DateField()
    session_type = serializers.ChoiceField(choices=['REGULAR', 'SPECIAL', 'TRAINING'], default='REGULAR')
    notes        = serializers.CharField(required=False, allow_blank=True)
    records      = AttendanceRecordInputSerializer(many=True)


class AttendanceSessionSerializer(serializers.ModelSerializer):
    records      = serializers.SerializerMethodField()
    record_count = serializers.SerializerMethodField()

    class Meta:
        model  = DepartmentAttendance
        fields = '__all__'

    def get_records(self, obj):
        recs = obj.records.select_related('person').all()
        return [{'person_id': str(r.person_id), 'person_name': r.person.full_name, 'status': r.status} for r in recs]

    def get_record_count(self, obj):
        return obj.records.count()
