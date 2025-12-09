import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { SubscriptionContext } from '../contexts/SubscriptionContext';
import { analyticsService } from '../services/analyticsService';
import SubscriptionRequired from '../components/SubscriptionRequired';

export default function TPBDashboardScreen({ navigation }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { hasActiveSubscription } = useContext(SubscriptionContext);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await analyticsService.getLenderAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      // Handle error (show message, etc.)
    } finally {
      setLoading(false);
    }
  };

  if (!hasActiveSubscription) {
    return <SubscriptionRequired />;
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="TPB Dashboard" />
      </Appbar.Header>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView>
          <Card style={styles.card}>
            <Card.Content>
              <Title>Total Loans</Title>
              <Paragraph>{analytics?.total_loans ?? '-'}</Paragraph>
            </Card.Content>
          </Card>
          <Card style={styles.card}>
            <Card.Content>
              <Title>Active Lenders</Title>
              <Paragraph>{analytics?.active_lenders ?? '-'}</Paragraph>
            </Card.Content>
          </Card>
          {/* Add more analytics cards as needed */}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { margin: 16 },
});
