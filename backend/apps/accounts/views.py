import logging

from django.contrib.auth import authenticate
from django.db.models import Q
from rest_framework import status
from rest_framework import mixins, viewsets
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from core.permissions import IsAdmin
from core.throttles import LoginRateThrottle
from .models import SystemUser
from .serializers import (
    LoginSerializer,
    SystemUserSerializer,
    SystemUserCreateSerializer,
    SystemUserUpdateSerializer,
    ResetPasswordSerializer,
)

logger = logging.getLogger(__name__)


class LoginView(APIView):
    permission_classes  = [AllowAny]
    throttle_classes    = [LoginRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data['identifier'].strip()
        password = serializer.validated_data['password']
        login_user = (
            SystemUser.objects
            .filter(Q(email__iexact=identifier) | Q(username__iexact=identifier))
            .first()
        )
        user = None
        if login_user:
            user = authenticate(request, username=login_user.email, password=password)

        if not user:
            logger.warning(
                "LOGIN_FAILED identifier=%r ip=%s",
                identifier,
                request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'unknown')),
            )
            return Response(
                {'success': False, 'error': {'message': 'Invalid credentials', 'statusCode': 401}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_active:
            logger.warning(
                "LOGIN_INACTIVE identifier=%r ip=%s",
                identifier,
                request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'unknown')),
            )
            return Response(
                {'success': False, 'error': {'message': 'Account is inactive', 'statusCode': 403}},
                status=status.HTTP_403_FORBIDDEN,
            )

        logger.info(
            "LOGIN_SUCCESS user_id=%s role=%s ip=%s",
            user.pk,
            user.role,
            request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'unknown')),
        )
        refresh = RefreshToken.for_user(user)
        return Response({
            'success':      True,
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user':         SystemUserSerializer(user).data,
            'requires_password_reset': user.must_reset_password,
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return Response(
                {'success': False, 'error': {'message': 'refresh_token required', 'statusCode': 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            pass  # Already blacklisted or invalid; treat as logged out
        return Response({'success': True, 'message': 'Logged out successfully.'})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'success': True,
            'data':    SystemUserSerializer(request.user).data,
        })


class ResetPasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']

        if not user.check_password(old_password):
            return Response(
                {'success': False, 'error': {'message': 'Old password is incorrect', 'statusCode': 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.must_reset_password = False
        user.save(update_fields=['password', 'must_reset_password', 'updated_at'])
        return Response({'success': True, 'message': 'Password reset successful'})


class SystemUserViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = SystemUser.objects.all().order_by('-created_at')
    permission_classes = [IsAdmin]
    filterset_fields = ['role', 'is_active']
    search_fields = ['email', 'username', 'person__first_name', 'person__last_name']
    filter_backends = [DjangoFilterBackend, SearchFilter]

    def get_serializer_class(self):
        if self.action == 'create':
            return SystemUserCreateSerializer
        if self.action in ('update', 'partial_update'):
            return SystemUserUpdateSerializer
        return SystemUserSerializer

    def perform_create(self, serializer):
        serializer.save()
