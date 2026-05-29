import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { OrderHistoryScreen } from '../screens/history/OrderHistoryScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { EditVehicleScreen } from '../screens/profile/EditVehicleScreen';
import { ChangePasswordScreen } from '../screens/profile/ChangePasswordScreen';
import { useAuthStore } from '../store/authStore';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { COLORS } from '../theme/theme';

export type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  OrderHistory: undefined;
  EditProfile: undefined;
  EditVehicle: undefined;
  ChangePassword: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

import { SplashScreen } from '../screens/SplashScreen';

export const RootNavigator = () => {
  const { user, isBootstrapping, bootstrap } = useAuthStore();
  
  // Setup Push Notifications - Will only request/sync if user is logged in
  usePushNotifications(!!user);

  useEffect(() => {
    bootstrap();
  }, []);

  if (isBootstrapping) return <SplashScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
        {user ? (
          // Authenticated: show main app tabs
          <>
            <Stack.Screen name="Home" component={MainTabNavigator} />
            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="EditVehicle" component={EditVehicleScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          </>
        ) : (
          // Unauthenticated: show auth flow
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
