import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { Appbar, TextInput, Button, ActivityIndicator, Avatar, Text, useTheme, Surface } from 'react-native-paper';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/authService';

// Helper to get initials
const getInitials = (first, last) => {
  return `${first ? first[0] : ''}${last ? last[0] : ''}`.toUpperCase();
};

export default function ProfileScreen({ navigation }) {
  const { user, setUser, updateProfile } = useContext(AuthContext);
  const theme = useTheme(); // Hook into paper theme
  
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
  });

  useEffect(() => {
    // Mocking the fetch for visualization purposes
    const fetchProfile = async () => {
      try {
        // const response = await api.get('/auth/profile/');
        // Mock data for UI demo
        const mockData = {
          first_name: user?.first_name || '',
          last_name: user?.last_name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          role: user?.role || 'Developer',
        };
        
        setProfile(mockData);
        setForm(mockData);
      } catch (error) {
        // console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    const result = await updateProfile(form);
    if (result.success) {
      setProfile({ ...profile, ...form });
      setIsEditing(false);
    } else {
      // Optionally show error
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Background Strip */}
      <View style={[styles.headerBackground, { backgroundColor: theme.colors.primary }]} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.webContainer}>
          
          {/* Main Card */}
          <Surface style={styles.card} elevation={4}>
            {/* Header / Avatar Section */}
            <View style={styles.avatarSection}>
              <Avatar.Text 
                size={100} 
                label={getInitials(form.first_name, form.last_name)} 
                style={[styles.avatar, { backgroundColor: theme.colors.accent || '#333' }]}
              />
              <Text variant="headlineMedium" style={styles.userName}>
                {form.first_name} {form.last_name}
              </Text>
              <Text variant="bodyMedium" style={styles.userRole}>
                {form.role}
              </Text>
              
              {!isEditing && (
                <Button 
                  mode="text" 
                  icon="pencil" 
                  onPress={() => setIsEditing(true)}
                  style={styles.editButtonTop}
                >
                  Edit Profile
                </Button>
              )}
            </View>

            {/* Form Fields */}
            <View style={styles.formGrid}>
              <View style={styles.inputRow}>
                <TextInput
                  mode="outlined"
                  label="First Name"
                  value={form.first_name}
                  onChangeText={t => setForm({ ...form, first_name: t })}
                  disabled={!isEditing}
                  style={[styles.input, styles.halfInput]}
                  left={<TextInput.Icon icon="account" />}
                />
                <TextInput
                  mode="outlined"
                  label="Last Name"
                  value={form.last_name}
                  onChangeText={t => setForm({ ...form, last_name: t })}
                  disabled={!isEditing}
                  style={[styles.input, styles.halfInput]}
                />
              </View>

              <TextInput
                mode="outlined"
                label="Email Address"
                value={form.email}
                onChangeText={t => setForm({ ...form, email: t })}
                disabled={true} // Usually email shouldn't be edited freely
                style={styles.input}
                left={<TextInput.Icon icon="email" />}
              />

              <TextInput
                mode="outlined"
                label="Phone Number"
                value={form.phone}
                onChangeText={t => setForm({ ...form, phone: t })}
                disabled={!isEditing}
                style={styles.input}
                left={<TextInput.Icon icon="phone" />}
              />

              <TextInput
                mode="outlined"
                label="Role / Title"
                value={form.role}
                disabled={true} // Roles are usually assigned, not chosen
                style={[styles.input, styles.readOnlyInput]}
                left={<TextInput.Icon icon="badge-account-horizontal" />}
              />

              {isEditing && (
                <View style={styles.actionButtons}>
                  <Button 
                    mode="outlined" 
                    onPress={() => setIsEditing(false)} 
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </Button>
                  <Button 
                    mode="contained" 
                    onPress={handleSave} 
                    style={styles.saveBtn}
                  >
                    Save Changes
                  </Button>
                </View>
              )}
            </View>
          </Surface>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC', // Cleaner light gray background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackground: {
    height: 180,
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  webContainer: {
    width: '100%',
    maxWidth: 600, // Keeps it looking tight on Desktop
    zIndex: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: -60, // Pulls the avatar up over the card edge
  },
  avatar: {
    borderWidth: 4,
    borderColor: 'white',
    elevation: 4,
  },
  userName: {
    marginTop: 12,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  userRole: {
    color: '#666',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  editButtonTop: {
    marginTop: 8,
  },
  formGrid: {
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap', // Wraps nicely on small screens
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  halfInput: {
    width: '48%', // Side by side layout
    minWidth: 140, // fallback for tiny screens
  },
  readOnlyInput: {
    backgroundColor: '#f0f0f0',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 10,
  },
  saveBtn: {
    flex: 1,
  },
  cancelBtn: {
    flex: 1,
    borderColor: '#ccc',
  },
});