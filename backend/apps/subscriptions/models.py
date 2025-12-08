"""
Subscription models for Omnifin Platform
"""

import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.authentication.models import User


class SubscriptionPlan(models.Model):
    """Subscription plans available on the platform"""
    
    PLAN_TYPE_CHOICES = [
        ('free', _('Free')),
        ('basic', _('Basic')),
        ('premium', _('Premium')),
        ('enterprise', _('Enterprise')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPE_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    billing_period = models.CharField(max_length=20, default='monthly')  # monthly, yearly
    stripe_price_id = models.CharField(max_length=100, blank=True, null=True)
    features = models.JSONField(default=dict, blank=True)
    
    # Usage limits for the subscription
    llm_tokens_limit = models.IntegerField(default=100000, help_text="Monthly LLM token limit")
    voice_tokens_limit = models.IntegerField(default=50000, help_text="Monthly voice token limit")
    max_users = models.IntegerField(default=10, help_text="Maximum users in group")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscriptions_plan'
        indexes = [
            models.Index(fields=['plan_type']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} - ${self.price}/{self.billing_period}"


class Subscription(models.Model):
    """User subscription - Admin buys subscription for their group"""
    
    STATUS_CHOICES = [
        ('active', _('Active')),
        ('trialing', _('Trialing')),
        ('past_due', _('Past Due')),
        ('canceled', _('Canceled')),
        ('unpaid', _('Unpaid')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    group_id = models.UUIDField(null=True, blank=True, help_text="Group ID that this subscription covers")
    stripe_subscription_id = models.CharField(max_length=100, blank=True, null=True)
    stripe_customer_id = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    current_period_start = models.DateTimeField(blank=True, null=True)
    current_period_end = models.DateTimeField(blank=True, null=True)
    cancel_at_period_end = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscriptions_subscription'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['status']),
            models.Index(fields=['stripe_subscription_id']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.plan.name} ({self.status})"


class PaymentHistory(models.Model):
    """Payment history for subscriptions"""
    
    STATUS_CHOICES = [
        ('succeeded', _('Succeeded')),
        ('failed', _('Failed')),
        ('pending', _('Pending')),
        ('refunded', _('Refunded')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='payments')
    stripe_payment_intent_id = models.CharField(max_length=100, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'subscriptions_payment_history'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['subscription']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"Payment ${self.amount} - {self.status}"
