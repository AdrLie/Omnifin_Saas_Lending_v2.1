import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Appbar, Button, List, ActivityIndicator } from 'react-native-paper';
import { documentsService } from '../services/documentsService';
import { AuthContext } from '../contexts/AuthContext';

export default function DocumentsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      // Replace with actual applicationId logic
      const applicationId = user?.activeApplicationId;
      const response = await documentsService.getDocuments(applicationId);
      setDocuments(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const renderDocument = ({ item }) => (
    <List.Item
      title={item.file_name}
      description={item.document_type}
      right={props => item.verified ? <List.Icon {...props} icon="check" color="green" /> : <List.Icon {...props} icon="alert" color="orange" />}
    />
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Documents" />
      </Appbar.Header>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={item => item.id}
          renderItem={renderDocument}
        />
      )}
      <Button mode="contained" onPress={() => {/* Integrate file picker/upload logic here */}}>
        Upload Document
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
