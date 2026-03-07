from rest_framework.routers import DefaultRouter
from .views import FollowUpTaskViewSet

router = DefaultRouter()
router.register('tasks', FollowUpTaskViewSet, basename='followup-task')

urlpatterns = router.urls
