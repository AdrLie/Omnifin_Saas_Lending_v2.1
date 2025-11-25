"""
Main URL configuration for Omnifin Platform
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.authtoken import views as auth_views
from apps.authentication.views import get_csrf_token

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),
    
    # API authentication
    path('api/token/', auth_views.obtain_auth_token),
    
    # App URLs
    path('api/auth/', include('apps.authentication.urls')),
    path('api/loans/', include('apps.loans.urls')),
    path('api/ai/', include('apps.ai_integration.urls')),
    path('api/documents/', include('apps.documents.urls')),
    path('api/commissions/', include('apps.commissions.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    
    # API documentation (in production, use tools like drf-yasg)
    path('api/', include('rest_framework.urls')),

    # CSRF token endpoint
    path('api/csrf/', get_csrf_token, name='csrf'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)