from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from core.views import HealthCheckView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/v1/auth/', include('apps.accounts.urls')),

    # Core modules
    path('api/v1/persons/',       include('apps.persons.urls')),
    path('api/v1/medical/',       include('apps.medical.urls')),
    path('api/v1/followup/',      include('apps.followup.urls')),
    path('api/v1/cells/',         include('apps.cellgroups.urls')),
    path('api/v1/depts/',         include('apps.departments.urls')),
    path('api/v1/hr/',            include('apps.hr.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/messaging/',     include('apps.messaging.urls')),
    path('api/v1/audit/',         include('apps.audit.urls')),
    path('api/v1/sponsors/',      include('apps.sponsors.urls')),

    # Global search
    path('api/v1/search/',        include('apps.persons.search_urls')),

    # Health check
    path('api/v1/health/',        HealthCheckView.as_view(), name='health-check'),

    # API Docs (OpenAPI / Swagger)
    path('api/schema/',  SpectacularAPIView.as_view(),                      name='schema'),
    path('api/docs/',    SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/',   SpectacularRedocView.as_view(url_name='schema'),   name='redoc'),
]

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [path('__debug__/', include(debug_toolbar.urls))] + urlpatterns
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
