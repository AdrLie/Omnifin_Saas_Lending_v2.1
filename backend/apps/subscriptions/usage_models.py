"""
Token usage tracking models for Omnifin Platform
"""

import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.subscriptions.models import Subscription


class TokenUsage(models.Model):
    """Track token usage for subscriptions"""
    
    USAGE_TYPE_CHOICES = [
        ('llm', _('LLM Tokens')),
        ('voice', _('Voice Tokens')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='usage_records')
    group_id = models.UUIDField(help_text="Group ID for this usage")
    usage_type = models.CharField(max_length=20, choices=USAGE_TYPE_CHOICES)
    tokens_used = models.IntegerField(default=0)
    user_id = models.UUIDField(blank=True, null=True, help_text="User who consumed the tokens")
    metadata = models.JSONField(default=dict, blank=True, help_text="Additional context (conversation_id, etc)")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'token_usage'
        indexes = [
            models.Index(fields=['subscription', 'usage_type']),
            models.Index(fields=['group_id', 'created_at']),
            models.Index(fields=['created_at']),
        ]    
    def __str__(self):
        return f"{self.usage_type} - {self.tokens_used} tokens"


class UsageSummary(models.Model):
    """Monthly usage summary per subscription"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='usage_summaries')
    group_id = models.UUIDField()
    
    # Monthly totals
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    llm_tokens_used = models.IntegerField(default=0)
    voice_tokens_used = models.IntegerField(default=0)
    
    # Limits from plan
    llm_tokens_limit = models.IntegerField()
    voice_tokens_limit = models.IntegerField()
    
    # Warning flags
    llm_warning_sent = models.BooleanField(default=False)
    voice_warning_sent = models.BooleanField(default=False)
    llm_limit_reached = models.BooleanField(default=False)
    voice_limit_reached = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'usage_summary'
        unique_together = ['subscription', 'period_start']
        indexes = [
            models.Index(fields=['subscription', 'period_start']),
            models.Index(fields=['group_id']),
        ]
    
    def __str__(self):
        return f"Usage {self.period_start.strftime('%Y-%m')} - {self.subscription.user.email}"
    
    @property
    def llm_usage_percentage(self):
        """Calculate LLM usage percentage"""
        if self.llm_tokens_limit == 0:
            return 0
        return (self.llm_tokens_used / self.llm_tokens_limit) * 100
    
    @property
    def voice_usage_percentage(self):
        """Calculate voice usage percentage"""
        if self.voice_tokens_limit == 0:
            return 0
        return (self.voice_tokens_used / self.voice_tokens_limit) * 100
    
    @property
    def needs_warning(self):
        """Check if warning should be sent (80% threshold)"""
        return (self.llm_usage_percentage >= 80 or self.voice_usage_percentage >= 80)
    
    @property
    def over_limit(self):
        """Check if any limit is exceeded"""
        return (self.llm_tokens_used >= self.llm_tokens_limit or 
                self.voice_tokens_used >= self.voice_tokens_limit)
