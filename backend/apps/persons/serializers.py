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
                  'email', 'source', 'date_of_birth', 'address', 'landmark', 'state',
                  'occupation', 'marital_status']

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
        source = validated_data.get('source')
        if request and getattr(request, 'user', None) and request.user.is_authenticated:
            if request.user.role != 'ADMIN' and source != Person.Source.ADMIN:
                validated_data.setdefault('status', Person.Status.PENDING_APPROVAL)
            else:
                validated_data.setdefault('status', Person.Status.NEW_MEMBER)
        return super().create(validated_data)


class PersonUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Person
        fields = ['first_name', 'last_name', 'other_names', 'email', 'gender',
                  'date_of_birth', 'address', 'landmark', 'state', 'occupation', 'marital_status',
                  'country', 'status',
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

    def validate_target_id(self, value):
        if not Person.objects.filter(pk=value, deleted_at__isnull=True).exists():
            raise serializers.ValidationError('Target person not found or has been deleted.')
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        if request and str(attrs['target_id']) == request.parser_context.get('kwargs', {}).get('pk'):
            raise serializers.ValidationError({'target_id': 'Cannot merge a profile into itself.'})
        return attrs


class BulkImportRowSerializer(serializers.Serializer):
    """Validates a single row from a CSV bulk-import upload."""
    first_name   = serializers.CharField(max_length=100)
    last_name    = serializers.CharField(max_length=100)
    phone        = serializers.CharField(max_length=20)
    other_names  = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    email        = serializers.EmailField(required=False, allow_blank=True, default=None)
    gender       = serializers.ChoiceField(
                       choices=['MALE', 'FEMALE', 'OTHER', ''],
                       required=False, allow_blank=True, default='',
                   )
    date_of_birth = serializers.DateField(required=False, allow_null=True, default=None)
    source       = serializers.ChoiceField(
                       choices=Person.Source.values,
                       required=False, default=Person.Source.ADMIN,
                   )
    address        = serializers.CharField(required=False, allow_blank=True, default='')
    landmark       = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    state          = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    occupation     = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    marital_status = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')
    status         = serializers.ChoiceField(
                         choices=Person.Status.values,
                         required=False,
                         default=Person.Status.NEW_MEMBER,
                     )

    def validate_phone(self, value):
        normalized = normalize_phone(value)
        if not normalized:
            raise serializers.ValidationError('Invalid phone number format.')
        return normalized

    def validate_email(self, value):
        if not value:
            return None
        return value
