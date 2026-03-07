from rest_framework import serializers
from core.utils.phone import normalize_phone
from .models import Person


class PersonListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model  = Person
        fields = ['id', 'full_name', 'first_name', 'last_name', 'phone',
                  'email', 'status', 'source', 'gender', 'profile_photo', 'created_at']


class PersonDetailSerializer(serializers.ModelSerializer):
    full_name          = serializers.ReadOnlyField()
    has_medical_record = serializers.SerializerMethodField()

    class Meta:
        model   = Person
        exclude = ['deleted_at', 'merged_from']

    def get_has_medical_record(self, obj):
        return hasattr(obj, 'medical_record')


class PersonCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Person
        fields = ['first_name', 'last_name', 'other_names', 'phone', 'gender',
                  'email', 'source', 'date_of_birth', 'address', 'state']

    def validate_phone(self, value):
        normalized = normalize_phone(value)
        if Person.objects.filter(phone=normalized).exists():
            raise serializers.ValidationError(
                'A person with this phone number already exists.',
                code='DUPLICATE_PHONE',
            )
        return normalized

    def create(self, validated_data):
        request = self.context.get('request')
        if request and getattr(request, 'user', None) and request.user.is_authenticated:
            if request.user.role != 'ADMIN':
                validated_data.setdefault('status', Person.Status.PENDING_APPROVAL)
            else:
                validated_data.setdefault('status', Person.Status.NEW_MEMBER)
        return super().create(validated_data)


class PersonUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Person
        fields = ['first_name', 'last_name', 'other_names', 'email', 'gender',
                  'date_of_birth', 'address', 'state', 'country', 'status',
                  'emergency_contact_name', 'emergency_contact_phone',
                  'joined_date', 'baptized', 'baptism_date', 'is_profile_complete']


class PhoneLookupSerializer(serializers.Serializer):
    phones = serializers.ListField(
        child=serializers.CharField(max_length=20),
        min_length=1,
        max_length=100,
    )


class MergeSerializer(serializers.Serializer):
    target_id = serializers.UUIDField()
