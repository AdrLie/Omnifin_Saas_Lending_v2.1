from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.commissions.views import CommissionViewSet

router = DefaultRouter()
router.register(r'commissions', CommissionViewSet)

urlpatterns = [
	path('', include(router.urls)),
]