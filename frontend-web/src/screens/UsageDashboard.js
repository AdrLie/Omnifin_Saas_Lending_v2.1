import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  LinearProgress,
  Alert,
  Button,
  Chip,
  Paper,
} from '@mui/material';
import {
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Chat as ChatIcon,
  Mic as MicIcon,
  Assessment,
  CreditCard,
} from '@mui/icons-material';
import subscriptionService from '../services/subscriptionService';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';

const UsageDashboard = () => {
  const navigate = useNavigate();
  const [usage, setUsage] = useState(null);
  const [limits, setLimits] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const subData = await subscriptionService.getMySubscription();
      setSubscription(subData);

      // Fetch usage data
      const usageData = await subscriptionService.getUsage();
      setUsage(usageData);

      // Check limits
      const limitsData = await subscriptionService.checkLimits();
      setLimits(limitsData);
    } catch (err) {
      // If no subscription found, don't show error
      if (err.response?.status === 404) {
        // Continue without error - will show subscription gate
      } else {
        setError(err.response?.data?.error || 'Failed to load usage data');
      }
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'error';
    if (percentage >= 80) return 'warning';
    return 'primary';
  };

  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  if (loading) return <LoadingScreen />;
  if (error) return <Alert severity="error">{error}</Alert>;
  
  if (!usage || !subscription) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <Assessment sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h4" gutterBottom> 
              No Active Subscription
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
              You need an active subscription to view your usage statistics and start using the AI features.
              Choose a plan that fits your needs and start tracking your token usage in real-time.
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<CreditCard />}
            onClick={() => navigate('/subscribe')}
            sx={{ px: 4, py: 1.5 }}
          >
            View Subscription Plans
          </Button>
        </Paper>
      </Container>
    );
  }

  // Provide default values if data is missing
  const llmUsage = usage.llm || { used: 0, limit: 0, percentage: 0 };
  const voiceUsage = usage.voice || { used: 0, limit: 0, percentage: 0 };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Usage Dashboard
      </Typography>

      {/* Current Plan Info */}
      {subscription && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6">Current Plan</Typography>
              <Typography variant="h4" color="primary">
                {subscription.plan_details.name}
              </Typography>
              <Chip
                label={subscription.status.toUpperCase()}
                color={subscription.status === 'active' ? 'success' : 'default'}
                size="small"
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
              <Typography variant="body2" color="text.secondary">
                Billing Period
              </Typography>
              <Typography variant="body1">
                {subscription.current_period_start && subscription.current_period_end
                  ? `${new Date(subscription.current_period_start).toLocaleDateString()} - ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  : 'Pending activation'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Warnings */}
      {limits && limits.has_warnings && (
        <Alert
          severity={limits.over_limit ? 'error' : 'warning'}
          icon={<WarningIcon />}
          sx={{ mb: 3 }}
          action={
            limits.suggested_upgrade && (
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate('/subscribe')}
              >
                Upgrade Now
              </Button>
            )
          }
        >
          {limits.warnings.map((warning, index) => (
            <Typography key={index} variant="body2">
              {warning.message}
            </Typography>
          ))}
          {limits.suggested_upgrade && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Suggested upgrade:</strong> {limits.suggested_upgrade.plan_name} -
              ${limits.suggested_upgrade.price}/{subscription?.plan_details.billing_period}
            </Typography>
          )}
        </Alert>
      )}

      {/* Usage Cards */}
      <Grid container spacing={3}>
        {/* LLM Tokens Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ChatIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">LLM Token Usage</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Used
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {llmUsage.percentage}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(llmUsage.percentage, 100)}
                  color={getProgressColor(llmUsage.percentage)}
                  sx={{ height: 10, borderRadius: 1 }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h4">{formatNumber(llmUsage.used)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Used
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4">{formatNumber(llmUsage.limit)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Limit
                  </Typography>
                </Grid>
              </Grid>

              {llmUsage.limit_reached && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Token limit reached! Upgrade to continue using AI chat.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Voice Tokens Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MicIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Voice Token Usage</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Used
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {voiceUsage.percentage}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(voiceUsage.percentage, 100)}
                  color={getProgressColor(voiceUsage.percentage)}
                  sx={{ height: 10, borderRadius: 1 }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h4">{formatNumber(voiceUsage.used)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Used
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4">{formatNumber(voiceUsage.limit)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Limit
                  </Typography>
                </Grid>
              </Grid>

              {voiceUsage.limit_reached && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Token limit reached! Upgrade to continue using voice chat.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item>
                  <Button
                    variant="outlined"
                    startIcon={<TrendingUpIcon />}
                    onClick={() => navigate('/subscribe')}
                  >
                    Upgrade Plan
                  </Button>
                </Grid>
                <Grid item>
                  <Button variant="outlined" onClick={fetchUsageData}>
                    Refresh Usage
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UsageDashboard;
