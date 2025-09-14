import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiFuel, 
  FiLeaf, 
  FiMapPin, 
  FiClock,
  FiAward,
  FiTarget
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ErrorMessage from '../components/UI/ErrorMessage';
import StatCard from '../components/Dashboard/StatCard';
import EcoScoreChart from '../components/Dashboard/EcoScoreChart';
import RecentTrips from '../components/Dashboard/RecentTrips';
import CoachingTips from '../components/Dashboard/CoachingTips';
import GoalsProgress from '../components/Dashboard/GoalsProgress';

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery(
    'dashboard',
    () => api.get('/dashboard'),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Fetch coaching recommendations
  const { data: recommendations } = useQuery(
    'recommendations',
    () => api.get('/coaching/recommendations'),
    {
      enabled: !!user,
    }
  );

  // Fetch goals progress
  const { data: progress } = useQuery(
    'progress',
    () => api.get('/coaching/progress'),
    {
      enabled: !!user,
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load dashboard data" />;
  }

  const stats = dashboardData?.data?.stats || {};
  const recentTrips = dashboardData?.data?.recentTrips || [];
  const insights = dashboardData?.data?.insights || {};

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants}>
        <div className="bg-gradient-to-r from-primary-600 to-eco-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-primary-100">
            Ready to drive smarter and save greener? Let's check your eco-driving progress.
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          title="Eco Score"
          value={stats.ecoScore || 0}
          unit="/100"
          icon={FiLeaf}
          trend={insights.ecoScoreTrend}
          color="eco"
          description="Your overall eco-driving performance"
        />
        
        <StatCard
          title="Fuel Saved"
          value={stats.fuelSaved || 0}
          unit="L"
          icon={FiFuel}
          trend={insights.fuelSavingsTrend}
          color="primary"
          description="Fuel saved this month"
        />
        
        <StatCard
          title="CO₂ Reduced"
          value={stats.co2Reduced || 0}
          unit="kg"
          icon={FiLeaf}
          trend={insights.co2Trend}
          color="eco"
          description="Carbon emissions reduced"
        />
        
        <StatCard
          title="Total Trips"
          value={stats.totalTrips || 0}
          unit="trips"
          icon={FiMapPin}
          trend={insights.tripsTrend}
          color="primary"
          description="Trips completed this month"
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts and Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Eco Score Chart */}
          <motion.div variants={itemVariants}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title flex items-center gap-2">
                  <FiTrendingUp className="text-eco-600" />
                  Eco Score Trend
                </h3>
                <p className="card-description">
                  Your eco-driving performance over the last 7 days
                </p>
              </div>
              <div className="card-content">
                <EcoScoreChart data={insights.ecoScoreHistory || []} />
              </div>
            </div>
          </motion.div>

          {/* Goals Progress */}
          {progress?.data && (
            <motion.div variants={itemVariants}>
              <GoalsProgress progress={progress.data} />
            </motion.div>
          )}

          {/* Recent Trips */}
          <motion.div variants={itemVariants}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title flex items-center gap-2">
                  <FiClock className="text-primary-600" />
                  Recent Trips
                </h3>
                <p className="card-description">
                  Your latest driving sessions
                </p>
              </div>
              <div className="card-content">
                <RecentTrips trips={recentTrips} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Tips and Achievements */}
        <div className="space-y-6">
          {/* Coaching Tips */}
          <motion.div variants={itemVariants}>
            <CoachingTips 
              recommendations={recommendations?.data?.recommendations || []}
              tips={recommendations?.data?.tips || []}
            />
          </motion.div>

          {/* Achievements */}
          <motion.div variants={itemVariants}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title flex items-center gap-2">
                  <FiAward className="text-warning-600" />
                  Recent Achievements
                </h3>
                <p className="card-description">
                  Celebrate your eco-driving milestones
                </p>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {stats.recentAchievements?.length > 0 ? (
                    stats.recentAchievements.map((achievement, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900 rounded-full flex items-center justify-center">
                          <FiAward className="text-warning-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{achievement.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FiTarget className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Complete more trips to unlock achievements!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Quick Actions</h3>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  <button className="w-full btn-primary btn-md">
                    Start New Trip
                  </button>
                  <button className="w-full btn-outline btn-md">
                    View Analytics
                  </button>
                  <button className="w-full btn-outline btn-md">
                    Get Coaching Tips
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Section - Insights */}
      {insights.summary && (
        <motion.div variants={itemVariants}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <FiTrendingUp className="text-eco-600" />
                Weekly Insights
              </h3>
              <p className="card-description">
                Key takeaways from your driving behavior this week
              </p>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-eco-600 mb-2">
                    {insights.summary.improvementPercentage}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Improvement in fuel efficiency
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600 mb-2">
                    {insights.summary.bestDay}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Best eco-driving day
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning-600 mb-2">
                    {insights.summary.tipsFollowed}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Coaching tips followed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Dashboard;