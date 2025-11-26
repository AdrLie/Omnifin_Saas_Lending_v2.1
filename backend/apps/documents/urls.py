from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.documents.views import DocumentViewSet

router = DefaultRouter()
router.register(r'documents', DocumentViewSet)

urlpatterns = [
	path('', include(router.urls)),
]