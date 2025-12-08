# Frontend Setup Instructions

## Install Required Dependencies

```bash
cd frontend-web
npm install @stripe/stripe-js @stripe/react-stripe-js react-router-dom
```

## Environment Variables

Create or update `.env` file in `frontend-web/` directory:

```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_publishable_key_here
```

## New Screens Created

1. **SubscriptionPlansScreen.js** - SuperAdmin can create/edit subscription plans
2. **SubscribeScreen.js** - Admins can purchase subscriptions for their group
3. **UsageDashboard.js** - View token usage, warnings, and upgrade suggestions

## Adding to Routes

Add these to your `App.js` or routing configuration:

```javascript
import SubscriptionPlansScreen from './screens/SubscriptionPlansScreen';
import SubscribeScreen from './screens/SubscribeScreen';
import UsageDashboard from './screens/UsageDashboard';

// In your routes:
<Route path="/subscription-plans" element={<SubscriptionPlansScreen />} /> {/* SuperAdmin only */}
<Route path="/subscribe" element={<SubscribeScreen />} /> {/* Admin users */}
<Route path="/usage" element={<UsageDashboard />} /> {/* All authenticated users */}
```

## Usage Flow

1. **SuperAdmin** creates subscription plans at `/subscription-plans`
2. **Admin** users purchase subscriptions at `/subscribe` for their group
3. **All users** in the group can view usage at `/usage`
4. Token usage is automatically tracked when using AI chat or voice features
5. Warnings appear when usage reaches 80%
6. Upgrade suggestions show when limits are reached

## Notes

- Make sure your backend is running and migrations are applied
- Configure Stripe keys in both backend and frontend
- Test with Stripe test keys first
- Use test card: 4242 4242 4242 4242
