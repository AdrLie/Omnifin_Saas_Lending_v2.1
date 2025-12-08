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
from apps.authentication.permissions import IsSuperAdmin
import logging

logger = logging.getLogger('omnifin')


class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperAdmin()]
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
        if user.is_superadmin:
            return Subscription.objects.all()
        # Admin users can see their group's subscription
        if user.group_id:
            return Subscription.objects.filter(group_id=user.group_id)
        return Subscription.objects.filter(user=user)
    
    @action(detail=False, methods=['get'], permission_classes=[IsSuperAdmin])
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
    
    @action(detail=False, methods=['post'], permission_classes=[IsSuperAdmin])
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
    def create_subscription(self, request):
        serializer = CreateSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Use user's group_id or provided group_id
        group_id = serializer.validated_data.get('group_id') or request.user.group_id
        if not group_id:
            return Response(
                {'error': 'User must have a group_id to purchase subscription'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
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
        if user.is_superadmin:
            return PaymentHistory.objects.all()
        if user.group_id:
            return PaymentHistory.objects.filter(subscription__group_id=user.group_id)
        return PaymentHistory.objects.filter(subscription__user=user)
