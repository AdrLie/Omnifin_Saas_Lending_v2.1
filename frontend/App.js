import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import { ChatProvider } from './src/contexts/ChatContext';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import Navigation from './src/navigation/Navigation';

// Custom theme with purple highlights
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200EE',
    accent: '#BB86FC',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#333333',
    placeholder: '#666666',
  },
};

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <SubscriptionProvider>
          <ChatProvider>
            <NavigationContainer>
              <Navigation />
            </NavigationContainer>
          </ChatProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </PaperProvider>
  );
}