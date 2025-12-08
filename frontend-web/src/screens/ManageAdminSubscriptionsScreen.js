import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Box,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, CheckCircle, Cancel } from '@mui/icons-material';
import subscriptionService from '../services/subscriptionService';

const ManageAdminSubscriptionsScreen = () => {
  const [adminUsers, setAdminUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, plansResponse] = await Promise.all([
        subscriptionService.getAdminUsers(),
        subscriptionService.getPlans()
      ]);
      setAdminUsers(usersResponse);
      setPlans(plansResponse);
    } catch (err) {
      setError('Failed to load data: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user) => {
    setSelectedUser(user);
    setSelectedPlan('');
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setSelectedPlan('');
  };

  const handleAssignSubscription = async () => {
    if (!selectedPlan) {
      setError('Please select a plan');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await subscriptionService.assignSubscription(selectedUser.id, selectedPlan);
      setSuccess(`Subscription assigned to ${selectedUser.email} successfully!`);
      handleCloseDialog();
      fetchData(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusChip = (subscription) => {
    if (!subscription) {
      return <Chip label="No Subscription" color="default" size="small" />;
    }

    const statusColors = {
      active: 'success',
      incomplete: 'warning',
      trialing: 'info',
      canceled: 'error',
      past_due: 'error'
    };

    return (
      <Chip
        label={subscription.status.toUpperCase()}
        color={statusColors[subscription.status] || 'default'}
        size="small"
        icon={subscription.status === 'active' ? <CheckCircle /> : <Cancel />}
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Manage Admin Subscriptions
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          Assign subscriptions to admin users for their groups
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Group ID</strong></TableCell>
                <TableCell><strong>Current Plan</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {adminUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">No admin users found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                adminUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {user.group_id ? user.group_id.substring(0, 8) + '...' : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {user.subscription ? (
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {user.subscription.plan.name}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          None
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(user.subscription)}
                    </TableCell>
                    <TableCell align="right">
                      {!user.subscription || user.subscription.status === 'canceled' ? (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenDialog(user)}
                        >
                          Assign Plan
                        </Button>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Active
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Assign Subscription Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign Subscription to {selectedUser?.first_name} {selectedUser?.last_name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select a subscription plan for {selectedUser?.email}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Subscription Plan</InputLabel>
            <Select
              value={selectedPlan}
              label="Subscription Plan"
              onChange={(e) => setSelectedPlan(e.target.value)}
            >
              {plans.map((plan) => (
                <MenuItem key={plan.id} value={plan.id}>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {plan.name} - ${plan.price}/{plan.billing_period}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {plan.llm_tokens_limit.toLocaleString()} LLM tokens, 
                      {plan.voice_tokens_limit.toLocaleString()} voice tokens, 
                      up to {plan.max_users} users
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignSubscription} 
            variant="contained" 
            disabled={submitting || !selectedPlan}
          >
            {submitting ? <CircularProgress size={24} /> : 'Assign Subscription'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageAdminSubscriptionsScreen;
