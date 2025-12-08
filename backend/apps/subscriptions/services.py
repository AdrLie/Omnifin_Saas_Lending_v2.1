"""
Subscription services for Omnifin Platform
"""

import stripe
import logging
from datetime import datetime
from django.conf import settings
from django.utils import timezone
from apps.subscriptions.models import SubscriptionPlan, Subscription, PaymentHistory

logger = logging.getLogger('omnifin')

# Initialize Stripe
stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')


class StripeService:
    """Service for Stripe operations"""
    
    @staticmethod
    def create_customer(user):
        """Create a Stripe customer"""
        try:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.get_full_name(),
                metadata={'user_id': str(user.id)}
            )
            return customer.id
        except Exception as e:
            logger.error(f"Error creating Stripe customer: {str(e)}")
            raise
    
    @staticmethod
    def create_subscription(customer_id, price_id, payment_method_id=None):
        """Create a Stripe subscription"""
        try:
            # Attach payment method to customer if provided
            if payment_method_id:
                stripe.PaymentMethod.attach(
                    payment_method_id,
                    customer=customer_id,
                )
                
                # Set as default payment method
                stripe.Customer.modify(
                    customer_id,
                    invoice_settings={'default_payment_method': payment_method_id},
                )
            
            subscription_params = {
                'customer': customer_id,
                'items': [{'price': price_id}],
                'payment_behavior': 'allow_incomplete',  # Allow incomplete for async confirmation
                'payment_settings': {'save_default_payment_method': 'on_subscription'},
                'expand': ['latest_invoice.payment_intent', 'latest_invoice', 'items.data'],
            }
            
            if payment_method_id:
                subscription_params['default_payment_method'] = payment_method_id
            
            subscription = stripe.Subscription.create(**subscription_params)
            return subscription
        except Exception as e:
            logger.error(f"Error creating Stripe subscription: {str(e)}")
            raise
    
    @staticmethod
    def cancel_subscription(subscription_id, at_period_end=True):
        """Cancel a Stripe subscription"""
        try:
            if at_period_end:
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            else:
                subscription = stripe.Subscription.delete(subscription_id)
            return subscription
        except Exception as e:
            logger.error(f"Error canceling Stripe subscription: {str(e)}")
            raise
    
    @staticmethod
    def get_subscription(subscription_id):
        """Get a Stripe subscription"""
        try:
            return stripe.Subscription.retrieve(
                subscription_id,
                expand=['items.data']
            )
        except Exception as e:
            logger.error(f"Error retrieving Stripe subscription: {str(e)}")
            raise


class SubscriptionService:
    """Service for subscription management"""
    
    @staticmethod
    def create_subscription(user, plan_id, payment_method_id=None, group_id=None):
        """Create a subscription for a user's group"""
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
            
            # Use provided group_id or user's group_id
            if not group_id:
                group_id = user.group_id
            
            if not group_id:
                raise ValueError("Group ID is required for subscription")
            
            # Check if group already has active subscription
            existing = Subscription.objects.filter(
                group_id=group_id,
                status='active'
            ).first()
            
            if existing:
                raise ValueError("Group already has an active subscription")
            
            # Get or create Stripe customer
            existing_subscription = Subscription.objects.filter(user=user).first()
            if existing_subscription and existing_subscription.stripe_customer_id:
                customer_id = existing_subscription.stripe_customer_id
            else:
                customer_id = StripeService.create_customer(user)
            
            # Create or get Stripe price
            stripe_price_id = plan.stripe_price_id
            
            # Check if we need to create a new Stripe price
            try:
                if stripe_price_id and stripe_price_id.startswith('price_'):
                    # Try to retrieve the price to see if it exists
                    stripe.Price.retrieve(stripe_price_id)
            except stripe.error.InvalidRequestError:
                # Price doesn't exist, need to create it
                stripe_price_id = None
            
            if not stripe_price_id or not stripe_price_id.startswith('price_'):
                # Create a new price in Stripe
                logger.info(f"Creating Stripe product and price for plan: {plan.name}")
                
                # Create product
                product = stripe.Product.create(
                    name=plan.name,
                    description=f"{plan.llm_tokens_limit} LLM tokens, {plan.voice_tokens_limit} voice tokens, up to {plan.max_users} users"
                )
                
                # Create price
                price = stripe.Price.create(
                    product=product.id,
                    unit_amount=int(plan.price * 100),  # Convert to cents
                    currency='usd',
                    recurring={'interval': 'month' if plan.billing_period == 'monthly' else 'year'}
                )
                
                # Update plan with Stripe IDs
                plan.stripe_price_id = price.id
                plan.save()
                stripe_price_id = price.id
                logger.info(f"Created Stripe price: {stripe_price_id}")
            
            # Create Stripe subscription
            stripe_subscription = StripeService.create_subscription(
                customer_id,
                stripe_price_id,
                payment_method_id
            )
            
            logger.info(f"Stripe subscription created: {stripe_subscription.id}, status: {stripe_subscription.status}")
            
            # Parse timestamps - Stripe stores these in subscription items, not at top level
            period_start = None
            period_end = None
            
            # Try to get from subscription items first (use dictionary access)
            if 'items' in stripe_subscription and stripe_subscription['items'] and 'data' in stripe_subscription['items']:
                items_data = stripe_subscription['items']['data']
                if items_data and len(items_data) > 0:
                    first_item = items_data[0]
                    if 'current_period_start' in first_item and first_item['current_period_start']:
                        period_start = timezone.make_aware(datetime.fromtimestamp(first_item['current_period_start']))
                    if 'current_period_end' in first_item and first_item['current_period_end']:
                        period_end = timezone.make_aware(datetime.fromtimestamp(first_item['current_period_end']))
            
            # Fallback to top-level fields (older API behavior)
            if not period_start and 'current_period_start' in stripe_subscription and stripe_subscription['current_period_start']:
                period_start = timezone.make_aware(datetime.fromtimestamp(stripe_subscription['current_period_start']))
            
            if not period_end and 'current_period_end' in stripe_subscription and stripe_subscription['current_period_end']:
                period_end = timezone.make_aware(datetime.fromtimestamp(stripe_subscription['current_period_end']))
            
            # Create local subscription
            subscription = Subscription.objects.create(
                user=user,
                plan=plan,
                group_id=group_id,
                stripe_subscription_id=stripe_subscription.id,
                stripe_customer_id=customer_id,
                status=stripe_subscription.status,
                current_period_start=period_start,
                current_period_end=period_end
            )
            
            return subscription, stripe_subscription
        except Exception as e:
            logger.error(f"Error creating subscription: {str(e)}")
            raise
    
    @staticmethod
    def cancel_subscription(subscription_id, at_period_end=True):
        """Cancel a subscription"""
        try:
            subscription = Subscription.objects.get(id=subscription_id)
            
            # Cancel in Stripe
            stripe_subscription = StripeService.cancel_subscription(
                subscription.stripe_subscription_id,
                at_period_end
            )
            
            # Update local subscription
            if at_period_end:
                subscription.cancel_at_period_end = True
            else:
                subscription.status = 'canceled'
            subscription.save()
            
            return subscription
        except Exception as e:
            logger.error(f"Error canceling subscription: {str(e)}")
            raise
    
    @staticmethod
    def sync_subscription(subscription_id):
        """Sync subscription with Stripe"""
        try:
            subscription = Subscription.objects.get(id=subscription_id)
            stripe_subscription = StripeService.get_subscription(
                subscription.stripe_subscription_id
            )
            
            # Parse timestamps - Stripe stores these in subscription items (use dictionary access)
            period_start = None
            period_end = None
            
            # Try to get from subscription items first
            if 'items' in stripe_subscription and stripe_subscription['items'] and 'data' in stripe_subscription['items']:
                items_data = stripe_subscription['items']['data']
                if items_data and len(items_data) > 0:
                    first_item = items_data[0]
                    if 'current_period_start' in first_item and first_item['current_period_start']:
                        period_start = timezone.make_aware(datetime.fromtimestamp(first_item['current_period_start']))
                    if 'current_period_end' in first_item and first_item['current_period_end']:
                        period_end = timezone.make_aware(datetime.fromtimestamp(first_item['current_period_end']))
            
            # Fallback to top-level fields (older API behavior)
            if not period_start and 'current_period_start' in stripe_subscription and stripe_subscription['current_period_start']:
                period_start = timezone.make_aware(datetime.fromtimestamp(stripe_subscription['current_period_start']))
            
            if not period_end and 'current_period_end' in stripe_subscription and stripe_subscription['current_period_end']:
                period_end = timezone.make_aware(datetime.fromtimestamp(stripe_subscription['current_period_end']))
            
            # Update local subscription
            subscription.status = stripe_subscription.status
            subscription.current_period_start = period_start
            subscription.current_period_end = period_end
            subscription.cancel_at_period_end = stripe_subscription.cancel_at_period_end
            subscription.save()
            
            return subscription
        except Exception as e:
            logger.error(f"Error syncing subscription: {str(e)}")
            raise
