import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from 'react-query';
import { 
  MaterialIcons, 
  MaterialCommunityIcons,
  Ionicons,
  Feather
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useTelematics } from '../contexts/TelematicsContext';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EcoScoreGauge from '../components/EcoScoreGauge';
import TripCard from '../components/TripCard';
import CoachingTipCard from '../components/CoachingTipCard';
import QuickActionButton from '../components/QuickActionButton';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isTracking, startTracking, stopTracking } = useTelematics();
  const [currentEcoScore, setCurrentEcoScore] = useState(0);

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    'dashboard',
    () => api.get('/dashboard'),
    {
      refetchInterval: 10000, // Refetch every 10 seconds
    }
  );

  // Fetch real-time coaching tips
  const { data: tipsData } = useQuery(
    'coaching-tips',
    () => api.get('/coaching/tips'),
    {
      enabled: !!user,
    }
  );

  const stats = dashboardData?.data?.stats || {};
  const recentTrips = dashboardData?.data?.recentTrips || [];
  const tips = tipsData?.data?.tips || [];

  const handleStartTrip = async () => {
    try {
      Alert.alert(
        'Start New Trip',
        'Ready to begin eco-driving? We\'ll track your performance and provide real-time coaching.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Start Trip', 
            onPress: async () => {
              await startTracking();
              navigation.navigate('TripTracking');
            }
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to start trip tracking');
    }
  };

  const handleStopTrip = async () => {
    try {
      Alert.alert(
        'End Trip',
        'Are you sure you want to end this trip?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'End Trip', 
            onPress: async () => {
              await stopTracking();
              navigation.navigate('TripSummary');
            }
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to stop trip tracking');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#0ea5e9', '#22c55e']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{user?.firstName}!</Text>
            <Text style={styles.subtitle}>Ready to drive smarter?</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <MaterialIcons name="account-circle" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Current Status */}
      <View style={styles.statusContainer}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <MaterialCommunityIcons name="car" size={24} color="#0ea5e9" />
            <Text style={styles.statusTitle}>Current Status</Text>
          </View>
          <View style={styles.statusContent}>
            <Text style={styles.statusText}>
              {isTracking ? 'Trip in Progress' : 'Ready to Drive'}
            </Text>
            <View style={styles.statusIndicator}>
              <View 
                style={[
                  styles.indicatorDot, 
                  { backgroundColor: isTracking ? '#22c55e' : '#6b7280' }
                ]} 
              />
            </View>
          </View>
        </View>
      </View>

      {/* Eco Score Gauge */}
      <View style={styles.gaugeContainer}>
        <EcoScoreGauge 
          score={stats.ecoScore || 0}
          size={width * 0.6}
        />
        <Text style={styles.gaugeLabel}>Your Eco Score</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="fuel" size={24} color="#0ea5e9" />
          <Text style={styles.statValue}>{stats.fuelSaved || 0}</Text>
          <Text style={styles.statLabel}>L Saved</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="leaf" size={24} color="#22c55e" />
          <Text style={styles.statValue}>{stats.co2Reduced || 0}</Text>
          <Text style={styles.statLabel}>kg CO₂</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="map-marker-distance" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{stats.totalTrips || 0}</Text>
          <Text style={styles.statLabel}>Trips</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickActionButton
            icon="play-circle"
            title="Start Trip"
            color="#22c55e"
            onPress={handleStartTrip}
            disabled={isTracking}
          />
          <QuickActionButton
            icon="stop-circle"
            title="End Trip"
            color="#ef4444"
            onPress={handleStopTrip}
            disabled={!isTracking}
          />
          <QuickActionButton
            icon="chart-line"
            title="Analytics"
            color="#0ea5e9"
            onPress={() => navigation.navigate('Analytics')}
          />
          <QuickActionButton
            icon="lightbulb"
            title="Tips"
            color="#f59e0b"
            onPress={() => navigation.navigate('Coaching')}
          />
        </View>
      </View>

      {/* Recent Trips */}
      {recentTrips.length > 0 && (
        <View style={styles.tripsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Trips</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Trips')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentTrips.slice(0, 3).map((trip, index) => (
              <TripCard key={index} trip={trip} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Coaching Tips */}
      {tips.length > 0 && (
        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>Today's Tips</Text>
          {tips.slice(0, 2).map((tip, index) => (
            <CoachingTipCard key={index} tip={tip} />
          ))}
        </View>
      )}

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  profileButton: {
    padding: 8,
  },
  statusContainer: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1f2937',
  },
  statusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  gaugeContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  gaugeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tripsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  tipsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default HomeScreen;