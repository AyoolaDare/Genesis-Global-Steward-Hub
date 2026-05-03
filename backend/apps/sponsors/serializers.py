from rest_framework import serializers
from .models import Sponsor, SponsorshipCommitment, SponsorshipPayment, SponsorMessage


class SponsorshipPaymentSerializer(serializers.ModelSerializer):
    recorded_by_name   = serializers.CharField(source='recorded_by.username', read_only=True)
    commitment_project = serializers.CharField(source='commitment.project', read_only=True, default='')

    class Meta:
        model  = SponsorshipPayment
        fields = [
            'id', 'sponsor', 'commitment', 'commitment_project',
            'amount', 'currency', 'payment_method', 'payment_date',
            'reference', 'status', 'notes',
            'recorded_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class SponsorshipCommitmentSerializer(serializers.ModelSerializer):
    total_paid  = serializers.SerializerMethodField()
    outstanding = serializers.SerializerMethodField()

    class Meta:
        model  = SponsorshipCommitment
        fields = [
            'id', 'sponsor', 'project', 'amount', 'currency',
            'frequency', 'start_date', 'end_date', 'is_active',
            'notes', 'total_paid', 'outstanding', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_total_paid(self, obj):
        return obj.total_paid

    def get_outstanding(self, obj):
        return obj.outstanding


class SponsorMessageSerializer(serializers.ModelSerializer):
    sent_by_name = serializers.CharField(source='sent_by.username', read_only=True)

    class Meta:
        model  = SponsorMessage
        fields = [
            'id', 'sponsor', 'payment', 'message_type',
            'body', 'phone', 'success', 'sent_by_name', 'sent_at',
        ]
        read_only_fields = ['id', 'sent_at']


class SponsorListSerializer(serializers.ModelSerializer):
    total_committed = serializers.SerializerMethodField()
    total_paid      = serializers.SerializerMethodField()
    outstanding     = serializers.SerializerMethodField()
    last_payment    = serializers.SerializerMethodField()
    person_name     = serializers.CharField(source='person.full_name', read_only=True, default=None)

    class Meta:
        model  = Sponsor
        fields = [
            'id', 'sponsor_id', 'name', 'email', 'phone',
            'sponsor_type', 'status', 'person_name',
            'total_committed', 'total_paid', 'outstanding',
            'last_payment', 'created_at',
        ]

    def get_total_committed(self, obj):
        return obj.total_committed

    def get_total_paid(self, obj):
        return obj.total_paid

    def get_outstanding(self, obj):
        return obj.outstanding

    def get_last_payment(self, obj):
        p = obj.payments.filter(
            status=SponsorshipPayment.PaymentStatus.CONFIRMED
        ).order_by('-payment_date').first()
        return str(p.payment_date) if p else None


class SponsorDetailSerializer(serializers.ModelSerializer):
    commitments     = SponsorshipCommitmentSerializer(many=True, read_only=True)
    payments        = SponsorshipPaymentSerializer(many=True, read_only=True)
    messages        = SponsorMessageSerializer(many=True, read_only=True)
    total_committed = serializers.SerializerMethodField()
    total_paid      = serializers.SerializerMethodField()
    outstanding     = serializers.SerializerMethodField()
    person_name     = serializers.CharField(source='person.full_name', read_only=True, default=None)
    person_phone    = serializers.CharField(source='person.phone', read_only=True, default=None)
    person_details  = serializers.SerializerMethodField()

    class Meta:
        model  = Sponsor
        fields = [
            'id', 'sponsor_id', 'name', 'email', 'phone',
            'sponsor_type', 'status', 'notes',
            'person', 'person_name', 'person_phone', 'person_details',
            'commitments', 'payments', 'messages',
            'total_committed', 'total_paid', 'outstanding',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'sponsor_id', 'created_at', 'updated_at']

    def get_total_committed(self, obj):
        return obj.total_committed

    def get_total_paid(self, obj):
        return obj.total_paid

    def get_outstanding(self, obj):
        return obj.outstanding

    def get_person_details(self, obj):
        p = obj.person
        if not p:
            return None
        full_name = (
            getattr(p, 'full_name', None) or
            f"{p.first_name} {p.last_name}".strip()
        )
        photo_url = None
        if p.profile_photo and hasattr(p.profile_photo, 'url'):
            try:
                photo_url = p.profile_photo.url
            except Exception:
                pass
        return {
            'id':             str(p.pk),
            'full_name':      full_name,
            'phone':          p.phone,
            'email':          p.email,
            'date_of_birth':  str(p.date_of_birth) if p.date_of_birth else None,
            'gender':         p.gender,
            'address':        p.address,
            'landmark':       p.landmark,
            'state':          p.state,
            'occupation':     p.occupation,
            'marital_status': p.marital_status,
            'status':         p.status,
            'baptized':       p.baptized,
            'baptism_date':   str(p.baptism_date) if p.baptism_date else None,
            'joined_date':    str(p.joined_date) if p.joined_date else None,
            'profile_photo':  photo_url,
        }


class SponsorCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Sponsor
        fields = ['name', 'email', 'phone', 'sponsor_type', 'status', 'notes', 'person']

    def validate_person(self, value):
        if value and Sponsor.objects.filter(person=value).exists():
            raise serializers.ValidationError('This person already has a sponsor profile.')
        return value


class AddPaymentSerializer(serializers.Serializer):
    commitment     = serializers.UUIDField(required=False, allow_null=True)
    amount         = serializers.DecimalField(max_digits=14, decimal_places=2)
    currency       = serializers.CharField(default='NGN', required=False)
    payment_method = serializers.ChoiceField(choices=SponsorshipPayment.PaymentMethod.choices)
    payment_date   = serializers.DateField()
    reference      = serializers.CharField(required=False, allow_blank=True)
    status         = serializers.ChoiceField(
                       choices=SponsorshipPayment.PaymentStatus.choices,
                       default=SponsorshipPayment.PaymentStatus.CONFIRMED
                     )
    notes          = serializers.CharField(required=False, allow_blank=True)


class AddCommitmentSerializer(serializers.Serializer):
    project    = serializers.CharField(required=False, allow_blank=True, default='')
    amount     = serializers.DecimalField(max_digits=14, decimal_places=2)
    currency   = serializers.CharField(default='NGN', required=False)
    frequency  = serializers.ChoiceField(choices=SponsorshipCommitment.Frequency.choices)
    start_date = serializers.DateField()
    end_date   = serializers.DateField(required=False, allow_null=True)
    notes      = serializers.CharField(required=False, allow_blank=True)
