import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
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

    return api.post('/ai/voice/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
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