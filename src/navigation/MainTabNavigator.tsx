import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Map as MapIcon, Wallet, User } from 'lucide-react-native';
import { HomeScreen } from '../screens/home/HomeScreen';
import { MapScreen } from '../screens/map/MapScreen';
import { EarningsScreen } from '../screens/earnings/EarningsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { COLORS, SHADOWS, SIZES } from '../theme/theme';

export type MainTabParamList = {
  Dashboard: undefined;
  Navigation: undefined;
  Earnings: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primaryLight,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.iconActive : styles.iconInactive}>
              <Home size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Navigation"
        component={MapScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.iconActive : styles.iconInactive}>
              <MapIcon size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.iconActive : styles.iconInactive}>
              <Wallet size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.iconActive : styles.iconInactive}>
              <User size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    height: Platform.OS === 'ios' ? 85 : 80,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...SHADOWS.lg,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  iconActive: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    padding: SIZES.xs,
    borderRadius: SIZES.radius,
  },
  iconInactive: {
    padding: SIZES.xs,
  },
});
