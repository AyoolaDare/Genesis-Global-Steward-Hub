from rest_framework.routers import DefaultRouter
from .views import MedicalRecordViewSet, MedicalVisitViewSet

router = DefaultRouter()
router.register('records', MedicalRecordViewSet, basename='medical-record')
router.register('visits',  MedicalVisitViewSet,  basename='medical-visit')

urlpatterns = router.urls
