import React, { useState, useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  Chip,
  Paper,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Chat,
  Mic,
  Person,
  Group,
  Analytics,
  Description,
  Settings,
  Logout,
  AdminPanelSettings,
  Psychology,
  School,
  CreditCard,
  Assessment,
  Subscriptions,
  SupervisorAccount,
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { ROUTES } from '../utils/constants';

const drawerWidth = 280;

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavigationItems = () => {
    const baseItems = [
      { text: 'Dashboard', icon: <Dashboard />, path: ROUTES.HOME },
      { text: 'AI Chat', icon: <Chat />, path: ROUTES.CHAT },
      { text: 'Voice Chat', icon: <Mic />, path: ROUTES.VOICE_CHAT },
      { text: 'Profile', icon: <Person />, path: ROUTES.PROFILE },
    ];

    const adminItems = [
      { text: 'User Management', icon: <Group />, path: ROUTES.USERS },
      { text: 'Analytics', icon: <Analytics />, path: ROUTES.ANALYTICS },
      { text: 'Loan Management', icon: <Description />, path: ROUTES.LOANS },
      { text: 'Subscribe', icon: <CreditCard />, path: ROUTES.SUBSCRIBE },
      { text: 'Usage Dashboard', icon: <Assessment />, path: ROUTES.USAGE },
    ];

    // For tbp, only show Analytics and Loan Management
    const tpbItems = [
      { text: 'Loan Management', icon: <Description />, path: ROUTES.LOANS },
    ];

    const superAdminItems = [
      { text: 'System Config', icon: <Settings />, path: ROUTES.CONFIG },
      { text: 'Prompt Management', icon: <Psychology />, path: ROUTES.PROMPTS },
      { text: 'Knowledge Bank', icon: <School />, path: ROUTES.KNOWLEDGE },
      { text: 'Admin Dashboard', icon: <AdminPanelSettings />, path: ROUTES.ADMIN },
      { text: 'Subscription Plans', icon: <Subscriptions />, path: ROUTES.SUBSCRIPTION_PLANS },
      { text: 'Manage Subscriptions', icon: <SupervisorAccount />, path: ROUTES.MANAGE_ADMIN_SUBSCRIPTIONS },
    ];

    const systemAdminItems = [
      { text: 'System Admin Panel', icon: <Settings />, path: ROUTES.ADMIN_DASHBOARD },
      { text: 'Profile', icon: <Person />, path: ROUTES.PROFILE },
    ];

    let items = [...baseItems];

    if (user?.role === 'admin' || user?.role === 'superadmin') {
      items = [...items, ...adminItems];
    } else if (user?.role === 'tpb') {
      items = [...items, ...tpbItems];
    } else if (user?.role === 'system_admin') {
      items = [...systemAdminItems];
    }

    if (user?.role === 'superadmin') {
      items = [...items, ...superAdminItems];
    }

    return items;
  };

  const navigationItems = getNavigationItems();

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Brand Header with Gradient */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100px',
            height: '100px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            transform: 'translate(30%, -30%)',
          },
        }}
      >
        <Typography 
          variant="h5" 
          component="div" 
          sx={{ 
            fontWeight: 700, 
            letterSpacing: 1,
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          Omnifin
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block',
            textAlign: 'center',
            opacity: 0.9,
            mt: 0.5,
            position: 'relative',
            zIndex: 1,
          }}
        >
          Lending Platform
        </Typography>
      </Box>

      {/* User Info Card */}
      <Paper
        elevation={0}
        sx={{
          m: 2,
          p: 2,
          bgcolor: 'rgba(102, 126, 234, 0.05)',
          border: '1px solid rgba(102, 126, 234, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: '#667eea',
              fontWeight: 600,
              fontSize: 20,
            }}
          >
            {user?.first_name?.[0] || user?.email?.[0] || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.first_name || user?.email?.split('@')[0] || 'User'}
            </Typography>
            <Chip
              label={user?.role?.toUpperCase() || 'USER'}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.688rem',
                fontWeight: 600,
                bgcolor: 'rgba(102, 126, 234, 0.15)',
                color: '#667eea',
                mt: 0.5,
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Navigation Items */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2 }}>
        <Typography
          variant="caption"
          sx={{
            px: 2,
            py: 1,
            display: 'block',
            color: 'text.secondary',
            fontWeight: 600,
            textTransform: 'uppercase',
            fontSize: '0.688rem',
            letterSpacing: 1,
          }}
        >
          Menu
        </Typography>
        <List sx={{ py: 0 }}>
          {navigationItems.map((item, index) => {
            const isSelected = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => {
                    navigate(item.path);
                    if (mobileOpen) setMobileOpen(false);
                  }}
                  sx={{
                    mb: 0.5,
                    transition: 'all 0.2s ease',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(102, 126, 234, 0.15)',
                      color: '#667eea',
                      '&:hover': {
                        bgcolor: 'rgba(102, 126, 234, 0.2)',
                      },
                      '& .MuiListItemIcon-root': {
                        color: '#667eea',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(102, 126, 234, 0.08)',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isSelected ? '#667eea' : 'text.secondary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.938rem',
                      fontWeight: isSelected ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
          © 2025 Omnifin
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
              }}
            >
              {navigationItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                display: { xs: 'none', sm: 'block' }, 
                opacity: 0.9,
              }}
            >
              Welcome back, {user?.first_name || user?.email?.split('@')[0] || 'User'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            <Tooltip title="Account settings">
              <IconButton 
                onClick={handleProfileMenuOpen} 
                sx={{ 
                  p: 0.5,
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    border: '2px solid rgba(255, 255, 255, 0.5)',
                  },
                }}
              >
                <Avatar 
                  sx={{ 
                    width: { xs: 36, sm: 40 }, 
                    height: { xs: 36, sm: 40 },
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    fontWeight: 600,
                  }}
                >
                  {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.15))',
            mt: 1.5,
            minWidth: 220,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1.5,
            },
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {user?.first_name || user?.email?.split('@')[0] || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <MenuItem 
          onClick={() => navigate('/profile')}
          sx={{
            py: 1.5,
            '&:hover': {
              bgcolor: 'rgba(102, 126, 234, 0.08)',
            },
          }}
        >
          <Avatar sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)', color: '#667eea' }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>Profile</Typography>
        </MenuItem>
        <MenuItem 
          onClick={() => navigate('/settings')}
          sx={{
            py: 1.5,
            '&:hover': {
              bgcolor: 'rgba(102, 126, 234, 0.08)',
            },
          }}
        >
          <ListItemIcon>
            <Settings fontSize="small" sx={{ color: 'text.secondary' }} />
          </ListItemIcon>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>Settings</Typography>
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem 
          onClick={handleLogout}
          sx={{
            py: 1.5,
            color: 'error.main',
            '&:hover': {
              bgcolor: 'rgba(244, 67, 54, 0.08)',
            },
          }}
        >
          <ListItemIcon>
            <Logout fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>Logout</Typography>
        </MenuItem>
      </Menu>

      {/* Desktop Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid rgba(0, 0, 0, 0.08)',
              bgcolor: '#fafafa',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            bgcolor: '#fafafa',
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: '#f8f9fa',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;