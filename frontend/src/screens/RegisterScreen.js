import React, { useState, useContext, useRef } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, ActivityIndicator, HelperText } from 'react-native-paper';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { register } = useContext(AuthContext);
  
  // Refs for focus chain
  const usernameRef = useRef(null);
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Form State
  const [form, setForm] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    password_confirm: '',
    role: 'applicant',
  });

  const handleChange = (name, value) => {
    // Clear error for this field when user starts typing
    setErrors(prev => ({ ...prev, [name]: '', general: '' }));
    setForm({ ...form, [name]: value });
  };

  const validate = () => {
    let valid = true;
    let newErrors = {};

    // Check required fields
    if (!form.email) { newErrors.email = 'Email is required'; valid = false; }
    if (!form.username) { newErrors.username = 'Username is required'; valid = false; }
    if (!form.first_name) { newErrors.first_name = 'First name required'; valid = false; }
    if (!form.last_name) { newErrors.last_name = 'Last name required'; valid = false; }
    if (!form.password) { newErrors.password = 'Password is required'; valid = false; }
    
    // Check password match
    if (form.password && form.password_confirm !== form.password) {
      newErrors.password_confirm = 'Passwords do not match';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await register(form);
      
      if (!result.success) {
        // Logic to clean up the backend error message
        let errorMessage = 'Registration failed.';
        const err = result.error;
        
        if (err) {
          if (typeof err === 'string') {
            errorMessage = err.replace(/non_field_errors:|detail:/gi, '').trim().replace(/[\[\]"']/g, '');
          } else if (typeof err === 'object') {
            // If we have specific field errors in the object, we can map them too!
            // But for the general banner, we grab the first available error.
            const message = err.non_field_errors || err.detail || Object.values(err)[0];
            errorMessage = Array.isArray(message) ? message[0] : message;
            
            // Optional: Map specific field errors from backend to input fields
            // setErrors(prev => ({...prev, ...err})); // This would highlight specific fields if keys match
          }
        }
        
        // Set general error for the banner
        setErrors(prev => ({ ...prev, general: errorMessage }));
      } else {
        navigation.replace('Home');
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, general: 'An unexpected error occurred. Try again.' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Create Account</Title>
            <Paragraph style={styles.subtitle}>
              Join Omnifin and get funded
            </Paragraph>

            {/* General Error Message Banner */}
            {errors.general ? (
              <View style={styles.errorContainer}>
                <HelperText type="error" visible={true} style={styles.errorText}>
                  {errors.general}
                </HelperText>
              </View>
            ) : null}

            {/* Email Input */}
            <View>
              <TextInput
                label="Email"
                value={form.email}
                onChangeText={(text) => handleChange('email', text)}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                mode="outlined"
                error={!!errors.email}
                left={<TextInput.Icon icon="email" />}
                returnKeyType="next"
                onSubmitEditing={() => usernameRef.current?.focus()}
                blurOnSubmit={false}
              />
              {errors.email && <HelperText type="error" visible={true}>{errors.email}</HelperText>}
            </View>

            {/* Username Input */}
            <View>
              <TextInput
                ref={usernameRef}
                label="Username"
                value={form.username}
                onChangeText={(text) => handleChange('username', text)}
                style={styles.input}
                autoCapitalize="none"
                mode="outlined"
                error={!!errors.username}
                left={<TextInput.Icon icon="account" />}
                returnKeyType="next"
                onSubmitEditing={() => firstNameRef.current?.focus()}
                blurOnSubmit={false}
              />
              {errors.username && <HelperText type="error" visible={true}>{errors.username}</HelperText>}
            </View>

            {/* Names Row */}
            <View style={styles.row}>
              <View style={styles.halfInputContainer}>
                <TextInput
                  ref={firstNameRef}
                  label="First Name"
                  value={form.first_name}
                  onChangeText={(text) => handleChange('first_name', text)}
                  style={styles.input}
                  mode="outlined"
                  error={!!errors.first_name}
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {errors.first_name && <HelperText type="error" visible={true}>{errors.first_name}</HelperText>}
              </View>

              <View style={styles.halfInputContainer}>
                <TextInput
                  ref={lastNameRef}
                  label="Last Name"
                  value={form.last_name}
                  onChangeText={(text) => handleChange('last_name', text)}
                  style={styles.input}
                  mode="outlined"
                  error={!!errors.last_name}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {errors.last_name && <HelperText type="error" visible={true}>{errors.last_name}</HelperText>}
              </View>
            </View>

            {/* Password Input */}
            <View>
              <TextInput
                ref={passwordRef}
                label="Password"
                value={form.password}
                onChangeText={(text) => handleChange('password', text)}
                style={styles.input}
                secureTextEntry
                mode="outlined"
                error={!!errors.password}
                left={<TextInput.Icon icon="lock" />}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                blurOnSubmit={false}
              />
              {errors.password && <HelperText type="error" visible={true}>{errors.password}</HelperText>}
            </View>

            {/* Confirm Password Input */}
            <View>
              <TextInput
                ref={confirmPasswordRef}
                label="Confirm Password"
                value={form.password_confirm}
                onChangeText={(text) => handleChange('password_confirm', text)}
                style={styles.input}
                secureTextEntry
                mode="outlined"
                error={!!errors.password_confirm}
                left={<TextInput.Icon icon="lock-check" />}
                returnKeyType="go"
                onSubmitEditing={handleRegister}
              />
              {errors.password_confirm && <HelperText type="error" visible={true}>{errors.password_confirm}</HelperText>}
            </View>

            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.button}
              disabled={loading}
              contentStyle={{ height: 48 }}
            >
              {loading ? <ActivityIndicator color="white" style={{ marginRight: 10 }} /> : null}
              Sign Up
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.linkButton}
            >
              Already have an account? Sign In
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingVertical: 10,
    elevation: 4,
    borderRadius: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 5,
    color: '#6200EE',
    fontWeight: 'bold',
    fontSize: 24,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 4, // slight spacing before helper text
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInputContainer: {
    width: '48%',
  },
  button: {
    marginTop: 15,
    borderRadius: 8,
  },
  linkButton: {
    marginTop: 10,
  },
  // New Error Styles
  errorContainer: {
    marginBottom: 15,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  errorText: {
    textAlign: 'center',
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 14,
  }
});