import React, { useState, useContext } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Please fill in all fields');
    return;
  }

  setLoading(true);
  try {
    console.log("[LoginScreen] Calling login() from AuthContext");
    const result = await login(email, password);
    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    } else {
      navigation.replace('Home'); // or 'Home', depending on your routes
    }
  } catch (error) {
    console.log("[LoginScreen] Unexpected error:", error);
    Alert.alert('Error', 'An unexpected error occurred');
  } finally {
    setLoading(false);
    console.log("[LoginScreen] Loading set to false");
  }
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Welcome to Omnifin</Title>
          <Paragraph style={styles.subtitle}>
            Your AI-powered lending platform
          </Paragraph>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon name="email" />}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
            left={<TextInput.Icon name="lock" />}
          />

          <Button
            mode="contained"
            onPress={() => {
              console.log("[LoginScreen] Sign In button pressed");
              handleLogin();
            }}
            style={styles.button}
            icon="login"
            disabled={loading}
          >
            {loading ? <ActivityIndicator size="small" style={{ marginRight: 10 }} /> : null}
            Sign In
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Register')}
            style={styles.linkButton}
          >
            Don't have an account? Sign Up
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  card: {
    padding: 20,
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#6200EE',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 15,
  },
  loader: {
    marginTop: 20,
  },
});