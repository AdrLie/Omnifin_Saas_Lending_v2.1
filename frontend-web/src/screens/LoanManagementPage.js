import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  Tabs,
  Tab
} from '@mui/material';
import {
  Assignment as ApplicationIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  HourglassEmpty as PendingIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { loanService } from '../services/loanService';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const LoanManagementPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  const loanStatuses = [
    'submitted',
    'under_review',
    'documents_verified',
    'approved',
    'rejected',
    'funded',
    'closed'
  ];

  const loanTypes = [
    'personal',
    'business',
    'mortgage',
    'auto',
    'student',
    'home_equity'
  ];

  const steps = [
    'Application Submitted',
    'Initial Review',
    'Document Verification',
    'Credit Check',
    'Final Approval',
    'Funding'
  ];

  useEffect(() => {
    loadLoans();
  }, []);

  useEffect(() => {
    filterLoans();
  }, [loans, searchQuery, statusFilter, typeFilter]);

  const loadLoans = async () => {
    try {
      setLoading(true);
      const data = await loanService.getAllLoans();
      // Normalize response to an array. API may return { results: [...] } or { applications: [...] }
      let loansArray = [];
      if (Array.isArray(data)) {
        loansArray = data;
      } else if (data && Array.isArray(data.results)) {
        loansArray = data.results;
      } else if (data && Array.isArray(data.applications)) {
        loansArray = data.applications;
      } else if (data && Array.isArray(data.loans)) {
        loansArray = data.loans;
      } else {
        // If data is an object with keys like {applications, lenders, offers}, try to pick the first array-valued key
        for (const k of Object.keys(data || {})) {
          if (Array.isArray(data[k])) {
            loansArray = data[k];
            break;
          }
        }
      }

      setLoans(loansArray);
    } catch (err) {
      setError('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const filterLoans = () => {
    let filtered = loans;

    if (searchQuery) {
      filtered = filtered.filter(loan =>
        loan.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.applicant_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.id.toString().includes(searchQuery)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(loan => loan.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(loan => loan.loan_type === typeFilter);
    }

    setFilteredLoans(filtered);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewLoan = (loan) => {
    setSelectedLoan(loan);
    setActiveStep(getCurrentStep(loan.status));
    setDialogOpen(true);
  };

  const handleUpdateStatus = async (loanId, newStatus) => {
    try {
      setLoading(true);
      await loanService.updateLoanStatus(loanId, newStatus);
      setSuccess('Loan status updated successfully!');
      loadLoans();
      setDialogOpen(false);
    } catch (err) {
      setError('Failed to update loan status');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReviewNote = async (loanId, note) => {
    try {
      await loanService.addReviewNote(loanId, note);
      setSuccess('Review note added successfully!');
      loadLoans();
    } catch (err) {
      setError('Failed to add review note');
    }
  };

  const getCurrentStep = (status) => {
    const statusMap = {
      'submitted': 0,
      'under_review': 1,
      'documents_verified': 2,
      'credit_check': 3,
      'approved': 4,
      'rejected': 4,
      'funded': 5,
      'closed': 5
    };
    return statusMap[status] || 0;
  };

  const getStatusColor = (status) => {
    const colors = {
      'submitted': 'info',
      'under_review': 'warning',
      'documents_verified': 'info',
      'credit_check': 'warning',
      'approved': 'success',
      'rejected': 'error',
      'funded': 'success',
      'closed': 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getTypeLabel = (type) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Safe derived values to avoid rendering objects/arrays directly in JSX
  const totalApplications = Array.isArray(filteredLoans) ? filteredLoans.length : 0;
  const approvedCount = Array.isArray(filteredLoans) ? filteredLoans.filter(l => l.status === 'approved').length : 0;
  const totalValue = Array.isArray(filteredLoans) ? filteredLoans.reduce((sum, loan) => sum + (loan?.amount || 0), 0) : 0;
  const approvalRate = totalApplications > 0 ? Math.round((approvedCount / totalApplications) * 100) : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={3}>
        {/* Header */}
        <Box sx={{ p: 4, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                Loan Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage loan applications, review process, and approval workflow
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => window.open('/api/loans/export', '_blank')}
            >
              Export Data
            </Button>
          </Box>

          {/* Search and Filters */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search loans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  {loanStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Loan Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="Loan Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {loanTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {getTypeLabel(type)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Applications" icon={<ApplicationIcon />} />
          <Tab label="Pending Review" icon={<PendingIcon />} />
          <Tab label="Approved" icon={<ApproveIcon />} />
          <Tab label="Rejected" icon={<RejectIcon />} />
        </Tabs>

        {/* All Applications Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Applicant</TableCell>
                  <TableCell>Loan Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(filteredLoans || [])
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>#{loan.id}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {loan.applicant_name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{loan.applicant_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {loan.applicant_email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getTypeLabel(loan.loan_type)}
                          color="info"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(loan.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(loan.status)}
                          color={getStatusColor(loan.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {formatDate(loan.created_at)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleViewLoan(loan)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredLoans.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </TabPanel>

        {/* Other tabs would show filtered content */}
        {[1, 2, 3].map((index) => (
          <TabPanel key={index} value={tabValue} index={index}>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {index === 1 && 'Pending review applications will be displayed here'}
              {index === 2 && 'Approved applications will be displayed here'}
              {index === 3 && 'Rejected applications will be displayed here'}
            </Typography>
          </TabPanel>
        ))}

        {/* Statistics */}
        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <Card elevation={0} sx={{ bgcolor: 'grey.50' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary">
                    {totalApplications}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Applications
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card elevation={0} sx={{ bgcolor: 'grey.50' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="success.main">
                    {approvedCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card elevation={0} sx={{ bgcolor: 'grey.50' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="warning.main">
                    {formatCurrency(totalValue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Value
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card elevation={0} sx={{ bgcolor: 'grey.50' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="info.main">
                    {approvalRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approval Rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Loan Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Loan Application Details
          <IconButton
            onClick={() => setDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedLoan && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Application Progress */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Application Progress
                </Typography>
                <Stepper activeStep={activeStep} alternativeLabel>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>

              {/* Loan Information */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card elevation={1}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Loan Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Loan ID</Typography>
                          <Typography variant="body2">#{selectedLoan.id}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Type</Typography>
                          <Typography variant="body2">{getTypeLabel(selectedLoan.loan_type)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Amount</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(selectedLoan.amount)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Interest Rate</Typography>
                          <Typography variant="body2">{selectedLoan.interest_rate}%</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Term</Typography>
                          <Typography variant="body2">{selectedLoan.term_months} months</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card elevation={1}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Applicant Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Name</Typography>
                          <Typography variant="body2">{selectedLoan.applicant_name}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Email</Typography>
                          <Typography variant="body2">{selectedLoan.applicant_email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Phone</Typography>
                          <Typography variant="body2">{selectedLoan.applicant_phone}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Credit Score</Typography>
                          <Typography variant="body2">{selectedLoan.credit_score}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Income</Typography>
                          <Typography variant="body2">
                            {formatCurrency(selectedLoan.annual_income)}/year
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Status Actions */}
              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {selectedLoan.status === 'under_review' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleUpdateStatus(selectedLoan.id, 'approved')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => handleUpdateStatus(selectedLoan.id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {selectedLoan.status === 'submitted' && (
                  <Button
                    variant="contained"
                    onClick={() => handleUpdateStatus(selectedLoan.id, 'under_review')}
                  >
                    Start Review
                  </Button>
                )}
                {selectedLoan.status === 'approved' && (
                  <Button
                    variant="contained"
                    onClick={() => handleUpdateStatus(selectedLoan.id, 'funded')}
                  >
                    Mark as Funded
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LoanManagementPage;