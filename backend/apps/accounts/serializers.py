from rest_framework import serializers
from .models import SystemUser


class SystemUserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model  = SystemUser
        fields = [
            'id', 'email', 'username', 'role', 'module_access',
            'department', 'department_name',
            'must_reset_password',
            'is_active', 'last_login', 'created_at',
        ]
        read_only_fields = ['id', 'last_login', 'created_at']


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class SystemUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = SystemUser
        fields = ['email', 'username', 'password', 'role', 'module_access', 'department']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user     = SystemUser(**validated_data)
        user.set_password(password)
        user.must_reset_password = True
        user.save()
        return user


class SystemUserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, required=False)

    class Meta:
        model = SystemUser
        fields = ['email', 'username', 'password', 'role', 'module_access', 'department', 'is_active']

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            instance.set_password(password)
            instance.must_reset_password = True
        instance.save()
        return instance


class ResetPasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
