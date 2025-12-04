import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';


const api = axios.create({
  baseURL: `${API_BASE_URL}/ai/chat/`,
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

export const chatService = {
  // Get all user conversations with filters and pagination
  getUserConversations: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ai/conversations/list/`, {
        params: {
          status: params.status,
          is_voice: params.is_voice,
          limit: params.limit || 50,
          offset: params.offset || 0
        },
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Get specific conversation with all messages
  getConversationMessages: async (conversationId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ai/conversations/${conversationId}/messages/`, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      throw error;
    }
  },

  // Delete a conversation
  deleteConversation: async (conversationId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/ai/conversations/${conversationId}/delete/`, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  },

  // Get chat history (legacy - kept for backward compatibility)
  getChatHistory: async () => {
    try {
      const response = await api.get('history/');
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  },

  // Send message to AI
  sendMessage: async (message, sessionId, context = {}) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/chat/`, {
        message: message,
        session_id: sessionId,
        context: context,
        is_voice: false
      }, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Upload voice message
  sendVoiceMessage: async (audioFile, sessionId, context = {}) => {
    try {
      const formData = new FormData();
      formData.append('audio_file', audioFile);
      formData.append('session_id', sessionId);
      formData.append('context', JSON.stringify(context));
      
      const response = await axios.post(`${API_BASE_URL}/ai/voice/`, formData, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error sending voice message:', error);
      throw error;
    }
  },

  // Upload document for analysis
  uploadDocument: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  // Clear chat history (delete all conversations)
  clearChatHistory: async () => {
    try {
      const response = await api.delete('clear/');
      return response.data;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw error;
    }
  },

  // Get AI suggestions
  getSuggestions: async (query) => {
    try {
      const response = await api.get('suggestions/', {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    }
  }
};