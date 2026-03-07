from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name  = serializers.CharField(source='user.username', read_only=True)
    target     = serializers.SerializerMethodField()
    performed_by = serializers.SerializerMethodField()
    target_label = serializers.SerializerMethodField()
    activity_summary = serializers.SerializerMethodField()

    class Meta:
        model  = AuditLog
        fields = '__all__'
        read_only_fields = [f.name for f in AuditLog._meta.get_fields()]

    def get_target(self, obj):
        if obj.entity_type and obj.entity_id:
            return f"{obj.entity_type}:{obj.entity_id}"
        if obj.entity_type:
            return obj.entity_type
        return None

    def get_performed_by(self, obj):
        if obj.user and obj.user.username:
            return obj.user.username
        if obj.user and obj.user.email:
            return obj.user.email
        return 'Unknown user'

    def get_target_label(self, obj):
        if obj.after_state and obj.after_state.get('target_display'):
            return obj.after_state['target_display']
        return self.get_target(obj)

    def get_activity_summary(self, obj):
        actor = self.get_performed_by(obj)
        action = (obj.action or '').strip()
        target = self.get_target_label(obj)
        if target:
            return f"{actor} {action} ({target})"
        return f"{actor} {action}".strip()
