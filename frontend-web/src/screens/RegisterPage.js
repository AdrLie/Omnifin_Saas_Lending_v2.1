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
    Card,
    CardContent,
    CardActionArea,
    Chip,
    Alert,
} from '@mui/material';
import {
    Person as PersonIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { ROUTES } from '../utils/constants';

const RegisterPage = () => {
    const [step, setStep] = useState('role'); // 'role', 'code' (for applicants), or 'form'
    const [userType, setUserType] = useState(null); // 'applicant' or 'tpb'
    const [invitationCode, setInvitationCode] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        first_name: '',
        last_name: '',
        phone: '',
        password: '',
        confirmPassword: '',
        organization_name: '',
        organization_description: '',
    });
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleRoleSelect = (role) => {
        setUserType(role);
        if (role === 'applicant') {
            setStep('code');
        } else {
            setStep('form');
        }
    };

    const handleCodeSubmit = () => {
        if (!invitationCode.trim()) {
            setFieldErrors({ invitationCode: 'Please enter an invitation code' });
            return;
        }
        setStep('form');
        setFieldErrors({});
    };

    const handleBackToRole = () => {
        setStep('role');
        setUserType(null);
        setInvitationCode('');
        setFieldErrors({});
    };

    const handleBackToCode = () => {
        setStep('code');
        setFieldErrors({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'phone') {
            const phoneValue = value.replace(/[^0-9+\-\s()]/g, '');
            setFormData({
                ...formData,
                [name]: phoneValue,
            });
        } else if (name === 'invitationCode') {
            setInvitationCode(value.toUpperCase());
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }

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

        // Add organization fields for TPB Manager
        if (userType === 'tpb') {
            requiredFields.push({ name: 'organization_name', label: 'Organization Name' });
        }

        requiredFields.forEach(field => {
            if (!formData[field.name] || formData[field.name].trim() === '') {
                errors[field.name] = `${field.label} is required`;
            }
        });

        if (formData.email && formData.email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                errors.email = 'Please enter a valid email address';
            }
        }

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
            const registrationData = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
                password_confirm: formData.confirmPassword,
                role: userType === 'applicant' ? 'tpb_customer' : 'tpb_manager'
            };

            // Add invitation code if applicant
            if (userType === 'applicant' && invitationCode) {
                registrationData.invitation_code = invitationCode;
            }

            // Add organization details if TPB Manager
            if (userType === 'tpb') {
                registrationData.organization_name = formData.organization_name;
                registrationData.organization_description = formData.organization_description;
            }

            const result = await register(registrationData);
            if (result.success) {
                navigate(ROUTES.HOME);
            } else {
                if (typeof result.error === 'object' && result.error !== null) {
                    const mappedErrors = {};
                    Object.entries(result.error).forEach(([key, value]) => {
                        mappedErrors[key] = Array.isArray(value) ? value[0] : value;
                    });
                    setFieldErrors(mappedErrors);
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
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
            <Grid container spacing={0} maxWidth="1200px" sx={{ height: 'auto', minHeight: '80vh' }}>
                {/* Left side - Branding */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            minHeight: '100%',
                            background: 'linear-gradient(135deg, #6200EE 0%, #BB86FC 100%)',
                            color: 'white',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center',
                            p: 4,
                            borderRadius: { xs: '0', md: '16px 0 0 16px' },
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
                        <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
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
                            minHeight: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            p: 4,
                            borderRadius: { xs: '0', md: '0 16px 16px 0' },
                        }}
                    >
                        <Box sx={{ maxWidth: 450, mx: 'auto', width: '100%' }}>
                            {step === 'role' ? (
                                // Role Selection Step
                                <>
                                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: '#6200EE', mb: 2 }}>
                                        Create Account
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                                        Who are you registering as?
                                    </Typography>

                                    <Grid container spacing={3} sx={{ mb: 4 }}>
                                        {/* Applicant Card */}
                                        <Grid item xs={12} sm={6}>
                                            <Card
                                                sx={{
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-8px)',
                                                        boxShadow: '0 12px 24px rgba(98, 0, 238, 0.2)',
                                                    },
                                                    border: '2px solid transparent',
                                                    borderColor: userType === 'applicant' ? '#6200EE' : '#e0e0e0',
                                                }}
                                            >
                                                <CardActionArea onClick={() => handleRoleSelect('applicant')}>
                                                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                                        <PersonIcon sx={{ fontSize: 64, color: '#6200EE', mb: 2 }} />
                                                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                                            Applicant
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            I want to apply for a loan
                                                        </Typography>
                                                        <Chip
                                                            label="Borrower"
                                                            size="small"
                                                            sx={{ mt: 2, bgcolor: 'rgba(98, 0, 238, 0.1)', color: '#6200EE' }}
                                                        />
                                                    </CardContent>
                                                </CardActionArea>
                                            </Card>
                                        </Grid>

                                        {/* TPB Card */}
                                        <Grid item xs={12} sm={6}>
                                            <Card
                                                sx={{
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-8px)',
                                                        boxShadow: '0 12px 24px rgba(98, 0, 238, 0.2)',
                                                    },
                                                    border: '2px solid transparent',
                                                    borderColor: userType === 'tpb' ? '#6200EE' : '#e0e0e0',
                                                }}
                                            >
                                                <CardActionArea onClick={() => handleRoleSelect('tpb')}>
                                                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                                        <BusinessIcon sx={{ fontSize: 64, color: '#6200EE', mb: 2 }} />
                                                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                                            TPB Manager
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            I manage a TPB organization
                                                        </Typography>
                                                        <Chip
                                                            label="Manager"
                                                            size="small"
                                                            sx={{ mt: 2, bgcolor: 'rgba(98, 0, 238, 0.1)', color: '#6200EE' }}
                                                        />
                                                    </CardContent>
                                                </CardActionArea>
                                            </Card>
                                        </Grid>
                                    </Grid>

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
                                </>
                            ) : step === 'code' ? (
                                // Invitation Code Step (for applicants)
                                <>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Button
                                            variant="text"
                                            onClick={handleBackToRole}
                                            sx={{ mr: 2, color: '#6200EE' }}
                                        >
                                            ← Back
                                        </Button>
                                        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: '#6200EE', flex: 1 }}>
                                            Enter Invitation Code
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Enter the invitation code provided by your organization
                                    </Typography>

                                    <Alert severity="info" sx={{ mb: 3 }}>
                                        Ask your organization's TPB Manager for an invitation code to join their workspace
                                    </Alert>

                                    {fieldErrors.invitationCode && (
                                        <Alert severity="error" sx={{ mb: 3 }}>
                                            {fieldErrors.invitationCode}
                                        </Alert>
                                    )}

                                    <TextField
                                        fullWidth
                                        label="Invitation Code"
                                        name="invitationCode"
                                        value={invitationCode}
                                        onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                                        placeholder="e.g., ABC123XYZ9"
                                        error={!!fieldErrors.invitationCode}
                                        helperText={fieldErrors.invitationCode || "Case-insensitive, usually 10 characters"}
                                        sx={{ mb: 3 }}
                                        inputProps={{ maxLength: 12, style: { textTransform: 'uppercase' } }}
                                    />

                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={handleCodeSubmit}
                                        sx={{
                                            py: 1.5,
                                            backgroundColor: '#6200EE',
                                            '&:hover': {
                                                backgroundColor: '#3700B3',
                                            },
                                        }}
                                    >
                                        Continue
                                    </Button>

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
                                </>
                            ) : (
                                // Registration Form Step
                                <>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Button
                                            variant="text"
                                            onClick={userType === 'applicant' ? handleBackToCode : handleBackToRole}
                                            sx={{ mr: 2, color: '#6200EE' }}
                                        >
                                            ← Back
                                        </Button>
                                        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: '#6200EE', flex: 1 }}>
                                            {userType === 'applicant' ? 'Applicant Registration' : 'TPB Staff Registration'}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Complete your profile information
                                    </Typography>

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

                                        {/* Organization fields for TPB Manager */}
                                        {userType === 'tpb' && (
                                            <>
                                                <Divider sx={{ my: 3 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Organization Details
                                                    </Typography>
                                                </Divider>
                                                <TextField
                                                    margin="dense"
                                                    required
                                                    fullWidth
                                                    id="organization_name"
                                                    label="Organization Name"
                                                    name="organization_name"
                                                    placeholder="e.g., Acme Lending Corp"
                                                    value={formData.organization_name}
                                                    onChange={handleChange}
                                                    error={!!fieldErrors.organization_name}
                                                    helperText={fieldErrors.organization_name}
                                                    sx={{ mb: 2 }}
                                                />
                                                <TextField
                                                    margin="dense"
                                                    fullWidth
                                                    id="organization_description"
                                                    label="Organization Description"
                                                    name="organization_description"
                                                    placeholder="Brief description of your organization (optional)"
                                                    multiline
                                                    rows={3}
                                                    value={formData.organization_description}
                                                    onChange={handleChange}
                                                    sx={{ mb: 2 }}
                                                />
                                                <Divider sx={{ my: 3 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Account Details
                                                    </Typography>
                                                </Divider>
                                            </>
                                        )}

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
                                </>
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default RegisterPage;