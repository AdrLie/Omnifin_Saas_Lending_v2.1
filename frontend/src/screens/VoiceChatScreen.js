import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Appbar, ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import { ChatContext } from '../contexts/ChatContext';
import { AuthContext } from '../contexts/AuthContext';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';

export default function VoiceChatScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const { startConversation, sendVoiceMessage, isLoading: chatLoading } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState(null);

  const initializeVoiceChat = async () => {
    try {
      const session = await startConversation(null, true);
      setSessionId(session);
      setMessages([
        {
          _id: 1,
          text: "Welcome to the AI Voice Assistant. Tap the button to record or upload audio.",
          createdAt: new Date(),
          user: { _id: 2, name: 'AI Assistant' },
        },
      ]);
    } catch (error) {
      console.error('Init error:', error);
      Alert.alert('Error', 'Failed to initialize voice chat');
    }
  };

  useEffect(() => {
    initializeVoiceChat();
    
    return () => {
      // Cleanup sound on unmount
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const playAudioResponse = async (base64Audio) => {
    try {
      // Unload previous sound if exists
      if (sound) {
        await sound.unloadAsync();
      }

      // Create sound from base64
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${base64Audio}` },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      
      // Cleanup when done playing
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          newSound.unloadAsync();
          setSound(null);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio response');
    }
  };

  const pickAudioFile = async () => {
    if (!sessionId) {
      Alert.alert('Error', 'Session not initialized');
      return;
    }

    setIsLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ 
        type: 'audio/*',
        copyToCacheDirectory: true 
      });
      
      console.log('DocumentPicker result:', JSON.stringify(result, null, 2));
      
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // ✅ FIX: Ensure proper file object structure
        const file = {
          uri: asset.uri,
          type: asset.mimeType || 'audio/wav',
          name: asset.name || `voice_${Date.now()}.wav`,
        };

        // Debug logs
        console.log('File to upload:', JSON.stringify(file, null, 2));
        console.log('File URI:', file.uri);
        console.log('File type:', file.type);
        console.log('File name:', file.name);
        console.log('Session ID:', sessionId);

        // Add user message to UI
        setMessages(prev => [
          ...prev,
          {
            _id: Math.round(Math.random() * 1000000),
            text: '[Audio Message]',
            createdAt: new Date(),
            user: { _id: 1, name: 'You' },
          },
        ]);

        // Send to backend
        const response = await sendVoiceMessage(sessionId, file);
        
        // Add AI response to UI
        setMessages(prev => [
          ...prev,
          {
            _id: Math.round(Math.random() * 1000000),
            text: response.aiResponse || response.response || 'No response from AI.',
            createdAt: new Date(),
            user: { _id: 2, name: 'AI Assistant' },
          },
        ]);

        // Play audio response if available
        if (response.audio_response) {
          await playAudioResponse(response.audio_response);
        }
      }
    } catch (error) {
      console.error('Pick audio error:', error);
      Alert.alert('Error', error.message || 'Failed to send voice message');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Microphone permission is required to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setIsRecording(true);
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (error) {
      console.error('Start recording error:', error);
      Alert.alert('Error', 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecordingAndSend = async () => {
    if (!recording || !sessionId) return;
    
    setIsRecording(false);
    setIsLoading(true);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      // ✅ FIX: Proper file object for React Native
      const file = {
        uri,
        type: 'audio/m4a', // iOS records in m4a by default
        name: `recording_${Date.now()}.m4a`,
      };

      // Debug log
      console.log('Recording to upload:', JSON.stringify(file, null, 2));

      // Add user message to UI
      setMessages(prev => [
        ...prev,
        {
          _id: Math.round(Math.random() * 1000000),
          text: '[Voice Recording]',
          createdAt: new Date(),
          user: { _id: 1, name: 'You' },
        },
      ]);

      // Send to backend
      const response = await sendVoiceMessage(sessionId, file);
      
      // Add AI response to UI
      setMessages(prev => [
        ...prev,
        {
          _id: Math.round(Math.random() * 1000000),
          text: response.aiResponse || response.response || 'No response from AI.',
          createdAt: new Date(),
          user: { _id: 2, name: 'AI Assistant' },
        },
      ]);

      // Play audio response if available
      if (response.audio_response) {
        await playAudioResponse(response.audio_response);
      }

      setRecording(null);
    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert('Error', error.message || 'Failed to send voice message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Voice Assistant" />
      </Appbar.Header>

      <ScrollView style={styles.messagesContainer}>
        {messages.map(msg => (
          <Card key={msg._id} style={styles.messageCard}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.messageSender}>
                {msg.user.name}
              </Text>
              <Text variant="bodyMedium">{msg.text}</Text>
              <Text variant="bodySmall" style={styles.messageTime}>
                {msg.createdAt.toLocaleTimeString()}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <View style={styles.controlsContainer}>
        {isLoading || chatLoading ? (
          <ActivityIndicator size="large" />
        ) : (
          <>
            {!isRecording ? (
              <>
                <Button 
                  mode="contained" 
                  onPress={startRecording}
                  icon="microphone"
                  style={styles.button}
                >
                  Start Recording
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={pickAudioFile}
                  icon="file-music"
                  style={styles.button}
                >
                  Pick Audio File
                </Button>
              </>
            ) : (
              <Button 
                mode="contained" 
                onPress={stopRecordingAndSend}
                icon="stop"
                buttonColor="#f44336"
                style={styles.button}
              >
                Stop & Send
              </Button>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F5F5' 
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageCard: {
    marginBottom: 12,
    elevation: 2,
  },
  messageSender: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageTime: {
    marginTop: 4,
    color: '#666',
  },
  controlsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 8,
  },
  button: {
    marginVertical: 6,
  },
});