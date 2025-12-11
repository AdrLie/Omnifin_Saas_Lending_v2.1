"""
Subscription views for Omnifin Platform
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.subscriptions.models import SubscriptionPlan, Subscription, PaymentHistory
from apps.subscriptions.serializers import (
    SubscriptionPlanSerializer, SubscriptionPlanCreateSerializer,
    SubscriptionSerializer, PaymentHistorySerializer, CreateSubscriptionSerializer
)
from apps.subscriptions.services import SubscriptionService
from apps.subscriptions.usage_services import UsageTrackingService
from apps.authentication.permissions import IsSystemAdmin
import logging

logger = logging.getLogger('omnifin')


class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSystemAdmin()]
        return [permissions.AllowAny()]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SubscriptionPlanCreateSerializer
        return SubscriptionPlanSerializer


class SubscriptionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SubscriptionSerializer
    
    def get_queryset(self):
        """Filter subscriptions by user"""
        user = self.request.user
        if user.is_system_admin:
            return Subscription.objects.all()
        # TPB manager can see their workspace subscription
        if user.group_id:
            return Subscription.objects.filter(group_id=user.group_id)
        return Subscription.objects.filter(user=user)
    
    @action(detail=False, methods=['get'], permission_classes=[IsSystemAdmin])
    def admin_users(self, request):
        """Get all admin users for subscription management - SuperAdmin only"""
        from apps.authentication.models import User
        from apps.authentication.serializers import UserSerializer
        
        admin_users = User.objects.filter(role='admin')
        
        # Add subscription info to each user
        users_data = []
        for user in admin_users:
            user_data = UserSerializer(user).data
            
            # Get active subscription for this user's group
            if user.group_id:
                subscription = Subscription.objects.filter(
                    group_id=user.group_id,
                    status__in=['active', 'incomplete', 'trialing']
                ).first()
                user_data['subscription'] = SubscriptionSerializer(subscription).data if subscription else None
            else:
                user_data['subscription'] = None
            
            users_data.append(user_data)
        
        return Response(users_data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[IsSystemAdmin])
    def assign_subscription(self, request):
        user_id = request.data.get('user_id')
        plan_id = request.data.get('plan_id')
        
        if not user_id or not plan_id:
            return Response(
                {'error': 'user_id and plan_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from apps.authentication.models import User
            user = User.objects.get(id=user_id, role='admin')
            
            # Ensure user has group_id
            if not user.group_id:
                user.group_id = user.id
                user.save()
            
            # Check if user's group already has active subscription
            existing = Subscription.objects.filter(
                group_id=user.group_id,
                status__in=['active', 'incomplete', 'trialing']
            ).first()
            
            if existing:
                return Response(
                    {'error': 'User already has an active subscription'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create subscription without payment method (SuperAdmin assigning)
            subscription, stripe_subscription = SubscriptionService.create_subscription(
                user=user,
                plan_id=plan_id,
                payment_method_id=None,
                group_id=user.group_id
            )
            
            return Response({
                'subscription': SubscriptionSerializer(subscription).data,
                'message': 'Subscription assigned successfully'
            }, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response(
                {'error': 'Admin user not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error assigning subscription: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def activate_trial(self, request):
        """Activate free trial for TPB Manager organization"""
        if not request.user.is_tpb_manager:
            return Response(
                {'error': 'Only TPB Managers can activate trial'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not request.user.group_id:
            return Response(
                {'error': 'User must have a group_id to activate trial'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Check if subscription already exists
            existing = Subscription.objects.filter(group_id=request.user.group_id).first()
            
            if existing:
                if existing.status == 'active' or existing.status == 'trialing':
                    return Response(
                        {'error': 'Subscription already exists for this organization'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Create a free trial subscription
            plan = SubscriptionPlan.objects.filter(plan_type='free').first()
            if not plan:
                return Response(
                    {'error': 'Free trial plan not found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            subscription, _ = SubscriptionService.create_subscription(
                user=request.user,
                plan_id=str(plan.id),
                payment_method_id=None,
                group_id=request.user.group_id
            )
            
            return Response({
                'subscription': SubscriptionSerializer(subscription).data,
                'message': 'Trial activated successfully for 14 days'
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error activating trial: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def create_subscription(self, request):
        serializer = CreateSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Use user's group_id or provided group_id
        group_id = serializer.validated_data.get('group_id') or request.user.group_id
        
        # If user doesn't have a group_id, auto-assign one
        if not group_id:
            import uuid
            group_id = uuid.uuid4()
            request.user.group_id = group_id
            request.user.save()
            logger.info(f"Auto-assigned group_id {group_id} to user {request.user.id}")
        
        try:
            subscription, stripe_subscription = SubscriptionService.create_subscription(
                user=request.user,
                plan_id=serializer.validated_data['plan_id'],
                payment_method_id=serializer.validated_data.get('payment_method_id'),
                group_id=group_id
            )
            
            # Extract client_secret safely
            client_secret = None
            try:
                if hasattr(stripe_subscription, 'latest_invoice') and stripe_subscription.latest_invoice:
                    invoice = stripe_subscription.latest_invoice
                    if hasattr(invoice, 'payment_intent') and invoice.payment_intent:
                        if isinstance(invoice.payment_intent, str):
                            # If it's just an ID, we need to fetch it
                            import stripe
                            payment_intent = stripe.PaymentIntent.retrieve(invoice.payment_intent)
                            client_secret = payment_intent.client_secret
                        else:
                            # It's already expanded
                            client_secret = invoice.payment_intent.client_secret
            except Exception as e:
                logger.warning(f"Could not extract client_secret: {str(e)}")
            
            return Response({
                'subscription': SubscriptionSerializer(subscription).data,
                'client_secret': client_secret
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating subscription: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a subscription"""
        try:
            at_period_end = request.data.get('at_period_end', True)
            subscription = SubscriptionService.cancel_subscription(pk, at_period_end)
            
            return Response(
                SubscriptionSerializer(subscription).data,
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error canceling subscription: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        """Sync subscription with Stripe"""
        try:
            subscription = SubscriptionService.sync_subscription(pk)
            return Response(
                SubscriptionSerializer(subscription).data,
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error syncing subscription: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def my_subscription(self, request):
        """Get current user's active subscription"""
        try:
            group_id = request.user.group_id
            if not group_id:
                return Response(
                    {'error': 'User does not have a group'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            subscription = Subscription.objects.filter(
                group_id=group_id,
                status__in=['active', 'incomplete', 'trialing']
            ).first()
            
            if not subscription:
                return Response(
                    {'error': 'No subscription found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response(
                SubscriptionSerializer(subscription).data,
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error getting subscription: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def usage(self, request):
        """Get usage summary for current user's group"""
        try:
            group_id = request.user.group_id
            
            # If user has no group_id, try to find from subscription
            if not group_id:
                subscription = Subscription.objects.filter(
                    user=request.user
                ).order_by('-created_at').first()
                if subscription and subscription.group_id:
                    group_id = subscription.group_id
            
            if not group_id:
                return Response(
                    {'error': 'User does not have a group'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            usage_data = UsageTrackingService.get_group_usage(str(group_id))
            return Response(usage_data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error getting usage: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        """Get current subscription status for the user"""
        try:
            # First, try to find subscription by group_id (for TPB managers)
            group_id = request.user.group_id
            subscription = None
            
            if group_id:
                subscription = Subscription.objects.filter(
                    group_id=group_id
                ).order_by('-created_at').first()
            
            # If no group subscription, try to find subscription assigned to the user directly
            if not subscription:
                subscription = Subscription.objects.filter(
                    user=request.user
                ).order_by('-created_at').first()
            
            if not subscription:
                return Response({
                    'status': 'no_subscription',
                    'message': 'No subscription found',
                    'has_active_subscription': False
                }, status=status.HTTP_200_OK)
            
            is_active = subscription.status in ['active', 'trialing']
            return Response({
                'status': subscription.status,
                'has_active_subscription': is_active,
                'plan': subscription.plan.name if subscription.plan else None,
                'current_period_start': subscription.current_period_start,
                'current_period_end': subscription.current_period_end,
                'message': 'Active subscription found' if is_active else 'Subscription is not active'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error getting subscription status: {str(e)}")
            return Response({
                'status': 'error',
                'has_active_subscription': False,
                'message': str(e)
            }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current subscription details for the user"""
        try:
            # First, try to find subscription by group_id (for TPB managers)
            group_id = request.user.group_id
            subscription = None
            
            if group_id:
                subscription = Subscription.objects.filter(
                    group_id=group_id,
                    status__in=['active', 'trialing']
                ).first()
            
            # If no group subscription, try to find subscription assigned to the user directly
            if not subscription:
                subscription = Subscription.objects.filter(
                    user=request.user,
                    status__in=['active', 'trialing']
                ).first()
            
            if not subscription:
                return Response(
                    {'error': 'No active subscription found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response(SubscriptionSerializer(subscription).data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error getting current subscription: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def check_limits(self, request):
        """Check if user's group is approaching or over usage limits"""
        try:
            group_id = request.user.group_id
            if not group_id:
                return Response(
                    {'error': 'User does not have a group'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            subscription = Subscription.objects.filter(
                group_id=group_id,
                status__in=['active', 'incomplete', 'trialing']
            ).first()
            
            if not subscription:
                return Response(
                    {'error': 'No subscription found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            limit_check = UsageTrackingService.check_usage_limits(str(subscription.id))
            return Response(limit_check, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error checking limits: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class PaymentHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Payment history viewset (read-only)"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PaymentHistorySerializer
    
    def get_queryset(self):
        """Filter payment history by user's subscriptions"""
        user = self.request.user
        if user.is_system_admin:
            return PaymentHistory.objects.all()
        if user.group_id:
            return PaymentHistory.objects.filter(subscription__group_id=user.group_id)
        return PaymentHistory.objects.filter(subscription__user=user)
