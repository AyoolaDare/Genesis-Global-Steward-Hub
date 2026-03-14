from rest_framework.routers import DefaultRouter
from .views import SMSCampaignViewSet

router = DefaultRouter()
router.register('campaigns', SMSCampaignViewSet, basename='campaign')

urlpatterns = router.urls
