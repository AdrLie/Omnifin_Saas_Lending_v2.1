import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, DataTable, ActivityIndicator } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { AuthContext } from '../contexts/AuthContext';
import { analyticsService } from '../services/analyticsService';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await analyticsService.getDashboardMetrics(30);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewCards = () => {
    if (!dashboardData) return null;

    const { users, applications, commissions } = dashboardData;

    const cards = [
      {
        title: 'Total Users',
        value: users.total_users,
        icon: 'account-multiple',
        color: '#6200EE',
      },
      {
        title: 'New Users (30d)',
        value: users.new_users,
        icon: 'account-plus',
        color: '#03DAC6',
      },
      {
        title: 'Active Users (30d)',
        value: users.active_users,
        icon: 'account-check',
        color: '#FF5722',
      },
      {
        title: 'Total Applications',
        value: applications.total_applications,
        icon: 'file-document-multiple',
        color: '#4CAF50',
      },
      {
        title: 'New Applications (30d)',
        value: applications.new_applications,
        icon: 'file-plus',
        color: '#FFC107',
      },
      {
        title: 'Total Commissions',
        value: `$${commissions.total_commission_amount.toFixed(2)}`,
        icon: 'currency-usd',
        color: '#9C27B0',
      },
    ];

    return cards.map((card, index) => (
      <Card key={index} style={styles.overviewCard}>
        <Card.Content style={styles.cardContent}>
          <View style={[styles.cardIcon, { backgroundColor: card.color }]}>
            <Icon name={card.icon} size={24} color="white" />
          </View>
          <View style={styles.cardText}>
            <Title style={styles.cardValue}>{card.value}</Title>
            <Paragraph style={styles.cardTitle}>{card.title}</Paragraph>
          </View>
        </Card.Content>
      </Card>
    ));
  };

  const renderApplicationChart = () => {
    if (!dashboardData) return null;

    const data = {
      labels: ['Pending', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Funded'],
      datasets: [
        {
          data: [
            dashboardData.applications.status_counts.pending || 0,
            dashboardData.applications.status_counts.submitted || 0,
            dashboardData.applications.status_counts.under_review || 0,
            dashboardData.applications.status_counts.approved || 0,
            dashboardData.applications.status_counts.rejected || 0,
            dashboardData.applications.status_counts.funded || 0,
          ],
        },
      ],
    };

    return (
      <Card style={styles.chartCard}>
        <Card.Content>
          <Title>Application Status Distribution</Title>
          <BarChart
            data={data}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </Card.Content>
      </Card>
    );
  };

  const renderConversionChart = () => {
    if (!dashboardData) return null;

    const data = [
      {
        name: 'Visitor to App',
        population: dashboardData.applications.conversion_rates.visitor_to_application || 0,
        color: '#6200EE',
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      },
      {
        name: 'App to Submit',
        population: dashboardData.applications.conversion_rates.application_to_submission || 0,
        color: '#BB86FC',
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      },
      {
        name: 'Submit to Approve',
        population: dashboardData.applications.conversion_rates.submission_to_approval || 0,
        color: '#03DAC6',
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      },
      {
        name: 'Approve to Fund',
        population: dashboardData.applications.conversion_rates.approval_to_funding || 0,
        color: '#FF5722',
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      },
    ];

    return (
      <Card style={styles.chartCard}>
        <Card.Content>
          <Title>Conversion Rates (%)</Title>
          <PieChart
            data={data}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </Card.Content>
      </Card>
    );
  };

  const renderRecentActivity = () => {
    if (!dashboardData) return null;

    return (
      <Card style={styles.activityCard}>
        <Card.Content>
          <Title>Recent Activity</Title>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Activity</DataTable.Title>
              <DataTable.Title numeric>Count</DataTable.Title>
              <DataTable.Title numeric>Change</DataTable.Title>
            </DataTable.Header>

            <DataTable.Row>
              <DataTable.Cell>New Applications</DataTable.Cell>
              <DataTable.Cell numeric>{dashboardData.applications.new_applications}</DataTable.Cell>
              <DataTable.Cell numeric style={{ color: '#4CAF50' }}>+12%</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Active Users</DataTable.Cell>
              <DataTable.Cell numeric>{dashboardData.users.active_users}</DataTable.Cell>
              <DataTable.Cell numeric style={{ color: '#4CAF50' }}>+8%</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Commissions Earned</DataTable.Cell>
              <DataTable.Cell numeric>
                ${dashboardData.commissions.period_commission_amount.toFixed(2)}
              </DataTable.Cell>
              <DataTable.Cell numeric style={{ color: '#4CAF50' }}>+15%</DataTable.Cell>
            </DataTable.Row>
          </DataTable>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Dashboard</Title>
        <Paragraph style={styles.headerSubtitle}>
          Platform Performance Overview (Last 30 Days)
        </Paragraph>
      </View>

      <View style={styles.overviewContainer}>
        {renderOverviewCards()}
      </View>

      {renderApplicationChart()}
      {renderConversionChart()}
      {renderRecentActivity()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#6200EE',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  headerSubtitle: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  overviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  overviewCard: {
    width: '48%',
    marginBottom: 10,
    elevation: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardText: {
    flex: 1,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 12,
    color: '#666',
  },
  chartCard: {
    margin: 10,
    elevation: 4,
  },
  activityCard: {
    margin: 10,
    elevation: 4,
  },
});