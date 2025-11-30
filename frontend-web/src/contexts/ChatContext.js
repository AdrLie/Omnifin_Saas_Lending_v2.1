import React, { createContext, useState, useContext } from 'react';
import { aiService } from '../services/aiService';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState({});
  const [activeConversation, setActiveConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const startConversation = async (applicationId = null, isVoice = false) => {
    try {
      const response = await aiService.createConversation(applicationId, isVoice);
      const conversation = response.data;

      setConversations(prev => ({
        ...prev,
        [conversation.session_id]: conversation
      }));

      setActiveConversation(conversation.session_id);
      return conversation.session_id;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  };

  const sendVoiceMessage = async (sessionId, data, voiceId = 'default') => {
    setIsLoading(true);
    try {
      let response = null;

      // Expect data to be a File or Blob (audio). If it's a mobile-style object with .file use that.
      let fileToSend = null;

      if (data instanceof Blob || data instanceof File) {
        fileToSend = data;
      } else if (data && data.file && (data.file instanceof Blob || data.file instanceof File)) {
        fileToSend = data.file;
      } else if (data && data.uri) {
        // Try fetching the URI to obtain a blob (works for browser-generated object URLs)
        try {
          const fetched = await fetch(data.uri);
          const blob = await fetched.blob();
          fileToSend = blob;
        } catch (err) {
          throw new Error('Unable to fetch audio from provided uri');
        }
      } else {
        throw new Error('sendVoiceMessage expects a File/Blob or an object with a file/uri property');
      }

      // Send audio file as multipart/form-data via aiService
      response = await aiService.sendVoiceMessage(sessionId, fileToSend, { voice_id: voiceId });

      // Update conversation messages
      setConversations(prev => {
        const updated = { ...prev };
        if (updated[sessionId]) {
          updated[sessionId].messages = updated[sessionId].messages || [];
          updated[sessionId].messages.push({ sender: 'user', content: '[Audio Message]', message_type: 'voice' });
          const text = response?.data?.response || response?.data?.text || response?.response || response?.text;
          if (text) {
            updated[sessionId].messages.push({ sender: 'ai', content: text });
          }
        }
        return updated;
      });

      return response;
    } catch (error) {
      console.error('Error sending voice message:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (sessionId, message, context = {}) => {
    setIsLoading(true);
    try {
      const response = await aiService.sendMessage(sessionId, message, context);
      const { response: aiResponse } = response.data;

      // Update conversation messages
      setConversations(prev => {
        const updated = { ...prev };
        if (updated[sessionId]) {
          updated[sessionId].messages = updated[sessionId].messages || [];
          updated[sessionId].messages.push(
            { sender: 'user', content: message },
            { sender: 'ai', content: aiResponse }
          );
        }
        return updated;
      });

      return aiResponse;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getConversation = (sessionId) => {
    return conversations[sessionId];
  };

  const endConversation = async (sessionId) => {
    try {
      await aiService.endConversation(sessionId);

      setConversations(prev => {
        const updated = { ...prev };
        if (updated[sessionId]) {
          updated[sessionId].status = 'completed';
          updated[sessionId].ended_at = new Date().toISOString();
        }
        return updated;
      });

      if (activeConversation === sessionId) {
        setActiveConversation(null);
      }
    } catch (error) {
      console.error('Error ending conversation:', error);
      throw error;
    }
  };

  const getActiveConversation = () => {
    return activeConversation ? conversations[activeConversation] : null;
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        isLoading,
        startConversation,
        sendMessage,
        sendVoiceMessage,
        getConversation,
        endConversation,
        getActiveConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};