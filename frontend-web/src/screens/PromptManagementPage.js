import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  PlayArrow as TestIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  SmartToy as AIIcon
} from '@mui/icons-material';
import { promptService } from '../services/promptService';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const PromptManagementPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [currentPrompt, setCurrentPrompt] = useState({
    id: null,
    name: '',
    category: 'general',
    content: '',
    description: '',
    variables: [],
    is_active: true,
    version: 1
  });
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testVariables, setTestVariables] = useState({});
  const [testResult, setTestResult] = useState('');

  const categories = [
    'general',
    'loan_application',
    'customer_service',
    'document_analysis',
    'compliance',
    'marketing',
    'onboarding'
  ];

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const data = await promptService.getAllPrompts();
      setPrompts(data);
    } catch (err) {
      setError('Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDialogOpen = (mode = 'create', prompt = null) => {
    setDialogMode(mode);
    if (mode === 'edit' && prompt) {
      setCurrentPrompt(prompt);
    } else {
      setCurrentPrompt({
        id: null,
        name: '',
        category: 'general',
        content: '',
        description: '',
        variables: [],
        is_active: true,
        version: 1
      });
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setCurrentPrompt({
      id: null,
      name: '',
      category: 'general',
      content: '',
      description: '',
      variables: [],
      is_active: true,
      version: 1
    });
  };

  const handleSavePrompt = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (dialogMode === 'create') {
        await promptService.createPrompt(currentPrompt);
        setSuccess('Prompt created successfully!');
      } else {
        await promptService.updatePrompt(currentPrompt.id, currentPrompt);
        setSuccess('Prompt updated successfully!');
      }
      
      handleDialogClose();
      loadPrompts();
    } catch (err) {
      setError(err.message || 'Failed to save prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrompt = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prompt?')) {
      return;
    }
    
    try {
      setLoading(true);
      await promptService.deletePrompt(id);
      setSuccess('Prompt deleted successfully!');
      loadPrompts();
    } catch (err) {
      setError('Failed to delete prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleTestPrompt = (prompt) => {
    // Extract variables from prompt content (format: {{variable_name}})
    const variableMatches = prompt.content.match(/\{\{(\w+)\}\}/g) || [];
    const variables = [...new Set(variableMatches.map(match => match.replace(/[{}]/g, '')))];
    
    setCurrentPrompt(prompt);
    setTestVariables(variables.reduce((acc, varName) => ({ ...acc, [varName]: '' }), {}));
    setTestResult('');
    setTestDialogOpen(true);
  };

  const handleRunTest = async () => {
    try {
      setLoading(true);
      let testContent = currentPrompt.content;
      
      // Replace variables with test values
      Object.entries(testVariables).forEach(([key, value]) => {
        testContent = testContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      
      const result = await promptService.testPrompt(testContent);
      setTestResult(result.response);
    } catch (err) {
      setError('Failed to test prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = async (prompt) => {
    try {
      const copiedPrompt = {
        ...prompt,
        id: null,
        name: `${prompt.name} (Copy)`,
        version: 1
      };
      
      await promptService.createPrompt(copiedPrompt);
      setSuccess('Prompt copied successfully!');
      loadPrompts();
    } catch (err) {
      setError('Failed to copy prompt');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'general': 'default',
      'loan_application': 'primary',
      'customer_service': 'secondary',
      'document_analysis': 'info',
      'compliance': 'warning',
      'marketing': 'success',
      'onboarding': 'error'
    };
    return colors[category] || 'default';
  };

  const getCategoryLabel = (category) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={3}>
        <Box sx={{ p: 4, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              AI Prompt Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and customize AI prompts for different use cases
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => handleDialogOpen('create')}
            startIcon={<AddIcon />}
          >
            Create Prompt
          </Button>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Prompts" icon={<AIIcon />} />
          <Tab label="Loan Application" icon={<AIIcon />} />
          <Tab label="Customer Service" icon={<AIIcon />} />
          <Tab label="Document Analysis" icon={<AIIcon />} />
        </Tabs>

        {/* All Prompts Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {prompts.map((prompt) => (
              <Grid item xs={12} md={6} key={prompt.id}>
                <Card elevation={3}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {prompt.name}
                        </Typography>
                        <Chip
                          label={getCategoryLabel(prompt.category)}
                          color={getCategoryColor(prompt.category)}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleTestPrompt(prompt)}
                          color="primary"
                        >
                          <TestIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleCopyPrompt(prompt)}
                          color="secondary"
                        >
                          <CopyIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDialogOpen('edit', prompt)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeletePrompt(prompt.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {prompt.description}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Version: {prompt.version} • Status: 
                      </Typography>
                      <Chip
                        label={prompt.is_active ? 'Active' : 'Inactive'}
                        color={prompt.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    
                    {prompt.variables.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Variables: {prompt.variables.join(', ')}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
            
            {prompts.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <AIIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No prompts found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create your first AI prompt to get started
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Category-specific tabs would show filtered prompts */}
        {[1, 2, 3].map((index) => (
          <TabPanel key={index} value={tabValue} index={index}>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Prompts for {categories[index]} category will be displayed here
            </Typography>
          </TabPanel>
        ))}

        {/* Save Button */}
        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', textAlign: 'right' }}>
          <Button
            variant="contained"
            onClick={() => window.location.reload()} // Refresh to see changes
            startIcon={<SaveIcon />}
          >
            Apply Changes
          </Button>
        </Box>
      </Paper>

      {/* Prompt Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create New Prompt' : 'Edit Prompt'}
          <IconButton
            onClick={handleDialogClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              fullWidth
              label="Prompt Name"
              value={currentPrompt.name}
              onChange={(e) => setCurrentPrompt({ ...currentPrompt, name: e.target.value })}
              required
            />
            
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={currentPrompt.category}
                onChange={(e) => setCurrentPrompt({ ...currentPrompt, category: e.target.value })}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {getCategoryLabel(category)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={currentPrompt.description}
              onChange={(e) => setCurrentPrompt({ ...currentPrompt, description: e.target.value })}
            />
            
            <TextField
              fullWidth
              label="Prompt Content"
              multiline
              rows={8}
              value={currentPrompt.content}
              onChange={(e) => setCurrentPrompt({ ...currentPrompt, content: e.target.value })}
              placeholder="Use {{variable_name}} for dynamic content"
              required
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={currentPrompt.is_active}
                  onChange={(e) => setCurrentPrompt({ ...currentPrompt, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSavePrompt} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save Prompt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Test Prompt: {currentPrompt.name}
          <IconButton
            onClick={() => setTestDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            {Object.keys(testVariables).length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Test Variables
                </Typography>
                {Object.entries(testVariables).map(([key, value]) => (
                  <TextField
                    key={key}
                    fullWidth
                    label={key}
                    value={value}
                    onChange={(e) => setTestVariables({ ...testVariables, [key]: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                ))}
                <Button
                  variant="contained"
                  onClick={handleRunTest}
                  disabled={loading}
                  startIcon={<TestIcon />}
                >
                  {loading ? <CircularProgress size={24} /> : 'Run Test'}
                </Button>
              </Box>
            )}
            
            {testResult && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Test Result
                </Typography>
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {testResult}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PromptManagementPage;