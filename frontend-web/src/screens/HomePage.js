import React, { useContext } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Avatar,
  Paper,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { ROUTES } from '../utils/constants';
import {
  Chat as ChatIcon,
  Mic as VoiceIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

const HomePage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const getWelcomeMessage = () => {
    if (user.role === 'tpb') {
      return 'Manage your referrals and track commissions';
    } else if (user.role === 'admin' || user.role === 'superadmin') {
      return 'Manage users and monitor platform performance';
    } else {
      return 'Get personalized loan recommendations with AI assistance';
    }
  };

  const getQuickActions = () => {
    const actions = [
      {
        title: 'Start AI Chat',
        description: 'Begin your loan application with AI assistance',
        icon: <ChatIcon />,
        onClick: () => navigate(ROUTES.CHAT),
        roles: ['applicant', 'tpb', 'admin', 'superadmin'],
        color: '#6200EE',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      {
        title: 'Voice Assistant',
        description: 'Use voice chat for hands-free assistance',
        icon: <VoiceIcon />,
        onClick: () => navigate(ROUTES.VOICE_CHAT),
        roles: ['applicant', 'tpb', 'admin', 'superadmin'],
        color: '#00BCD4',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      {
        title: 'My Profile',
        description: 'Manage your account and personal information',
        icon: <PersonIcon />,
        onClick: () => navigate(ROUTES.PROFILE),
        roles: ['applicant', 'tpb', 'admin', 'superadmin'],
        color: '#FF9800',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      },
    ];

    // Admin/SuperAdmin specific actions
    if (user.role === 'admin' || user.role === 'superadmin') {
      actions.push(
        {
          title: 'User Management',
          description: 'Manage platform users and permissions',
          icon: <GroupIcon />,
          onClick: () => navigate(ROUTES.USERS),
          roles: ['admin', 'superadmin'],
          color: '#4CAF50',
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        {
          title: 'Analytics',
          description: 'View platform performance and insights',
          icon: <AnalyticsIcon />,
          onClick: () => navigate(ROUTES.ANALYTICS),
          roles: ['admin', 'superadmin'],
          color: '#2196F3',
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }
      );
    }

    // SuperAdmin specific actions
    if (user.role === 'superadmin') {
      actions.push(
        {
          title: 'System Config',
          description: 'Configure AI services and lender APIs',
          icon: <SettingsIcon />,
          onClick: () => navigate(ROUTES.CONFIG),
          roles: ['superadmin'],
          color: '#9C27B0',
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        {
          title: 'Prompt Management',
          description: 'Manage AI conversation prompts',
          icon: <ChatIcon />,
          onClick: () => navigate(ROUTES.PROMPTS),
          roles: ['superadmin'],
          color: '#E91E63',
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        {
          title: 'Knowledge Bank',
          description: 'Manage AI knowledge base',
          icon: <SettingsIcon />,
          onClick: () => navigate(ROUTES.KNOWLEDGE),
          roles: ['superadmin'],
          color: '#FF5722',
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }
      );
    }

    return actions.filter(action => action.roles.includes(user.role));
  };

  const quickActions = getQuickActions();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      {/* Welcome Section with Gradient */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: { xs: 3, sm: 4, md: 5 },
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '50%',
            height: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50%',
            transform: 'translate(25%, -25%)',
          },
        }}
      >
        <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Avatar
            sx={{
              width: { xs: 70, sm: 90 },
              height: { xs: 70, sm: 90 },
              mx: 'auto',
              mb: 2,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              fontSize: { xs: 28, sm: 36 },
              border: '3px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            }}
          >
            {user?.first_name?.[0] || user?.email?.[0] || 'U'}
          </Avatar>
          <Typography 
            variant={isMobile ? 'h5' : 'h4'} 
            component="h1" 
            gutterBottom 
            sx={{ fontWeight: 700, mb: 1 }}
          >
            Welcome back, {user?.first_name || user?.email}!
          </Typography>
          <Typography 
            variant={isMobile ? 'body1' : 'h6'} 
            sx={{ opacity: 0.95, fontWeight: 400 }}
          >
            {getWelcomeMessage()}
          </Typography>
          <Chip
            label={user.role?.toUpperCase()}
            sx={{
              mt: 2,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
            }}
          />
        </Box>
      </Paper>

      {/* Quick Actions Grid */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h5" 
          component="h2" 
          gutterBottom 
          sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}
        >
          Quick Actions
        </Typography>
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '2px solid',
                  borderColor: 'divider',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(102, 126, 234, 0.25)',
                    borderColor: action.color,
                    '& .action-icon': {
                      transform: 'scale(1.1) rotate(5deg)',
                    },
                    '&::after': {
                      opacity: 1,
                    },
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: action.gradient,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    zIndex: 0,
                  },
                }}
                onClick={action.onClick}
              >
                <CardContent 
                  sx={{ 
                    textAlign: 'center', 
                    py: { xs: 3, sm: 4 },
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <Box
                    className="action-icon"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: { xs: 60, sm: 70 },
                      height: { xs: 60, sm: 70 },
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      color: 'white',
                      mb: 2,
                      transition: 'transform 0.3s ease',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {React.cloneElement(action.icon, { sx: { fontSize: { xs: 32, sm: 40 } } })}
                  </Box>
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: { xs: '1rem', sm: '1.15rem' },
                      color: 'white',
                    }}
                  >
                    {action.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: { xs: '0.813rem', sm: '0.875rem' },
                      lineHeight: 1.6,
                    }}
                  >
                    {action.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Stats and Getting Started Section */}
      <Box sx={{ mt: 2 }}>
        <Typography 
          variant="h5" 
          component="h2" 
          gutterBottom 
          sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}
        >
          Overview
        </Typography>
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Quick Stats */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                border: '2px solid',
                borderColor: 'divider',
                height: '100%',
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <TrendingUpIcon sx={{ color: '#6200EE', mr: 1.5, fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Quick Stats
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                        0
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.95, fontSize: '0.75rem' }}>
                        Applications
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                        0
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.95, fontSize: '0.75rem' }}>
                        Active Chats
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white',
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                        0
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.95, fontSize: '0.75rem' }}>
                        Documents
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Getting Started */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                border: '2px solid',
                borderColor: 'divider',
                height: '100%',
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CheckCircleIcon sx={{ color: '#4CAF50', mr: 1.5, fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Getting Started
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                  Complete these steps to get the most out of Omnifin:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[
                    'Complete your profile information',
                    'Start a conversation with our AI assistant',
                    'Begin your loan application process',
                    'Upload required documents',
                  ].map((step, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1.5,
                        bgcolor: 'rgba(102, 126, 234, 0.05)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'rgba(102, 126, 234, 0.1)',
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      <CheckCircleIcon
                        sx={{
                          color: 'action.disabled',
                          mr: 1.5,
                          fontSize: 20,
                        }}
                      />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {step}
                      </Typography>
                      <ArrowForwardIcon
                        sx={{
                          color: 'action.disabled',
                          fontSize: 18,
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default HomePage;