from rest_framework import serializers
from apps.persons.serializers import PersonListSerializer
from .models import (
    Department, DepartmentExecutive, DepartmentMember,
    DepartmentSession, AttendanceRecord, DepartmentMessage, MessageRecipient,
)


# ── Executives ────────────────────────────────────────────────────────────────

class DepartmentExecutiveSerializer(serializers.ModelSerializer):
    person_detail = PersonListSerializer(source='person', read_only=True)
    granted_by_name = serializers.SerializerMethodField()

    def get_granted_by_name(self, obj):
        if not obj.granted_by_id:
            return None
        return obj.granted_by.person.full_name if obj.granted_by.person_id else obj.granted_by.username

    class Meta:
        model  = DepartmentExecutive
        fields = [
            'id', 'department', 'person', 'person_detail', 'system_user',
            'role', 'granted_by', 'granted_by_name', 'granted_at', 'revoked_at', 'is_active',
        ]
        read_only_fields = ['id', 'granted_at']


class GrantExecutiveSerializer(serializers.Serializer):
    person_id = serializers.UUIDField()
    role      = serializers.ChoiceField(choices=DepartmentExecutive.Role.choices)


class RevokeExecutiveSerializer(serializers.Serializer):
    person_id = serializers.UUIDField()


# ── Members ───────────────────────────────────────────────────────────────────

class DepartmentMemberSerializer(serializers.ModelSerializer):
    person_detail = PersonListSerializer(source='person', read_only=True)

    class Meta:
        model  = DepartmentMember
        fields = [
            'id', 'department', 'person', 'person_detail', 'role',
            'joined_date', 'left_date', 'removal_reason', 'is_active',
            'notes', 'added_by', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'joined_date']


class AddMemberSerializer(serializers.Serializer):
    person_id = serializers.UUIDField()
    role      = serializers.ChoiceField(choices=DepartmentMember.MemberRole.choices, default='MEMBER')
    notes     = serializers.CharField(required=False, allow_blank=True)


class RemoveMemberSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=5)


# ── Attendance ────────────────────────────────────────────────────────────────

class AttendanceRecordSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source='person.full_name', read_only=True)

    class Meta:
        model  = AttendanceRecord
        fields = ['id', 'person', 'person_name', 'status', 'excuse_reason', 'created_at']
        read_only_fields = ['id', 'created_at']


class AttendanceRecordInputSerializer(serializers.Serializer):
    person_id     = serializers.UUIDField()
    status        = serializers.ChoiceField(choices=AttendanceRecord.Status.choices)
    excuse_reason = serializers.CharField(required=False, allow_blank=True)


class DepartmentSessionSerializer(serializers.ModelSerializer):
    records      = serializers.SerializerMethodField()
    record_count = serializers.SerializerMethodField()
    present_count = serializers.SerializerMethodField()
    absent_count  = serializers.SerializerMethodField()

    class Meta:
        model  = DepartmentSession
        fields = [
            'id', 'department', 'session_name', 'session_date', 'session_type',
            'notes', 'created_by', 'created_at',
            'record_count', 'present_count', 'absent_count', 'records',
        ]
        read_only_fields = ['id', 'created_at']

    def get_records(self, obj):
        recs = obj.records.select_related('person').all()
        return [
            {
                'person_id':    str(r.person_id),
                'person_name':  r.person.full_name,
                'status':       r.status,
                'excuse_reason': r.excuse_reason,
            }
            for r in recs
        ]

    def get_record_count(self, obj):
        return obj.records.count()

    def get_present_count(self, obj):
        return obj.records.filter(status__in=['PRESENT', 'LATE']).count()

    def get_absent_count(self, obj):
        return obj.records.filter(status='ABSENT').count()


class CreateSessionSerializer(serializers.Serializer):
    session_name = serializers.CharField()
    session_date = serializers.DateField()
    session_type = serializers.ChoiceField(
        choices=DepartmentSession.SessionType.choices, default='REGULAR'
    )
    notes        = serializers.CharField(required=False, allow_blank=True)
    records      = AttendanceRecordInputSerializer(many=True)


# ── Messaging ────────────────────────────────────────────────────────────────

class MessageRecipientSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source='person.full_name', read_only=True)

    class Meta:
        model  = MessageRecipient
        fields = ['id', 'person', 'person_name', 'delivered_at', 'read_at']


class DepartmentMessageSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    level1_reviewed_by_name = serializers.SerializerMethodField()
    admin_reviewed_by_name = serializers.SerializerMethodField()
    recipient_count = serializers.SerializerMethodField()

    def _display_user(self, user):
        if not user:
            return None
        return user.person.full_name if user.person_id else user.username

    def get_created_by_name(self, obj):
        return self._display_user(obj.created_by)

    def get_level1_reviewed_by_name(self, obj):
        return self._display_user(obj.level1_reviewed_by)

    def get_admin_reviewed_by_name(self, obj):
        return self._display_user(obj.admin_reviewed_by)

    class Meta:
        model  = DepartmentMessage
        fields = [
            'id', 'department', 'subject', 'body', 'message_type', 'priority',
            'recipient_scope', 'approval_stage',
            'level1_reviewed_by', 'level1_reviewed_by_name', 'level1_reviewed_at',
            'level1_rejection_reason',
            'admin_reviewed_by', 'admin_reviewed_by_name', 'admin_reviewed_at',
            'admin_rejection_reason',
            'sent_at', 'created_by', 'created_by_name', 'created_at', 'updated_at',
            'recipient_count',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'approval_stage']

    def get_recipient_count(self, obj):
        return obj.recipients.count()


class DepartmentMessagePublicSerializer(serializers.ModelSerializer):
    """
    Restricted message view for PRO role.
    Exposes only APPROVED/SENT messages and omits all internal review metadata
    (rejection reasons, reviewer identities, review timestamps).
    """
    created_by_name = serializers.SerializerMethodField()
    recipient_count = serializers.SerializerMethodField()

    def get_created_by_name(self, obj):
        user = obj.created_by
        if not user:
            return None
        return user.person.full_name if user.person_id else user.username

    class Meta:
        model  = DepartmentMessage
        fields = [
            'id', 'department', 'subject', 'body', 'message_type', 'priority',
            'recipient_scope', 'approval_stage',
            'sent_at', 'created_by', 'created_by_name', 'created_at',
            'recipient_count',
        ]
        read_only_fields = ['id', 'created_at', 'approval_stage']

    def get_recipient_count(self, obj):
        return obj.recipients.count()


class CreateMessageSerializer(serializers.Serializer):
    subject          = serializers.CharField(max_length=255)
    body             = serializers.CharField()
    message_type     = serializers.ChoiceField(choices=DepartmentMessage.MessageType.choices)
    priority         = serializers.ChoiceField(
        choices=DepartmentMessage.Priority.choices, default='NORMAL'
    )
    recipient_scope  = serializers.ChoiceField(
        choices=DepartmentMessage.RecipientScope.choices, default='ALL'
    )
    specific_persons = serializers.ListField(
        child=serializers.UUIDField(), required=False
    )


class RejectMessageSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=5)


# ── Department list / detail ───────────────────────────────────────────────────

class DepartmentListSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    executives   = serializers.SerializerMethodField()

    class Meta:
        model  = Department
        fields = ['id', 'name', 'category', 'description', 'is_active',
                  'member_count', 'executives', 'created_at']

    def get_member_count(self, obj):
        return obj.members.filter(is_active=True).count()

    def get_executives(self, obj):
        execs = obj.executives.filter(is_active=True).select_related('person')
        return [
            {'role': e.role, 'name': e.person.full_name, 'person_id': str(e.person_id)}
            for e in execs
        ]


class DepartmentDetailSerializer(serializers.ModelSerializer):
    members      = DepartmentMemberSerializer(many=True, read_only=True)
    executives   = DepartmentExecutiveSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()
    session_count = serializers.SerializerMethodField()

    class Meta:
        model  = Department
        fields = [
            'id', 'name', 'category', 'description', 'is_active',
            'member_count', 'session_count', 'executives', 'members',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.members.filter(is_active=True).count()

    def get_session_count(self, obj):
        return obj.sessions.count()


class DepartmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Department
        fields = ['name', 'description', 'category']
