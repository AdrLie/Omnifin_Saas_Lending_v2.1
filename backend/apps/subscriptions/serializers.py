"""
Subscription serializers for Omnifin Platform
"""

from rest_framework import serializers
from apps.subscriptions.models import SubscriptionPlan, Subscription, PaymentHistory


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Subscription plan serializer"""
    
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'plan_type', 'price', 'billing_period', 
                 'features', 'llm_tokens_limit', 'voice_tokens_limit', 'max_users',
                 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class SubscriptionPlanCreateSerializer(serializers.ModelSerializer):
    """Subscription plan creation serializer"""
    
    class Meta:
        model = SubscriptionPlan
        fields = ['name', 'plan_type', 'price', 'billing_period', 'stripe_price_id',
                 'features', 'llm_tokens_limit', 'voice_tokens_limit', 'max_users', 'is_active']


class SubscriptionSerializer(serializers.ModelSerializer):
    """Subscription serializer"""
    plan_details = SubscriptionPlanSerializer(source='plan', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Subscription
        fields = ['id', 'user', 'user_email', 'plan', 'plan_details', 'group_id',
                 'status', 'current_period_start', 'current_period_end', 
                 'cancel_at_period_end', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentHistorySerializer(serializers.ModelSerializer):
    """Payment history serializer"""
    
    class Meta:
        model = PaymentHistory
        fields = ['id', 'subscription', 'amount', 'status', 'payment_method', 
                 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at']


class CreateSubscriptionSerializer(serializers.Serializer):
    """Create subscription serializer"""
    plan_id = serializers.UUIDField()
    payment_method_id = serializers.CharField(required=False, allow_blank=True)
    group_id = serializers.UUIDField(required=False, help_text="Group ID for this subscription")
