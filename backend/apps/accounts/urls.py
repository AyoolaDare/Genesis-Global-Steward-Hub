from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, LogoutView, MeView, ResetPasswordView, SystemUserViewSet

router = DefaultRouter()
router.register('users', SystemUserViewSet, basename='system-user')

urlpatterns = [
    path('login/',   LoginView.as_view(),        name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('logout/',  LogoutView.as_view(),       name='auth-logout'),
    path('me/',      MeView.as_view(),           name='auth-me'),
    path('reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
] + router.urls
