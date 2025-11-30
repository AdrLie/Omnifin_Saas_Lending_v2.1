import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  Notifications as NotificationsIcon,
  CreditCard as CreditCardIcon,
  Assignment as ApplicationIcon,
  CheckCircle as VerifiedIcon,
  Cancel as UnverifiedIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { changePassword } = useUser();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editPasswordMode, setEditPasswordMode] = useState(false);
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    avatar: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setUserData({
        first_name: user.first_name || (user.name ? user.name.split(' ')[0] : ''),
        last_name: user.last_name || (user.name ? user.name.split(' ').slice(1).join(' ') : ''),
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        role: user.role || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // send first_name and last_name explicitly
      const payload = {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone: userData.phone,
        company: userData.company,
        role: userData.role,
        avatar: userData.avatar,
      };

      const result = await updateProfile(payload);
      if (result && result.success) {
        setSuccess('Profile updated successfully!');
        setEditMode(false);
      } else {
        setError(result?.error || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await changePassword(passwordData);
      if (res && res.success !== false) {
        setSuccess('Password changed successfully!');
      } else {
        throw new Error(res?.error || 'Failed to change password');
      }
      setEditPasswordMode(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message || 'Failed to change password');
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

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Grid container spacing={3}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
              <Avatar
                sx={{ width: 100, height: 100, bgcolor: 'primary.main' }}
                src={userData.avatar}
              >
                {((userData.first_name || userData.last_name)
                  ? `${(userData.first_name || '').charAt(0) || ''}${(userData.last_name || '').charAt(0) || ''}`
                  : (user?.name || user?.email || 'U').charAt(0)
                ).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" gutterBottom>
                  {(userData.first_name || userData.last_name)
                    ? `${userData.first_name} ${userData.last_name}`.trim()
                    : (user?.name || user?.email || 'User')}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {userData.email || user?.email}
                </Typography>
                <Chip
                  label={getRoleLabel(userData.role)}
                  color={getRoleColor(userData.role)}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}
                </Typography>
              </Box>
              <IconButton onClick={() => setEditMode(true)}>
                <EditIcon />
              </IconButton>
            </Box>

            {/* Quick Stats */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Card elevation={0} sx={{ bgcolor: 'grey.50' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="primary">
                      {user?.applications_count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Applications
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card elevation={0} sx={{ bgcolor: 'grey.50' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="success.main">
                      {user?.approved_count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Approved
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card elevation={0} sx={{ bgcolor: 'grey.50' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="warning.main">
                      {user?.pending_count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card elevation={0} sx={{ bgcolor: 'grey.50' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="info.main">
                      ${user?.total_commission || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Commission
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Tab Navigation */}
        <Grid item xs={12}>
          <Paper elevation={3}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Profile Info" icon={<PersonIcon />} />
              <Tab label="Security" icon={<SecurityIcon />} />
              <Tab label="Activity" icon={<HistoryIcon />} />
              <Tab label="Notifications" icon={<NotificationsIcon />} />
            </Tabs>

            {/* Profile Info Tab */}
            <TabPanel value={tabValue} index={0}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="first_name"
                    value={userData.first_name}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="last_name"
                    value={userData.last_name}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={userData.email}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={userData.phone}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Company/Organization"
                    name="company"
                    value={userData.company}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    {editMode ? (
                      <>
                        <Button onClick={() => setEditMode(false)} disabled={loading}>
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleSaveProfile}
                          disabled={loading}
                        >
                          {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={() => setEditMode(true)}
                        startIcon={<EditIcon />}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Security Tab */}
            <TabPanel value={tabValue} index={1}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Password Settings
                  </Typography>
                  {editPasswordMode ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        fullWidth
                        label="Current Password"
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                      />
                      <TextField
                        fullWidth
                        label="New Password"
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                      />
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                      />
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button onClick={() => setEditPasswordMode(false)}>
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleChangePassword}
                          disabled={loading}
                        >
                          {loading ? <CircularProgress size={24} /> : 'Change Password'}
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={() => setEditPasswordMode(true)}
                      startIcon={<SecurityIcon />}
                    >
                      Change Password
                    </Button>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Two-Factor Authentication
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {user?.mfa_enabled ? (
                      <Chip
                        icon={<VerifiedIcon />}
                        label="Enabled"
                        color="success"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        icon={<UnverifiedIcon />}
                        label="Not Enabled"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => window.open('/mfa-setup', '_blank')}
                    >
                      {user?.mfa_enabled ? 'Manage' : 'Enable'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Activity Tab */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List>
                {Array.isArray(user?.recent_activity) && user.recent_activity.length > 0 ? (
                  user.recent_activity.map((activity, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {activity.type === 'login' && <PersonIcon />}
                          {activity.type === 'application' && <ApplicationIcon />}
                          {activity.type === 'payment' && <CreditCardIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.description}
                        secondary={`${new Date(activity.timestamp).toLocaleString()}`}
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No recent activity to display
                  </Typography>
                )}
              </List>
            </TabPanel>

            {/* Notifications Tab */}
            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" gutterBottom>
                Notification Preferences
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card elevation={1}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Email Notifications
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">Application Updates</Typography>
                          <Chip label="Enabled" color="success" size="small" />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">Payment Reminders</Typography>
                          <Chip label="Enabled" color="success" size="small" />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">Marketing Communications</Typography>
                          <Chip label="Disabled" color="default" size="small" />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card elevation={1}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        SMS Notifications
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">Security Alerts</Typography>
                          <Chip label="Enabled" color="success" size="small" />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">Status Updates</Typography>
                          <Chip label="Enabled" color="success" size="small" />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">Promotional Messages</Typography>
                          <Chip label="Disabled" color="default" size="small" />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;