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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
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
  Cancel as UnverifiedIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Description as DocumentIcon,
  Done as ApprovalIcon,
  Block as RejectionIcon,
  AccountBalance as LenderIcon,
  Payment as PaymentIcon,
  PersonAdd as RegisterIcon,
  Update as UpdateIcon,
  Security as MfaIcon,
  Star as ReviewIcon,
  Check as VerificationIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { API_BASE_URL } from '../utils/constants';
import activityService from '../services/activityService';

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
  const [editApplicantMode, setEditApplicantMode] = useState(false);
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    avatar: ''
  });
  const [applicantData, setApplicantData] = useState({
    date_of_birth: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    employment_status: '',
    annual_income: '',
    credit_score: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

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
    if (user?.role === 'applicant') {
      loadApplicantProfile();
    }
  }, [user]);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoadingActivities(true);
    try {
      const data = await activityService.getActivities({ ordering: '-created_at' });
      setActivities(data.results || data);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const loadApplicantProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile/applicant/`, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        setApplicantData({
          date_of_birth: data.date_of_birth || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          employment_status: data.employment_status || '',
          annual_income: data.annual_income || '',
          credit_score: data.credit_score || ''
        });
      }
    } catch (err) {
      console.error('Failed to load applicant profile:', err);
    }
  };

  const handleApplicantInputChange = (event) => {
    const { name, value } = event.target;
    setApplicantData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveApplicantProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile/applicant/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(applicantData)
      });

      if (response.ok) {
        setSuccess('Applicant profile updated successfully!');
        setEditApplicantMode(false);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to update applicant profile');
      }
    } catch (err) {
      setError('Failed to update applicant profile');
    } finally {
      setLoading(false);
    }
  };

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
      'tpb': 'info',
      'applicant': 'success'
    };
    return colors[role] || 'default';
  };

  const getRoleLabel = (role) => {
    const labels = {
      'super_admin': 'Super Admin',
      'admin': 'Administrator',
      'tpb': 'Third Party Broker',
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
              {user?.role === 'applicant' && <Tab label="Applicant Profile" icon={<CreditCardIcon />} />}
              <Tab label="Security" icon={<SecurityIcon />} />
              <Tab label="Activity" icon={<HistoryIcon />} />
              {/* <Tab label="Notifications" icon={<NotificationsIcon />} /> */}
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
                    disabled
                    value={userData.email}
                    onChange={handleInputChange}
                    // disabled={!editMode}
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
                {/* <Grid item xs={12} md={6}>
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
                </Grid> */}
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

            {/* Applicant Profile Tab */}
            {user?.role === 'applicant' && (
              <TabPanel value={tabValue} index={1}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Typography variant="h6" gutterBottom>
                  Applicant Information
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  This information is required for loan applications and will be used to assess your eligibility.
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      name="date_of_birth"
                      type="date"
                      value={applicantData.date_of_birth}
                      onChange={handleApplicantInputChange}
                      disabled={!editApplicantMode}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth disabled={!editApplicantMode}>
                      <InputLabel>Employment Status</InputLabel>
                      <Select
                        name="employment_status"
                        value={applicantData.employment_status}
                        onChange={handleApplicantInputChange}
                        label="Employment Status"
                      >
                        <MenuItem value="employed">Employed</MenuItem>
                        <MenuItem value="self_employed">Self-Employed</MenuItem>
                        <MenuItem value="unemployed">Unemployed</MenuItem>
                        <MenuItem value="retired">Retired</MenuItem>
                        <MenuItem value="student">Student</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      name="address"
                      value={applicantData.address}
                      onChange={handleApplicantInputChange}
                      disabled={!editApplicantMode}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="City"
                      name="city"
                      value={applicantData.city}
                      onChange={handleApplicantInputChange}
                      disabled={!editApplicantMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="State"
                      name="state"
                      value={applicantData.state}
                      onChange={handleApplicantInputChange}
                      disabled={!editApplicantMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Zip Code"
                      name="zip_code"
                      value={applicantData.zip_code}
                      onChange={handleApplicantInputChange}
                      disabled={!editApplicantMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Annual Income"
                      name="annual_income"
                      type="number"
                      value={applicantData.annual_income}
                      onChange={handleApplicantInputChange}
                      disabled={!editApplicantMode}
                      InputProps={{
                        startAdornment: <Typography>$</Typography>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Credit Score"
                      name="credit_score"
                      type="number"
                      value={applicantData.credit_score}
                      onChange={handleApplicantInputChange}
                      disabled={!editApplicantMode}
                      helperText="Your credit score (300-850)"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      {editApplicantMode ? (
                        <>
                          <Button onClick={() => setEditApplicantMode(false)} disabled={loading}>
                            Cancel
                          </Button>
                          <Button
                            variant="contained"
                            onClick={handleSaveApplicantProfile}
                            disabled={loading}
                          >
                            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={() => setEditApplicantMode(true)}
                          startIcon={<EditIcon />}
                        >
                          Edit Applicant Profile
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </TabPanel>
            )}

            {/* Security Tab */}
            <TabPanel value={tabValue} index={user?.role === 'applicant' ? 2 : 1}>
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
            <TabPanel value={tabValue} index={user?.role === 'applicant' ? 3 : 2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Recent Activity
                </Typography>
                <Button 
                  size="small" 
                  onClick={loadActivities}
                  disabled={loadingActivities}
                >
                  Refresh
                </Button>
              </Box>
              {loadingActivities ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {activities.length > 0 ? (
                    activities.map((activity) => {
                      const getActivityIcon = (type) => {
                        const iconMap = {
                          login: <LoginIcon />,
                          logout: <LogoutIcon />,
                          loan_application: <ApplicationIcon />,
                          loan_status_change: <UpdateIcon />,
                          loan_view: <UpdateIcon />,
                          document_upload: <DocumentIcon />,
                          document_verification: <VerificationIcon />,
                          credit_check: <CreditCardIcon />,
                          approval: <ApprovalIcon />,
                          rejection: <RejectionIcon />,
                          lender_assignment: <LenderIcon />,
                          disbursement: <PaymentIcon />,
                          payment: <PaymentIcon />,
                          registration: <RegisterIcon />,
                          profile_update: <UpdateIcon />,
                          mfa_enabled: <MfaIcon />,
                          mfa_disabled: <MfaIcon />,
                          application_review: <ReviewIcon />,
                          settings_change: <SettingsIcon />,
                        };
                        return iconMap[type] || <HistoryIcon />;
                      };

                      const getActivityColor = (type) => {
                        const colorMap = {
                          login: '#4caf50',
                          logout: '#ff9800',
                          loan_application: '#2196f3',
                          loan_status_change: '#ff9800',
                          loan_view: '#2196f3',
                          application_review: '#9c27b0',
                          profile_update: '#00bcd4',
                          approval: '#4caf50',
                          rejection: '#f44336',
                          disbursement: '#9c27b0',
                          payment: '#00bcd4',
                        };
                        return colorMap[type] || '#757575';
                      };

                      return (
                        <ListItem 
                          key={activity.id} 
                          sx={{ 
                            px: 0, 
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-child': { borderBottom: 'none' }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar 
                              sx={{ 
                                width: 40, 
                                height: 40,
                                bgcolor: getActivityColor(activity.activity_type)
                              }}
                            >
                              {getActivityIcon(activity.activity_type)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={activity.description}
                            secondary={
                              <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(activity.created_at).toLocaleString()}
                                </Typography>
                                {activity.metadata?.applicant_name && (
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    Applicant: {activity.metadata.applicant_name} ({activity.metadata.applicant_email})
                                  </Typography>
                                )}
                                {activity.metadata?.application_number && (
                                  <Typography variant="caption" color="text.secondary">
                                    Application: {activity.metadata.application_number}
                                  </Typography>
                                )}
                                {activity.metadata?.loan_amount && activity.metadata?.loan_purpose && (
                                  <Typography variant="caption" color="text.secondary">
                                    ${activity.metadata.loan_amount} - {activity.metadata.loan_purpose}
                                  </Typography>
                                )}
                                {activity.ip_address && (
                                  <Typography variant="caption" color="text.secondary">
                                    IP: {activity.ip_address}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <Chip 
                            label={activity.activity_type.replace(/_/g, ' ').toUpperCase()} 
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </ListItem>
                      );
                    })
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      No recent activity to display
                    </Typography>
                  )}
                </List>
              )}
            </TabPanel>

            {/* Notifications Tab */}
            {/* <TabPanel value={tabValue} index={user?.role === 'applicant' ? 4 : 3}>
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
            </TabPanel> */}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;