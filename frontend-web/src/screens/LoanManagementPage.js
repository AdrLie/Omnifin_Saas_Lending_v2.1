import React, { useState, useEffect, useCallback } from 'react';
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
  Tab,
  useTheme,
  useMediaQuery
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
import applicationProgressService from '../services/applicationProgressService';
import LoanStepContent from '../components/loan-steps/LoanStepContent';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>}
  </div>
);

const LoanManagementPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loans, setLoans] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

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
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadLoans = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (tabValue === 1) {
        params.tab = 'pending_review';
      } else if (tabValue === 2) {
        params.tab = 'approved';
      } else if (tabValue === 3) {
        params.tab = 'rejected';
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (typeFilter !== 'all') {
        params.loan_type = typeFilter;
      }
      if (debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim();
      }
      
      const data = await loanService.getAllLoans(params);
      
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
  }, [tabValue, statusFilter, typeFilter, debouncedSearchQuery]);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewLoan = async (loan) => {
    setSelectedLoan(loan);
    setDialogOpen(true);
    
    try {
      setLoadingProgress(true);
      const progressData = await applicationProgressService.getProgress(loan.id);
      setProgress(progressData);
      setActiveStep(progressData.current_step);
    } catch (err) {
      console.error('Failed to load progress:', err);
      setActiveStep(getCurrentStep(loan.status));
    } finally {
      setLoadingProgress(false);
    }
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
    if (!status) return 'Unknown';
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getTypeLabel = (type) => {
    if (!type) return 'Unknown';
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

  const totalApplications = Array.isArray(loans) ? loans.length : 0;
  const approvedCount = Array.isArray(loans) ? loans.filter(l => l.status === 'approved').length : 0;
  const totalValue = Array.isArray(loans) ? loans.reduce((sum, loan) => {
    const amount = parseFloat(loan?.loan_amount || loan?.amount || 0);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0) : 0;
  const approvalRate = totalApplications > 0 ? Math.round((approvedCount / totalApplications) * 100) : 0;

  const renderTable = (data) => (
    <>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>ID</TableCell>
              <TableCell>Applicant</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Loan Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length > 0 ? (
              data
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      #{loan.id || loan.application_number}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {(loan.applicant_name || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                            {loan.applicant_name || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 120 }}>
                            {loan.applicant_email || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Chip
                        label={getTypeLabel(loan.loan_type || loan.loan_purpose)}
                        color="info"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(loan.loan_amount || loan.amount || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(loan.status)}
                        color={getStatusColor(loan.status)}
                        size="small"
                        sx={{ maxWidth: { xs: 80, sm: 'auto' } }}
                      />
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
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
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No applications found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />
    </>
  );

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
      <Paper elevation={3}>
        <Box sx={{ p: { xs: 2, md: 4 }, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            gap: 2,
            mb: 3 
          }}>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                Loan Management
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                Manage loan applications, review process, and approval workflow
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => window.open('/api/loans/export', '_blank')}
              fullWidth={isMobile}
            >
              Export Data
            </Button>
          </Box>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={2}>
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

        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ m: 2 }}>{success}</Alert>}

        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab label="All" icon={<ApplicationIcon />} iconPosition="start" />
            <Tab label="Pending" icon={<PendingIcon />} iconPosition="start" />
            <Tab label="Approved" icon={<ApproveIcon />} iconPosition="start" />
            <Tab label="Rejected" icon={<RejectIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {renderTable(loans)}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderTable(loans)}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {renderTable(loans)}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {renderTable(loans)}
        </TabPanel>

        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pr: 6 }}>
          Loan Application Details
          <IconButton
            onClick={() => setDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedLoan && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Application Progress
                </Typography>
                <Box sx={{ overflowX: 'auto', pb: 1 }}>
                  <Stepper activeStep={activeStep} alternativeLabel sx={{ minWidth: isMobile ? '600px' : 'auto' }}>
                    {steps.map((label, index) => (
                      <Step key={label}>
                        <StepLabel
                          StepIconProps={{
                            sx: {
                              color: index <= activeStep ? 'primary.main' : 'grey.400',
                              '&.Mui-active': {
                                color: 'primary.main',
                              },
                              '&.Mui-completed': {
                                color: 'success.main',
                              },
                            }
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: index === activeStep ? 600 : 400,
                              color: index <= activeStep ? 'text.primary' : 'text.secondary'
                            }}
                          >
                            {label}
                          </Typography>
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>

                <Box sx={{ mt: 4, p: { xs: 2, md: 3 }, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <LoanStepContent
                    activeStep={activeStep}
                    loan={selectedLoan}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                    onUpdateStatus={handleUpdateStatus}
                  />
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column-reverse', sm: 'row' },
                  justifyContent: 'space-between', 
                  gap: 2,
                  mt: 3 
                }}>
                  <Button
                    disabled={activeStep === 0}
                    fullWidth={isMobile}
                    variant="outlined"
                    onClick={async () => {
                      const newStep = activeStep - 1;
                      setActiveStep(newStep);
                      try {
                        await applicationProgressService.setCurrentStep(selectedLoan.id, newStep);
                      } catch (err) {
                        console.error('Failed to update step:', err);
                      }
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth={isMobile}
                    disabled={activeStep === steps.length - 1}
                    onClick={async () => {
                      const newStep = activeStep + 1;
                      setActiveStep(newStep);
                      try {
                        await applicationProgressService.setCurrentStep(selectedLoan.id, newStep);
                        const progressData = await applicationProgressService.getProgress(selectedLoan.id);
                        setProgress(progressData);
                      } catch (err) {
                        console.error('Failed to update step:', err);
                      }
                    }}
                  >
                    Next Step
                  </Button>
                </Box>
              </Box>

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
                          <Typography variant="body2">#{selectedLoan.id || selectedLoan.application_number}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Type</Typography>
                          <Typography variant="body2">{getTypeLabel(selectedLoan.loan_type || selectedLoan.loan_purpose)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Amount</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(selectedLoan.loan_amount || selectedLoan.amount || 0)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Interest Rate</Typography>
                          <Typography variant="body2">{selectedLoan.interest_rate || 'N/A'}%</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Term</Typography>
                          <Typography variant="body2">{selectedLoan.loan_term || selectedLoan.term_months || 'N/A'} months</Typography>
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
                          <Typography variant="body2">{selectedLoan.applicant_name || 'Unknown'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Email</Typography>
                          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{selectedLoan.applicant_email || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Phone</Typography>
                          <Typography variant="body2">{selectedLoan.applicant_phone || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Credit Score</Typography>
                          <Typography variant="body2">{selectedLoan.credit_score || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Income</Typography>
                          <Typography variant="body2">
                            {selectedLoan.annual_income ? formatCurrency(selectedLoan.annual_income) + '/year' : 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ 
                mt: 3, 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2, 
                justifyContent: 'flex-end' 
              }}>
                {selectedLoan.status === 'under_review' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth={isMobile}
                      onClick={() => handleUpdateStatus(selectedLoan.id, 'approved')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      fullWidth={isMobile}
                      onClick={() => handleUpdateStatus(selectedLoan.id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {selectedLoan.status === 'submitted' && (
                  <Button
                    variant="contained"
                    fullWidth={isMobile}
                    onClick={() => handleUpdateStatus(selectedLoan.id, 'under_review')}
                  >
                    Start Review
                  </Button>
                )}
                {selectedLoan.status === 'approved' && (
                  <Button
                    variant="contained"
                    fullWidth={isMobile}
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