import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Divider,
  Avatar,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Chat as ChatIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Mic as MicIcon,
  MoreVert as MoreVertIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { chatService } from '../services/chatService';
import { format } from 'date-fns';

const ChatHistoryPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0); // 0: all, 1: active, 2: completed
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedConvForMenu, setSelectedConvForMenu] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const statusMap = {
        0: null, // all
        1: 'active',
        2: 'completed'
      };
      
      const params = {
        status: statusMap[tabValue],
        limit: 50,
        offset: 0
      };
      
      const data = await chatService.getUserConversations(params);
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [tabValue]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleViewConversation = async (conversation) => {
    try {
      setLoading(true);
      const data = await chatService.getConversationMessages(conversation.id);
      setSelectedConversation(data.conversation);
      setMessages(data.messages || []);
      setDialogOpen(true);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load conversation messages.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      await chatService.deleteConversation(conversationId);
      setConversations(conversations.filter(c => c.id !== conversationId));
      setDeleteConfirmOpen(false);
      setConversationToDelete(null);
      if (selectedConversation?.id === conversationId) {
        setDialogOpen(false);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('Failed to delete conversation.');
    }
  };

  const handleMenuOpen = (event, conversation) => {
    setAnchorEl(event.currentTarget);
    setSelectedConvForMenu(conversation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedConvForMenu(null);
  };

  const handleDeleteClick = (conversation) => {
    setConversationToDelete(conversation);
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const lastMessage = conv.last_message?.content?.toLowerCase() || '';
    const sessionId = conv.session_id?.toLowerCase() || '';
    
    return lastMessage.includes(query) || sessionId.includes(query);
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'primary';
      case 'completed': return 'success';
      case 'abandoned': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper ele.vation={3}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4">
              Chat History
            </Typography>
            <Chip 
              label={`${conversations.length} conversations`}
              color="primary"
              icon={<ChatIcon />}
            />
          </Box>

          <TextField
            fullWidth
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="All Conversations" />
            <Tab label="Active" />
            <Tab label="Completed" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredConversations.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <ChatIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No conversations found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start a new chat to see your conversation history here
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredConversations.map((conversation, index) => (
              <React.Fragment key={conversation.id}>
                <ListItem
                  secondaryAction={
                    <IconButton onClick={(e) => handleMenuOpen(e, conversation)}>
                      <MoreVertIcon />
                    </IconButton>
                  }
                  disablePadding
                >
                  <ListItemButton onClick={() => handleViewConversation(conversation)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                      <Avatar sx={{ bgcolor: conversation.is_voice_chat ? 'secondary.main' : 'primary.main' }}>
                        {conversation.is_voice_chat ? <MicIcon /> : <ChatIcon />}
                      </Avatar>
                      
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle1" noWrap>
                            {conversation.is_voice_chat ? 'Voice Chat' : 'Text Chat'}
                          </Typography>
                          <Chip 
                            label={conversation.status}
                            size="small"
                            color={getStatusColor(conversation.status)}
                          />
                          {conversation.is_voice_chat && (
                            <Chip label="Voice" size="small" icon={<MicIcon />} />
                          )}
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {conversation.last_message?.content || 'No messages yet'}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            <AccessTimeIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                            {formatDate(conversation.started_at)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {conversation.message_count} messages
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </ListItemButton>
                </ListItem>
                {index < filteredConversations.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Message Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedConversation?.is_voice_chat ? <MicIcon /> : <ChatIcon />}
              <Typography variant="h6">
                Conversation Details
              </Typography>
            </Box>
            <Chip 
              label={selectedConversation?.status}
              size="small"
              color={getStatusColor(selectedConversation?.status)}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Started: {formatDate(selectedConversation?.started_at)}
          </Typography>
        </DialogTitle>
        
        <DialogContent dividers>
          <List>
            {messages.map((message, index) => (
              <ListItem 
                key={message.id}
                sx={{
                  flexDirection: 'column',
                  alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  gap: 1
                }}
              >
                <Box
                  sx={{
                    maxWidth: '70%',
                    bgcolor: message.sender === 'user' ? 'primary.main' : 'grey.200',
                    color: message.sender === 'user' ? 'white' : 'text.primary',
                    borderRadius: 2,
                    p: 2
                  }}
                >
                  <Typography variant="body2">
                    {message.content}
                  </Typography>
                  {message.audio_url && (
                    <Box sx={{ mt: 1 }}>
                      <audio controls src={message.audio_url} style={{ width: '100%' }} />
                    </Box>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(message.created_at)}
                </Typography>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
          <Button 
            color="error" 
            onClick={() => handleDeleteClick(selectedConversation)}
            startIcon={<DeleteIcon />}
          >
            Delete Conversation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleViewConversation(selectedConvForMenu);
          handleMenuClose();
        }}>
          <ChatIcon sx={{ mr: 1 }} fontSize="small" />
          View Messages
        </MenuItem>
        <MenuItem onClick={() => handleDeleteClick(selectedConvForMenu)}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Conversation?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this conversation? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleDeleteConversation(conversationToDelete?.id)} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ChatHistoryPage;
