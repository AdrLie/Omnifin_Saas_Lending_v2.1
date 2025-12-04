import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Box,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Grid,
    Paper,
    Divider,
} from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import { ROUTES } from '../utils/constants';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        first_name: '',
        last_name: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    // const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const handleChange = (e) => {
        const { name, value } = e.target;

        // For phone field, only allow numbers, spaces, hyphens, plus, and parentheses
        if (name === 'phone') {
            const phoneValue = value.replace(/[^0-9+\-\s()]/g, '');
            setFormData({
                ...formData,
                [name]: phoneValue,
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }

        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors({
                ...fieldErrors,
                [name]: '',
            });
        }
    };

    const validateFields = () => {
        const errors = {};
        const requiredFields = [
            { name: 'username', label: 'Username' },
            { name: 'email', label: 'Email Address' },
            { name: 'first_name', label: 'First Name' },
            { name: 'last_name', label: 'Last Name' },
            { name: 'phone', label: 'Phone Number' },
            { name: 'password', label: 'Password' },
            { name: 'confirmPassword', label: 'Confirm Password' },
        ];

        requiredFields.forEach(field => {
            if (!formData[field.name] || formData[field.name].trim() === '') {
                errors[field.name] = `${field.label} is required`;
            }
        });

        // Email validation
        if (formData.email && formData.email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                errors.email = 'Please enter a valid email address';
            }
        }

        // Phone number validation
        if (formData.phone && formData.phone.trim() !== '') {
            const phoneRegex = /^[0-9+\-\s()]+$/;
            if (!phoneRegex.test(formData.phone)) {
                errors.phone = 'Phone number must contain only numbers';
            } else if (formData.phone.replace(/[^0-9]/g, '').length < 10) {
                errors.phone = 'Phone number must be at least 10 digits';
            }
        }

        if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateFields();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setLoading(true);
        try {
            const result = await register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
                password_confirm: formData.confirmPassword,
                role: 'applicant'
            });
            if (result.success) {
                navigate(ROUTES.HOME);
            } else {
                // If error is an object, map field errors to first message
                if (typeof result.error === 'object' && result.error !== null) {
                    const mappedErrors = {};
                    Object.entries(result.error).forEach(([key, value]) => {
                        mappedErrors[key] = Array.isArray(value) ? value[0] : value;
                    });
                    setFieldErrors(mappedErrors);
                }
                // else: ignore non-field error, or optionally show a toast/snackbar
            }
        } catch (error) {
            // Optionally handle unexpected error (e.g., show a toast/snackbar)
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

                {/* Right side - Register Form */}
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
                                Create Account
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                                Register a new account to get started
                            </Typography>

                            {/* Removed top-level error alert for field errors */}

                            <Box component="form" onSubmit={handleSubmit} noValidate>
                                <TextField
                                    margin="dense"
                                    required
                                    fullWidth
                                    id="username"
                                    label="Username"
                                    name="username"
                                    autoComplete="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    error={!!fieldErrors.username}
                                    helperText={fieldErrors.username}
                                    sx={{ mb: 2 }}
                                />
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            id="first_name"
                                            label="First Name"
                                            name="first_name"
                                            autoComplete="given-name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            error={!!fieldErrors.first_name}
                                            helperText={fieldErrors.first_name}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            id="last_name"
                                            label="Last Name"
                                            name="last_name"
                                            autoComplete="family-name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            error={!!fieldErrors.last_name}
                                            helperText={fieldErrors.last_name}
                                        />
                                    </Grid>
                                </Grid>
                                <TextField
                                    margin="dense"
                                    required
                                    fullWidth
                                    id="phone"
                                    label="Phone Number"
                                    name="phone"
                                    autoComplete="tel"
                                    type="tel"
                                    inputProps={{
                                        inputMode: 'numeric',
                                        pattern: '[0-9+\\-\\s()]*'
                                    }}
                                    value={formData.phone}
                                    onChange={handleChange}
                                    error={!!fieldErrors.phone}
                                    helperText={fieldErrors.phone}
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    margin="dense"
                                    required
                                    fullWidth
                                    id="email"
                                    label="Email Address"
                                    name="email"
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    error={!!fieldErrors.email}
                                    helperText={fieldErrors.email}
                                    sx={{ mb: 2 }}
                                />
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            name="password"
                                            label="Password"
                                            type="password"
                                            id="password"
                                            autoComplete="new-password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            error={!!fieldErrors.password}
                                            helperText={fieldErrors.password}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            name="confirmPassword"
                                            label="Confirm Password"
                                            type="password"
                                            id="confirmPassword"
                                            autoComplete="new-password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            error={!!fieldErrors.confirmPassword}
                                            helperText={fieldErrors.confirmPassword}
                                        />
                                    </Grid>
                                </Grid>
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
                                        'Register'
                                    )}
                                </Button>
                            </Box>

                            <Divider sx={{ my: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                    OR
                                </Typography>
                            </Divider>

                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Already have an account?{' '}
                                    <Link to="/login" style={{ textDecoration: 'none' }}>
                                        <Typography variant="body2" color="primary" sx={{ cursor: 'pointer', display: 'inline' }}>
                                            Sign In
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

export default RegisterPage;