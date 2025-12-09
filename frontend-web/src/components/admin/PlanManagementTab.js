import React, { useState, useEffect } from 'react';
import {
  Paper,
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Box,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import adminService from '../../services/adminService';

const PlanManagementTab = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    plan_type: 'basic',
    price: '',
    billing_period: 'monthly',
    llm_tokens_limit: '',
    voice_tokens_limit: '',
    max_users: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const plans = await adminService.getPlans();
      setPlans(plans);
    } catch (err) {
      setError('Failed to load plans');
    } finally {
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
        llm_tokens_limit: plan.llm_tokens_limit,
        voice_tokens_limit: plan.voice_tokens_limit,
        max_users: plan.max_users,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        plan_type: 'basic',
        price: '',
        billing_period: 'monthly',
        llm_tokens_limit: '',
        voice_tokens_limit: '',
        max_users: '',
      });
    }
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPlan(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSavePlan = async () => {
    setError('');
    setSuccess('');

    if (!formData.name || !formData.price) {
      setError('Name and price are required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        llm_tokens_limit: parseInt(formData.llm_tokens_limit),
        voice_tokens_limit: parseInt(formData.voice_tokens_limit),
        max_users: parseInt(formData.max_users),
      };

      if (editingPlan) {
        // Update plan
        await adminService.updatePlan(editingPlan.id, payload);
        setSuccess('Plan updated successfully');
      } else {
        // Create plan
        await adminService.createPlan(payload);
        setSuccess('Plan created successfully');
      }

      handleCloseDialog();
      fetchPlans();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to save plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await adminService.deletePlan(planId);
        setSuccess('Plan deleted successfully');
        fetchPlans();
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to delete plan');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Subscription Plans ({plans.length})</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Plan
        </Button>
      </Box>

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
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell align="right"><strong>Price</strong></TableCell>
              <TableCell align="right"><strong>LLM Tokens</strong></TableCell>
              <TableCell align="right"><strong>Voice Tokens</strong></TableCell>
              <TableCell align="right"><strong>Max Users</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">No plans found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell fontWeight="bold">{plan.name}</TableCell>
                  <TableCell align="right">${parseFloat(plan.price).toFixed(2)}</TableCell>
                  <TableCell align="right">{parseInt(plan.llm_tokens_limit).toLocaleString()}</TableCell>
                  <TableCell align="right">{parseInt(plan.voice_tokens_limit).toLocaleString()}</TableCell>
                  <TableCell align="right">{plan.max_users}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(plan)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Plan Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPlan ? 'Edit Plan' : 'Add New Plan'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            fullWidth
            label="Plan Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            margin="normal"
            placeholder="e.g., Starter, Professional"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Plan Type</InputLabel>
            <Select
              name="plan_type"
              value={formData.plan_type}
              onChange={handleInputChange}
              label="Plan Type"
            >
              <MenuItem value="free">Free</MenuItem>
              <MenuItem value="basic">Basic</MenuItem>
              <MenuItem value="premium">Premium</MenuItem>
              <MenuItem value="enterprise">Enterprise</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Price (USD)"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleInputChange}
            margin="normal"
            inputProps={{ step: '0.01', min: '0' }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Billing Period</InputLabel>
            <Select
              name="billing_period"
              value={formData.billing_period}
              onChange={handleInputChange}
              label="Billing Period"
            >
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="LLM Tokens Limit"
            name="llm_tokens_limit"
            type="number"
            value={formData.llm_tokens_limit}
            onChange={handleInputChange}
            margin="normal"
            inputProps={{ min: '0' }}
          />

          <TextField
            fullWidth
            label="Voice Tokens Limit"
            name="voice_tokens_limit"
            type="number"
            value={formData.voice_tokens_limit}
            onChange={handleInputChange}
            margin="normal"
            inputProps={{ min: '0' }}
          />

          <TextField
            fullWidth
            label="Max Users"
            name="max_users"
            type="number"
            value={formData.max_users}
            onChange={handleInputChange}
            margin="normal"
            inputProps={{ min: '1' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSavePlan}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : (editingPlan ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PlanManagementTab;
