# Subscription Module - Omnifin Platform

## Overview

This module provides subscription management functionality using Stripe as the payment gateway.

## Setup

### 1. Install Dependencies

```bash
pip install stripe==7.8.0
```

### 2. Environment Variables

Add these to your `.env` file:

```env
STRIPE_PUBLIC_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. Run Migrations

```bash
python manage.py makemigrations subscriptions
python manage.py migrate
```

### 4. Create Subscription Plans

Create plans in Django admin or via API. Make sure to set the `stripe_price_id` from your Stripe dashboard.

## API Endpoints

### List Plans

```
GET /api/subscriptions/plans/
```

### Create Subscription

```
POST /api/subscriptions/subscriptions/create_subscription/
Body: {
    "plan_id": "uuid-of-plan",
    "payment_method_id": "pm_xxxxx"  // Optional, from Stripe.js
}
```

### Cancel Subscription

```
POST /api/subscriptions/subscriptions/{id}/cancel/
Body: {
    "at_period_end": true  // Optional, defaults to true
}
```

### Get User Subscriptions

```
GET /api/subscriptions/subscriptions/
```

### Get Payment History

```
GET /api/subscriptions/payments/
```

## Stripe Webhook Setup

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://yourdomain.com/api/subscriptions/webhook/stripe/`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret to your `.env` file

## Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:8000/api/subscriptions/webhook/stripe/

# Test webhook
stripe trigger customer.subscription.created
```

## Models

- **SubscriptionPlan**: Available subscription plans
- **Subscription**: User subscriptions
- **PaymentHistory**: Payment transaction records

## Usage Example

```python
from apps.subscriptions.services import SubscriptionService

# Create subscription
subscription, stripe_sub = SubscriptionService.create_subscription(
    user=request.user,
    plan_id=plan_id,
    payment_method_id=payment_method_id
)

# Cancel subscription
SubscriptionService.cancel_subscription(subscription_id, at_period_end=True)

# Sync with Stripe
SubscriptionService.sync_subscription(subscription_id)
```

## Notes

- All prices are stored in decimal format (e.g., 9.99)
- Stripe amounts are in cents (multiply by 100 when sending to Stripe)
- Webhooks automatically update subscription status
- Payment history is created automatically via webhooks
