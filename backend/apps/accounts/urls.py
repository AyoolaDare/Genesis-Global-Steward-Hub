from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from core.throttles import RefreshTokenThrottle
from .views import LoginView, LogoutView, MeView, ResetPasswordView, SystemUserViewSet


class ThrottledTokenRefreshView(TokenRefreshView):
    """Token refresh with rate limiting to protect against stolen-token replay."""
    throttle_classes = [RefreshTokenThrottle]


router = DefaultRouter()
router.register('users', SystemUserViewSet, basename='system-user')

urlpatterns = [
    path('login/',   LoginView.as_view(),               name='auth-login'),
    path('refresh/', ThrottledTokenRefreshView.as_view(), name='auth-refresh'),
    path('logout/',  LogoutView.as_view(),              name='auth-logout'),
    path('me/',      MeView.as_view(),                  name='auth-me'),
    path('reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
] + router.urls
