import React, { useState, useEffect, useContext } from 'react';
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
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';
import { SubscriptionContext } from '../contexts/SubscriptionContext';
import { API_BASE_URL } from '../utils/constants';

const UserManagementPage = () => {
  const { loadAllUsers, createUser, updateUser, deleteUser, sendPasswordReset } = useUser();
  const { hasActiveSubscription } = useContext(SubscriptionContext);
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
    role: 'tpb_customer',
    company: '',
    is_active: true,
    password: '',
    password_confirm: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [invitationCodes, setInvitationCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [invitationDialogOpen, setInvitationDialogOpen] = useState(false);
  const [invitationFormData, setInvitationFormData] = useState({
    email: '',
    days_valid: 7,
  });
  const [copiedCode, setCopiedCode] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loadingOrg, setLoadingOrg] = useState(true);

  const roles = [
    { value: 'tpb_customer', label: 'TPB Customer (Applicant)' },
    { value: 'tpb_staff', label: 'TPB Staff' },
    { value: 'tpb_manager', label: 'TPB Manager' },
    { value: 'system_admin', label: 'System Administrator' }
  ];

  useEffect(() => {
    loadUsers();
    loadOrganization();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter, statusFilter]);

  const loadOrganization = async () => {
    try {
      setLoadingOrg(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/auth/organization/current/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setOrganization(data);
      }
    } catch (err) {
      console.error('Failed to load organization:', err);
    } finally {
      setLoadingOrg(false);
    }
  };

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
        is_active: true
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
      is_active: true
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
      setPage(0);
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

  // Invitation Code Functions
  const loadInvitationCodes = async () => {
    try {
      setLoadingCodes(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/auth/invitation-codes/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setInvitationCodes(data);
      } else if (data.results) {
        setInvitationCodes(data.results);
      }
    } catch (err) {
      console.error('Failed to load invitation codes:', err);
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleCreateInvitationCode = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/auth/invitation-codes/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(invitationFormData),
      });

      if (!response.ok) {
        throw new Error('Failed to create invitation code');
      }

      const newCode = await response.json();
      setSuccess('Invitation code created successfully!');
      setInvitationFormData({ email: '', days_valid: 7 });
      setInvitationDialogOpen(false);
      loadInvitationCodes();
    } catch (err) {
      setError(err.message || 'Failed to create invitation code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  useEffect(() => {
    loadInvitationCodes();
  }, []);

  const getRoleColor = (role) => {
    const colors = {
      'system_admin': 'error',
      'tpb_manager': 'warning',
      'tpb_staff': 'info',
      'tpb_customer': 'success'
    };
    return colors[role] || 'default';
  };

  const getRoleLabel = (role) => {
    const labels = {
      'system_admin': 'System Admin',
      'tpb_manager': 'TPB Manager',
      'tpb_staff': 'TPB Staff',
      'tpb_customer': 'TPB Customer (Applicant)'
    };
    return labels[role] || role;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (name === 'password') {
      setCurrentUser(prev => ({
        ...prev,
        password: value,
        password_confirm: value,
      }));
    } else {
      setCurrentUser(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSwitchChange = (name) => (event) => {
    setCurrentUser(prev => ({
      ...prev,
      [name]: event.target.checked
    }));
  };

  const [activeTab, setActiveTab] = React.useState(0);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={3}>
        {/* Header and Tabs */}
        <Box sx={{ p: 4, borderBottom: 1, borderColor: 'divider' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                Manage Team
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Manage team members and generate invitation codes
              </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, backgroundColor: '#f5f5f5', padding: '12px 16px', borderRadius: '8px', width: 'fit-content' }}>
                <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                  Organization:
                </Typography>
                {loadingOrg ? (
                  <CircularProgress size={20} />
                ) : organization ? (
                  <>
                    <Chip
                      label={organization.name}
                      color="primary"
                      variant="outlined"
                    />
                    {organization.description && (
                      <Tooltip title={organization.description}>
                        <Typography variant="caption" sx={{ color: '#999', ml: 1 }}>
                          {organization.description.substring(0, 50)}
                          {organization.description.length > 50 ? '...' : ''}
                        </Typography>
                      </Tooltip>
                    )}
                  </>
                ) : (
                  <Typography variant="caption" sx={{ color: '#999' }}>
                    No organization found
                  </Typography>
                )}
              </Box>
            </Box>
            {activeTab === 0 && (
              <Button
                variant="contained"
                onClick={() => handleDialogOpen('create')}
                startIcon={<AddIcon />}
              >
                Add User
              </Button>
            )}
            {activeTab === 1 && hasActiveSubscription && (
              <Button
                variant="contained"
                onClick={() => setInvitationDialogOpen(true)}
                startIcon={<AddIcon />}
              >
                Generate Code
              </Button>
            )}
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Team Members" />
              <Tab label="Invitation Codes" />
            </Tabs>
          </Box>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        {/* Tab Content */}
        <Box sx={{ p: 3 }}>
          {/* Team Members Tab */}
          {activeTab === 0 && (
            <>
              {/* Search and Filters */}
              <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
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
                    placeholder="Search by name, email"
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

              {/* Users Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '20%' }}>User</TableCell>
                  <TableCell sx={{ width: '25%' }}>Email</TableCell>
                  <TableCell sx={{ width: '20%' }}>Role</TableCell>
                  <TableCell sx={{ width: '15%' }}>Status</TableCell>
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
                          <TableCell>
                            <Chip
                              label={safeUser.is_active ? 'Active' : 'Inactive'}
                              color={safeUser.is_active ? 'success' : 'default'}
                              size="small"
                            />
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
                              {/* <IconButton
                                size="small"
                                onClick={() => handleSendPasswordReset(safeUser.email)}
                                color="info"
                              >
                                <EmailIcon />
                              </IconButton> */}
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
                    <TableCell colSpan={5} align="center">No users found</TableCell>
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
            </>
          )}

          {/* Invitation Codes Tab */}
          {activeTab === 1 && (
            <>
              {/* Invitation Codes Table */}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '20%' }}>Code</TableCell>
                      <TableCell sx={{ width: '25%' }}>Target Email</TableCell>
                      <TableCell sx={{ width: '15%' }}>Status</TableCell>
                      <TableCell sx={{ width: '15%' }}>Expires At</TableCell>
                      <TableCell sx={{ width: '15%' }}>Used By</TableCell>
                      <TableCell align="center" sx={{ width: '10%' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingCodes ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : Array.isArray(invitationCodes) && invitationCodes.length > 0 ? (
                      invitationCodes.map((code, index) => {
                        const now = new Date();
                        const expiresAt = new Date(code.expires_at);
                        const isExpired = now > expiresAt;
                        const getCodeStatus = () => {
                          if (code.is_used) return { label: 'Used', color: 'default' };
                          if (isExpired) return { label: 'Expired', color: 'error' };
                          return { label: 'Valid', color: 'success' };
                        };
                        const status = getCodeStatus();

                        return (
                          <TableRow key={code.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography 
                                  sx={{ 
                                    fontFamily: 'monospace', 
                                    fontWeight: 600,
                                    letterSpacing: 1 
                                  }}
                                >
                                  {code.code}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{code.email || '—'}</TableCell>
                            <TableCell>
                              <Chip
                                label={status.label}
                                color={status.color}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{new Date(code.expires_at).toLocaleDateString()}</TableCell>
                            <TableCell>{code.used_by_name || '—'}</TableCell>
                            <TableCell align="center">
                              <Tooltip title={copiedCode === index ? 'Copied!' : 'Copy code'}>
                                <IconButton
                                  size="small"
                                  onClick={() => copyToClipboard(code.code, index)}
                                  color={copiedCode === index ? 'success' : 'default'}
                                >
                                  {copiedCode === index ? <CheckIcon /> : <CopyIcon />}
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">No invitation codes generated yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={loadInvitationCodes}
                  disabled={loadingCodes}
                >
                  Refresh
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Paper>

      {/* Invitation Code Dialog */}
      <Dialog open={invitationDialogOpen} onClose={() => setInvitationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Generate Invitation Code
          <IconButton
            onClick={() => setInvitationDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              fullWidth
              label="Target Email (Optional)"
              type="email"
              placeholder="Leave blank to allow any email"
              value={invitationFormData.email}
              onChange={(e) => setInvitationFormData({
                ...invitationFormData,
                email: e.target.value
              })}
              helperText="If set, only users with this email can use the code"
            />
            <TextField
              fullWidth
              type="number"
              label="Valid For (Days)"
              value={invitationFormData.days_valid}
              onChange={(e) => setInvitationFormData({
                ...invitationFormData,
                days_valid: parseInt(e.target.value) || 7
              })}
              inputProps={{ min: 1, max: 365 }}
              helperText="Code will expire after this many days"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvitationDialogOpen(false)} disabled={loading}>Cancel</Button>
          <Button 
            onClick={handleCreateInvitationCode} 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading ? 'Generating...' : 'Generate Code'}
          </Button>
        </DialogActions>
      </Dialog>

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

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={currentUser.password}
              onChange={handleInputChange}
              required
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

            {/* <TextField
               fullWidth
               label="Company/Organization"
               name="company"
               value={currentUser.company}
               onChange={handleInputChange}
             /> */}

            <FormControlLabel
              control={
                <Switch
                  checked={currentUser.is_active}
                  onChange={handleSwitchChange('is_active')}
                />
              }
              label="Active"
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