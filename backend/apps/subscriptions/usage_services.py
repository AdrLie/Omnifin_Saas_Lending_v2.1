"""
Token usage tracking services for Omnifin Platform
"""

import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Sum
from apps.subscriptions.models import Subscription
from apps.subscriptions.usage_models import TokenUsage, UsageSummary

logger = logging.getLogger('omnifin')


class UsageTrackingService:
    """Service for tracking token usage"""
    
    @staticmethod
    def record_usage(subscription_id, usage_type, tokens_used, user_id=None, metadata=None):
        """Record token usage"""
        try:
            subscription = Subscription.objects.get(id=subscription_id, status='active')
            
            usage = TokenUsage.objects.create(
                subscription=subscription,
                group_id=subscription.group_id,
                usage_type=usage_type,
                tokens_used=tokens_used,
                user_id=user_id,
                metadata=metadata or {}
            )
            
            # Update usage summary
            UsageTrackingService.update_usage_summary(subscription)
            
            return usage
        except Exception as e:
            logger.error(f"Error recording usage: {str(e)}")
            raise
    
    @staticmethod
    def get_or_create_current_summary(subscription):
        """Get or create current month's usage summary"""
        now = timezone.now()
        period_start = subscription.current_period_start or now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        period_end = subscription.current_period_end or (period_start + timedelta(days=30))
        
        summary, created = UsageSummary.objects.get_or_create(
            subscription=subscription,
            period_start=period_start,
            defaults={
                'group_id': subscription.group_id,
                'period_end': period_end,
                'llm_tokens_limit': subscription.plan.llm_tokens_limit,
                'voice_tokens_limit': subscription.plan.voice_tokens_limit,
            }
        )
        
        return summary
    
    @staticmethod
    def update_usage_summary(subscription):
        """Update usage summary with latest totals"""
        try:
            summary = UsageTrackingService.get_or_create_current_summary(subscription)
            
            # Calculate totals for current period
            usage_records = TokenUsage.objects.filter(
                subscription=subscription,
                created_at__gte=summary.period_start,
                created_at__lte=summary.period_end
            )
            
            llm_total = usage_records.filter(usage_type='llm').aggregate(
                total=Sum('tokens_used')
            )['total'] or 0
            
            voice_total = usage_records.filter(usage_type='voice').aggregate(
                total=Sum('tokens_used')
            )['total'] or 0
            
            summary.llm_tokens_used = llm_total
            summary.voice_tokens_used = voice_total
            
            # Update warning flags
            if summary.llm_usage_percentage >= 100:
                summary.llm_limit_reached = True
            elif summary.llm_usage_percentage >= 80:
                summary.llm_warning_sent = True
            
            if summary.voice_usage_percentage >= 100:
                summary.voice_limit_reached = True
            elif summary.voice_usage_percentage >= 80:
                summary.voice_warning_sent = True
            
            summary.save()
            
            return summary
        except Exception as e:
            logger.error(f"Error updating usage summary: {str(e)}")
            raise
    
    @staticmethod
    def get_usage_summary(subscription_id):
        """Get current usage summary for a subscription"""
        try:
            subscription = Subscription.objects.get(id=subscription_id)
            summary = UsageTrackingService.get_or_create_current_summary(subscription)
            
            return {
                'subscription_id': str(subscription.id),
                'plan_name': subscription.plan.name,
                'group_id': str(subscription.group_id),
                'period_start': summary.period_start,
                'period_end': summary.period_end,
                'llm': {
                    'used': summary.llm_tokens_used,
                    'limit': summary.llm_tokens_limit,
                    'percentage': round(summary.llm_usage_percentage, 2),
                    'warning': summary.llm_warning_sent,
                    'limit_reached': summary.llm_limit_reached,
                },
                'voice': {
                    'used': summary.voice_tokens_used,
                    'limit': summary.voice_tokens_limit,
                    'percentage': round(summary.voice_usage_percentage, 2),
                    'warning': summary.voice_warning_sent,
                    'limit_reached': summary.voice_limit_reached,
                },
                'needs_warning': summary.needs_warning,
                'over_limit': summary.over_limit,
            }
        except Exception as e:
            logger.error(f"Error getting usage summary: {str(e)}")
            raise
    
    @staticmethod
    def get_group_usage(group_id):
        """Get usage for all subscriptions in a group"""
        try:
            subscriptions = Subscription.objects.filter(group_id=group_id, status='active')
            
            if not subscriptions.exists():
                return {'error': 'No active subscription found for group'}
            
            # Get the first active subscription (should only be one per group)
            subscription = subscriptions.first()
            return UsageTrackingService.get_usage_summary(subscription.id)
        except Exception as e:
            logger.error(f"Error getting group usage: {str(e)}")
            return {'error': str(e)}
    
    @staticmethod
    def check_usage_limits(subscription_id):
        """Check if subscription is approaching or over limits"""
        try:
            subscription = Subscription.objects.get(id=subscription_id)
            summary = UsageTrackingService.get_or_create_current_summary(subscription)
            
            warnings = []
            
            if summary.llm_usage_percentage >= 100:
                warnings.append({
                    'type': 'error',
                    'category': 'llm',
                    'message': 'LLM token limit reached! Upgrade to continue.',
                    'percentage': round(summary.llm_usage_percentage, 2)
                })
            elif summary.llm_usage_percentage >= 80:
                warnings.append({
                    'type': 'warning',
                    'category': 'llm',
                    'message': f'You have used {round(summary.llm_usage_percentage, 0)}% of your LLM tokens.',
                    'percentage': round(summary.llm_usage_percentage, 2)
                })
            
            if summary.voice_usage_percentage >= 100:
                warnings.append({
                    'type': 'error',
                    'category': 'voice',
                    'message': 'Voice token limit reached! Upgrade to continue.',
                    'percentage': round(summary.voice_usage_percentage, 2)
                })
            elif summary.voice_usage_percentage >= 80:
                warnings.append({
                    'type': 'warning',
                    'category': 'voice',
                    'message': f'You have used {round(summary.voice_usage_percentage, 0)}% of your voice tokens.',
                    'percentage': round(summary.voice_usage_percentage, 2)
                })
            
            return {
                'has_warnings': len(warnings) > 0,
                'over_limit': summary.over_limit,
                'warnings': warnings,
                'suggested_upgrade': UsageTrackingService.suggest_upgrade(subscription, summary) if warnings else None
            }
        except Exception as e:
            logger.error(f"Error checking usage limits: {str(e)}")
            return {'error': str(e)}
    
    @staticmethod
    def suggest_upgrade(subscription, summary):
        """Suggest next tier plan based on current usage"""
        from apps.subscriptions.models import SubscriptionPlan
        
        current_plan = subscription.plan
        
        # Find plans with higher limits
        better_plans = SubscriptionPlan.objects.filter(
            is_active=True,
            price__gt=current_plan.price
        ).order_by('price')
        
        if better_plans.exists():
            next_plan = better_plans.first()
            return {
                'plan_id': str(next_plan.id),
                'plan_name': next_plan.name,
                'price': float(next_plan.price),
                'llm_tokens': next_plan.llm_tokens_limit,
                'voice_tokens': next_plan.voice_tokens_limit,
            }
        
        return None
