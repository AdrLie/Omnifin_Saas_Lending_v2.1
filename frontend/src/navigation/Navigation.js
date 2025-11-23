import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../contexts/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import VoiceChatScreen from '../screens/VoiceChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ApplicationsScreen from '../screens/ApplicationsScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import TPBDashboardScreen from '../screens/TPBDashboardScreen';

const Stack = createNativeStackNavigator();

export default function Navigation() {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200EE',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {!user ? (
        // Auth screens
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ title: 'Create Account' }}
          />
        </>
      ) : (
        // Main app screens
        <>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Omnifin Platform' }}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen} 
            options={{ title: 'AI Assistant' }}
          />
          <Stack.Screen 
            name="VoiceChat" 
            component={VoiceChatScreen} 
            options={{ title: 'Voice Assistant' }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ title: 'Profile' }}
          />
          <Stack.Screen 
            name="Applications" 
            component={ApplicationsScreen} 
            options={{ title: 'My Applications' }}
          />
          <Stack.Screen 
            name="Documents" 
            component={DocumentsScreen} 
            options={{ title: 'Documents' }}
          />
          
          {/* Role-specific screens */}
          {user.role === 'admin' && (
            <Stack.Screen 
              name="AdminDashboard" 
              component={AdminDashboardScreen} 
              options={{ title: 'Admin Dashboard' }}
            />
          )}
          
          {user.role === 'superadmin' && (
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen} 
              options={{ title: 'Super Admin Dashboard' }}
            />
          )}
          
          {user.role === 'tpb' && (
            <Stack.Screen 
              name="TPBDashboard" 
              component={TPBDashboardScreen} 
              options={{ title: 'TPB Dashboard' }}
            />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}