import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
} from '@mui/material';
import {
  Assessment,
  CreditCard,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionRequired() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <Box sx={{ mb: 3 }}>
          <Assessment sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            No Active Subscription
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
          >
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
