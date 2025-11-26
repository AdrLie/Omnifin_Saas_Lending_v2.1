import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../contexts/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import ApplicationsScreen from '../screens/ApplicationsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import VoiceChatScreen from '../screens/VoiceChatScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import TPBDashboardScreen from '../screens/TPBDashboardScreen';
import AdminCommissionScreen from '../screens/AdminCommissionScreen';
import LenderManagementScreen from '../screens/LenderManagementScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator();

export default function Navigation() {
  const { user, isLoading } = useContext(AuthContext);

  // if (isLoading) {
  //   return null; // Or a loading screen
  // }
  console.log("[Navigation] User state:", user);
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
            options={{ headerShown: false }}
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
          <Stack.Screen 
            name="TPBDashboard" 
            component={TPBDashboardScreen} 
            options={{ title: 'TPB Dashboard' }}
          />
          <Stack.Screen 
            name="AdminCommission" 
            component={AdminCommissionScreen} 
            options={{ title: 'Admin Commission' }}
          />
          <Stack.Screen 
            name="LenderManagement" 
            component={LenderManagementScreen} 
            options={{ title: 'Lender Management' }}
          />
          {/* <Stack.Screen 
            name="Documents" 
            component={DocumentsScreen} 
            options={{ title: 'Documents' }}
          /> */}
          
          {/* Role-specific screens */}
          {(user.role === 'admin' || user.role === 'superadmin') && (
            <Stack.Screen 
              name="AdminDashboard" 
              component={require('../screens/AdminDashboardScreen').default} 
              options={{ title: 'Admin Dashboard' }}
            />
          )}
          
      {user.role === 'admin' && (
  < Stack.Screen 
    name="Dashboard" 
    component={DashboardScreen} 
    options={{ title: 'Super Admin Dashboard' }}
  />
)}
          
          {/* {user.role === 'tpb' && (
            <Stack.Screen 
              name="TPBDashboard" 
              component={TPBDashboardScreen} 
              options={{ title: 'TPB Dashboard' }}
            />
          )} */}
        </>
      )}
    </Stack.Navigator>
  );
}