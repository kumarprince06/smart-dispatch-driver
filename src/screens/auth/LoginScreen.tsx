import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Animated, Alert, TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Truck, AlertCircle } from 'lucide-react-native';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { COLORS, SIZES, TYPOGRAPHY, SHADOWS } from '../../theme/theme';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { login, isLoading, error, clearError } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();

  // Shake animation for error state
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Shake form on error
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  const handleLogin = () => {
    clearError();
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    login({ email: email.trim(), password });
  };

  return (
    <View style={styles.container}>
      {/* Deep Space Gradient Background */}
      <LinearGradient
        colors={[COLORS.background, '#1e1b4b']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative glow blobs */}
      <View style={[styles.blob, { top: -120, right: -120, backgroundColor: COLORS.primary }]} />
      <View style={[styles.blob, { bottom: -120, left: -120, backgroundColor: COLORS.accent }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.logoRing}>
              <Truck size={44} color={COLORS.primaryLight} />
            </View>
            <Text style={styles.brandName}>Smart Dispatch</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>DRIVER PORTAL</Text>
              </View>
            </View>
          </Animated.View>

          {/* Glass Card Form */}
          <Animated.View style={{ transform: [{ translateX: shakeAnim }], opacity: fadeAnim }}>
            <View style={[styles.card, SHADOWS.lg]}>
              <Text style={styles.cardTitle}>Sign In</Text>
              <Text style={styles.cardSubtitle}>Enter your credentials to continue</Text>

              {/* Error Banner */}
              {error && (
                <View style={styles.errorBanner}>
                  <AlertCircle size={16} color={COLORS.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Input
                label="Email Address"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                icon={<Mail size={20} color={COLORS.textMuted} />}
              />

              <Input
                label="Password"
                placeholder="Your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                icon={<Lock size={20} color={COLORS.textMuted} />}
              />

              <TouchableOpacity style={styles.forgotPasswordBtn} onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <Button
                title="Sign In"
                onPress={handleLogin}
                isLoading={isLoading}
                disabled={isLoading}
                style={{ marginTop: SIZES.sm }}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Driver access only</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.helpText}>
                Having trouble? Contact your fleet manager.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: SIZES.xl, paddingVertical: SIZES.xxl },
  blob: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.12,
  },

  // Logo
  header: { alignItems: 'center', marginBottom: SIZES.xxl },
  logoRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(99,102,241,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.lg,
    ...SHADOWS.glow,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
    marginBottom: SIZES.sm,
  },
  badgeRow: { flexDirection: 'row' },
  badge: {
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs / 2,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.4)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 2,
  },

  // Card
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: SIZES.radiusXl,
    padding: SIZES.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: { ...TYPOGRAPHY.h2, marginBottom: SIZES.xs },
  cardSubtitle: { ...TYPOGRAPHY.body2, marginBottom: SIZES.xl },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    padding: SIZES.md,
    marginBottom: SIZES.lg,
  },
  errorText: { ...TYPOGRAPHY.body2, color: COLORS.error, flex: 1 },

  forgotPasswordBtn: {
    alignSelf: 'flex-end',
    marginBottom: SIZES.md,
    marginTop: -SIZES.sm,
  },
  forgotPasswordText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryLight,
    fontWeight: '600',
  },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginTop: SIZES.xl, gap: SIZES.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },

  helpText: { ...TYPOGRAPHY.caption, textAlign: 'center', marginTop: SIZES.lg, color: COLORS.textMuted },
});
