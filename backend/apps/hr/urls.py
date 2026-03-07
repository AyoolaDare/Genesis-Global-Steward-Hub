from rest_framework.routers import DefaultRouter
from .views import WorkerProfileViewSet

router = DefaultRouter()
router.register('workers', WorkerProfileViewSet, basename='worker')

urlpatterns = router.urls
