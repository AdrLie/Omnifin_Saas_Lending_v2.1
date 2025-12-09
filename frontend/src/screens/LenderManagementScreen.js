import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Appbar, List, Button, ActivityIndicator } from 'react-native-paper';
import { SubscriptionContext } from '../contexts/SubscriptionContext';
import { analyticsService } from '../services/analyticsService';
import SubscriptionRequired from '../components/SubscriptionRequired';

export default function LenderManagementScreen({ navigation }) {
  const [lenders, setLenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { hasActiveSubscription } = useContext(SubscriptionContext);

  useEffect(() => {
    if (hasActiveSubscription) {
      loadLenders();
    } else {
      setLoading(false);
    }
  }, [hasActiveSubscription]);

  const loadLenders = async () => {
    setLoading(true);
    try {
      const response = await analyticsService.getLenders();
      setLenders(response.data);
    } catch (error) {
      // Handle error (show message, etc.)
    } finally {
      setLoading(false);
    }
  };

  const renderLender = ({ item }) => (
    <List.Item
      title={item.name}
      description={`Offers: ${item.offers_count}`}
      right={props => <Button onPress={() => {/* Integrate offer management logic */}}>Manage</Button>}
    />
  );

  if (!hasActiveSubscription) {
    return <SubscriptionRequired />;
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Lender Management" />
      </Appbar.Header>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={lenders}
          keyExtractor={item => item.id}
          renderItem={renderLender}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
