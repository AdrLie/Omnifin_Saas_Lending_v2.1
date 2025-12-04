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
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Button,
  Menu,
  MenuItem,
  Drawer,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Send as SendIcon,
  Mic as MicIcon,
  AttachFile as AttachFileIcon,
  ContentCopy as CopyIcon,
  MoreVert as MoreVertIcon,
  SmartToy as AIIcon,
  Person as UserIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';

const ChatPage = () => {
  const { user } = useAuth();
  const { startConversation, sendMessage, isLoading, activeConversation, getConversation } = useChat();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // State for mobile sidebar drawer
  const [mobileOpen, setMobileOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const startedRef = useRef(false);

  const suggestedPrompts = [
    'What loan options are available for small businesses?',
    'Help me understand the loan application process',
    'What documents do I need for a mortgage?',
    'Compare different loan interest rates',
    'How can I improve my credit score?'
  ];

  const loanApplicationTemplates = [
    {
      title: 'Business Loan',
      message: 'I want to apply for a loan: $50,000 for business expansion, 24 months term, at 7.5% interest rate'
    },
    {
      title: 'Personal Loan',
      message: 'I want to apply for a loan: $25,000 for personal use, 36 months term, at 8% interest rate'
    },
    {
      title: 'Home Renovation',
      message: 'I want to apply for a loan: $75,000 for home renovation, 48 months term, at 6.5% interest rate'
    }
  ];

  const handleTemplateClick = (template) => {
    setInputMessage(template.message);
    if (isMobile) setMobileOpen(false); // Close drawer on mobile selection
  };

  const handlePromptClick = (prompt) => {
    handleSendMessage(prompt);
    if (isMobile) setMobileOpen(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!startedRef.current) {
    startedRef.current = true;
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

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Reusable Sidebar Content for both Desktop (Grid) and Mobile (Drawer)
  const SidebarContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      {/* Mobile Header for Drawer */}
      {isMobile && (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Tools & Templates</Typography>
          <IconButton onClick={() => setMobileOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      <Box sx={{ p: isMobile ? 2 : 0, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {/* Suggested Prompts */}
        <Card variant="outlined">
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Suggested Questions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {suggestedPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  size="small"
                  onClick={() => handlePromptClick(prompt)}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left', textTransform: 'none' }}
                >
                  {prompt}
                </Button>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Loan Application Templates */}
        <Card variant="outlined">
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Quick Loan App
            </Typography>
            <Typography variant="caption" color="text.secondary" paragraph>
              Click to populate message
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {loanApplicationTemplates.map((template, index) => (
                <Button
                  key={index}
                  variant="contained"
                  size="small"
                  onClick={() => handleTemplateClick(template)}
                  sx={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    bgcolor: 'primary.main',
                    textTransform: 'none'
                  }}
                >
                  {template.title}
                </Button>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card variant="outlined">
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<MicIcon />}
                onClick={() => window.open('/voice-chat', '_blank')}
                fullWidth
                sx={{ textTransform: 'none' }}
              >
                Voice Chat
              </Button>
              <Button
                variant="outlined"
                startIcon={<AttachFileIcon />}
                onClick={() => fileInputRef.current?.click()}
                fullWidth
                sx={{ textTransform: 'none' }}
              >
                Upload Document
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  return (
    <Container 
      maxWidth="xl" 
      sx={{ 
        height: { xs: 'calc(100dvh - 8px)', md: 'calc(100vh - 18px)' }, // Account for padding
        py: { xs: 1, md: 1 }, 
        px: { xs: 1, md: 1 },
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
    >
      <Grid container spacing={2} sx={{ flex: 1, maxHeight: '100%', overflow: 'hidden' }}>
        
        {/* Chat Interface - Takes full width on mobile, 8 cols on desktop */}
        <Grid item xs={12} md={8} lg={9} sx={{ height: '100%' }}>
          <Paper 
            elevation={3} 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: { xs: 2, md: 3 }
            }}
          >
            {/* Chat Header */}
            <Box sx={{ 
              p: 2, 
              borderBottom: 1, 
              borderColor: 'divider', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              bgcolor: 'background.paper'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {/* Mobile: Hamburger menu to open sidebar */}
                {isMobile && (
                  <IconButton onClick={() => setMobileOpen(true)} edge="start" color="primary">
                    <MenuIcon />
                  </IconButton>
                )}
                
                <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                  <AIIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>
                    Omnifin AI
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                    <Typography variant="caption" color="text.secondary">
                      {isLoading ? 'Typing...' : 'Online'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box>
                <IconButton onClick={handleMenuOpen}>
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={() => window.open('/voice-chat', '_blank')}>Switch to Voice</MenuItem>
                </Menu>
              </Box>
            </Box>

            {/* Messages Area */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f8f9fa' }}>
              {sessionId ? (
                <>
                  {messages.length === 0 && (
                    <Box sx={{ textAlign: 'center', mt: 4, opacity: 0.7 }}>
                      <AIIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2, opacity: 0.5 }} />
                      <Typography variant="h6" gutterBottom>How can I help you today?</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ask about loans, documents, or financial advice.
                      </Typography>
                    </Box>
                  )}
                  <List>
                    {messages.map((message) => (
                      <ListItem 
                        key={message.id} 
                        sx={{ 
                          flexDirection: 'column', 
                          alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                          gap: 0.5,
                          pb: 2
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1, 
                          flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                          maxWidth: '100%'
                        }}>
                          <Avatar sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: message.sender === 'ai' ? 'primary.main' : 'secondary.main',
                            fontSize: '0.875rem'
                          }}>
                            {message.sender === 'ai' ? <AIIcon fontSize="small" /> : <UserIcon fontSize="small" />}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">
                            {message.sender === 'ai' ? 'Omnifin AI' : 'You'} • {formatTimestamp(message.timestamp)}
                          </Typography>
                        </Box>

                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            bgcolor: message.sender === 'ai' ? 'white' : 'primary.main',
                            color: message.sender === 'ai' ? 'text.primary' : 'white',
                            border: message.sender === 'ai' ? '1px solid #e0e0e0' : 'none',
                            borderRadius: 2,
                            borderTopLeftRadius: message.sender === 'ai' ? 0 : 2,
                            borderTopRightRadius: message.sender === 'user' ? 0 : 2,
                            maxWidth: { xs: '95%', md: '80%' },
                            wordBreak: 'break-word'
                          }}
                        >
                          {message.file && (
                             <Chip
                               size="small"
                               icon={<AttachFileIcon style={{ color: message.sender === 'user' ? 'white' : 'inherit' }}/>}
                               label={message.file.name}
                               variant="outlined"
                               sx={{ mb: 1, borderColor: message.sender === 'user' ? 'rgba(255,255,255,0.5)' : 'default', color: 'inherit' }}
                             />
                          )}
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                            {message.content}
                          </Typography>
                        </Paper>
                        
                        {message.sender === 'ai' && (
                          <Box sx={{ display: 'flex', gap: 1, ml: 5 }}>
                            <IconButton size="small" onClick={() => handleCopyMessage(message.content)}>
                              <CopyIcon fontSize="small" sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        )}
                      </ListItem>
                    ))}
                  </List>
                  {isLoading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 2, mb: 2 }}>
                      <CircularProgress size={20} />
                      <Typography variant="caption" color="text.secondary">Analyzing...</Typography>
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress />
                </Box>
              )}
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 0 }}>
                {error}
              </Alert>
            )}

            {/* Input Area */}
            {sessionId && (
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ color: 'text.secondary' }}
                  >
                    <AttachFileIcon />
                  </IconButton>
                  <TextField
                    fullWidth
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    disabled={isLoading}
                    multiline
                    maxRows={4}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        bgcolor: 'grey.50'
                      }
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !inputMessage.trim()}
                    sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, width: 40, height: 40 }}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sidebar - Desktop (Visible only on md+) */}
        <Grid item md={4} lg={3} sx={{ display: { xs: 'none', md: 'block' }, height: '100%' }}>
          <SidebarContent />
        </Grid>

        {/* Sidebar - Mobile (Drawer) */}
        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }} // Better open performance on mobile
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
          }}
        >
          <SidebarContent />
        </Drawer>
      </Grid>
      
      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} />
    </Container>
  );
};

export default ChatPage;