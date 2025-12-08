# Subscription & Usage Tracking System - Complete Implementation

## Overview

Implemented a complete subscription and usage tracking system where:

- **SuperAdmin** creates subscription plans with usage limits
- **Admin** users purchase subscriptions for their group
- **All users** in the group consume tokens tracked against the subscription
- **Automatic warnings** at 80% usage with upgrade suggestions
- **Billing** through Stripe with automatic monthly charges

## Backend Implementation ✅

### Models Created

1. **SubscriptionPlan** (updated)

   - Added `llm_tokens_limit`, `voice_tokens_limit`, `max_users`
   - SuperAdmin configures these when creating plans

2. **Subscription** (updated)

   - Added `group_id` to link subscription to a group
   - All users with same `group_id` share the subscription limits

3. **TokenUsage** (new)

   - Records every token consumption event
   - Tracks LLM and voice tokens separately
   - Links to user and subscription

4. **UsageSummary** (new)
   - Monthly aggregated usage per subscription
   - Calculates percentages and warning flags
   - Auto-updates as tokens are consumed

### Services Created

1. **StripeService** (updated)

   - Handles all Stripe API calls
   - Creates customers, subscriptions, manages cancellations

2. **SubscriptionService** (updated)

   - Business logic for subscriptions
   - Links subscription to group_id
   - Prevents duplicate subscriptions per group

3. **UsageTrackingService** (new)
   - `record_usage()` - Logs token consumption
   - `get_usage_summary()` - Returns current usage stats
   - `check_usage_limits()` - Returns warnings and upgrade suggestions
   - `suggest_upgrade()` - Recommends next tier plan

### API Endpoints

```
GET  /api/subscriptions/plans/                    - List plans (everyone)
POST /api/subscriptions/plans/                    - Create plan (SuperAdmin)
PUT  /api/subscriptions/plans/{id}/               - Update plan (SuperAdmin)

GET  /api/subscriptions/subscriptions/my_subscription/  - Get active subscription
POST /api/subscriptions/subscriptions/create_subscription/ - Buy subscription
GET  /api/subscriptions/subscriptions/usage/      - Get usage data
GET  /api/subscriptions/subscriptions/check_limits/ - Check warnings
POST /api/subscriptions/subscriptions/{id}/cancel/ - Cancel subscription

POST /api/subscriptions/webhook/stripe/           - Stripe webhooks
```

### Token Tracking Integration

Updated `AIChatService` and `VoiceService` to automatically track tokens:

```python
# In AI service after each API call
tokens_used = response.usage.total_tokens
self._track_token_usage(conversation.user, tokens_used, 'llm')

# In Voice service
self._track_voice_usage(user, estimated_tokens)
```

## Frontend Implementation ✅

### Screens Created

1. **SubscriptionPlansScreen.js**

   - Full CRUD for subscription plans
   - SuperAdmin only
   - Configure: price, limits, features
   - Real-time form validation

2. **SubscribeScreen.js**

   - Browse available plans
   - Stripe checkout integration
   - 3D Secure support
   - Shows current plan status

3. **UsageDashboard.js**
   - Visual progress bars for LLM and voice tokens
   - Color-coded warnings (green → yellow → red)
   - Real-time percentage display
   - Upgrade suggestions
   - Period information

### Features

- **Stripe Elements** integration for secure payments
- **Responsive** Material-UI design
- **Real-time** usage updates
- **Warning alerts** at 80% and 100%
- **Suggested upgrades** when approaching limits
- **Period tracking** showing billing cycle

## User Flow

### 1. SuperAdmin Creates Plans

```
1. Navigate to /subscription-plans
2. Click "Create Plan"
3. Fill form:
   - Name: "Basic Plan"
   - Price: $29.99
   - LLM Tokens: 100,000/month
   - Voice Tokens: 50,000/month
   - Max Users: 10
   - Stripe Price ID: price_xxxxx
4. Save plan
```

### 2. Admin Purchases Subscription

```
1. Navigate to /subscribe
2. Select plan
3. Enter credit card (Stripe Elements)
4. Confirm payment
5. Subscription created for their group_id
6. All users in group now share these limits
```

### 3. Users Consume Tokens

```
1. User chats with AI or uses voice
2. Backend automatically tracks tokens
3. Updates UsageSummary in real-time
4. Checks limits after each use
```

### 4. Usage Monitoring

```
1. Navigate to /usage
2. See current usage:
   - LLM: 75,234 / 100,000 (75%)
   - Voice: 42,891 / 50,000 (86%)
3. Warning appears at 80%: "Consider upgrading"
4. At 100%: Services limited until upgrade/renewal
```

### 5. Monthly Billing

```
1. Stripe charges card automatically each month
2. Usage resets at period_start
3. New UsageSummary created for new period
4. Webhooks update subscription status
```

## Database Schema

```sql
-- Subscription Plan
subscriptions_plan (
    id UUID PRIMARY KEY,
    name VARCHAR,
    price DECIMAL,
    llm_tokens_limit INTEGER,
    voice_tokens_limit INTEGER,
    max_users INTEGER,
    stripe_price_id VARCHAR
)

-- Subscription
subscriptions_subscription (
    id UUID PRIMARY KEY,
    user_id UUID FK,
    plan_id UUID FK,
    group_id UUID,  -- Links to user.group_id
    status VARCHAR,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    stripe_subscription_id VARCHAR
)

-- Token Usage (transaction log)
token_usage (
    id UUID PRIMARY KEY,
    subscription_id UUID FK,
    group_id UUID,
    usage_type VARCHAR,  -- 'llm' or 'voice'
    tokens_used INTEGER,
    user_id UUID,
    created_at TIMESTAMP
)

-- Usage Summary (monthly aggregates)
usage_summary (
    id UUID PRIMARY KEY,
    subscription_id UUID FK,
    group_id UUID,
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    llm_tokens_used INTEGER,
    llm_tokens_limit INTEGER,
    voice_tokens_used INTEGER,
    voice_tokens_limit INTEGER,
    llm_warning_sent BOOLEAN,
    voice_warning_sent BOOLEAN
)
```

## Business Logic

### Limit Checking

```python
if llm_usage_percentage >= 100:
    return "Limit reached - upgrade required"
elif llm_usage_percentage >= 80:
    return "Warning - approaching limit"
```

### Upgrade Suggestions

```python
# Find next higher-priced plan
next_plan = SubscriptionPlan.objects.filter(
    price__gt=current_plan.price
).order_by('price').first()
```

### Token Estimation

```python
# LLM: Direct from OpenAI response
tokens = response.usage.total_tokens

# Voice STT: Based on audio file size
tokens = len(audio_bytes) // 16000

# Voice TTS: Based on text length
tokens = len(text) * 2
```

## Configuration Required

### Backend (.env)

```env
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend (.env)

```env
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_...
REACT_APP_API_BASE_URL=http://localhost:8000
```

### Stripe Dashboard

1. Create Products and Prices
2. Get Price IDs (price_xxxxx)
3. Setup webhook endpoint
4. Copy webhook secret

## Testing Checklist

- [ ] SuperAdmin can create plans
- [ ] Admin can purchase subscription
- [ ] Tokens are tracked during AI chat
- [ ] Tokens are tracked during voice chat
- [ ] Usage dashboard shows correct percentages
- [ ] Warnings appear at 80%
- [ ] Upgrade suggestions work
- [ ] Monthly billing works (Stripe test clock)
- [ ] Webhooks update subscription status
- [ ] Multiple users in same group share limits

## Next Steps

1. **Email Notifications**: Send emails at 80%, 90%, 100%
2. **Overages**: Allow usage beyond limits with extra charges
3. **Analytics**: Track popular plans, conversion rates
4. **Admin Dashboard**: SuperAdmin view of all groups' usage
5. **Usage Reports**: Export usage data for accounting
6. **Payment History**: Show past invoices
7. **Team Management**: Add/remove users from groups

## Files Modified/Created

### Backend

- `apps/subscriptions/models.py` - Updated with limits
- `apps/subscriptions/usage_models.py` - NEW
- `apps/subscriptions/usage_services.py` - NEW
- `apps/subscriptions/services.py` - Updated
- `apps/subscriptions/views.py` - Added usage endpoints
- `apps/subscriptions/serializers.py` - Updated
- `apps/subscriptions/admin.py` - Updated
- `apps/ai_integration/services.py` - Added tracking

### Frontend

- `src/screens/SubscriptionPlansScreen.js` - NEW
- `src/screens/SubscribeScreen.js` - NEW
- `src/screens/UsageDashboard.js` - NEW

### Documentation

- `FRONTEND_SETUP.md` - Installation guide
- `SUBSCRIPTION_FLOW.md` - This file

All done! 🎉
