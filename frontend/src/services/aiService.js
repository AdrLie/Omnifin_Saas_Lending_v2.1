import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import storage from '../utils/storage';
import { Platform } from 'react-native';

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
    const token = await storage.getItem('authToken');
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
 sendVoiceMessage: async (sessionId, audioFile, context = {}) => {
    try {      
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(audioFile.uri);
        
        const blob = await response.blob();
        
        const file = new File([blob], audioFile.name, { 
          type: audioFile.type || blob.type || 'audio/wav' 
        });
        
        formData.append('audio_file', file);
      } else {
        formData.append('audio_file', {
          uri: audioFile.uri,
          type: audioFile.type || 'audio/wav',
          name: audioFile.name || `voice_${Date.now()}.wav`,
        });
      }
      
      formData.append('session_id', sessionId);
      
      // Only add context if it has data
      if (context && Object.keys(context).length > 0) {
        formData.append('context', JSON.stringify(context));
      }

      // Get token manually for this request
      const token = await storage.getItem('authToken');

      // Use axios with explicit headers
      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}/ai/voice/`,
        data: formData,
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        timeout: 60000,
      });

      return response;
    } catch (error) {
      throw error;
    }
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