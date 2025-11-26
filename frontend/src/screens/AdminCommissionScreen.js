import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, DataTable, ActivityIndicator } from 'react-native-paper';
import { commissionsService } from '../services/commissionsService';

export default function AdminCommissionScreen({ navigation }) {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    setLoading(true);
    try {
      const response = await commissionsService.getAllCommissions();
      setCommissions(response.data);
    } catch (error) {
      // Handle error (show message, etc.)
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Admin Commission" />
      </Appbar.Header>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView horizontal>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>User</DataTable.Title>
              <DataTable.Title>Amount</DataTable.Title>
              <DataTable.Title>Status</DataTable.Title>
            </DataTable.Header>
            {commissions.map((item) => (
              <DataTable.Row key={item.id}>
                <DataTable.Cell>{item.user_name}</DataTable.Cell>
                <DataTable.Cell>{item.amount}</DataTable.Cell>
                <DataTable.Cell>{item.status}</DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
