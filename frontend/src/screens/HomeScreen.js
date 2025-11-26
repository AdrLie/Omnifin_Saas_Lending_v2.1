import React, { useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Card, Title, Paragraph, Button, Avatar, Text, Divider, Surface } from 'react-native-paper';
import { AuthContext } from '../contexts/AuthContext';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Good Evening';
    if (hour < 12) greeting = 'Good Morning';
    else if (hour < 18) greeting = 'Good Afternoon';

    if (user.role === 'tpb') {
      return `${greeting}! Ready to grow your business?`;
    } else if (user.role === 'admin' || user.role === 'superadmin') {
      return `${greeting}! Monitor your platform performance`;
    } else {
      return `${greeting}! Let's find your perfect loan`;
    }
  };

  const getRoleBadge = () => {
    const roleLabels = {
      applicant: 'Applicant',
      tpb: 'Partner',
      admin: 'Admin',
      superadmin: 'Super Admin',
    };

    return (
      <View style={styles.roleBadge}>
        <Text style={styles.roleBadgeText}>{roleLabels[user.role]}</Text>
      </View>
    );
  };

  const getQuickActions = () => {
    const actions = [
      {
        title: 'Admin Dashboard',
        description: 'Manage users and platform settings',
        icon: 'shield-account',
        onPress: () => navigation.navigate('AdminDashboard'),
        roles: ['admin', 'superadmin'],
      },
      {
        title: 'Start Application',
        description: 'Begin your loan application',
        icon: 'file-document-edit',
        onPress: () => navigation.navigate('Chat'),
        roles: ['applicant', 'admin'],
      },
      {
        title: 'Voice Assistant',
        description: 'Hands-free AI assistance',
        icon: 'microphone',
        onPress: () => navigation.navigate('VoiceChat'),
        roles: ['applicant', 'admin'],
      },
      {
        title: 'My Applications',
        description: 'Track your loan status',
        icon: 'file-document-multiple',
        onPress: () => navigation.navigate('Applications'),
        roles: ['applicant', 'tpb'],
      },
      {
        title: 'Documents',
        description: 'Upload required documents',
        icon: 'folder-upload',
        onPress: () => navigation.navigate('Documents'),
        roles: ['applicant'],
      },
      {
        title: 'Dashboard',
        description: 'View analytics & metrics',
        icon: 'chart-line',
        onPress: () => {
          if (user.role === 'superadmin' || user.role === 'admin') {
            navigation.navigate('Dashboard');
          } else if (user.role === 'tpb') {
            navigation.navigate('TPBDashboard');
          }
        },
        roles: ['admin', 'superadmin', 'tpb'],
      },
      {
        title: 'Profile',
        description: 'Manage account settings',
        icon: 'account-cog',
        onPress: () => navigation.navigate('Profile'),
        roles: ['applicant', 'tpb', 'admin', 'superadmin'],
      },
    ];

    return actions.filter(action => action.roles.includes(user.role));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Avatar.Text
            size={70}
            label={user.first_name?.[0] || user.email?.[0] || 'U'}
            style={styles.avatar}
          />
          {getRoleBadge()}
          <Title style={styles.welcomeTitle}>
            {user.first_name || user.email?.split('@')[0] || 'User'}
          </Title>
          <Text style={styles.welcomeSubtitle}>
            {getWelcomeMessage()}
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <Surface style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Applications</Text>
        </View>
        <Divider style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Documents</Text>
        </View>
        <Divider style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Messages</Text>
        </View>
      </Surface>

      {/* Quick Actions Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Text style={styles.sectionSubtitle}>Everything you need at your fingertips</Text>
      </View>

      {/* Action Cards */}
      <View style={styles.actionsContainer}>
        {getQuickActions().map((action, index) => (
          <TouchableOpacity 
            key={index} 
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <Card style={styles.actionCard}>
              <Card.Content style={styles.cardContent}>
                <Avatar.Icon 
                  size={48} 
                  icon={action.icon} 
                  style={styles.actionIcon}
                  color="#FFFFFF"
                />
                <View style={styles.cardText}>
                  <Title style={styles.actionTitle}>{action.title}</Title>
                  <Paragraph style={styles.actionDescription}>
                    {action.description}
                  </Paragraph>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <Button
        mode="outlined"
        onPress={logout}
        style={styles.logoutButton}
        icon="logout"
        textColor="#6200EE"
      >
        Sign Out
      </Button>

      {/* Bottom Padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: '#6200EE',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      },
    }),
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatar: {
    marginBottom: 12,
    backgroundColor: '#BB86FC',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  welcomeSubtitle: {
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.95,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginTop: -25,
    marginBottom: 25,
    padding: 18,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    }),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200EE',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    paddingHorizontal: 20,
  },
  actionCard: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      },
    }),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionIcon: {
    marginRight: 15,
    backgroundColor: '#6200EE',
  },
  cardText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    color: '#333',
  },
  actionDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 25,
    borderColor: '#6200EE',
    borderWidth: 1.5,
    borderRadius: 10,
  },
  bottomPadding: {
    height: 30,
  },
});