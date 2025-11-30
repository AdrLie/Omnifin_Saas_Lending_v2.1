import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
  Button,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Send as SendIcon,
  Mic as MicIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  MoreVert as MoreVertIcon,
  SmartToy as AIIcon,
  Person as UserIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';

const ChatPage = () => {
  const { user } = useAuth();
  const { startConversation, sendMessage, isLoading, activeConversation, getConversation } = useChat();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const suggestedPrompts = [
    'What loan options are available for small businesses?',
    'Help me understand the loan application process',
    'What documents do I need for a mortgage?',
    'Compare different loan interest rates',
    'How can I improve my credit score?'
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const startedRef = useRef(false);

  // trigger startNewChat once on first render (first page load) without useEffect
  if (!startedRef.current) {
    startedRef.current = true;
    // defer to next tick to avoid running during render
    setTimeout(() => {
      startNewChat();
    }, 0);
  }

  const startNewChat = async () => {
    try {
      const newSessionId = await startConversation();
      setSessionId(newSessionId);
      const conv = getConversation(newSessionId);
      if (conv && conv.messages) {
        setMessages(conv.messages.map((msg, idx) => ({
          id: idx + 1,
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp || new Date().toISOString(),
          user: msg.sender === 'user' ? (user?.name || 'User') : 'Omnifin AI',
          ...msg
        })));
      } else {
        setMessages([]);
      }
    } catch (err) {
      setMessages([]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim() || isLoading || !sessionId) return;

    const userMessage = {
      id: Date.now(),
      content: message,
      sender: 'user',
      timestamp: new Date().toISOString(),
      user: user?.name || 'User'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setError(null);

    try {
      const aiResponse = await sendMessage(sessionId, message);
      const aiMessage = {
        id: Date.now() + 1,
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        user: 'Omnifin AI'
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setError('Failed to get response. Please try again.');
      const errorMessage = {
        id: Date.now() + 1,
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        user: 'Omnifin AI',
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // const handleFileUpload = async (event) => {
  //   const file = event.target.files[0];
  //   if (!file) return;

  //   try {
  //     setLoading(true);
  //     const response = await chatService.uploadDocument(file);
  //     const fileMessage = {
  //       id: Date.now(),
  //       content: `Document uploaded: ${file.name}`,
  //       sender: 'user',
  //       timestamp: new Date().toISOString(),
  //       user: user?.name || 'User',
  //       file: {
  //         name: file.name,
  //         size: file.size,
  //         type: file.type,
  //         url: response.url
  //       }
  //     };
  //     setMessages(prev => [...prev, fileMessage]);

  //     // Send automatic message about document analysis
  //     await handleSendMessage(`Please analyze this document: ${file.name}`);
  //   } catch (err) {
  //     setError('Failed to upload document. Please try again.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
    // Could add a toast notification here
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // const handleClearChat = async () => {
  //   try {
  //     await chatService.clearChatHistory();
  //     setMessages([]);
  //     handleMenuClose();
  //   } catch (err) {
  //     setError('Failed to clear chat history.');
  //   }
  // };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Grid container spacing={3}>
        {/* Chat Interface */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AIIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">Omnifin AI Assistant</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isLoading ? 'Typing...' : 'Online'}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={handleMenuOpen}>
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                {/* <MenuItem onClick={handleClearChat}>Clear Chat</MenuItem> */}
                <MenuItem onClick={() => window.open('/voice-chat', '_blank')}>Switch to Voice</MenuItem>
              </Menu>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {sessionId ? (
                <>
                  {messages.length === 0 && (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                      <AIIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Welcome to Omnifin AI Assistant
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        I'm here to help you with loan applications, financial advice, and document analysis.
                      </Typography>
                    </Box>
                  )}
                  <List>
                    {messages.map((message) => (
                      <ListItem key={message.id} sx={{ px: 0, alignItems: 'flex-start' }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: message.sender === 'ai' ? 'primary.main' : 'secondary.main' }}>
                            {message.sender === 'ai' ? <AIIcon /> : <UserIcon />}
                          </Avatar>
                        </ListItemAvatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle2">{message.user}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTimestamp(message.timestamp)}
                            </Typography>
                            {message.file && (
                              <Chip
                                size="small"
                                icon={<AttachFileIcon />}
                                label={message.file.name}
                                variant="outlined"
                              />
                            )}
                          </Box>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              bgcolor: message.sender === 'ai' ? 'grey.50' : 'primary.light',
                              color: message.sender === 'ai' ? 'text.primary' : 'primary.contrastText',
                              display: 'inline-block'
                            }}
                          >
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {message.content}
                            </Typography>
                          </Paper>
                          {message.sender === 'ai' && (
                            <Box sx={{ mt: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleCopyMessage(message.content)}
                                sx={{ mr: 1 }}
                              >
                                <CopyIcon fontSize="small" />
                              </IconButton>
                              {message.metadata?.downloadUrl && (
                                <IconButton
                                  size="small"
                                  onClick={() => window.open(message.metadata.downloadUrl, '_blank')}
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          )}
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                  {isLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Initializing conversation...</Typography>
                  <CircularProgress />
                </Box>
              )}
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Input */}
            {sessionId && (
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <IconButton onClick={() => fileInputRef.current?.click()}>
                    <AttachFileIcon />
                  </IconButton>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isLoading}
                    multiline
                    maxRows={4}
                  />
                  <IconButton
                    color="primary"
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !inputMessage.trim()}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Suggested Prompts */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Suggested Questions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {suggestedPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outlined"
                      size="small"
                      onClick={() => handleSendMessage(prompt)}
                      sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                    >
                      {prompt}
                    </Button>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<MicIcon />}
                    onClick={() => window.open('/voice-chat', '_blank')}
                    fullWidth
                  >
                    Switch to Voice Chat
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AttachFileIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    fullWidth
                  >
                    Upload Document
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Chat Statistics */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Today's Summary
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Messages
                    </Typography>
                    <Typography variant="body2">
                      {messages.length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Documents
                    </Typography>
                    <Typography variant="body2">
                      {messages.filter(m => m.file).length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Last Activity
                    </Typography>
                    <Typography variant="body2">
                      {messages.length > 0 ? formatTimestamp(messages[messages.length - 1].timestamp) : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* Hidden file input */}
      {/* <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
      /> */}
    </Container>
  );
};

export default ChatPage;