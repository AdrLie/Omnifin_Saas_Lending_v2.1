"""
Subscription admin configuration
"""

from django.contrib import admin
from apps.subscriptions.models import SubscriptionPlan, Subscription, PaymentHistory
from apps.subscriptions.usage_models import TokenUsage, UsageSummary


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'plan_type', 'price', 'billing_period', 'llm_tokens_limit', 'voice_tokens_limit', 'max_users', 'is_active', 'created_at']
    list_filter = ['plan_type', 'is_active', 'billing_period']
    search_fields = ['name']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'group_id', 'status', 'current_period_end', 'cancel_at_period_end', 'created_at']
    list_filter = ['status', 'cancel_at_period_end', 'plan']
    search_fields = ['user__email', 'stripe_subscription_id', 'stripe_customer_id', 'group_id']
    raw_id_fields = ['user']


@admin.register(PaymentHistory)
class PaymentHistoryAdmin(admin.ModelAdmin):
    list_display = ['subscription', 'amount', 'status', 'payment_method', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['stripe_payment_intent_id', 'subscription__user__email']
    raw_id_fields = ['subscription']


@admin.register(TokenUsage)
class TokenUsageAdmin(admin.ModelAdmin):
    list_display = ['subscription', 'group_id', 'usage_type', 'tokens_used', 'user_id', 'created_at']
    list_filter = ['usage_type', 'created_at']
    search_fields = ['subscription__user__email', 'group_id', 'user_id']
    raw_id_fields = ['subscription']
    date_hierarchy = 'created_at'


@admin.register(UsageSummary)
class UsageSummaryAdmin(admin.ModelAdmin):
    list_display = ['subscription', 'period_start', 'llm_tokens_used', 'llm_tokens_limit', 'voice_tokens_used', 'voice_tokens_limit', 'llm_warning_sent', 'voice_warning_sent']
    list_filter = ['llm_warning_sent', 'voice_warning_sent', 'llm_limit_reached', 'voice_limit_reached']
    search_fields = ['subscription__user__email', 'group_id']
    raw_id_fields = ['subscription']
    date_hierarchy = 'period_start'
