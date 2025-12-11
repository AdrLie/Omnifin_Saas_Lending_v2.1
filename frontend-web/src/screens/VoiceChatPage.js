import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeIcon,
  VolumeOff as VolumeOffIcon,
  Settings as SettingsIcon,
  SmartToy as AIIcon,
  Person as UserIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  Assessment,
  CreditCard,
} from '@mui/icons-material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { chatService } from '../services/chatService';
import { useSubscription } from '../hooks/useSubscription';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';

const VoiceChatPage = () => {
  const { user } = useAuth();
  const { startConversation, sendVoiceMessage, sendMessage, getActiveConversation } = useChat();
  const { subscription, loading } = useSubscription();
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [muted, setMuted] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('default');
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en-US');
  const [autoSend, setAutoSend] = useState(true);
  
  // Chat history state
  const [conversations, setConversations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const createdObjectUrlRef = useRef(null);
  const resumeListenerRef = useRef(null);
  const [lastPlayedAudioUrl, setLastPlayedAudioUrl] = useState(null);
  const initializedRef = useRef(false);

  const availableVoices = [
    { id: 'default', name: 'Default Voice', gender: 'neutral' },
    { id: 'female-1', name: 'Sarah (Female)', gender: 'female' },
    { id: 'male-1', name: 'David (Male)', gender: 'male' },
    { id: 'female-2', name: 'Emma (Female)', gender: 'female' }
  ];

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' }
  ];

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Reuse an existing active conversation if present to avoid duplicates
        const active = getActiveConversation();
        if (active && active.session_id) {
          if (mounted) setSessionId(active.session_id);
        } else {
          // create a new conversation only when none exists
          try {
            const session = await startConversation(null, true);
            if (mounted) setSessionId(session);
            setMessages([
              {
                id: 1,
                content: 'Welcome to the AI Voice Assistant. Click the microphone to begin.',
                sender: 'ai',
                timestamp: new Date().toISOString(),
                user: 'Omnifin AI'
              }
            ]);
          } catch (err) {
            console.warn('Could not start conversation via ChatContext:', err);
          }
        }

        // mark as ready
        setConnectionStatus('connected');
      } catch (err) {
        console.error('Init error:', err);
      }
    };

    init();

    return () => {
      mounted = false;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) { }
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      // remove any resume listener we may have installed
      if (resumeListenerRef.current) {
        try {
          document.removeEventListener('click', resumeListenerRef.current);
          document.removeEventListener('keydown', resumeListenerRef.current);
          document.removeEventListener('touchstart', resumeListenerRef.current);
        } catch (e) { }
        resumeListenerRef.current = null;
      }
    };
    // run only once on first page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [sessionId, setSessionId] = useState(null);



  // Recording via MediaRecorder — capture audio blob and upload as file via sendVoiceMessage

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const options = { mimeType: 'audio/webm' };
      const recorder = new MediaRecorder(stream, options);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size) chunksRef.current.push(e.data);
      };

      recorder.onstart = () => {
        setIsRecording(true);
        setTranscript('Recording...');
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        setTranscript('Processing...');
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || 'audio/webm' });
        chunksRef.current = [];

        // create a File to send
        const file = new File([blob], `recording_${Date.now()}.webm`, { type: blob.type });

        // send audio file via ChatContext
        try {
          const response = await sendVoiceMessage(sessionId, file, selectedVoice);
          const data = response?.data || response;

          // Extract transcribed text and AI response
          const transcribedText = data?.text || '[Voice Recording]';
          const aiResponse = data?.response;
          const audioPayload = data?.audio || data?.audio_response;

          // Show transcribed text briefly
          setTranscript(transcribedText);

          // Add user's transcribed message
          setMessages(prev => [...prev, {
            id: Date.now(),
            content: transcribedText,
            sender: 'user',
            timestamp: new Date().toISOString(),
            user: user?.email || user?.username || 'You'
          }]);

          // Add AI response with audio if available
          if (aiResponse) {
            if (audioPayload) {
              playAudioResponse(audioPayload, aiResponse);
            } else {
              addAIMessage(aiResponse);
            }
          }

          // Clear transcript after a brief delay to allow user to see it
          setTimeout(() => setTranscript(''), 2000);
        } catch (err) {
          console.error('Failed to upload voice message:', err);
          setError('Failed to send voice message. Please try again.');
          setTranscript('');
        } finally {
          // stop and release media tracks
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
          }
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch (err) {
      console.error('Recording start failed:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch (e) {
      console.warn('Error stopping recording', e);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording(); else startRecording();
  };

  const handleSendTranscript = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      content: text,
      sender: 'user',
      timestamp: new Date().toISOString(),
      user: user?.email || user?.username || 'You'
    };

    setMessages(prev => [...prev, userMessage]);
    setTranscript('');

    // Send transcript as text message via sendMessage (not sendVoiceMessage)
    try {
      const aiResponse = await sendMessage(sessionId, text);
      if (aiResponse) addAIMessage(aiResponse);
      
      // Refresh history after first message
      if (messages.length === 0) {
        loadChatHistory();
      }
    } catch (err) {
      console.error('Failed to get AI response:', err);
      setError('Failed to get AI response. Please try again.');
    }
  };

  const loadChatHistory = async () => {
    try {
      setLoadingHistory(true);
      // Filter for voice chat only (is_voice = true)
      const data = await chatService.getUserConversations({ limit: 10, offset: 0, is_voice: 'true' });
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Error loading voice chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLoadPreviousChat = async (conversation) => {
    try {
      const data = await chatService.getConversationMessages(conversation.id);
      setSessionId(conversation.session_id);
      
      // Map messages to display format
      const loadedMessages = (data.messages || []).map((msg, idx) => ({
        id: idx + 1,
        content: msg.content,
        sender: msg.sender,
        timestamp: msg.created_at,
        user: msg.sender === 'user' ? (user?.name || 'User') : 'Omnifin AI',
      }));
      
      setMessages(loadedMessages);
      
      if (loadedMessages.length === 0) {
        setError('This conversation has no messages yet.');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation');
    }
  };

  const handleNewChat = async () => {
    setMessages([]);
    setError(null);
    setTranscript('');
    // Create new voice conversation immediately
    try {
      const newSessionId = await startConversation(null, true);
      setSessionId(newSessionId);
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  // Load chat history once on mount
  if (!initializedRef.current) {
    initializedRef.current = true;
    loadChatHistory();
  }

  const playAudioResponse = (audioData, text) => {
    try {
      // audioData may be:
      // - a remote URL string (http/https or relative)
      // - a data URL string (data:audio/..;base64,...)
      // - a raw base64 string (no data: prefix)
      // - a Blob or ArrayBuffer
      let audioUrl = null;

      if (typeof audioData === 'string') {
        // Normalize and detect the actual string type. We prefer treating
        // long strings that match base64 as base64 audio (even if they
        // start with characters like "//"). Only treat explicit http(s)
        // URLs or data: URIs as URLs.
        const raw = audioData.trim();

        // Data URL (safe to use directly)
        if (raw.startsWith('data:audio')) {
          audioUrl = raw;
        } else {
          // Remove whitespace/newlines to validate base64 payload
          const candidate = raw.replace(/\s+/g, '');
          const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;

          // Heuristic: if it looks like base64 and is reasonably long, decode it.
          if (candidate.length > 100 && base64Regex.test(candidate)) {
            try {
              const binary = atob(candidate);
              const len = binary.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
              const blob = new Blob([bytes.buffer], { type: 'audio/mpeg' });
              const url = URL.createObjectURL(blob);
              createdObjectUrlRef.current = url;
              audioUrl = url;
            } catch (decodeErr) {
              console.error('Failed to decode base64 audio string:', decodeErr);
            }
          } else if (/^https?:\/\//i.test(raw) || /^\/(?!\/)/.test(raw) || /^\/\//.test(raw)) {
            // URL-ish string (absolute http(s), root-relative, or protocol-relative)
            audioUrl = raw;
          } else {
            // Fallback: if it's short or doesn't match base64, try as URL
            audioUrl = raw;
          }
        }
      } else if (audioData instanceof ArrayBuffer) {
        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        createdObjectUrlRef.current = url;
        audioUrl = url;
      } else if (audioData instanceof Blob) {
        audioUrl = URL.createObjectURL(audioData);
      } else if (audioData && typeof audioData === 'object' && audioData.data) {
        // Some responses wrap binary in { data: <ArrayBuffer|Uint8Array|base64> }
        const payload = audioData.data;
        if (payload instanceof ArrayBuffer) {
          const blob = new Blob([payload], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          createdObjectUrlRef.current = url;
          audioUrl = url;
        } else if (payload instanceof Uint8Array) {
          const blob = new Blob([payload.buffer], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          createdObjectUrlRef.current = url;
          audioUrl = url;
        } else if (typeof payload === 'string') {
          // fall back to string handling
          const base64 = payload.replace(/^data:audio\/\w+;base64,/, '');
          try {
            const binary = atob(base64);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
            const blob = new Blob([bytes.buffer], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            createdObjectUrlRef.current = url;
            audioUrl = url;
          } catch (e) {
            console.error('Failed to decode wrapped audio payload', e);
          }
        }
      }

      if (!audioUrl) {
        console.error('Could not create a playable audio URL from response:', audioData);
        setError('Received audio in an unsupported format.');
        return;
      }

      if (audioRef.current) {
        // Avoid double-playing the same audio URL
        try {
          const currentSrc = audioRef.current.src || '';
          if (currentSrc === audioUrl && !audioRef.current.paused) {
            // already playing this audio
          } else {
            // revoke prior object URL if we created one
            if (createdObjectUrlRef.current && createdObjectUrlRef.current !== audioUrl) {
              try { URL.revokeObjectURL(createdObjectUrlRef.current); } catch (e) { }
              createdObjectUrlRef.current = null;
            }

            audioRef.current.autoplay = false;
            audioRef.current.src = audioUrl;
            audioRef.current.volume = muted ? 0 : volume / 100;

            // Attempt immediate play
            const p = audioRef.current.play();
            if (p && typeof p.then === 'function') {
              p.then(() => {
                setIsPlaying(true);
                setLastPlayedAudioUrl(audioUrl);
              }).catch((e) => {
                // Autoplay blocked — install a one-time resume handler
                console.warn('Autoplay blocked, will resume on user interaction', e);
                if (!resumeListenerRef.current) {
                  const resumeOnce = () => {
                    try {
                      if (!audioRef.current) return;
                      audioRef.current.play().then(() => {
                        setIsPlaying(true);
                        setLastPlayedAudioUrl(audioUrl);
                      }).catch(() => { });
                    } finally {
                      document.removeEventListener('click', resumeOnce);
                      document.removeEventListener('keydown', resumeOnce);
                      document.removeEventListener('touchstart', resumeOnce);
                      resumeListenerRef.current = null;
                    }
                  };
                  resumeListenerRef.current = resumeOnce;
                  document.addEventListener('click', resumeOnce);
                  document.addEventListener('keydown', resumeOnce);
                  document.addEventListener('touchstart', resumeOnce, { passive: true });
                }
              });
            } else {
              setIsPlaying(true);
              setLastPlayedAudioUrl(audioUrl);
            }
          }
        } catch (err) {
          console.warn('Audio play attempt failed', err);
        }
      }

      addAIMessage(text, audioUrl);
    } catch (err) {
      console.error('playAudioResponse error:', err);
      setError('Unable to play audio response.');
    }
  };

  const handlePlayClick = (audioUrl) => {
    if (!audioRef.current) return;

    const currentSrc = audioRef.current.src || '';
    if (currentSrc !== audioUrl) {
      // switch source and play
      try {
        if (createdObjectUrlRef.current && createdObjectUrlRef.current !== audioUrl) {
          try { URL.revokeObjectURL(createdObjectUrlRef.current); } catch (e) { }
          createdObjectUrlRef.current = null;
        }
      } catch (e) { }

      audioRef.current.src = audioUrl;
      audioRef.current.volume = muted ? 0 : volume / 100;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setLastPlayedAudioUrl(audioUrl);
      }).catch((e) => {
        console.warn('User play failed', e);
      });
    } else {
      // toggle play/pause
      if (audioRef.current.paused) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const addAIMessage = (content, audioUrl = null) => {
    const aiMessage = {
      id: Date.now() + 1,
      content: content,
      sender: 'ai',
      timestamp: new Date().toISOString(),
      user: 'Omnifin AI',
      audioUrl: audioUrl
    };
    setMessages(prev => [...prev, aiMessage]);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setLastPlayedAudioUrl(null);
    if (audioRef.current) {
      try {
        if (createdObjectUrlRef.current && audioRef.current.src === createdObjectUrlRef.current) {
          URL.revokeObjectURL(createdObjectUrlRef.current);
          createdObjectUrlRef.current = null;
        }
      } catch (e) {
        console.warn('Failed to revoke object URL', e);
      }
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      {loading ? (
        <LoadingScreen />
      ) : !subscription ? (
        <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Box sx={{ mb: 3 }}>
              <Assessment sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                No Active Subscription
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                You need an active subscription to use Voice Chat. Choose a plan and start chatting with our voice assistant today.
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<CreditCard />}
              onClick={() => navigate('/subscribe')}
              sx={{ px: 4, py: 1.5 }}
            >
              View Subscription Plans
            </Button>
          </Paper>
        </Container>
      ) : (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Grid container spacing={3}>
        {/* Main Voice Interface */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            {/* Connection Status */}
            <Box sx={{ mb: 3 }}>
              <Chip
                label={connectionStatus === 'connected' ? 'Connected' :
                  connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                color={connectionStatus === 'connected' ? 'success' :
                  connectionStatus === 'connecting' ? 'warning' : 'error'}
                size="small"
              />
            </Box>

            {/* AI Avatar */}
            <Box sx={{ mb: 4 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: isRecording ? 'error.main' : 'primary.main',
                  animation: isRecording ? 'pulse 2s infinite' : 'none'
                }}
              >
                <AIIcon sx={{ fontSize: 60 }} />
              </Avatar>
              <Typography variant="h4" gutterBottom>
                Omnifin Voice Assistant
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {isRecording ? 'Listening... Click to stop' : isPlaying ? 'Playing response...' : 'Click the microphone to start talking'}
              </Typography>
            </Box>

            {/* Recording Controls */}
            <Box sx={{ mb: 4 }}>
              <IconButton
                onClick={toggleRecording}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: isRecording ? 'error.main' : 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: isRecording ? 'error.dark' : 'primary.dark'
                  }
                }}
              >
                {isRecording ? <MicOffIcon sx={{ fontSize: 40 }} /> : <MicIcon sx={{ fontSize: 40 }} />}
              </IconButton>
            </Box>

            {/* Live Transcript */}
            <Paper
              elevation={1}
              sx={{
                p: 3,
                mb: 3,
                minHeight: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: transcript ? 'grey.50' : 'grey.100'
              }}
            >
              <Typography
                variant="body1"
                color={transcript ? 'text.primary' : 'text.secondary'}
                sx={{ fontStyle: transcript ? 'normal' : 'italic' }}
              >
                {transcript || 'Your speech will appear here...'}
              </Typography>
            </Paper>

            {/* Auto-send Toggle */}
            <Box sx={{ mb: 3 }}>
              <ToggleButtonGroup
                value={autoSend}
                exclusive
                onChange={(e, value) => setAutoSend(value)}
                size="small"
              >
                <ToggleButton value={true}>
                  Auto-send
                </ToggleButton>
                <ToggleButton value={false}>
                  Manual send
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Manual Send Button */}
            {!autoSend && transcript && (
              <Button
                variant="contained"
                onClick={() => handleSendTranscript(transcript)}
                disabled={!transcript.trim()}
                sx={{ mb: 2 }}
              >
                Send Message
              </Button>
            )}

            {/* Error Display */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Audio Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <IconButton onClick={() => setMuted(!muted)}>
                {muted ? <VolumeOffIcon /> : <VolumeIcon />}
              </IconButton>
              <Slider
                value={volume}
                onChange={(e, value) => setVolume(value)}
                min={0}
                max={100}
                sx={{ width: 100 }}
                disabled={muted}
              />
              <IconButton onClick={() => setSettingsOpen(true)}>
                <SettingsIcon />
              </IconButton>
            </Box>
          </Paper>

          {/* Recent Messages */}
          <Paper elevation={3} sx={{ mt: 3, p: 2, maxHeight: 300, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Recent Messages
            </Typography>
            <List>
              {messages.slice(-5).map((message) => (
                <ListItem key={message.id} sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: message.sender === 'ai' ? 'primary.main' : 'secondary.main' }}>
                      {message.sender === 'ai' ? <AIIcon /> : <UserIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={message.content}
                    secondary={`${message.user} • ${formatTimestamp(message.timestamp)}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                  {message.sender === 'ai' && message.audioUrl && (
                    <IconButton
                      edge="end"
                      aria-label="play"
                      onClick={() => handlePlayClick(message.audioUrl)}
                    >
                      {lastPlayedAudioUrl === message.audioUrl && isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                  )}
                </ListItem>
              ))}
              {messages.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No messages yet. Start a conversation!
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* New Chat Button */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewChat}
              fullWidth
              sx={{ mb: 0 }}
            >
              New Voice Chat
            </Button>

            {/* Recent Voice Chats */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <HistoryIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Recent Voice Chats
                  </Typography>
                </Box>
                <Box
                  sx={{
                    maxHeight: 250,
                    overflowY: 'scroll',
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      borderRadius: '10px',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.3)',
                      },
                    },
                  }}
                >
                  {loadingHistory ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : conversations.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No voice chat history yet
                    </Typography>
                  ) : (
                    conversations.map((conv) => (
                      <Box
                        key={conv.id}
                        onClick={() => handleLoadPreviousChat(conv)}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          borderRadius: 1,
                          cursor: 'pointer',
                          bgcolor: conv.session_id === sessionId ? 'primary.light' : 'grey.100',
                          '&:hover': {
                            bgcolor: conv.session_id === sessionId ? 'primary.light' : 'grey.200',
                          },
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {conv.created_at ? format(new Date(conv.created_at), 'MMM dd, yyyy HH:mm') : 'Unknown date'}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: conv.session_id === sessionId ? 600 : 400 }}>
                          {conv.first_message || 'Voice Conversation'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {conv.message_count || 0} message{conv.message_count !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Voice Settings Card */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Voice Settings
                </Typography>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>AI Voice</InputLabel>
                  <Select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    label="AI Voice"
                  >
                    {availableVoices.map((voice) => (
                      <MenuItem key={voice.id} value={voice.id}>
                        {voice.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    label="Language"
                  >
                    {languages.map((lang) => (
                      <MenuItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>

            {/* Quick Commands */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Commands
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const text = "What loan options are available?";
                      setTranscript(text);
                      if (autoSend) handleSendTranscript(text);
                    }}
                  >
                    Loan Options
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const text = "Help me with my application";
                      setTranscript(text);
                      if (autoSend) handleSendTranscript(text);
                    }}
                  >
                    Application Help
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const text = "What's my application status?";
                      setTranscript(text);
                      if (autoSend) handleSendTranscript(text);
                    }}
                  >
                    Check Status
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Connection Info */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Connection Info
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body2">
                      {connectionStatus}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Voice
                    </Typography>
                    <Typography variant="body2">
                      {availableVoices.find(v => v.id === selectedVoice)?.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Language
                    </Typography>
                    <Typography variant="body2">
                      {languages.find(l => l.code === language)?.name}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Voice Chat Settings
          <IconButton
            onClick={() => setSettingsOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>AI Voice</InputLabel>
              <Select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                label="AI Voice"
              >
                {availableVoices.map((voice) => (
                  <MenuItem key={voice.id} value={voice.id}>
                    {voice.name} ({voice.gender})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                label="Language"
              >
                {languages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Volume
              </Typography>
              <Slider
                value={volume}
                onChange={(e, value) => setVolume(value)}
                min={0}
                max={100}
                marks
                valueLabelDisplay="auto"
              />
            </Box>

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Auto-send Transcripts
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Automatically send voice transcripts to AI for response
              </Typography>
              <ToggleButtonGroup
                value={autoSend}
                exclusive
                onChange={(e, value) => setAutoSend(value)}
              >
                <ToggleButton value={true}>Enabled</ToggleButton>
                <ToggleButton value={false}>Disabled</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        style={{ display: 'none' }}
      />
    </Container>
      )}
    </>
  );
};

export default VoiceChatPage;