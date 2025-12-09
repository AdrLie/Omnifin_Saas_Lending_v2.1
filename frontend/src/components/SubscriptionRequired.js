import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { AuthContext } from '../contexts/AuthContext';

export default function SubscriptionRequired() {
  const { user } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.iconContainer}>
            <Title style={styles.icon}>💳</Title>
          </View>
          
          <Title style={styles.title}>Subscription Required</Title>
          
          <Paragraph style={styles.description}>
            To access loan management and other premium features, you need an active subscription.
          </Paragraph>
          
          <View style={styles.infoBox}>
            <Paragraph style={styles.infoTitle}>Our Plans:</Paragraph>
            <Paragraph style={styles.planItem}>
              • <Paragraph style={styles.planName}>Starter</Paragraph> - $29.99/month
            </Paragraph>
            <Paragraph style={styles.planItem}>
              • <Paragraph style={styles.planName}>Professional</Paragraph> - $79.99/month
            </Paragraph>
            <Paragraph style={styles.planItem}>
              • <Paragraph style={styles.planName}>Business</Paragraph> - $199.99/month
            </Paragraph>
            <Paragraph style={styles.planItem}>
              • <Paragraph style={styles.planName}>Enterprise</Paragraph> - $499.99/month
            </Paragraph>
          </View>
          
          <Paragraph style={styles.userEmail}>
            Logged in as: {user?.email}
          </Paragraph>
        </Card.Content>
        
        <Card.Actions style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => {
              // Navigate to subscription page
              // This will be implemented based on your app's navigation
            }}
            style={styles.button}
          >
            Choose Plan & Subscribe
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  card: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#6200EE',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  planItem: {
    marginVertical: 4,
    fontSize: 13,
    color: '#555',
  },
  planName: {
    fontWeight: '600',
    color: '#6200EE',
  },
  userEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actions: {
    justifyContent: 'center',
    paddingVertical: 16,
  },
  button: {
    width: '80%',
    backgroundColor: '#6200EE',
  },
});
