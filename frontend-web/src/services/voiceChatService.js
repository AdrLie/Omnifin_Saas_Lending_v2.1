import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/voice/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// WebSocket connection for real-time voice streaming
let ws = null;

export const voiceChatService = {
  // Connect to WebSocket for voice streaming
  // accepts optional { token, sessionId } to build a secure ws url
  connect: ({ token = null, sessionId = null } = {}) => {
    const effectiveToken = token || localStorage.getItem('authToken');
    let wsUrl = `${API_BASE_URL.replace('http', 'ws')}/voice/stream/`;
    const params = new URLSearchParams();
    if (effectiveToken) params.append('token', effectiveToken);
    if (sessionId) params.append('session', sessionId);
    if ([...params].length > 0) wsUrl += `?${params.toString()}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Voice chat WebSocket connected');
    };

    ws.onclose = () => {
      console.log('Voice chat WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('Voice chat WebSocket error:', error);
    };

    return ws;
  },

  // Send voice message
  // sendVoiceMessage supports optional token override via opts.token
  sendVoiceMessage: async (transcript, voiceId = 'default', opts = {}) => {
    try {
      const headers = {};
      if (opts.token) headers.Authorization = `Token ${opts.token}`;

      const response = await api.post('m/', {
        transcript: transcript,
        voice_id: voiceId,
        timestamp: new Date().toISOString()
      }, { headers });
      return response.data;
    } catch (error) {
      console.error('Error sending voice message:', error);
      throw error;
    }
  },

  // Get available voices
  getVoices: async () => {
    try {
      const response = await api.get('voices/');
      return response.data;
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  },

  // Test voice synthesis
  testVoice: async (text, voiceId) => {
    try {
      const response = await api.post('test/', {
        text: text,
        voice_id: voiceId
      });
      return response.data;
    } catch (error) {
      console.error('Error testing voice:', error);
      throw error;
    }
  },

  // Get voice chat history
  getVoiceHistory: async () => {
    try {
      const response = await api.get('history/');
      return response.data;
    } catch (error) {
      console.error('Error fetching voice history:', error);
      throw error;
    }
  }
};