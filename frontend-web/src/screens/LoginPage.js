import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import { ROUTES, API_BASE_URL } from '../utils/constants';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        // Check if MFA is required
        if (result.mfa_required) {
          setMfaRequired(true);
        } else {
          // Check user role and redirect accordingly
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user.role === 'system_admin') {
              navigate(ROUTES.ADMIN_DASHBOARD);
            } else {
              navigate(ROUTES.HOME);
            }
          } else {
            navigate(ROUTES.HOME);
          }
        }
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/mfa/verify-login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          token: mfaToken
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Check user role and redirect accordingly
        if (data.data.user.role === 'system_admin') {
          navigate(ROUTES.ADMIN_DASHBOARD);
        } else {
          navigate(ROUTES.HOME);
        }
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Grid container spacing={0} maxWidth="1200px" sx={{ height: '80vh' }}>
        {/* Left side - Branding */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #6200EE 0%, #BB86FC 100%)',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              p: 4,
              borderRadius: '16px 0 0 16px',
            }}
          >
            <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Omnifin
            </Typography>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 400 }}>
              AI-Powered Lending Platform
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 400 }}>
              Transform your lending process with intelligent AI assistance,
              seamless integrations, and comprehensive user management.
            </Typography>
            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>AI-Powered</Typography>
                <Typography variant="body2">Smart Conversations</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>Secure</Typography>
                <Typography variant="body2">Enterprise Grade</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>Scalable</Typography>
                <Typography variant="body2">Cloud Ready</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Right side - Login Form */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              p: 6,
              borderRadius: '0 16px 16px 0',
            }}
          >
            <Box sx={{ maxWidth: 400, mx: 'auto' }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: '#6200EE' }}>
                Welcome Back
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Sign in to your account to continue
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {mfaRequired && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  Please enter the 6-digit code from your authenticator app
                </Alert>
              )}

              {!mfaRequired ? (
                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={formData.email}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    sx={{ mb: 3 }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      mb: 2,
                      backgroundColor: '#6200EE',
                      '&:hover': {
                        backgroundColor: '#3700B3',
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </Box>
              ) : (
                <Box component="form" onSubmit={handleMfaSubmit} noValidate>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="mfa-token"
                    label="2FA Verification Code"
                    name="mfaToken"
                    autoComplete="off"
                    autoFocus
                    value={mfaToken}
                    onChange={(e) => setMfaToken(e.target.value)}
                    placeholder="XXXXXX"
                    inputProps={{ maxLength: 6 }}
                    sx={{ mb: 3 }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading || !mfaToken}
                    sx={{
                      py: 1.5,
                      mb: 2,
                      backgroundColor: '#6200EE',
                      '&:hover': {
                        backgroundColor: '#3700B3',
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      'Verify'
                    )}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      setMfaRequired(false);
                      setMfaToken('');
                      setError('');
                    }}
                    sx={{ mb: 2 }}
                  >
                    Back to Login
                  </Button>
                </Box>
              )}

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                    Forgot password?
                  </Typography>
                </Link>
              </Box>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link to="/register" style={{ textDecoration: 'none' }}>
                    <Typography variant="body2" color="primary" sx={{ cursor: 'pointer', display: 'inline' }}>
                      Sign up
                    </Typography>
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoginPage;