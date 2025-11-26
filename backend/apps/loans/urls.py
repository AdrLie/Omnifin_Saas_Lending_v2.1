"""
Loans URLs for Omnifin Platform
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.loans.views import ApplicationViewSet, LenderViewSet, LoanOfferViewSet, application_dashboard, lender_performance

app_name = 'loans'

router = DefaultRouter()
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'lenders', LenderViewSet, basename='lender')
router.register(r'offers', LoanOfferViewSet, basename='loanoffer')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', application_dashboard, name='application_dashboard'),
    path('lender-performance/', lender_performance, name='lender_performance'),
]