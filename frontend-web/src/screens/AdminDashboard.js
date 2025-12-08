import React, { useState } from 'react';
import {
  Container,
  Box,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Typography,
  Paper,
} from '@mui/material';
import {
  People as PeopleIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import UserManagementTab from '../components/admin/UserManagementTab';
import PlanManagementTab from '../components/admin/PlanManagementTab';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Admin Header */}
      <AppBar position="static" sx={{ bgcolor: '#6200EE' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            System Admin Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Tabs Navigation */}
      <Paper sx={{ borderRadius: 0, boxShadow: 'none', borderBottom: '1px solid #ddd' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ bgcolor: 'white' }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            icon={<PeopleIcon />}
            label="User Management"
            iconPosition="start"
            sx={{ textTransform: 'none', fontSize: '1rem' }}
          />
          <Tab
            icon={<CreditCardIcon />}
            label="Plan Management"
            iconPosition="start"
            sx={{ textTransform: 'none', fontSize: '1rem' }}
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {activeTab === 0 && <UserManagementTab />}
          {activeTab === 1 && <PlanManagementTab />}
        </Container>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
