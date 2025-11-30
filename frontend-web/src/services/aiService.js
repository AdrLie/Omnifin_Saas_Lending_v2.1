import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Response interceptor to log and handle 301 redirects
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 301) {
      console.warn('Received 301 redirect:', error.response.config.url, '→', error.response.headers.location);
      // Optionally, follow the redirect manually if needed
      // window.location.href = error.response.headers.location;
    }
    return Promise.reject(error);
  }
);

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const aiService = {
  // Chat endpoints
  sendMessage: (sessionId, message, context = {}) => {
    return api.post('/ai/chat/', {
      session_id: sessionId,
      message,
      context
    });
  },

  sendVoiceMessage: (sessionId, audioFile, context = {}) => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('session_id', sessionId);
    formData.append('context', JSON.stringify(context));

    // Send multipart/form-data as before, then normalize the response so
    // callers can receive a Blob under `response.data.audio` when the
    // backend returns base64-encoded audio (common pattern in this repo).
    return api.post('/ai/voice/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then((response) => {
      try {
        const data = response && response.data ? response.data : null;
        // backend may return audio as `audio_response` or `audio` (base64 string)
        const base64Str = data && (data.audio_response || data.audio);
        if (base64Str && typeof base64Str === 'string') {
          // strip data URI prefix if present
          const cleaned = base64Str.replace(/^data:audio\/[a-zA-Z0-9.+-]+;base64,/, '').replace(/\s+/g, '');
          // decode base64 -> binary
          try {
            const binary = atob(cleaned);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
            // assume mp3 from backend TTS; fallback to generic audio/mpeg
            const blob = new Blob([bytes.buffer], { type: 'audio/mpeg' });
            // attach convenience properties so callers can handle Blob directly
            response.data.audio = blob;
            response.data.audio_blob = blob;
          } catch (err) {
            // leave original response intact if decode fails
            console.warn('aiService: failed to decode base64 audio response', err);
          }
        }
      } catch (e) {
        console.warn('aiService: normalization of voice response failed', e);
      }

      return response;
    });
  },


  // Conversation management
  createConversation: (applicationId = null, isVoice = false) => {
    return api.post('/ai/conversations/create/', {
      application: applicationId,
      is_voice_chat: isVoice
    });
  },

  getConversationHistory: (sessionId) => {
    return api.get(`/ai/conversations/history/${sessionId}/`);
  },

  endConversation: (sessionId) => {
    return api.post(`/ai/conversations/${sessionId}/end/`);
  },

  // Prompt management
  getActivePrompts: (category = null) => {
    const params = {};
    if (category) params.category = category;
    return api.get('/ai/prompts/active/', { params });
  },

  // Knowledge base
  getKnowledge: (category = null, search = null) => {
    const params = {};
    if (category) params.category = category;
    if (search) params.search = search;
    return api.get('/ai/knowledge/search/', { params });
  },

  // Dashboard
  getAIDashboard: () => {
    return api.get('/ai/dashboard/');
  },

  // Admin endpoints
  createPrompt: (promptData) => {
    return api.post('/ai/prompts/', promptData);
  },

  updatePrompt: (promptId, promptData) => {
    return api.patch(`/ai/prompts/${promptId}/`, promptData);
  },

  deletePrompt: (promptId) => {
    return api.delete(`/ai/prompts/${promptId}/`);
  },

  createKnowledge: (knowledgeData) => {
    return api.post('/ai/knowledge/', knowledgeData);
  },

  updateKnowledge: (knowledgeId, knowledgeData) => {
    return api.patch(`/ai/knowledge/${knowledgeId}/`, knowledgeData);
  },

  deleteKnowledge: (knowledgeId) => {
    return api.delete(`/ai/knowledge/${knowledgeId}/`);
  },
};