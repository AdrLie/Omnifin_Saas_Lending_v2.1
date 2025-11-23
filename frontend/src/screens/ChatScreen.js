import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import { ActivityIndicator, Appbar } from 'react-native-paper';
import { ChatContext } from '../contexts/ChatContext';
import { AuthContext } from '../contexts/AuthContext';

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { startConversation, sendMessage, isLoading: chatLoading } = useContext(ChatContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    initializeChat();
    return () => {
      // Cleanup if needed
    };
  }, []);

  const initializeChat = async () => {
    try {
      const conversation = await startConversation(null, false);
      setSessionId(conversation);
      
      // Add welcome message
      setMessages([
        {
          _id: 1,
          text: "Hello! I'm your AI loan assistant. I'll help you find the perfect loan for your needs. Let's start by understanding what type of loan you're looking for.",
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'AI Assistant',
            avatar: 'https://ui-avatars.com/api/?name=AI&background=6200EE&color=fff',
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize chat');
    }
  };

  const onSend = async (newMessages = []) => {
    if (!sessionId) {
      Alert.alert('Error', 'Chat not initialized');
      return;
    }

    const userMessage = newMessages[0];
    
    // Add user message to chat
    setMessages(previousMessages => 
      GiftedChat.append(previousMessages, [userMessage])
    );

    try {
      // Send message to AI
      const response = await sendMessage(sessionId, userMessage.text);
      
      // Add AI response to chat
      const aiMessage = {
        _id: Math.round(Math.random() * 1000000),
        text: response,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'AI Assistant',
          avatar: 'https://ui-avatars.com/api/?name=AI&background=6200EE&color=fff',
        },
      };
      
      setMessages(previousMessages => 
        GiftedChat.append(previousMessages, [aiMessage])
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const renderLoading = () => {
    if (chatLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="AI Assistant" />
      </Appbar.Header>
      
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{
          _id: 1,
          name: user?.first_name || 'User',
          avatar: user?.email ? `https://ui-avatars.com/api/?name=${user.first_name}&background=BB86FC&color=fff` : null,
        }}
        placeholder="Type your message..."
        alwaysShowSend
        scrollToBottom
        renderLoading={renderLoading}
        renderAvatarOnTop
        showUserAvatar
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});