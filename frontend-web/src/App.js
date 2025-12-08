import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import Layout from './components/Layout';
import HomePage from './screens/HomePage';
import LoginPage from './screens/LoginPage';
import ChatPage from './screens/ChatPage';
import VoiceChatPage from './screens/VoiceChatPage';
import ProfilePage from './screens/ProfilePage';
import SuperAdminConfigPage from './screens/SuperAdminConfigPage';
import PromptManagementPage from './screens/PromptManagementPage';
import KnowledgeBankPage from './screens/KnowledgeBankPage';
import UserManagementPage from './screens/UserManagementPage';
import AnalyticsPage from './screens/AnalyticsPage';
import LoanManagementPage from './screens/LoanManagementPage';
import { UserProvider } from './contexts/UserContext';
import RegisterPage from './screens/RegisterPage';
import SubscriptionPlansScreen from './screens/SubscriptionPlansScreen';
import SubscribeScreen from './screens/SubscribeScreen';
import UsageDashboard from './screens/UsageDashboard';
import ManageAdminSubscriptionsScreen from './screens/ManageAdminSubscriptionsScreen';
import SystemAdminDashboard from './screens/system_admin/SystemAdminDashboard';

// Create a custom theme with purple highlights as requested
const theme = createTheme({
  palette: {
    primary: {
      main: '#6200EE', // Purple as requested
      light: '#9E47FF',
      dark: '#3700B3',
    },
    secondary: {
      main: '#03DAC6', // Teal accent
      light: '#66FFF9',
      dark: '#00A895',
    },
    background: {
      default: '#FAFBFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h6: {
      fontWeight: 500,
    },
    body1: {
      lineHeight: 1.6,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 0,
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// Role-based Route Component
const RoleBasedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ChatProvider>
          <UserProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<HomePage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="voice-chat" element={<VoiceChatPage />} />
                  <Route path="profile" element={<ProfilePage />} />

                  {/* Admin Routes */}
                  <Route path="admin/config" element={
                    <RoleBasedRoute allowedRoles={['super_admin']}>
                      <SuperAdminConfigPage />
                    </RoleBasedRoute>
                  } />
                  <Route path="admin/prompts" element={
                    <RoleBasedRoute allowedRoles={['super_admin', 'admin']}>
                      <PromptManagementPage />
                    </RoleBasedRoute>
                  } />
                  <Route path="admin/knowledge" element={
                    <RoleBasedRoute allowedRoles={['super_admin', 'admin']}>
                      <KnowledgeBankPage />
                    </RoleBasedRoute>
                  } />
                  <Route path="admin/users" element={
                    <RoleBasedRoute allowedRoles={['super_admin', 'admin']}>
                      <UserManagementPage />
                    </RoleBasedRoute>
                  } />
                  <Route path="admin/analytics" element={
                    <RoleBasedRoute allowedRoles={['super_admin', 'admin']}>
                      <AnalyticsPage />
                    </RoleBasedRoute>
                  } />
                  <Route path="admin/loans" element={
                    <RoleBasedRoute allowedRoles={['super_admin', 'admin', 'tpb']}>
                      <LoanManagementPage />
                    </RoleBasedRoute>
                  } />

                  {/* Subscription Routes */}
                  <Route path="subscription-plans" element={
                    <RoleBasedRoute allowedRoles={['super_admin', 'admin']}>
                      <SubscriptionPlansScreen />
                    </RoleBasedRoute>
                  } />
                  <Route path="manage-admin-subscriptions" element={
                    <RoleBasedRoute allowedRoles={['super_admin']}>
                      <ManageAdminSubscriptionsScreen />
                    </RoleBasedRoute>
                  } />
                  <Route path="subscribe" element={
                    <RoleBasedRoute allowedRoles={['admin']}>
                      <SubscribeScreen />
                    </RoleBasedRoute>
                  } />
                  <Route path="usage" element={<UsageDashboard />} />
                  <Route path="admin-dashboard" element={
                    <RoleBasedRoute allowedRoles={['system_admin']}>
                      <SystemAdminDashboard />
                    </RoleBasedRoute>
                  } />
                </Route>

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Router>
          </UserProvider>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;