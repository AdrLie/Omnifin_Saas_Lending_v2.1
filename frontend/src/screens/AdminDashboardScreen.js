import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import { Appbar, Button, DataTable, TextInput, Dialog, Portal, Text, ActivityIndicator, Surface, Chip, IconButton, useTheme, Avatar } from 'react-native-paper';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/authService'; // Make sure this is uncommented for delete actions

export default function AdminDashboardScreen({ navigation }) {
  // 1. Now we pulling getAllUsers straight from the context
  const { user, getAllUsers } = useContext(AuthContext);
  const theme = useTheme();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', role: 'user', password: '' });

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // 3. Calling the real function now
      const data = await getAllUsers();
      
      // Safety check: ensure data is an array before setting it
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.warn("getAllUsers did not return an array:", data);
        setUsers([]); 
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    setIsLoading(true);
    try {

      
      setShowDialog(false);
      setForm({ email: '', first_name: '', last_name: '', role: 'user', password: '' });
      
      // Refresh the list after creating
      fetchUsers();
    } catch (error) {
      Alert.alert('Error', 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const previousUsers = [...users];
    setUsers(users.filter(u => u.id !== userId));

    try {
      await api.delete(`/api/auth/users/${userId}/`);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete user');
      // Revert if it failed
      setUsers(previousUsers);
    }
  };

  const getInitials = (first, last) => `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();

  return (
    <View style={styles.container}>
      {/* Header Background Strip */}
      <View style={[styles.headerBackground, { backgroundColor: theme.colors.primary }]} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.webContainer}>
          
          <View style={styles.headerRow}>
            <View>
              <Text variant="headlineMedium" style={{ color: 'white', fontWeight: 'bold' }}>User List</Text>
              <Text variant="bodyMedium" style={{ color: 'rgba(255,255,255,0.8)' }}>Manage your users and their access roles</Text>
            </View>
            <Button 
              icon="plus" 
              mode="contained" 
              buttonColor={theme.colors.secondaryContainer}
              textColor={theme.colors.onSecondaryContainer}
              onPress={() => setShowDialog(true)}
              style={styles.addButton}
            >
              Add User
            </Button>
          </View>

          {/* Main Card */}
          <Surface style={styles.card} elevation={2}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{marginTop: 10, color: '#666'}}>Fetching the squad...</Text>
              </View>
            ) : (
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title style={{flex: 2}}>User</DataTable.Title>
                  <DataTable.Title style={{flex: 2}}>Email</DataTable.Title>
                  <DataTable.Title>Role</DataTable.Title>
                  <DataTable.Title numeric>Actions</DataTable.Title>
                </DataTable.Header>

                {users.length > 0 ? (
                  users.map(u => (
                    <DataTable.Row key={u.id} style={styles.row}>
                      <DataTable.Cell style={{flex: 2}}>
                        <View style={styles.userCell}>
                          <Avatar.Text size={32} label={getInitials(u.first_name, u.last_name)} style={{marginRight: 10}} />
                          <Text style={{fontWeight: '500'}}>{u.first_name} {u.last_name}</Text>
                        </View>
                      </DataTable.Cell>
                      <DataTable.Cell style={{flex: 2}}>
                        <Text style={{color: '#666'}}>{u.email}</Text>
                      </DataTable.Cell>
                      <DataTable.Cell>
                        <Chip 
                          mode="flat" 
                          compact 
                          style={u.role === 'superadmin' || u.role === 'admin' ? styles.adminChip : styles.userChip}
                          textStyle={{fontSize: 10}}
                        >
                          {u.role ? u.role.toUpperCase() : 'USER'}
                        </Chip>
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        <IconButton icon="pencil" size={20} onPress={() => {}} iconColor="#666" />
                        <IconButton 
                          icon="delete" 
                          size={20} 
                          iconColor={theme.colors.error}
                          onPress={() => handleDeleteUser(u.id)} 
                          disabled={user.id === u.id}
                        />
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text>No users found.</Text>
                  </View>
                )}
              </DataTable>
            )}
          </Surface>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)} style={{ backgroundColor: 'white' }}>
          <Dialog.Title>Add New Team Member</Dialog.Title>
          <Dialog.Content>
            <View style={styles.dialogForm}>
              <View style={styles.rowInputs}>
                <TextInput 
                  mode="outlined" 
                  label="First Name" 
                  value={form.first_name} 
                  onChangeText={t => setForm({ ...form, first_name: t })} 
                  style={[styles.input, {flex: 1}]} 
                />
                <TextInput 
                  mode="outlined" 
                  label="Last Name" 
                  value={form.last_name} 
                  onChangeText={t => setForm({ ...form, last_name: t })} 
                  style={[styles.input, {flex: 1}]} 
                />
              </View>
              <TextInput 
                mode="outlined" 
                label="Email" 
                value={form.email} 
                onChangeText={t => setForm({ ...form, email: t })} 
                style={styles.input} 
                left={<TextInput.Icon icon="email" />}
              />
              <TextInput 
                mode="outlined" 
                label="Role (user/admin)" 
                value={form.role} 
                onChangeText={t => setForm({ ...form, role: t })} 
                style={styles.input} 
                left={<TextInput.Icon icon="shield-account" />}
              />
              <TextInput 
                mode="outlined" 
                label="Password" 
                value={form.password} 
                onChangeText={t => setForm({ ...form, password: t })} 
                style={styles.input} 
                secureTextEntry 
                left={<TextInput.Icon icon="lock" />}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDialog(false)} textColor="#666">Cancel</Button>
            <Button mode="contained" onPress={handleCreateUser} style={{marginLeft: 10}}>Create User</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  headerBackground: {
    height: 180,
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 30,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  webContainer: {
    width: '100%',
    maxWidth: 900,
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    paddingBottom: 10,
  },
  loadingContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  adminChip: {
    backgroundColor: '#E3F2FD',
  },
  userChip: {
    backgroundColor: '#F5F5F5',
  },
  dialogForm: {
    marginTop: 10,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    elevation: 2,
  }
});