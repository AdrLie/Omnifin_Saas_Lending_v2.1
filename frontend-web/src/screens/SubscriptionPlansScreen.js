import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import subscriptionService from '../services/subscriptionService';

const SubscriptionPlansScreen = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    plan_type: 'basic',
    price: '',
    billing_period: 'monthly',
    stripe_price_id: '',
    llm_tokens_limit: '100000',
    voice_tokens_limit: '50000',
    max_users: '10',
    is_active: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const plansData = await subscriptionService.getPlans();
      setPlans(plansData);
      setLoading(false);
    } catch (err) {
      setError('Failed to load subscription plans');
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        plan_type: plan.plan_type,
        price: plan.price,
        billing_period: plan.billing_period,
        stripe_price_id: plan.stripe_price_id || '',
        llm_tokens_limit: plan.llm_tokens_limit.toString(),
        voice_tokens_limit: plan.voice_tokens_limit.toString(),
        max_users: plan.max_users.toString(),
        is_active: plan.is_active,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        plan_type: 'basic',
        price: '',
        billing_period: 'monthly',
        stripe_price_id: '',
        llm_tokens_limit: '100000',
        voice_tokens_limit: '50000',
        max_users: '10',
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPlan(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        llm_tokens_limit: parseInt(formData.llm_tokens_limit),
        voice_tokens_limit: parseInt(formData.voice_tokens_limit),
        max_users: parseInt(formData.max_users),
      };

      if (editingPlan) {
        await subscriptionService.updatePlan(editingPlan.id, payload);
        setSuccess('Plan updated successfully');
      } else {
        await subscriptionService.createPlan(payload);
        setSuccess('Plan created successfully');
      }

      fetchPlans();
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save plan');
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;

    try {
      await subscriptionService.deletePlan(planId);
      setSuccess('Plan deleted successfully');
      fetchPlans();
    } catch (err) {
      setError('Failed to delete plan');
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Subscription Plans
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Plan
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {plans.map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Typography variant="h5" component="h2">
                    {plan.name}
                  </Typography>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenDialog(plan)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(plan.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                
                <Typography variant="h4" color="primary" sx={{ my: 2 }}>
                  ${plan.price}
                  <Typography component="span" variant="body1" color="text.secondary">
                    /{plan.billing_period}
                  </Typography>
                </Typography>

                <Chip 
                  label={plan.plan_type.toUpperCase()} 
                  size="small" 
                  sx={{ mb: 2 }}
                />

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>LLM Tokens:</strong> {plan.llm_tokens_limit.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Voice Tokens:</strong> {plan.voice_tokens_limit.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Max Users:</strong> {plan.max_users}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    <strong>Status:</strong> {plan.is_active ? '✅ Active' : '❌ Inactive'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Plan Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              margin="normal"
            />
            
            <TextField
              fullWidth
              select
              label="Plan Type"
              name="plan_type"
              value={formData.plan_type}
              onChange={handleChange}
              required
              margin="normal"
              SelectProps={{ native: true }}
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  margin="normal"
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  select
                  label="Billing Period"
                  name="billing_period"
                  value={formData.billing_period}
                  onChange={handleChange}
                  required
                  margin="normal"
                  SelectProps={{ native: true }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </TextField>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Stripe Price ID"
              name="stripe_price_id"
              value={formData.stripe_price_id}
              onChange={handleChange}
              margin="normal"
              helperText="Get this from your Stripe Dashboard"
            />

            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
              Usage Limits
            </Typography>

            <TextField
              fullWidth
              label="LLM Tokens Limit"
              name="llm_tokens_limit"
              type="number"
              value={formData.llm_tokens_limit}
              onChange={handleChange}
              required
              margin="normal"
              helperText="Monthly limit for AI chat tokens"
            />

            <TextField
              fullWidth
              label="Voice Tokens Limit"
              name="voice_tokens_limit"
              type="number"
              value={formData.voice_tokens_limit}
              onChange={handleChange}
              required
              margin="normal"
              helperText="Monthly limit for voice chat tokens"
            />

            <TextField
              fullWidth
              label="Maximum Users"
              name="max_users"
              type="number"
              value={formData.max_users}
              onChange={handleChange}
              required
              margin="normal"
              helperText="Maximum users allowed in the group"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingPlan ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default SubscriptionPlansScreen;
