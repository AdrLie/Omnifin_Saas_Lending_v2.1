import React, { useContext } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, Avatar, Text } from 'react-native-paper';
import { AuthContext } from '../contexts/AuthContext';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);

  const getWelcomeMessage = () => {
    if (user.role === 'tpb') {
      return 'Manage your referrals and track commissions';
    } else if (user.role === 'admin' || user.role === 'superadmin') {
      return 'Manage users and monitor platform performance';
    } else {
      return 'Get personalized loan recommendations with AI assistance';
    }
  };

  const getQuickActions = () => {
    const actions = [
      {
        title: 'Start Application',
        description: 'Begin your loan application process',
        icon: 'file-document-edit',
        onPress: () => navigation.navigate('Chat'),
        roles: ['applicant'],
      },
      {
        title: 'Voice Assistant',
        description: 'Use voice chat for hands-free assistance',
        icon: 'microphone',
        onPress: () => navigation.navigate('VoiceChat'),
        roles: ['applicant'],
      },
      {
        title: 'My Applications',
        description: 'View and manage your loan applications',
        icon: 'file-document-multiple',
        onPress: () => navigation.navigate('Applications'),
        roles: ['applicant', 'tpb'],
      },
      {
        title: 'Documents',
        description: 'Upload and manage required documents',
        icon: 'folder-upload',
        onPress: () => navigation.navigate('Documents'),
        roles: ['applicant'],
      },
      {
        title: 'Dashboard',
        description: 'View analytics and performance metrics',
        icon: 'chart-bar',
        onPress: () => {
          if (user.role === 'superadmin') {
            navigation.navigate('Dashboard');
          } else if (user.role === 'admin') {
            navigation.navigate('AdminDashboard');
          } else if (user.role === 'tpb') {
            navigation.navigate('TPBDashboard');
          }
        },
        roles: ['admin', 'superadmin', 'tpb'],
      },
      {
        title: 'Profile',
        description: 'Manage your account settings',
        icon: 'account-cog',
        onPress: () => navigation.navigate('Profile'),
        roles: ['applicant', 'tpb', 'admin', 'superadmin'],
      },
    ];

    return actions.filter(action => action.roles.includes(user.role));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text
          size={80}
          label={user.first_name?.[0] || user.email?.[0] || 'U'}
          style={styles.avatar}
        />
        <Title style={styles.welcomeTitle}>
          Welcome, {user.first_name || user.email}!
        </Title>
        <Text style={styles.welcomeSubtitle}>
          {getWelcomeMessage()}
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        {getQuickActions().map((action, index) => (
          <Card key={index} style={styles.actionCard} onPress={action.onPress}>
            <Card.Content style={styles.cardContent}>
              <Avatar.Icon size={40} icon={action.icon} style={styles.actionIcon} />
              <View style={styles.cardText}>
                <Title style={styles.actionTitle}>{action.title}</Title>
                <Paragraph style={styles.actionDescription}>
                  {action.description}
                </Paragraph>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>

      <Button
        mode="outlined"
        onPress={logout}
        style={styles.logoutButton}
        icon="logout"
      >
        Sign Out
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#6200EE',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatar: {
    marginBottom: 15,
    backgroundColor: '#BB86FC',
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    marginBottom: 5,
  },
  welcomeSubtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  actionsContainer: {
    padding: 20,
  },
  actionCard: {
    marginBottom: 15,
    elevation: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 15,
    backgroundColor: '#6200EE',
  },
  cardText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    marginBottom: 5,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    margin: 20,
    marginTop: 30,
  },
});