import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Payment as PaymentIcon,
  // Integration as IntegrationIcon,
  Notifications as NotificationsIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { superAdminService } from '../services/superAdminService';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const SuperAdminConfigPage = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [config, setConfig] = useState({
    system_name: 'Omnifin',
    system_email: 'noreply@omnifin.com',
    maintenance_mode: false,
    registration_enabled: true,
    max_file_size: 50,
    allowed_file_types: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
    api_keys: {},
    payment_settings: {},
    notification_settings: {},
    security_settings: {}
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [dialogData, setDialogData] = useState({});

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const data = await superAdminService.getConfiguration();
      setConfig(data);
    } catch (err) {
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleConfigChange = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleSaveConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await superAdminService.updateConfiguration(config);
      setSuccess('Configuration updated successfully!');
    } catch (err) {
      setError('Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpen = (type, data = {}) => {
    setDialogType(type);
    setDialogData(data);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogType('');
    setDialogData({});
  };

  const handleApiKeySave = async () => {
    try {
      await superAdminService.updateApiKey(dialogData.service, dialogData.key);
      setSuccess('API key updated successfully!');
      handleDialogClose();
      loadConfiguration();
    } catch (err) {
      setError('Failed to update API key');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={3}>
        <Box sx={{ p: 4, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h4" gutterBottom>
            System Configuration
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage global system settings, integrations, and security policies
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="General Settings" icon={<SettingsIcon />} />
          {/* <Tab label="API Keys" icon={<IntegrationIcon />} /> */}
          <Tab label="Payment Settings" icon={<PaymentIcon />} />
          <Tab label="Security" icon={<SecurityIcon />} />
          <Tab label="Notifications" icon={<NotificationsIcon />} />
        </Tabs>

        {/* General Settings */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="System Name"
                      value={config.system_name}
                      onChange={(e) => setConfig({ ...config, system_name: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      label="System Email"
                      type="email"
                      value={config.system_email}
                      onChange={(e) => setConfig({ ...config, system_email: e.target.value })}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Status
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.maintenance_mode}
                          onChange={(e) => setConfig({ ...config, maintenance_mode: e.target.checked })}
                        />
                      }
                      label="Maintenance Mode"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.registration_enabled}
                          onChange={(e) => setConfig({ ...config, registration_enabled: e.target.checked })}
                        />
                      }
                      label="User Registration"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    File Upload Settings
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Max File Size (MB)"
                        type="number"
                        value={config.max_file_size}
                        onChange={(e) => setConfig({ ...config, max_file_size: parseInt(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Allowed File Types</InputLabel>
                        <Select
                          multiple
                          value={config.allowed_file_types}
                          onChange={(e) => setConfig({ ...config, allowed_file_types: e.target.value })}
                          renderValue={(selected) => selected.join(', ')}
                        >
                          {['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.xlsx'].map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* API Keys */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    AI Services
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="OpenAI API Key"
                        secondary={config.api_keys?.openai ? 'Configured' : 'Not configured'}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() => handleDialogOpen('api_key', { service: 'openai', key: config.api_keys?.openai || '' })}
                        >
                          <EditIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="ElevenLabs API Key"
                        secondary={config.api_keys?.elevenlabs ? 'Configured' : 'Not configured'}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() => handleDialogOpen('api_key', { service: 'elevenlabs', key: config.api_keys?.elevenlabs || '' })}
                        >
                          <EditIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Ultravox API Key"
                        secondary={config.api_keys?.ultravox ? 'Configured' : 'Not configured'}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() => handleDialogOpen('api_key', { service: 'ultravox', key: config.api_keys?.ultravox || '' })}
                        >
                          <EditIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Payment Gateways
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Stripe API Key"
                        secondary={config.api_keys?.stripe ? 'Configured' : 'Not configured'}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() => handleDialogOpen('api_key', { service: 'stripe', key: config.api_keys?.stripe || '' })}
                        >
                          <EditIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="PayPal Client ID"
                        secondary={config.api_keys?.paypal ? 'Configured' : 'Not configured'}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() => handleDialogOpen('api_key', { service: 'paypal', key: config.api_keys?.paypal || '' })}
                        >
                          <EditIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    External Services
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="SendGrid API Key"
                        secondary={config.api_keys?.sendgrid ? 'Configured' : 'Not configured'}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() => handleDialogOpen('api_key', { service: 'sendgrid', key: config.api_keys?.sendgrid || '' })}
                        >
                          <EditIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Twilio API Key"
                        secondary={config.api_keys?.twilio ? 'Configured' : 'Not configured'}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() => handleDialogOpen('api_key', { service: 'twilio', key: config.api_keys?.twilio || '' })}
                        >
                          <EditIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Payment Settings */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Payment Configuration
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.payment_settings?.enabled || false}
                          onChange={(e) => handleConfigChange('payment_settings', 'enabled', e.target.checked)}
                        />
                      }
                      label="Payment Processing"
                    />
                    <TextField
                      fullWidth
                      label="Commission Percentage (%)"
                      type="number"
                      value={config.payment_settings?.commission_percentage || 0}
                      onChange={(e) => handleConfigChange('payment_settings', 'commission_percentage', parseFloat(e.target.value))}
                    />
                    <TextField
                      fullWidth
                      label="Minimum Commission Amount ($)"
                      type="number"
                      value={config.payment_settings?.minimum_commission || 0}
                      onChange={(e) => handleConfigChange('payment_settings', 'minimum_commission', parseFloat(e.target.value))}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Currency & Tax
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Default Currency</InputLabel>
                      <Select
                        value={config.payment_settings?.default_currency || 'USD'}
                        onChange={(e) => handleConfigChange('payment_settings', 'default_currency', e.target.value)}
                      >
                        {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map((currency) => (
                          <MenuItem key={currency} value={currency}>
                            {currency}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Tax Rate (%)"
                      type="number"
                      value={config.payment_settings?.tax_rate || 0}
                      onChange={(e) => handleConfigChange('payment_settings', 'tax_rate', parseFloat(e.target.value))}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Settings */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Authentication
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.security_settings?.mfa_required || false}
                          onChange={(e) => handleConfigChange('security_settings', 'mfa_required', e.target.checked)}
                        />
                      }
                      label="Require Two-Factor Authentication"
                    />
                    <TextField
                      fullWidth
                      label="Password Minimum Length"
                      type="number"
                      value={config.security_settings?.password_min_length || 8}
                      onChange={(e) => handleConfigChange('security_settings', 'password_min_length', parseInt(e.target.value))}
                    />
                    <TextField
                      fullWidth
                      label="Session Timeout (minutes)"
                      type="number"
                      value={config.security_settings?.session_timeout || 60}
                      onChange={(e) => handleConfigChange('security_settings', 'session_timeout', parseInt(e.target.value))}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Access Control
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.security_settings?.ip_whitelist_enabled || false}
                          onChange={(e) => handleConfigChange('security_settings', 'ip_whitelist_enabled', e.target.checked)}
                        />
                      }
                      label="Enable IP Whitelist"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.security_settings?.login_attempts_limit || false}
                          onChange={(e) => handleConfigChange('security_settings', 'login_attempts_limit', e.target.checked)}
                        />
                      }
                      label="Limit Login Attempts"
                    />
                    <TextField
                      fullWidth
                      label="Max Login Attempts"
                      type="number"
                      value={config.security_settings?.max_login_attempts || 5}
                      onChange={(e) => handleConfigChange('security_settings', 'max_login_attempts', parseInt(e.target.value))}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notification Settings */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Email Notifications
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.notification_settings?.email_enabled || false}
                          onChange={(e) => handleConfigChange('notification_settings', 'email_enabled', e.target.checked)}
                        />
                      }
                      label="Enable Email Notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.notification_settings?.new_user_email || false}
                          onChange={(e) => handleConfigChange('notification_settings', 'new_user_email', e.target.checked)}
                        />
                      }
                      label="New User Registration"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.notification_settings?.application_status_email || false}
                          onChange={(e) => handleConfigChange('notification_settings', 'application_status_email', e.target.checked)}
                        />
                      }
                      label="Application Status Updates"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    SMS Notifications
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.notification_settings?.sms_enabled || false}
                          onChange={(e) => handleConfigChange('notification_settings', 'sms_enabled', e.target.checked)}
                        />
                      }
                      label="Enable SMS Notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.notification_settings?.security_sms || false}
                          onChange={(e) => handleConfigChange('notification_settings', 'security_sms', e.target.checked)}
                        />
                      }
                      label="Security Alerts"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.notification_settings?.payment_sms || false}
                          onChange={(e) => handleConfigChange('notification_settings', 'payment_sms', e.target.checked)}
                        />
                      }
                      label="Payment Notifications"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Save Button */}
        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', textAlign: 'right' }}>
          <Button
            variant="contained"
            onClick={handleSaveConfiguration}
            disabled={loading}
            startIcon={<SaveIcon />}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Configuration'}
          </Button>
        </Box>
      </Paper>

      {/* API Key Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Configure API Key
          <IconButton
            onClick={handleDialogClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={`${dialogData.service} API Key`}
            type="password"
            value={dialogData.key || ''}
            onChange={(e) => setDialogData({ ...dialogData, key: e.target.value })}
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Your API key will be encrypted and stored securely
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleApiKeySave} variant="contained">
            Save API Key
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SuperAdminConfigPage;