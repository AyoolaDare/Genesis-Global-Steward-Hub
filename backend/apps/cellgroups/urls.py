from rest_framework.routers import DefaultRouter
from .views import CellGroupViewSet

router = DefaultRouter()
router.register('groups', CellGroupViewSet, basename='cellgroup')

urlpatterns = router.urls
