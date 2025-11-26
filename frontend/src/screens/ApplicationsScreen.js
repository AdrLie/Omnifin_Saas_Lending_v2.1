import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Chip, DataTable, FAB, Portal, Dialog, TextInput, ActivityIndicator } from 'react-native-paper';
import { AuthContext } from '../contexts/AuthContext';
import { applicationsService } from '../services/applicationsService';
import { APPLICATION_STATUS, STATUS_COLORS } from '../utils/constants';

export default function ApplicationsScreen({ navigation }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newApplication, setNewApplication] = useState({
    loan_purpose: '',
    loan_amount: '',
    loan_term: '',
  });
  
  const { user } = useContext(AuthContext);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await applicationsService.getApplications();
      setApplications(response.data);
    } catch (error) {
      console.error('Error loading applications:', error);
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApplication = async () => {
    if (!newApplication.loan_purpose || !newApplication.loan_amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const response = await applicationsService.createApplication({
        ...newApplication,
        loan_amount: parseFloat(newApplication.loan_amount),
        loan_term: newApplication.loan_term ? parseInt(newApplication.loan_term) : null,
      });
      
      setApplications([response.data, ...applications]);
      setShowCreateDialog(false);
      setNewApplication({ loan_purpose: '', loan_amount: '', loan_term: '' });
      Alert.alert('Success', 'Application created successfully');
    } catch (error) {
      console.error('Error creating application:', error);
      Alert.alert('Error', 'Failed to create application');
    }
  };

  const handleSubmitApplication = async (applicationId) => {
    try {
      await applicationsService.submitApplication(applicationId);
      Alert.alert('Success', 'Application submitted successfully');
      loadApplications(); // Reload to update status
    } catch (error) {
      console.error('Error submitting application:', error);
      Alert.alert('Error', 'Failed to submit application');
    }
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || '#666666';
  };

  const renderApplicationCard = (application) => (
    <Card key={application.id} style={styles.applicationCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Title style={styles.applicationNumber}>
            {application.application_number}
          </Title>
          <Chip
            mode="outlined"
            style={[styles.statusChip, { borderColor: getStatusColor(application.status) }]}
            textStyle={{ color: getStatusColor(application.status) }}
          >
            {application.status.replace('_', ' ').toUpperCase()}
          </Chip>
        </View>

        <Paragraph style={styles.applicationDetails}>
          Loan Amount: ${parseFloat(application.loan_amount).toLocaleString()}
        </Paragraph>
        <Paragraph style={styles.applicationDetails}>
          Purpose: {application.loan_purpose}
        </Paragraph>
        <Paragraph style={styles.applicationDetails}>
          Created: {new Date(application.created_at).toLocaleDateString()}
        </Paragraph>

        {application.status === 'pending' && (
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => handleSubmitApplication(application.id)}
              style={styles.submitButton}
              icon="send"
            >
              Submit
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Chat', { applicationId: application.id })}
              style={styles.chatButton}
              icon="chat"
            >
              Continue Chat
            </Button>
          </View>
        )}

        {application.status === 'approved' && (
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Offers', { applicationId: application.id })}
            style={styles.viewOffersButton}
            icon="gift"
          >
            View Offers
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {applications.length === 0 ? (
          <View style={styles.emptyState}>
            <Title style={styles.emptyTitle}>No Applications Yet</Title>
            <Paragraph style={styles.emptySubtitle}>
              Start your first loan application to see it here
            </Paragraph>
          </View>
        ) : (
          applications.map(renderApplicationCard)
        )}
      </ScrollView>

      {user.role === 'applicant' && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => setShowCreateDialog(true)}
        />
      )}

      <Portal>
        <Dialog visible={showCreateDialog} onDismiss={() => setShowCreateDialog(false)}>
          <Dialog.Title>Create New Application</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Loan Purpose"
              value={newApplication.loan_purpose}
              onChangeText={(text) => setNewApplication({ ...newApplication, loan_purpose: text })}
              style={styles.input}
              placeholder="e.g., Home Purchase, Debt Consolidation"
            />
            <TextInput
              label="Loan Amount ($)"
              value={newApplication.loan_amount}
              onChangeText={(text) => setNewApplication({ ...newApplication, loan_amount: text })}
              style={styles.input}
              keyboardType="numeric"
              placeholder="50000"
            />
            <TextInput
              label="Loan Term (months) - Optional"
              value={newApplication.loan_term}
              onChangeText={(text) => setNewApplication({ ...newApplication, loan_term: text })}
              style={styles.input}
              keyboardType="numeric"
              placeholder="60"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onPress={handleCreateApplication}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    marginBottom: 10,
    color: '#6200EE',
  },
  emptySubtitle: {
    textAlign: 'center',
    color: '#666',
  },
  applicationCard: {
    marginBottom: 15,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  applicationNumber: {
    fontSize: 16,
    color: '#6200EE',
  },
  statusChip: {
    height: 30,
  },
  applicationDetails: {
    marginBottom: 5,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  submitButton: {
    flex: 1,
    marginRight: 5,
  },
  chatButton: {
    flex: 1,
    marginLeft: 5,
  },
  viewOffersButton: {
    marginTop: 15,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 10,
  },
});