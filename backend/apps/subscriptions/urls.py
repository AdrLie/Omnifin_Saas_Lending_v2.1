"""
Subscription URL configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.subscriptions.views import (
    SubscriptionPlanViewSet, SubscriptionViewSet, PaymentHistoryViewSet
)
from apps.subscriptions.webhooks import stripe_webhook

router = DefaultRouter()
router.register(r'plans', SubscriptionPlanViewSet, basename='subscription-plan')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')
router.register(r'payments', PaymentHistoryViewSet, basename='payment-history')

urlpatterns = [
    path('', include(router.urls)),
    path('webhook/stripe/', stripe_webhook, name='stripe-webhook'),
]
