from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import SponsorViewSet, paystack_webhook

router = DefaultRouter()
router.register('sponsors', SponsorViewSet, basename='sponsor')

urlpatterns = router.urls + [
    path('webhooks/paystack/', paystack_webhook, name='paystack-webhook'),
]
