import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Animated, Alert, TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { COLORS, SIZES, TYPOGRAPHY, SHADOWS } from '../../theme/theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { authApi } from '../../api/authApi';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const navigation = useNavigation<NavigationProp>();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }
    
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setIsSuccess(true);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send reset link.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Deep Space Gradient Background */}
      <LinearGradient
        colors={[COLORS.background, '#1e1b4b']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative glow blobs */}
      <View style={[styles.blob, { top: -120, right: -120, backgroundColor: COLORS.accent }]} />
      <View style={[styles.blob, { bottom: -120, left: -120, backgroundColor: COLORS.primary }]} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
            >
              <ArrowLeft size={24} color={COLORS.text} />
            </TouchableOpacity>

            <Animated.View style={{ opacity: fadeAnim }}>
              {/* Header Icon */}
              <View style={styles.header}>
                <View style={styles.iconRing}>
                  {isSuccess ? (
                    <CheckCircle2 size={44} color={COLORS.success} />
                  ) : (
                    <KeyRound size={44} color={COLORS.primaryLight} />
                  )}
                </View>
              </View>

              {/* Glass Card Form */}
              <View style={[styles.card, SHADOWS.lg]}>
                {isSuccess ? (
                  <View style={styles.successContainer}>
                    <Text style={styles.cardTitle}>Check your email</Text>
                    <Text style={[styles.cardSubtitle, { textAlign: 'center' }]}>
                      We've sent a password recovery link to{'\n'}
                      <Text style={{ fontWeight: '700', color: COLORS.text }}>{email}</Text>
                    </Text>
                    
                    <Button
                      title="Back to Login"
                      onPress={() => navigation.goBack()}
                      style={{ marginTop: SIZES.lg, width: '100%' }}
                    />
                  </View>
                ) : (
                  <>
                    <Text style={styles.cardTitle}>Reset Password</Text>
                    <Text style={styles.cardSubtitle}>
                      Enter the email address associated with your driver account.
                    </Text>

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

                    <Button
                      title="Send Reset Link"
                      onPress={handleResetPassword}
                      isLoading={isLoading}
                      disabled={isLoading}
                      style={{ marginTop: SIZES.sm }}
                    />
                  </>
                )}
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

// Simple SafeAreaView mock since we don't import from react-native-safe-area-context here to keep it contained,
// but it's better to use the proper one if needed.
const SafeAreaView = ({ children, style }: any) => <View style={style}>{children}</View>;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: SIZES.xl },
  blob: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.12,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: SIZES.xl,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  header: { alignItems: 'center', marginBottom: SIZES.xl },
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(99,102,241,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
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
  cardSubtitle: { ...TYPOGRAPHY.body2, marginBottom: SIZES.xl, lineHeight: 22 },
  
  successContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.md,
  },
});
