"""
Stripe webhook handler for Omnifin Platform
"""

import json
import stripe
import logging
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from apps.subscriptions.models import Subscription, PaymentHistory

logger = logging.getLogger('omnifin')
stripe.api_key = settings.STRIPE_SECRET_KEY


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """Handle Stripe webhook events"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        return HttpResponse(status=400)
    
    # Handle the event
    event_type = event['type']
    data = event['data']['object']
    
    try:
        if event_type == 'customer.subscription.created':
            handle_subscription_created(data)
        elif event_type == 'customer.subscription.updated':
            handle_subscription_updated(data)
        elif event_type == 'customer.subscription.deleted':
            handle_subscription_deleted(data)
        elif event_type == 'invoice.payment_succeeded':
            handle_payment_succeeded(data)
        elif event_type == 'invoice.payment_failed':
            handle_payment_failed(data)
        else:
            logger.info(f"Unhandled event type: {event_type}")
    
    except Exception as e:
        logger.error(f"Error handling webhook event: {str(e)}")
        return HttpResponse(status=500)
    
    return HttpResponse(status=200)


def handle_subscription_created(subscription_data):
    """Handle subscription created event"""
    logger.info(f"Subscription created: {subscription_data['id']}")
    # Additional logic if needed


def handle_subscription_updated(subscription_data):
    """Handle subscription updated event"""
    try:
        subscription = Subscription.objects.get(
            stripe_subscription_id=subscription_data['id']
        )
        subscription.status = subscription_data['status']
        subscription.current_period_start = subscription_data['current_period_start']
        subscription.current_period_end = subscription_data['current_period_end']
        subscription.cancel_at_period_end = subscription_data.get('cancel_at_period_end', False)
        subscription.save()
        
        logger.info(f"Updated subscription: {subscription.id}")
    except Subscription.DoesNotExist:
        logger.warning(f"Subscription not found: {subscription_data['id']}")


def handle_subscription_deleted(subscription_data):
    """Handle subscription deleted event"""
    try:
        subscription = Subscription.objects.get(
            stripe_subscription_id=subscription_data['id']
        )
        subscription.status = 'canceled'
        subscription.save()
        
        logger.info(f"Canceled subscription: {subscription.id}")
    except Subscription.DoesNotExist:
        logger.warning(f"Subscription not found: {subscription_data['id']}")


def handle_payment_succeeded(invoice_data):
    """Handle payment succeeded event"""
    try:
        subscription_id = invoice_data.get('subscription')
        if subscription_id:
            subscription = Subscription.objects.get(
                stripe_subscription_id=subscription_id
            )
            
            PaymentHistory.objects.create(
                subscription=subscription,
                stripe_payment_intent_id=invoice_data.get('payment_intent'),
                amount=invoice_data['amount_paid'] / 100,  # Convert from cents
                status='succeeded',
                payment_method=invoice_data.get('payment_method_types', [''])[0],
                metadata={
                    'invoice_id': invoice_data['id'],
                    'invoice_number': invoice_data.get('number')
                }
            )
            
            logger.info(f"Payment succeeded for subscription: {subscription.id}")
    except Subscription.DoesNotExist:
        logger.warning(f"Subscription not found for invoice: {invoice_data['id']}")


def handle_payment_failed(invoice_data):
    """Handle payment failed event"""
    try:
        subscription_id = invoice_data.get('subscription')
        if subscription_id:
            subscription = Subscription.objects.get(
                stripe_subscription_id=subscription_id
            )
            
            PaymentHistory.objects.create(
                subscription=subscription,
                stripe_payment_intent_id=invoice_data.get('payment_intent'),
                amount=invoice_data['amount_due'] / 100,  # Convert from cents
                status='failed',
                payment_method=invoice_data.get('payment_method_types', [''])[0],
                metadata={
                    'invoice_id': invoice_data['id'],
                    'invoice_number': invoice_data.get('number'),
                    'failure_reason': invoice_data.get('last_finalization_error', {}).get('message')
                }
            )
            
            logger.info(f"Payment failed for subscription: {subscription.id}")
    except Subscription.DoesNotExist:
        logger.warning(f"Subscription not found for invoice: {invoice_data['id']}")
