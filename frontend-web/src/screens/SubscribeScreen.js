import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import subscriptionService from '../services/subscriptionService';
import { useSubscription } from '../hooks/useSubscription';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_51RMP2oGgetd0muXY5uMb4YkygxholvUPhU7DS43stTYYMtYPXIEe9vZFnPOfGdR0nL6FWH2zjfpiVK4Q8hwocEEH005RvHQPja');

const CheckoutForm = ({ selectedPlan, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      const cardElement = elements.getElement(CardElement);
      
      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
        setError(pmError.message);
        setLoading(false);
        return;
      }

      // Create subscription
      const response = await subscriptionService.createSubscription(
        selectedPlan.id,
        paymentMethod.id
      );

      // Handle 3D Secure if needed
      if (response.client_secret) {
        const { error: confirmError } = await stripe.confirmCardPayment(
          response.client_secret
        );

        if (confirmError) {
          setError(confirmError.message);
          setLoading(false);
          return;
        }
      }

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create subscription');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Subscribe to {selectedPlan.name}
        </Typography>
        <Typography variant="h4" color="primary" gutterBottom>
          ${selectedPlan.price}/{selectedPlan.billing_period}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 3, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </Box>

      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!stripe || loading}
        >
          {loading ? <CircularProgress size={24} /> : `Pay $${selectedPlan.price}`}
        </Button>
      </DialogActions>
    </form>
  );
};

const SubscribeScreen = () => {
  const { checkSubscription } = useSubscription();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [openCheckout, setOpenCheckout] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch plans
      const plansData = await subscriptionService.getPlans();
      setPlans(plansData);

      // Fetch current subscription
      try {
        const subscriptionData = await subscriptionService.getMySubscription();
        setCurrentSubscription(subscriptionData);
      } catch {
        // No subscription yet
        setCurrentSubscription(null);
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to load subscription data');
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setOpenCheckout(true);
  };

  const handleSubscriptionSuccess = async () => {
    setOpenCheckout(false);
    setSuccess('Subscription created successfully!');
    // Refresh subscription context immediately
    await checkSubscription();
    // Also refresh local data
    fetchData();
  };

  if (loading) return <CircularProgress />;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Choose Your Plan
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {currentSubscription && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are currently subscribed to <strong>{currentSubscription.plan_details.name}</strong>
        </Alert>
      )}

      <Grid container spacing={3}>
        {plans.map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border:
                  currentSubscription?.plan_details?.id === plan.id
                    ? '2px solid #1976d2'
                    : undefined,
              }}
            >
              {currentSubscription?.plan_details?.id === plan.id && (
                <Chip
                  label="Current Plan"
                  color="primary"
                  size="small"
                  sx={{ position: 'absolute', top: 16, right: 16 }}
                />
              )}
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  {plan.name}
                </Typography>
                
                <Typography variant="h3" color="primary" sx={{ my: 2 }}>
                  ${plan.price}
                  <Typography component="span" variant="body1" color="text.secondary">
                    /{plan.billing_period}
                  </Typography>
                </Typography>

                <List dense>
                  <ListItem>
                    <CheckIcon color="primary" sx={{ mr: 1 }} />
                    <ListItemText primary={`${plan.llm_tokens_limit.toLocaleString()} LLM tokens/month`} />
                  </ListItem>
                  <ListItem>
                    <CheckIcon color="primary" sx={{ mr: 1 }} />
                    <ListItemText primary={`${plan.voice_tokens_limit.toLocaleString()} voice tokens/month`} />
                  </ListItem>
                  <ListItem>
                    <CheckIcon color="primary" sx={{ mr: 1 }} />
                    <ListItemText primary={`Up to ${plan.max_users} users`} />
                  </ListItem>
                </List>

                <Button
                  fullWidth
                  variant={currentSubscription?.plan_details?.id === plan.id ? 'outlined' : 'contained'}
                  color="primary"
                  sx={{ mt: 2 }}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={currentSubscription?.plan_details?.id === plan.id}
                >
                  {currentSubscription?.plan_details?.id === plan.id
                    ? 'Current Plan'
                    : currentSubscription
                    ? 'Upgrade'
                    : 'Subscribe'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Checkout Dialog */}
      <Dialog open={openCheckout} onClose={() => setOpenCheckout(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Your Subscription</DialogTitle>
        <DialogContent>
          {selectedPlan && (
            <Elements stripe={stripePromise}>
              <CheckoutForm
                selectedPlan={selectedPlan}
                onSuccess={handleSubscriptionSuccess}
                onCancel={() => setOpenCheckout(false)}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default SubscribeScreen;
