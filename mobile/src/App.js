import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from 'react-query';
import Toast from 'react-native-toast-message';
import FlashMessage from 'react-native-flash-message';
import SplashScreen from 'react-native-splash-screen';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import { TelematicsProvider } from './contexts/TelematicsContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Navigation
import AppNavigator from './navigation/AppNavigator';

// Services
import { initializeServices } from './services/initializeServices';

// Theme
import { theme } from './styles/theme';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => {
  useEffect(() => {
    // Initialize services
    initializeServices();
    
    // Hide splash screen
    SplashScreen.hide();
    
    // Set status bar style
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(theme.colors.primary);
    }
    StatusBar.setBarStyle('light-content');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <LocationProvider>
            <TelematicsProvider>
              <PaperProvider theme={theme}>
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
                
                {/* Toast Messages */}
                <Toast />
                
                {/* Flash Messages */}
                <FlashMessage position="top" />
              </PaperProvider>
            </TelematicsProvider>
          </LocationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;