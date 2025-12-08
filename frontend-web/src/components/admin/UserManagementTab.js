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
  Chip,
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

const UserManagementTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'applicant',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const users = await adminService.getUsers();
      setUsers(users);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || err.message;
      setError(`Failed to load users: ${errorMsg}`);
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        role: 'applicant',
      });
    }
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaveUser = async () => {
    setError('');
    setSuccess('');

    if (!formData.email || !formData.first_name) {
      setError('Email and first name are required');
      return;
    }

    try {
      setSubmitting(true);

      if (editingUser) {
        // Update user
        await adminService.updateUser(editingUser.id, formData);
        setSuccess('User updated successfully');
      } else {
        // Create user
        await adminService.createUser(formData);
        setSuccess('User created successfully');
      }

      handleCloseDialog();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminService.deleteUser(userId);
        setSuccess('User deleted successfully');
        fetchUsers();
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to delete user');
      }
    }
  };

  const getRoleChip = (role) => {
    const colors = {
      applicant: 'default',
      admin: 'primary',
      super_admin: 'error',
      superadmin: 'error',
      tpb: 'info',
      system_admin: 'secondary',
    };

    const labels = {
      applicant: 'Applicant',
      admin: 'Admin',
      super_admin: 'SuperAdmin',
      superadmin: 'SuperAdmin',
      tpb: 'TPB',
      system_admin: 'System Admin',
    };

    return (
      <Chip
        label={labels[role] || role}
        color={colors[role]}
        size="small"
        variant="outlined"
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
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Users ({users.length})</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add User
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
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography color="text.secondary">No users found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleChip(user.role)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(user)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteUser(user.id)}
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

      {/* User Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            fullWidth
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            margin="normal"
            disabled={editingUser}
          />

          <TextField
            fullWidth
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            margin="normal"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              label="Role"
            >
              <MenuItem value="applicant">Applicant</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="superadmin">SuperAdmin</MenuItem>
              <MenuItem value="system_admin">System Admin</MenuItem>
              <MenuItem value="tpb">TPB</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : (editingUser ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default UserManagementTab;
