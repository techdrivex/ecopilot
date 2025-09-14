import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    
    return response;
  },
  (error) => {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data);
    }

    // Handle different error types
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle authentication errors
      if (status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      // Handle validation errors
      if (status === 400 && data.errors) {
        const errorMessages = data.errors.map(err => err.msg || err.message).join(', ');
        toast.error(errorMessages);
      } else if (data.message) {
        toast.error(data.message);
      }
      
      // Handle server errors
      if (status >= 500) {
        toast.error('Server error. Please try again later.');
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    } else {
      // Other errors
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  deleteAccount: () => api.delete('/users/account'),
};

export const vehicleAPI = {
  getVehicles: () => api.get('/vehicles'),
  getVehicle: (id) => api.get(`/vehicles/${id}`),
  createVehicle: (data) => api.post('/vehicles', data),
  updateVehicle: (id, data) => api.put(`/vehicles/${id}`, data),
  deleteVehicle: (id) => api.delete(`/vehicles/${id}`),
  setPrimary: (id) => api.put(`/vehicles/${id}/primary`),
};

export const tripAPI = {
  getTrips: (params) => api.get('/trips', { params }),
  getTrip: (id) => api.get(`/trips/${id}`),
  createTrip: (data) => api.post('/trips', data),
  updateTrip: (id, data) => api.put(`/trips/${id}`, data),
  deleteTrip: (id) => api.delete(`/trips/${id}`),
  startTrip: (data) => api.post('/trips/start', data),
  endTrip: (id, data) => api.post(`/trips/${id}/end`, data),
  getTripStats: (params) => api.get('/trips/stats', { params }),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getEfficiencyTrends: (params) => api.get('/analytics/efficiency-trends', { params }),
  getBehaviorAnalysis: (params) => api.get('/analytics/behavior-analysis', { params }),
  getEnvironmentalImpact: (params) => api.get('/analytics/environmental-impact', { params }),
  getReports: (params) => api.get('/analytics/reports', { params }),
  exportData: (params) => api.get('/analytics/export', { params }),
};

export const coachingAPI = {
  getRecommendations: (params) => api.get('/coaching/recommendations', { params }),
  getInsights: (params) => api.get('/coaching/insights', { params }),
  getTips: (params) => api.get('/coaching/tips', { params }),
  setGoals: (data) => api.post('/coaching/goals', data),
  getProgress: () => api.get('/coaching/progress'),
  analyzeTrip: (tripId) => api.post('/coaching/analyze-trip', { tripId }),
};

export const gamificationAPI = {
  getAchievements: () => api.get('/gamification/achievements'),
  getBadges: () => api.get('/gamification/badges'),
  getLeaderboard: (params) => api.get('/gamification/leaderboard', { params }),
  getChallenges: () => api.get('/gamification/challenges'),
  joinChallenge: (challengeId) => api.post(`/gamification/challenges/${challengeId}/join`),
  completeChallenge: (challengeId) => api.post(`/gamification/challenges/${challengeId}/complete`),
};

export const telematicsAPI = {
  startTracking: (data) => api.post('/telematics/start-tracking', data),
  updateLocation: (data) => api.post('/telematics/update-location', data),
  endTracking: (sessionId) => api.post(`/telematics/end-tracking/${sessionId}`),
  getRealTimeData: (sessionId) => api.get(`/telematics/real-time/${sessionId}`),
};

// File upload helper
export const uploadFile = async (file, endpoint) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Export the main api instance
export { api };
export default api;