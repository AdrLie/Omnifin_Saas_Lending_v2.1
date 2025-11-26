"""
Analytics Services for Omnifin Platform
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q
from apps.analytics.models import Event, AuditLog
from apps.authentication.models import User
from apps.loans.models import Application, Lender
from apps.commissions.models import Commission

logger = logging.getLogger('omnifin')


class AnalyticsService:
    """Service for platform analytics"""
    
    def track_event(self, user: User, event_type: str, event_category: str, 
                   properties: Dict[str, Any] = None, session_id: str = None,
                   application: Application = None) -> Event:
        """Track a user event"""
        try:
            event = Event.objects.create(
                user=user,
                event_type=event_type,
                event_category=event_category,
                session_id=session_id,
                application=application,
                properties=properties or {}
            )
            
            return event
            
        except Exception as e:
            logger.error(f"Error tracking event: {str(e)}")
            return None
    
    def get_dashboard_metrics(self, days: int = 30) -> Dict[str, Any]:
        """Get dashboard metrics for the specified period"""
        try:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=days)
            
            # User metrics
            user_metrics = self._get_user_metrics(start_date, end_date)
            
            # Application metrics
            application_metrics = self._get_application_metrics(start_date, end_date)
            
            # Commission metrics
            commission_metrics = self._get_commission_metrics(start_date, end_date)
            
            # AI interaction metrics
            ai_metrics = self._get_ai_metrics(start_date, end_date)
            
            return {
                'period_days': days,
                'users': user_metrics,
                'applications': application_metrics,
                'commissions': commission_metrics,
                'ai_interactions': ai_metrics
            }
            
        except Exception as e:
            logger.error(f"Error getting dashboard metrics: {str(e)}")
            return {}
    
    def _get_user_metrics(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get user-related metrics"""
        total_users = User.objects.count()
        new_users = User.objects.filter(created_at__range=(start_date, end_date)).count()
        active_users = User.objects.filter(last_login__gte=start_date).count()
        
        # User roles distribution
        role_distribution = User.objects.values('role').annotate(count=Count('role'))
        
        return {
            'total_users': total_users,
            'new_users': new_users,
            'active_users': active_users,
            'role_distribution': {item['role']: item['count'] for item in role_distribution}
        }
    
    def _get_application_metrics(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get application-related metrics"""
        total_applications = Application.objects.count()
        new_applications = Application.objects.filter(created_at__range=(start_date, end_date)).count()
        
        # Status distribution
        status_distribution = Application.objects.values('status').annotate(count=Count('status'))
        
        # Conversion rates
        submitted_applications = Application.objects.filter(status__in=['submitted', 'under_review', 'approved', 'funded']).count()
        approved_applications = Application.objects.filter(status='approved').count()
        funded_applications = Application.objects.filter(status='funded').count()
        
        conversion_rate = (submitted_applications / total_applications * 100) if total_applications > 0 else 0
        approval_rate = (approved_applications / submitted_applications * 100) if submitted_applications > 0 else 0
        funding_rate = (funded_applications / approved_applications * 100) if approved_applications > 0 else 0
        
        # Average loan amounts
        avg_loan_amount = Application.objects.filter(status='funded').aggregate(
            avg_amount=Avg('loan_amount')
        )['avg_amount'] or 0
        
        return {
            'total_applications': total_applications,
            'new_applications': new_applications,
            'status_distribution': {item['status']: item['count'] for item in status_distribution},
            'conversion_rate': round(conversion_rate, 2),
            'approval_rate': round(approval_rate, 2),
            'funding_rate': round(funding_rate, 2),
            'average_loan_amount': float(avg_loan_amount)
        }
    
    def _get_commission_metrics(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get commission-related metrics"""
        total_commissions = Commission.objects.count()
        period_commissions = Commission.objects.filter(calculated_at__range=(start_date, end_date))
        
        # Commission status distribution
        status_distribution = Commission.objects.values('status').annotate(
            count=Count('status'),
            total_amount=Sum('commission_amount')
        )
        
        # Total commission amounts
        total_commission_amount = Commission.objects.aggregate(
            total=Sum('commission_amount')
        )['total'] or 0
        
        period_commission_amount = period_commissions.aggregate(
            total=Sum('commission_amount')
        )['total'] or 0
        
        return {
            'total_commissions': total_commissions,
            'period_commissions': period_commissions.count(),
            'total_commission_amount': float(total_commission_amount),
            'period_commission_amount': float(period_commission_amount),
            'status_distribution': {
                item['status']: {
                    'count': item['count'],
                    'total_amount': float(item['total_amount'] or 0)
                } for item in status_distribution
            }
        }
    
    def _get_ai_metrics(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get AI interaction metrics"""
        from apps.ai_integration.models import Conversation, Message
        
        total_conversations = Conversation.objects.count()
        active_conversations = Conversation.objects.filter(status='active').count()
        completed_conversations = Conversation.objects.filter(status='completed').count()
        
        # Messages
        total_messages = Message.objects.count()
        user_messages = Message.objects.filter(sender='user').count()
        ai_messages = Message.objects.filter(sender='ai').count()
        
        # Voice vs Text
        voice_conversations = Conversation.objects.filter(is_voice_chat=True).count()
        text_conversations = Conversation.objects.filter(is_voice_chat=False).count()
        
        return {
            'total_conversations': total_conversations,
            'active_conversations': active_conversations,
            'completed_conversations': completed_conversations,
            'total_messages': total_messages,
            'user_messages': user_messages,
            'ai_messages': ai_messages,
            'voice_conversations': voice_conversations,
            'text_conversations': text_conversations
        }
    
    def get_application_funnel(self, days: int = 30) -> Dict[str, Any]:
        """Get application funnel analytics"""
        try:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=days)
            
            # Funnel stages
            visitors = Event.objects.filter(
                event_type='page_view',
                created_at__range=(start_date, end_date)
            ).values('session_id').distinct().count()
            
            applications_started = Application.objects.filter(
                created_at__range=(start_date, end_date)
            ).count()
            
            applications_submitted = Application.objects.filter(
                submission_date__range=(start_date, end_date)
            ).count()
            
            applications_approved = Application.objects.filter(
                decision_date__range=(start_date, end_date),
                status='approved'
            ).count()
            
            applications_funded = Application.objects.filter(
                funding_date__range=(start_date, end_date),
                status='funded'
            ).count()
            
            # Calculate conversion rates
            visitor_to_app_rate = (applications_started / visitors * 100) if visitors > 0 else 0
            app_to_submit_rate = (applications_submitted / applications_started * 100) if applications_started > 0 else 0
            submit_to_approve_rate = (applications_approved / applications_submitted * 100) if applications_submitted > 0 else 0
            approve_to_fund_rate = (applications_funded / applications_approved * 100) if applications_approved > 0 else 0
            
            return {
                'visitors': visitors,
                'applications_started': applications_started,
                'applications_submitted': applications_submitted,
                'applications_approved': applications_approved,
                'applications_funded': applications_funded,
                'conversion_rates': {
                    'visitor_to_application': round(visitor_to_app_rate, 2),
                    'application_to_submission': round(app_to_submit_rate, 2),
                    'submission_to_approval': round(submit_to_approve_rate, 2),
                    'approval_to_funding': round(approve_to_fund_rate, 2)
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting application funnel: {str(e)}")
            return {}
    
    def get_lender_performance(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get lender performance metrics"""
        try:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=days)
            
            lenders = Lender.objects.filter(is_active=True)
            performance_data = []
            
            for lender in lenders:
                # Applications submitted to this lender
                applications = Application.objects.filter(
                    lender=lender,
                    submission_date__range=(start_date, end_date)
                )
                
                total_applications = applications.count()
                approved_applications = applications.filter(status='approved').count()
                funded_applications = applications.filter(status='funded').count()
                
                # Calculate rates
                approval_rate = (approved_applications / total_applications * 100) if total_applications > 0 else 0
                funding_rate = (funded_applications / approved_applications * 100) if approved_applications > 0 else 0
                
                # Average processing time
                avg_processing_days = 0
                if total_applications > 0:
                    processing_times = []
                    for app in applications.filter(decision_date__isnull=False):
                        if app.submission_date:
                            processing_time = (app.decision_date - app.submission_date).days
                            processing_times.append(processing_time)
                    
                    if processing_times:
                        avg_processing_days = sum(processing_times) / len(processing_times)
                
                performance_data.append({
                    'lender_name': lender.name,
                    'total_applications': total_applications,
                    'approved_applications': approved_applications,
                    'funded_applications': funded_applications,
                    'approval_rate': round(approval_rate, 2),
                    'funding_rate': round(funding_rate, 2),
                    'avg_processing_days': round(avg_processing_days, 1)
                })
            
            return sorted(performance_data, key=lambda x: x['approval_rate'], reverse=True)
            
        except Exception as e:
            logger.error(f"Error getting lender performance: {str(e)}")
            return []


class AuditService:
    """Service for audit logging"""
    
    def log_action(self, user: User, action: str, resource_type: str, 
                   resource_id: str = None, changes: Dict[str, Any] = None,
                   ip_address: str = None, user_agent: str = None) -> AuditLog:
        """Log a user action"""
        try:
            audit_log = AuditLog.objects.create(
                user=user,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                changes=changes or {},
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            return audit_log
            
        except Exception as e:
            logger.error(f"Error logging audit action: {str(e)}")
            return None
    
    def get_user_activity(self, user: User, days: int = 30) -> List[AuditLog]:
        """Get user activity logs"""
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        return AuditLog.objects.filter(
            user=user,
            created_at__range=(start_date, end_date)
        ).order_by('-created_at')
    
    def get_security_events(self, days: int = 7) -> List[AuditLog]:
        """Get security-related events"""
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        security_actions = ['login', 'logout', 'password_change', 'failed_login', 'access_denied']
        
        return AuditLog.objects.filter(
            action__in=security_actions,
            created_at__range=(start_date, end_date)
        ).order_by('-created_at')