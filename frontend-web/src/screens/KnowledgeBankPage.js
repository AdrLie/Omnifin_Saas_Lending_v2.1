import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
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
  Tabs,
  Tab,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Upload as UploadIcon,
  Folder as FolderIcon,
  Description as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as DocIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { knowledgeBankService } from '../services/knowledgeBankService';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const KnowledgeBankPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');

  const categories = [
    'all',
    'loan_documents',
    'compliance',
    'templates',
    'policies',
    'training',
    'marketing'
  ];

  const fileTypes = {
    'pdf': PdfIcon,
    'doc': DocIcon,
    'docx': DocIcon,
    'txt': FileIcon,
    'jpg': ImageIcon,
    'jpeg': ImageIcon,
    'png': ImageIcon
  };

  useEffect(() => {
    loadKnowledgeBank();
  }, [currentFolder]);

  const loadKnowledgeBank = async () => {
    try {
      setLoading(true);
      const data = await knowledgeBankService.getDocuments(currentFolder);
      setDocuments(data.documents || []);
      setFolders(data.folders || []);
    } catch (err) {
      setError('Failed to load knowledge bank');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      setLoading(true);
      setError(null);
      
      for (const file of files) {
        await knowledgeBankService.uploadDocument(file, currentFolder, selectedCategory);
      }
      
      setSuccess('Files uploaded successfully!');
      setUploadDialogOpen(false);
      loadKnowledgeBank();
    } catch (err) {
      setError('Failed to upload files');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      setLoading(true);
      await knowledgeBankService.createFolder(newFolderName, currentFolder);
      setSuccess('Folder created successfully!');
      setFolderDialogOpen(false);
      setNewFolderName('');
      loadKnowledgeBank();
    } catch (err) {
      setError('Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      setLoading(true);
      await knowledgeBankService.deleteDocument(id);
      setSuccess('Document deleted successfully!');
      loadKnowledgeBank();
    } catch (err) {
      setError('Failed to delete document');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this folder and all its contents?')) {
      return;
    }

    try {
      setLoading(true);
      await knowledgeBankService.deleteFolder(id);
      setSuccess('Folder deleted successfully!');
      loadKnowledgeBank();
    } catch (err) {
      setError('Failed to delete folder');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setViewDialogOpen(true);
  };

  const handleDownloadDocument = async (document) => {
    try {
      const url = await knowledgeBankService.getDocumentUrl(document.id);
      window.open(url, '_blank');
    } catch (err) {
      setError('Failed to download document');
    }
  };

  const getFileIcon = (fileType) => {
    const IconComponent = fileTypes[fileType.toLowerCase()] || FileIcon;
    return <IconComponent />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'loan_documents': 'primary',
      'compliance': 'warning',
      'templates': 'info',
      'policies': 'error',
      'training': 'success',
      'marketing': 'secondary'
    };
    return colors[category] || 'default';
  };

  const getCategoryLabel = (category) => {
    if (category === 'all') return 'All Categories';
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={3}>
        {/* Header */}
        <Box sx={{ p: 4, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                Knowledge Bank
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage and organize documents, templates, and knowledge resources
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setFolderDialogOpen(true)}
                startIcon={<AddIcon />}
              >
                New Folder
              </Button>
              <Button
                variant="contained"
                onClick={() => setUploadDialogOpen(true)}
                startIcon={<UploadIcon />}
              >
                Upload Files
              </Button>
            </Box>
          </Box>

          {/* Search and Filter */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search documents..."
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
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {getCategoryLabel(category)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        {/* Breadcrumb Navigation */}
        {currentFolder && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Breadcrumbs>
              <Link
                component="button"
                variant="body2"
                onClick={() => setCurrentFolder(null)}
                sx={{ cursor: 'pointer' }}
              >
                Knowledge Bank
              </Link>
              <Typography variant="body2" color="text.primary">
                {folders.find(f => f.id === currentFolder)?.name || 'Unknown Folder'}
              </Typography>
            </Breadcrumbs>
          </Box>
        )}

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Files" icon={<FolderIcon />} />
          <Tab label="Documents" icon={<FileIcon />} />
          <Tab label="Images" icon={<ImageIcon />} />
          <Tab label="Templates" icon={<FolderIcon />} />
        </Tabs>

        {/* All Files Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Folders */}
            {folders.map((folder) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={folder.id}>
                <Card
                  elevation={3}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'grey.50' }
                  }}
                  onClick={() => setCurrentFolder(folder.id)}
                >
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <FolderIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" noWrap>
                        {folder.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {folder.file_count} files
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {/* Documents */}
            {documents.map((document) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={document.id}>
                <Card elevation={3}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={document.thumbnail_url || '/document-placeholder.png'}
                    alt={document.name}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {getFileIcon(document.file_type)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>
                          {document.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(document.file_size)} • {new Date(document.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Chip
                      label={getCategoryLabel(document.category)}
                      color={getCategoryColor(document.category)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDocument(document)}
                        color="primary"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDownloadDocument(document)}
                        color="secondary"
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteDocument(document.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {folders.length === 0 && documents.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No files found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload documents or create folders to get started
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Other tabs would show filtered content */}
        {[1, 2, 3].map((index) => (
          <TabPanel key={index} value={tabValue} index={index}>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Filtered content for tab {index} will be displayed here
            </Typography>
          </TabPanel>
        ))}

        {/* Upload Statistics */}
        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <Card elevation={0} sx={{ bgcolor: 'grey.50' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary">
                    {documents.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Documents
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card elevation={0} sx={{ bgcolor: 'grey.50' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="success.main">
                    {folders.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Folders
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card elevation={0} sx={{ bgcolor: 'grey.50' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="info.main">
                    {documents.reduce((total, doc) => total + doc.file_size, 0) / (1024 * 1024).toFixed(2)} MB
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Storage Used
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card elevation={0} sx={{ bgcolor: 'grey.50' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="warning.main">
                    {documents.filter(doc => new Date(doc.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This Week
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Upload Documents
          <IconButton
            onClick={() => setUploadDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                {categories.filter(cat => cat !== 'all').map((category) => (
                  <MenuItem key={category} value={category}>
                    {getCategoryLabel(category)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<UploadIcon />}
            >
              Choose Files
              <input
                type="file"
                multiple
                hidden
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xlsx"
              />
            </Button>
            
            <Typography variant="caption" color="text.secondary">
              Supported formats: PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, XLSX
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Folder Dialog */}
      <Dialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Create New Folder
          <IconButton
            onClick={() => setFolderDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            sx={{ mt: 2 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFolderDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder} variant="contained" disabled={!newFolderName.trim()}>
            Create Folder
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedDocument?.name}
          <IconButton
            onClick={() => setViewDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              {selectedDocument.file_type.toLowerCase() === 'pdf' ? (
                <iframe
                  src={selectedDocument.preview_url}
                  width="100%"
                  height="600"
                  style={{ border: 'none' }}
                  title={selectedDocument.name}
                />
              ) : (
                <img
                  src={selectedDocument.preview_url}
                  alt={selectedDocument.name}
                  style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => handleDownloadDocument(selectedDocument)}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default KnowledgeBankPage;