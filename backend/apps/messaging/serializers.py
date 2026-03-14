from rest_framework import serializers
from apps.persons.serializers import PersonListSerializer
from .models import SMSCampaign


class CampaignCreatorSerializer(serializers.Serializer):
    id       = serializers.UUIDField()
    username = serializers.CharField()


class SMSCampaignListSerializer(serializers.ModelSerializer):
    created_by  = CampaignCreatorSerializer(read_only=True)
    reviewed_by = CampaignCreatorSerializer(read_only=True)
    recipient_count = serializers.SerializerMethodField()

    def get_recipient_count(self, obj):
        return getattr(obj, 'recipient_total', obj.recipient_count)

    class Meta:
        model  = SMSCampaign
        fields = [
            'id', 'title', 'message', 'channel', 'status',
            'recipient_count', 'created_by', 'reviewed_by',
            'review_note', 'sent_count', 'failed_count',
            'created_at', 'reviewed_at',
        ]


class SMSCampaignDetailSerializer(SMSCampaignListSerializer):
    recipients = PersonListSerializer(many=True, read_only=True)

    class Meta(SMSCampaignListSerializer.Meta):
        fields = SMSCampaignListSerializer.Meta.fields + ['recipients']


class CreateCampaignSerializer(serializers.Serializer):
    title         = serializers.CharField(max_length=200)
    message       = serializers.CharField(min_length=5, max_length=160)
    channel       = serializers.ChoiceField(choices=SMSCampaign.Channel.choices, default='SMS')
    recipient_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        max_length=500,
    )


class RejectCampaignSerializer(serializers.Serializer):
    review_note = serializers.CharField(max_length=500)
