import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, StyleSheet, Alert, Dimensions, FlatList, TouchableOpacity, Platform, Animated } from 'react-native';
import { GiftedChat, Bubble, InputToolbar, Composer } from 'react-native-gifted-chat';
import { ActivityIndicator, Appbar, useTheme, Text, Divider, Surface, Avatar } from 'react-native-paper';
import { ChatContext } from '../contexts/ChatContext';
import { AuthContext } from '../contexts/AuthContext';
import { aiService } from '../services/aiService';

export default function ChatScreen({ navigation, route }) {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const { startConversation, sendMessage, isLoading: chatLoading } = useContext(ChatContext);
  const { width } = Dimensions.get('window');
  
  const isMobile = width < 768;
  const passedSessionId = route.params?.sessionId;

  // Animation refs for typing dots
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(passedSessionId || null);
  const [initialLoading, setInitialLoading] = useState(!!passedSessionId);
  const [isTyping, setIsTyping] = useState(false);
  
  // Sidebar states
  const [conversations, setConversations] = useState([]);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchConversations();

    if (passedSessionId) {
      loadChatHistory(passedSessionId);
    } else {
      initializeNewChat();
    }
  }, [passedSessionId]);

  // Animate typing dots
  useEffect(() => {
    if (isTyping) {
      const createAnimation = (animValue, delay) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const anim1 = createAnimation(dot1Anim, 0);
      const anim2 = createAnimation(dot2Anim, 150);
      const anim3 = createAnimation(dot3Anim, 300);

      anim1.start();
      anim2.start();
      anim3.start();

      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
        dot1Anim.setValue(0);
        dot2Anim.setValue(0);
        dot3Anim.setValue(0);
      };
    }
  }, [isTyping]);

  const fetchConversations = async () => {
    setHistoryLoading(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      setConversations([]);
    } catch (error) {
      console.log('Error fetching list:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadChatHistory = async (id) => {
    if (isMobile) setShowSidebar(false);
    setSessionId(id);
    setInitialLoading(true);
    setMessages([]);
    try {
      const response = await aiService.getConversationHistory(id);
      const history = response.data;
      const mappedMessages = (history.messages || []).map(msg => ({
        _id: msg.id,
        text: msg.content,
        createdAt: new Date(msg.created_at),
        user: {
          _id: msg.sender === 'user' ? 1 : 2,
          name: msg.sender === 'user' ? (user?.first_name || 'User') : 'AI Assistant',
          avatar: msg.sender === 'user'
            ? (user?.email ? `https://ui-avatars.com/api/?name=${user.first_name}&background=BB86FC&color=fff` : null)
            : 'https://ui-avatars.com/api/?name=AI&background=6200EE&color=fff',
        },
      })).reverse();
      setMessages(mappedMessages);
    } catch (error) {
      Alert.alert('Error', 'Could not load chat history');
    } finally {
      setInitialLoading(false);
    }
  };

  const initializeNewChat = async () => {
    if (isMobile) setShowSidebar(false);
    
    // Show typing indicator while initializing
    setIsTyping(true);
    
    try {
      const conversation = await startConversation(null, false);
      setSessionId(conversation);
      console.log(conversation, 'CONVER')
      
      // Simulate AI "thinking" time
      await new Promise(r => setTimeout(r, 800));
      
      setMessages([
        {
          _id: 1,
          text: "What's good? I'm your AI loan assistant. Let's get you set up with the right funding. What you looking for today?",
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'AI Assistant',
            avatar: 'https://ui-avatars.com/api/?name=AI&background=6200EE&color=fff',
          },
        },
      ]);
    } catch (error) {
      setSessionId('new-session');
    } finally {
      setIsTyping(false);
    }
  };

  const onSend = async (newMessages = []) => {
    const userMessage = newMessages[0];
    
    // Add user message immediately
    setMessages(previousMessages => 
      GiftedChat.append(previousMessages, [userMessage])
    );

    // Show typing indicator
    setIsTyping(true);

    try {
      // Add slight delay to show thinking state
      await new Promise(r => setTimeout(r, 500));
      
      const response = await sendMessage(sessionId, userMessage.text);
      
      // Add another brief delay for realism
      await new Promise(r => setTimeout(r, 500));
      
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
    } finally {
      setIsTyping(false);
    }
  };

  const renderBubble = (props) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: { backgroundColor: theme.colors.primary },
        left: { backgroundColor: 'white' },
      }}
      textStyle={{
        right: { color: 'white' },
      }}
    />
  );

  // Custom typing indicator with animation
  const renderFooter = () => {
    if (isTyping) {
      const dotStyle = (animValue) => ({
        opacity: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        }),
        transform: [
          {
            translateY: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -3],
            }),
          },
        ],
      });

      return (
        <View style={styles.typingContainer}>
          <View style={styles.typingBubble}>
            <Animated.View style={[styles.typingDot, dotStyle(dot1Anim)]} />
            <Animated.View style={[styles.typingDot, dotStyle(dot2Anim)]} />
            <Animated.View style={[styles.typingDot, dotStyle(dot3Anim)]} />
          </View>
          <Text style={styles.typingText}>Thinking...</Text>
        </View>
      );
    }
    return null;
  };

  const renderLoading = () => {
    if (initialLoading) {
      return (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      );
    }
    return null;
  };

  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity 
      onPress={() => loadChatHistory(item.id)}
      style={[
        styles.historyItem, 
        sessionId === item.id && styles.activeHistoryItem
      ]}
    >
      <View style={styles.historyAvatar}>
        <Avatar.Icon 
          size={32} 
          icon="message-text-outline" 
          style={{
            backgroundColor: sessionId === item.id ? theme.colors.primary : '#E0E0E0'
          }} 
        />
      </View>
      <View style={{flex: 1}}>
        <Text 
          variant="titleSmall" 
          numberOfLines={1} 
          style={{fontWeight: sessionId === item.id ? 'bold' : 'normal'}}
        >
          {item.title}
        </Text>
        <Text variant="bodySmall" numberOfLines={1} style={{color: '#666'}}>
          {item.preview}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Empty state for when no messages
  const renderEmpty = () => {
    if (messages.length === 0 && !initialLoading && !isTyping) {
      return (
        <View style={styles.emptyState}>
          <Avatar.Icon size={64} icon="robot" style={{backgroundColor: theme.colors.primary}} />
          <Text variant="titleLarge" style={styles.emptyTitle}>
            Start a Conversation
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Ask me anything about loans and financing
          </Text>
        </View>
      );
    }
    return null;
  };

  // Custom composer to handle Enter key (React Native Web)
  const renderComposer = (props) => (
    <Composer
      {...props}
      textInputProps={{
        ...props.textInputProps,
        onKeyPress: (e) => {
          // Handle Enter key on web
          if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
            e.preventDefault();
            if (props.text && props.text.trim().length > 0) {
              props.onSend({ text: props.text.trim() }, true);
            }
          }
        },
        onSubmitEditing: () => {
          // Handle Enter key on native
          if (Platform.OS !== 'web' && props.text && props.text.trim().length > 0) {
            props.onSend({ text: props.text.trim() }, true);
          }
        },
        blurOnSubmit: false,
        returnKeyType: 'send',
        multiline: true,
      }}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        {showSidebar && (
          <Surface style={[styles.sidebar, isMobile && styles.mobileSidebar]} elevation={2}>
            <View style={styles.sidebarHeader}>
              <Text variant="titleMedium" style={{fontWeight: 'bold'}}>History</Text>
              <TouchableOpacity onPress={initializeNewChat}>
                <Text style={{color: theme.colors.primary, fontWeight: 'bold'}}>+ New</Text>
              </TouchableOpacity>
            </View>
            <Divider />
            
            {historyLoading ? (
              <ActivityIndicator style={{marginTop: 20}} />
            ) : conversations.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={{color: '#999', textAlign: 'center'}}>No conversations yet</Text>
              </View>
            ) : (
              <FlatList
                data={conversations}
                renderItem={renderHistoryItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{paddingVertical: 10}}
              />
            )}
          </Surface>
        )}

        <View style={styles.chatArea}>
          <GiftedChat
            messages={messages}
            onSend={onSend}
            user={{
              _id: 1,
              name: user?.first_name || 'User',
              avatar: user?.email ? `https://ui-avatars.com/api/?name=${user.first_name}&background=BB86FC&color=fff` : null,
            }}
            placeholder="Type your message... (Press Enter to send)"
            alwaysShowSend
            scrollToBottom
            renderLoading={renderLoading}
            renderAvatarOnTop
            showUserAvatar
            renderBubble={renderBubble}
            renderFooter={renderFooter}
            renderChatEmpty={renderEmpty}
            renderComposer={renderComposer}
            isTyping={isTyping}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 280,
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    display: 'flex',
    flexDirection: 'column',
  },
  mobileSidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    width: '80%',
    height: '100%',
  },
  sidebarHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  chatArea: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  historyItem: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeHistoryItem: {
    backgroundColor: '#E3F2FD',
  },
  historyAvatar: {
    marginRight: 12,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 5,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6200EE',
    marginHorizontal: 2,
  },
  typingText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    marginTop: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
  emptyHistory: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});