# Subscription Module Setup - Quick Start

## ✅ What's Been Set Up

### 1. Django App Structure

- Created `apps/subscriptions/` module
- Models: SubscriptionPlan, Subscription, PaymentHistory
- Serializers for API communication
- ViewSets for REST API endpoints
- Stripe service integration

### 2. Database

- Migrations created and applied
- Tables ready to use

### 3. API Endpoints

All available at `/api/subscriptions/`:

- `GET /plans/` - List subscription plans
- `POST /subscriptions/create_subscription/` - Create new subscription
- `GET /subscriptions/` - List user subscriptions
- `POST /subscriptions/{id}/cancel/` - Cancel subscription
- `POST /subscriptions/{id}/sync/` - Sync with Stripe
- `GET /payments/` - Payment history
- `POST /webhook/stripe/` - Stripe webhook endpoint

### 4. Dependencies

- ✅ Stripe Python library installed
- ✅ Added to requirements.txt

## 🔧 Next Steps

### 1. Add Stripe Keys to .env

```env
STRIPE_PUBLIC_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### 2. Create Subscription Plans

**Option A: Django Admin**

1. Start server: `python manage.py runserver`
2. Go to http://localhost:8000/admin
3. Add Subscription Plans with Stripe Price IDs

**Option B: Django Shell**

```python
python manage.py shell

from apps.subscriptions.models import SubscriptionPlan

SubscriptionPlan.objects.create(
    name="Basic Plan",
    plan_type="basic",
    price=9.99,
    billing_period="monthly",
    stripe_price_id="price_xxxxx",  # Get from Stripe Dashboard
    features={"loans": 5, "support": "email"},
    is_active=True
)
```

### 3. Test the API

```bash
# List plans
curl http://localhost:8000/api/subscriptions/plans/

# Create subscription (requires auth token)
curl -X POST http://localhost:8000/api/subscriptions/subscriptions/create_subscription/ \
  -H "Authorization: Token your_token" \
  -H "Content-Type: application/json" \
  -d '{"plan_id": "uuid-here", "payment_method_id": "pm_xxxxx"}'
```

### 4. Set Up Webhook (Production)

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://yourdomain.com/api/subscriptions/webhook/stripe/`
3. Select events:
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed

### 5. Test Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:8000/api/subscriptions/webhook/stripe/
```

## 📖 Usage Examples

### Frontend Integration

```javascript
// 1. Get subscription plans
const plans = await axios.get("/api/subscriptions/plans/");

// 2. Create Stripe payment method (use Stripe.js)
const { paymentMethod } = await stripe.createPaymentMethod({
  type: "card",
  card: cardElement,
});

// 3. Create subscription
const subscription = await axios.post(
  "/api/subscriptions/subscriptions/create_subscription/",
  {
    plan_id: selectedPlan.id,
    payment_method_id: paymentMethod.id,
  },
  { headers: { Authorization: `Token ${userToken}` } }
);

// 4. Handle 3D Secure if needed
if (subscription.data.client_secret) {
  const { error } = await stripe.confirmCardPayment(
    subscription.data.client_secret
  );
}
```

## 📁 Files Created

```
backend/apps/subscriptions/
├── __init__.py
├── apps.py
├── models.py              # 3 models
├── serializers.py         # 4 serializers
├── services.py            # Stripe & subscription services
├── views.py               # 3 viewsets
├── urls.py                # URL routing
├── admin.py               # Admin config
├── webhooks.py            # Stripe webhook handler
├── README.md              # Full documentation
└── migrations/
    ├── __init__.py
    └── 0001_initial.py
```

## 🔗 Updated Files

- `backend/omnifin/settings.py` - Added app & Stripe config
- `backend/omnifin/urls.py` - Added subscription routes
- `backend/requirements.txt` - Added stripe package

## 💡 Tips

- Use Stripe test keys for development
- Test card: 4242 4242 4242 4242
- Monitor webhook events in Stripe Dashboard
- Keep stripe_price_id synced with Stripe Dashboard
- Use subscriptions/sync endpoint if data gets out of sync

That's it! Your subscription module is ready to use. 🎉
