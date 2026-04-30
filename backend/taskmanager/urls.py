"""
Main URL configuration for Team Task Manager API.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth endpoints
    path('api/auth/', include('accounts.urls')),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Core API endpoints
    path('api/', include('projects.urls')),
    path('api/', include('tasks.urls')),
    path('api/', include('core.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
