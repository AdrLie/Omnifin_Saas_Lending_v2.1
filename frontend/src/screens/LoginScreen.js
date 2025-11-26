import React, { useState, useContext, useRef } from 'react'; // Added useRef here
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, ActivityIndicator, HelperText } from 'react-native-paper';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useContext(AuthContext);

  // 1. Create a ref for the password input so we can focus it later
  const passwordInputRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    // Clear previous errors
    setError('');

    if (!email || !password) {
      setError('We need both your email and password to proceed.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      
      if (!result.success) {
        let errorMessage = 'Login failed. Check your credentials.';
        
        const err = result.error;
        if (err) {
          if (typeof err === 'string') {
            errorMessage = err.replace(/non_field_errors:|detail:/gi, '').trim();
            errorMessage = errorMessage.replace(/[\[\]"']/g, '');
          } else if (typeof err === 'object') {
            const message = err.non_field_errors || err.detail || Object.values(err)[0];
            errorMessage = Array.isArray(message) ? message[0] : message;
          }
        }
        
        setError(errorMessage);
      } else {
        navigation.replace('Home');
      }
    } catch (error) {
      setError('Something went wrong on the server. Try again later.');
    } finally {
      setLoading(false);
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

          {error ? (
            <View style={styles.errorContainer}>
              <HelperText type="error" visible={true} style={styles.errorText}>
                {error}
              </HelperText>
            </View>
          ) : null}

          <TextInput
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError('');
            }}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
            error={!!error}
            // 2. When hitting enter on Email, jump to Password
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            blurOnSubmit={false}
          />

          <TextInput
            // 3. Attach the ref here
            ref={passwordInputRef}
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError('');
            }}
            style={styles.input}
            secureTextEntry
            left={<TextInput.Icon icon="lock" />}
            error={!!error}
            // 4. When hitting enter here, fire the login function
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            disabled={loading}
            icon="login"
          >
            {loading ? <ActivityIndicator color="white" size="small" style={{ marginRight: 10 }} /> : null}
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
    borderRadius: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#6200EE',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  errorContainer: {
    marginBottom: 15,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    paddingVertical: 4,
  },
  errorText: {
    textAlign: 'center',
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 20,
    paddingVertical: 6,
  },
  linkButton: {
    marginTop: 15,
  },
});