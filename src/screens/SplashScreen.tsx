import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  withRepeat,
  withSequence
} from 'react-native-reanimated';
import { Truck } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY } from '../theme/theme';

const { width } = Dimensions.get('window');

export const SplashScreen = () => {
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  
  const textTranslateY = useSharedValue(40);
  const textOpacity = useSharedValue(0);
  
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  const truckTranslateX = useSharedValue(-100);

  useEffect(() => {
    // 1. Logo fades in and scales up (Spring)
    logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 100 });

    // 2. Pulse continuously in the background
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // 3. Text slides up and fades in
    textOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) })
    );
    textTranslateY.value = withDelay(
      500,
      withSpring(0, { damping: 14, stiffness: 100 })
    );

    // 4. Little truck drives into the icon
    truckTranslateX.value = withDelay(
      200,
      withSpring(0, { damping: 14, stiffness: 80 })
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const truckStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: truckTranslateX.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[COLORS.background, COLORS.surfaceLight, COLORS.background]}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Glow/Pulse Effect */}
      <Animated.View style={[styles.pulseCircle, pulseStyle]} />

      {/* Center Logo */}
      <Animated.View style={[styles.logoWrapper, logoStyle]}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoGradient}
        >
          <Animated.View style={truckStyle}>
            <Truck size={56} color="#FFFFFF" strokeWidth={2.5} />
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Brand Name */}
      <Animated.View style={[styles.textContainer, textStyle]}>
        <Animated.Text style={styles.title}>
          SMART DISPATCH
        </Animated.Text>
        <Animated.View style={styles.badge}>
          <Animated.Text style={styles.subtitle}>DRIVER</Animated.Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  pulseCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primaryLight,
  },
  logoWrapper: {
    marginBottom: 40,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 20,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  subtitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 6,
    marginLeft: 6,
  },
});
