import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as UsersIcon,
  AttachMoney as MoneyIcon,
  Assignment as ApplicationsIcon,
  BarChart as ChartIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { analyticsService } from '../services/analyticsService';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const AnalyticsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    applications: {},
    users: {},
    revenue: {},
    performance: {}
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getAnalytics(timeRange);
      setAnalyticsData(data);
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  // Sample data for charts (in real implementation, this would come from API)
  const applicationTrendData = [
    { date: '2024-01', applications: 45, approvals: 32, rejections: 13 },
    { date: '2024-02', applications: 52, approvals: 38, rejections: 14 },
    { date: '2024-03', applications: 48, approvals: 35, rejections: 13 },
    { date: '2024-04', applications: 61, approvals: 45, rejections: 16 },
    { date: '2024-05', applications: 55, approvals: 42, rejections: 13 },
    { date: '2024-06', applications: 67, approvals: 51, rejections: 16 }
  ];

  const userActivityData = [
    { name: 'Mon', active: 120, new: 15 },
    { name: 'Tue', active: 132, new: 18 },
    { name: 'Wed', active: 101, new: 12 },
    { name: 'Thu', active: 134, new: 22 },
    { name: 'Fri', active: 90, new: 8 },
    { name: 'Sat', active: 65, new: 5 },
    { name: 'Sun', active: 45, new: 3 }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 45000, commissions: 8500 },
    { month: 'Feb', revenue: 52000, commissions: 9200 },
    { month: 'Mar', revenue: 48000, commissions: 7800 },
    { month: 'Apr', revenue: 61000, commissions: 11200 },
    { month: 'May', revenue: 55000, commissions: 9500 },
    { month: 'Jun', revenue: 67000, commissions: 12800 }
  ];

  const loanTypeDistribution = [
    { name: 'Personal Loans', value: 35, color: '#8884d8' },
    { name: 'Business Loans', value: 28, color: '#82ca9d' },
    { name: 'Mortgage Loans', value: 22, color: '#ffc658' },
    { name: 'Auto Loans', value: 15, color: '#ff7300' }
  ];

  const statusDistribution = [
    { name: 'Approved', value: 68, color: '#4caf50' },
    { name: 'Pending', value: 22, color: '#ff9800' },
    { name: 'Rejected', value: 10, color: '#f44336' }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={3}>
        {/* Header */}
        <Box sx={{ p: 4, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                Analytics Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Monitor platform performance, user activity, and business metrics
              </Typography>
            </Box>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={handleTimeRangeChange}
                label="Time Range"
              >
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="90d">Last 90 Days</MenuItem>
                <MenuItem value="1y">Last Year</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {loading && <CircularProgress sx={{ m: 4 }} />}

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" icon={<TrendingUpIcon />} />
          <Tab label="Applications" icon={<ApplicationsIcon />} />
          <Tab label="Users" icon={<UsersIcon />} />
          <Tab label="Revenue" icon={<MoneyIcon />} />
          <Tab label="Performance" icon={<ChartIcon />} />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          {/* KPI Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" color="primary">
                        {analyticsData.overview?.totalApplications || 328}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Applications
                      </Typography>
                    </Box>
                    <ApplicationsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label="+12.5%"
                      color="success"
                      size="small"
                      icon={<TrendingUpIcon />}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" color="success.main">
                        {analyticsData.overview?.approvedApplications || 245}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Approved Applications
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label="74.7%"
                      color="info"
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" color="info.main">
                        {analyticsData.overview?.activeUsers || 1.247}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Users
                      </Typography>
                    </Box>
                    <UsersIcon sx={{ fontSize: 40, color: 'info.main' }} />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label="+8.2%"
                      color="success"
                      size="small"
                      icon={<TrendingUpIcon />}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" color="warning.main">
                        ${analyticsData.overview?.revenue || 328.450}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Revenue
                      </Typography>
                    </Box>
                    <MoneyIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label="+15.3%"
                      color="success"
                      size="small"
                      icon={<TrendingUpIcon />}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Application Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={applicationTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="applications" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="approvals" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Loan Type Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={loanTypeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {loanTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Applications Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Application Status Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={statusDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Processing Time Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={applicationTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="applications" stroke="#8884d8" />
                      <Line type="monotone" dataKey="approvals" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Users Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    User Activity Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={userActivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="active" fill="#8884d8" name="Active Users" />
                      <Bar dataKey="new" fill="#82ca9d" name="New Users" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Revenue Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue & Commission Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue ($)" />
                      <Line type="monotone" dataKey="commissions" stroke="#82ca9d" name="Commissions ($)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Performance Metrics
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1">Average Response Time</Typography>
                      <Chip label="245ms" color="success" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1">Uptime</Typography>
                      <Chip label="99.8%" color="success" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1">Error Rate</Typography>
                      <Chip label="0.2%" color="info" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1">API Requests/min</Typography>
                      <Chip label="1,247" color="warning" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Business Metrics
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1">Conversion Rate</Typography>
                      <Chip label="74.7%" color="success" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1">Average Loan Amount</Typography>
                      <Chip label="$45,230" color="info" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1">Customer Satisfaction</Typography>
                      <Chip label="4.8/5" color="success" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1">Net Promoter Score</Typography>
                      <Chip label="72" color="warning" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AnalyticsPage;