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
      console.log('=== VOICE MESSAGE DEBUG ===');
      console.log('Session ID:', sessionId);
      console.log('Audio file object:', audioFile);
      console.log('Audio file URI:', audioFile?.uri);
      console.log('Audio file type:', audioFile?.type);
      console.log('Audio file name:', audioFile?.name);
      console.log('Platform:', Platform.OS);
      
      const formData = new FormData();
      
      // ✅ CRITICAL FIX: Handle Web vs Native differently
      if (Platform.OS === 'web') {
        console.log('Using WEB file upload method');
        
        // For Web: Fetch the file and create a proper Blob
        console.log('Fetching file from URI:', audioFile.uri);
        const response = await fetch(audioFile.uri);
        console.log('Fetch response status:', response.status);
        console.log('Fetch response type:', response.headers.get('content-type'));
        
        const blob = await response.blob();
        console.log('Blob created, size:', blob.size, 'type:', blob.type);
        
        // Create a File object from the Blob (web standard)
        const file = new File([blob], audioFile.name, { 
          type: audioFile.type || blob.type || 'audio/wav' 
        });
        
        console.log('File object created:', file.name, file.size, file.type);
        formData.append('audio_file', file);
      } else {
        console.log('Using NATIVE file upload method');
        // For Native: Use the standard React Native format
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

      console.log('FormData created, posting to:', `${API_BASE_URL}/ai/voice`);

      // Get token manually for this request
      const token = await storage.getItem('authToken');
      console.log('Token retrieved:', token ? 'YES' : 'NO');

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
        timeout: 60000, // 60 seconds
      });

      console.log('Response received:', response.status);
      console.log('Response data:', response.data);
      return response;
    } catch (error) {
      console.error('=== VOICE UPLOAD ERROR ===');
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
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