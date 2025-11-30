import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Shield as AdminIcon
} from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';

const UserManagementPage = () => {
  const { loadAllUsers, createUser, updateUser, deleteUser, sendPasswordReset } = useUser()
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'applicant',
    company: '',
    is_active: true,
    mfa_enabled: false
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const roles = [
    { value: 'applicant', label: 'Loan Applicant' },
    { value: 'tbp', label: 'Third Party Broker' },
    { value: 'admin', label: 'Administrator' },
    { value: 'super_admin', label: 'Super Administrator' }
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await loadAllUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(u => {
        const nameStr = (u?.name && String(u.name)) || `${u?.first_name || ''} ${u?.last_name || ''}`.trim();
        return (
          (nameStr || '').toLowerCase().includes(q) ||
          (u?.email || '').toLowerCase().includes(q) ||
          (u?.company || '').toLowerCase().includes(q)
        );
      });
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (statusFilter === 'active') return user.is_active;
        if (statusFilter === 'inactive') return !user.is_active;
        return true;
      });
    }

    setFilteredUsers(filtered);
  };

  const handleDialogOpen = (mode = 'create', user = null) => {
    setDialogMode(mode);
    if (mode === 'edit' && user) {
      setCurrentUser(user);
    } else {
      setCurrentUser({
        id: null,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'applicant',
        company: '',
        is_active: true,
        mfa_enabled: false
      });
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setCurrentUser({
      id: null,
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'applicant',
      company: '',
      is_active: true,
      mfa_enabled: false
    });
  };

  const handleSaveUser = async () => {
    try {
      setLoading(true);
      setError(null);

      if (dialogMode === 'create') {
        await createUser(currentUser);
        setSuccess('User created successfully!');
      } else {
        await updateUser(currentUser.id, currentUser);
        setSuccess('User updated successfully!');
      }

      handleDialogClose();
      loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    const found = filteredUsers.find(u => u && u.id === id) || { id };
    setUserToDelete(found);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setDeleteLoading(true);
      setError(null);
      await deleteUser(userToDelete.id);
      setSuccess('User deleted successfully!');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleToggleUserStatus = async (user) => {
    try {
      setLoading(true);
      await updateUser(user.id, { ...user, is_active: !user.is_active });
      setSuccess(`User ${!user.is_active ? 'activated' : 'deactivated'} successfully!`);
      loadUsers();
    } catch (err) {
      setError('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPasswordReset = async (email) => {
    try {
      setLoading(true);
      await sendPasswordReset(email);
      setSuccess('Password reset email sent successfully!');
    } catch (err) {
      setError('Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      'super_admin': 'error',
      'admin': 'warning',
      'tbp': 'info',
      'applicant': 'success'
    };
    return colors[role] || 'default';
  };

  const getRoleLabel = (role) => {
    const labels = {
      'super_admin': 'Super Admin',
      'admin': 'Administrator',
      'tbp': 'Third Party Broker',
      'applicant': 'Loan Applicant'
    };
    return labels[role] || role;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setCurrentUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (name) => (event) => {
    setCurrentUser(prev => ({
      ...prev,
      [name]: event.target.checked
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={3}>
        {/* Header and Filters */}
        <Box sx={{ p: 4, borderBottom: 1, borderColor: 'divider' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                User Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage system users, roles, and permissions
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => handleDialogOpen('create')}
              startIcon={<AddIcon />}
            >
              Add User
            </Button>
          </Box>

          {/* Search and Filters */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="role-filter-label">Role</InputLabel>
                <Select
                  labelId="role-filter-label"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Role"
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CloseIcon />}
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        {/* Users Table */}
        <Box sx={{ p: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '20%' }}>User</TableCell>
                  <TableCell sx={{ width: '25%' }}>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">MFA</TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      width: '150px',
                      position: 'sticky',
                      right: 0,
                      bgcolor: 'background.paper',
                      zIndex: 1
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(filteredUsers) && filteredUsers.length > 0 ? (
                  filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user) => {
                      const safeUser = user || {};
                      const displayName = (safeUser.name && safeUser.name.trim())
                        ? safeUser.name.trim()
                        : ((safeUser.first_name || safeUser.last_name)
                          ? `${(safeUser.first_name || '').trim()} ${(safeUser.last_name || '').trim()}`.trim()
                          : (safeUser.email || 'User'));
                      const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

                      return (
                        <TableRow key={safeUser.id || Math.random()}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {initial}
                              </Avatar>
                              <Typography variant="body2">{displayName}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{safeUser.email || '—'}</TableCell>
                          <TableCell>
                            <Chip
                              label={getRoleLabel(safeUser.role)}
                              color={getRoleColor(safeUser.role)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{safeUser.company || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={safeUser.is_active ? 'Active' : 'Inactive'}
                              color={safeUser.is_active ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            {safeUser.mfa_enabled ? (
                              <AdminIcon color="success" />
                            ) : (
                              <AdminIcon color="disabled" />
                            )}
                          </TableCell>
                          <TableCell align="center" sx={{ position: 'sticky', right: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleUserStatus(safeUser)}
                                color={safeUser.is_active ? 'warning' : 'success'}
                              >
                                {safeUser.is_active ? <LockIcon /> : <UnlockIcon />}
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleSendPasswordReset(safeUser.email)}
                                color="info"
                              >
                                <EmailIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDialogOpen('edit', safeUser)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteUser(safeUser.id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No users found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Delete Confirmation Modal */}
          <Dialog
            open={deleteDialogOpen}
            onClose={cancelDelete}
            aria-labelledby="delete-user-dialog-title"
            aria-describedby="delete-user-dialog-description"
          >
            <DialogTitle id="delete-user-dialog-title">Confirm user deletion</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', minWidth: 360 }}>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <DeleteIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">Are you sure you want to delete this user?</Typography>
                  <Typography variant="body2" color="text.secondary" id="delete-user-dialog-description">
                    {userToDelete ? `${userToDelete.name || `${userToDelete.first_name || ''} ${userToDelete.last_name || ''}`.trim() || userToDelete.email || ''}` : ''}
                    {userToDelete && userToDelete.email ? ` — ${userToDelete.email}` : ''}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={cancelDelete} disabled={deleteLoading}>Cancel</Button>
              <Button
                onClick={confirmDeleteUser}
                color="error"
                variant="contained"
                disabled={deleteLoading}
                startIcon={deleteLoading ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
              >
                {deleteLoading ? 'Deleting...' : 'Delete user'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </Box>
      </Paper>

      {/* User Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create New User' : 'Edit User'}
          <IconButton
            onClick={handleDialogClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={currentUser.first_name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="last_name"
                  value={currentUser.last_name}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={currentUser.email}
              onChange={handleInputChange}
              required
            />

            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={currentUser.phone}
              onChange={handleInputChange}
            />

            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={currentUser.role}
                onChange={handleInputChange}
                label="Role"
              >
                {roles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Company/Organization"
              name="company"
              value={currentUser.company}
              onChange={handleInputChange}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={currentUser.is_active}
                  onChange={handleSwitchChange('is_active')}
                />
              }
              label="Active"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={currentUser.mfa_enabled}
                  onChange={handleSwitchChange('mfa_enabled')}
                />
              }
              label="Two-Factor Authentication"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagementPage;