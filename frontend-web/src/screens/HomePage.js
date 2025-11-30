import React, { useContext } from 'react';
import { Grid, Card, CardContent, Typography, Button, Box, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { ROUTES } from '../utils/constants';
import {
  Dashboard as DashboardIcon,
  Chat as ChatIcon,
  Mic as VoiceIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Analytics as AnalyticsIcon,
  Description as LoanIcon,
  Settings as SettingsIcon,
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
      },
      {
        title: 'Voice Assistant',
        description: 'Use voice chat for hands-free assistance',
        icon: <VoiceIcon />,
        onClick: () => navigate(ROUTES.VOICE_CHAT),
        roles: ['applicant', 'tpb', 'admin', 'superadmin'],
      },
      {
        title: 'My Profile',
        description: 'Manage your account and personal information',
        icon: <PersonIcon />,
        onClick: () => navigate(ROUTES.PROFILE),
        roles: ['applicant', 'tpb', 'admin', 'superadmin'],
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
        },
        {
          title: 'Analytics',
          description: 'View platform performance and insights',
          icon: <AnalyticsIcon />,
          onClick: () => navigate(ROUTES.ANALYTICS),
          roles: ['admin', 'superadmin'],
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
        },
        {
          title: 'Prompt Management',
          description: 'Manage AI conversation prompts',
          icon: <ChatIcon />,
          onClick: () => navigate(ROUTES.PROMPTS),
          roles: ['superadmin'],
        },
        {
          title: 'Knowledge Bank',
          description: 'Manage AI knowledge base',
          icon: <SettingsIcon />,
          onClick: () => navigate(ROUTES.KNOWLEDGE),
          roles: ['superadmin'],
        }
      );
    }

    return actions.filter(action => action.roles.includes(user.role));
  };

  const quickActions = getQuickActions();

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Avatar
          sx={{
            width: 80,
            height: 80,
            mx: 'auto',
            mb: 2,
            bgcolor: '#6200EE',
            fontSize: 32,
          }}
        >
          {user?.first_name?.[0] || user?.email?.[0] || 'U'}
        </Avatar>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#6200EE', fontWeight: 600 }}>
          Welcome back, {user?.first_name || user?.email}!
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          {getWelcomeMessage()}
        </Typography>
      </Box>

      {/* Quick Actions Grid */}
      <Grid container spacing={3}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              onClick={action.onClick}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Box sx={{ color: '#6200EE', mb: 2 }}>
                  {React.cloneElement(action.icon, { sx: { fontSize: 48 } })}
                </Box>
                <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity Section */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#6200EE' }}>
          Recent Activity
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Stats
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Applications
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Chats
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Documents
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Getting Started
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Welcome to Omnifin! Here's how to get started:
                  </Typography>
                  <Box component="ol" sx={{ pl: 2 }}>
                    <li>Complete your profile information</li>
                    <li>Start a conversation with our AI assistant</li>
                    <li>Begin your loan application process</li>
                    <li>Upload required documents</li>
                  </Box>
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