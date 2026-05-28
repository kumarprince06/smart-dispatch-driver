import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, Switch,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../../navigation/MainTabNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Package, Clock, TrendingUp, Wallet,
  MapPin, Bell, LogOut, CheckCircle,
  ChevronRight, Star, Zap, WifiOff,
} from 'lucide-react-native';
import { GlassCard, StatCard } from '../../components/common/Cards';
import { CustomAlert } from '../../components/common/CustomAlert';
import { COLORS, SIZES, TYPOGRAPHY, SHADOWS } from '../../theme/theme';
import { useAuthStore } from '../../store/authStore';
import * as Location from 'expo-location';
import { driverApi, DriverProfile } from '../../api/driverApi';
import { orderApi, OrderResponse } from '../../api/orderApi';
import { paymentApi } from '../../api/paymentApi';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  ASSIGNED: { label: 'Assigned', color: COLORS.info, bg: 'rgba(59,130,246,0.15)' },
  IN_TRANSIT: { label: 'In Transit', color: COLORS.warning, bg: 'rgba(245,158,11,0.15)' },
  DELIVERED: { label: 'Delivered', color: COLORS.success, bg: 'rgba(16,185,129,0.15)' },
  PICKED_UP: { label: 'Picked Up', color: COLORS.accent, bg: 'rgba(20,184,166,0.15)' },
};

export const HomeScreen = () => {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [isOnline, setIsOnline] = useState(false);
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [todayOrderCount, setTodayOrderCount] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'error' | 'info' | 'logout';
    buttons?: any[];
  }>({
    visible: false,
    title: '',
    message: '',
  });
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse ring animation when online
  useEffect(() => {
    if (isOnline) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOnline]);

  // Fetch driver data
  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch profile and active orders concurrently
      const [profileRes, ordersRes] = await Promise.all([
        driverApi.getMe(),
        orderApi.getDriverOrders(0, 20)
      ]);

      const driverData = profileRes.data.data;
      setProfile(driverData);
      setIsOnline(driverData.status === 'AVAILABLE' || driverData.status === 'ONLINE');

      const allOrders = ordersRes.data?.data?.content ?? [];
      
      // Filter active orders
      const activeOrders = allOrders.filter(
        (o: OrderResponse) => ['ASSIGNED', 'IN_TRANSIT', 'PICKED_UP'].includes(o.status)
      );
      setOrders(activeOrders);

      // Count today's orders
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = allOrders.filter(
        (o: OrderResponse) => o.createdAt?.startsWith(today)
      );
      setTodayOrderCount(todayOrders.length);

      // Calculate today's earnings from delivered orders
      const deliveredToday = allOrders.filter(
        (o: OrderResponse) => o.status === 'DELIVERED' && o.createdAt?.startsWith(today)
      );
      const totalEarnings = deliveredToday.reduce((sum: number, o: OrderResponse) => sum + (o.deliveryFee || 0), 0);
      setEarnings(totalEarnings);

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time location reporting to backend when online
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('[Location Reporter] Permission not granted');
          return;
        }

        // Periodically record and report location
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 15000, // every 15 seconds
            distanceInterval: 15, // or every 15 meters
          },
          async (loc) => {
            if (!isMounted) return;
            try {
              await driverApi.updateLocation(loc.coords.latitude, loc.coords.longitude);
              console.log(`[Location Reporter] Updated coordinates: ${loc.coords.latitude}, ${loc.coords.longitude}`);
            } catch (err) {
              console.error('[Location Reporter] Failed to report location:', err);
            }
          }
        );
      } catch (err) {
        console.error('[Location Reporter] Error starting tracking:', err);
      }
    };

    if (isOnline) {
      startTracking();
    }

    return () => {
      isMounted = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isOnline]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  }, [fetchDashboardData]);

  const handleToggleOnline = async (value: boolean) => {
    setIsOnline(value);
    try {
      await driverApi.updateStatus(value ? 'AVAILABLE' : 'OFFLINE');
    } catch (err: any) {
      console.error('Failed to update status:', err?.response?.data || err);
      setIsOnline(!value); // Revert on failure
      const msg = err?.response?.data?.message || 'Could not update your status. Please try again.';
      setAlertConfig({
        visible: true,
        title: 'Update Failed',
        message: msg,
        type: 'error',
        buttons: [{ text: 'OK', style: 'default' }]
      });
    }
  };

  const handleLogout = () => {
    setAlertConfig({
      visible: true,
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      type: 'logout',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  const firstName = user?.firstName ?? 'Driver';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, '#1e1b4b']}
        style={StyleSheet.absoluteFill}
      />
      {/* Background blob */}
      <View style={styles.topBlob} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primaryLight}
              colors={[COLORS.primaryLight]}
            />
          }
        >
          {/* ── Header Row ── */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greetingLabel}>{getGreeting()}</Text>
              <Text style={styles.greetingName}>{firstName} 👋</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.iconBtn}
                onPress={() => setAlertConfig({
                  visible: true,
                  title: 'Notifications',
                  message: 'You have no new notifications at the moment.',
                  type: 'info',
                  buttons: [{ text: 'Close', style: 'default' }]
                })}
              >
                <Bell size={22} color={COLORS.text} />
                <View style={styles.notifDot} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
                <LogOut size={22} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Online Status Card ── */}
          <GlassCard style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusLeft}>
                {/* Pulse ring */}
                <View style={styles.pulseWrapper}>
                  <Animated.View style={[
                    styles.pulseRing,
                    isOnline && { transform: [{ scale: pulseAnim }], opacity: 0.3 }
                  ]} />
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: isOnline ? COLORS.success : COLORS.textMuted }
                  ]} />
                </View>
                <View style={{ marginLeft: SIZES.md }}>
                  <Text style={styles.statusTitle}>
                    {isOnline ? 'You are Online' : 'You are Offline'}
                  </Text>
                  <Text style={styles.statusSubtitle}>
                    {isOnline ? 'Receiving new orders' : 'Toggle to start earning'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                trackColor={{ false: COLORS.surfaceLight, true: 'rgba(99,102,241,0.5)' }}
                thumbColor={isOnline ? COLORS.primary : COLORS.textMuted}
              />
            </View>

            {isOnline && (
              <LinearGradient
                colors={['rgba(99,102,241,0.1)', 'transparent']}
                style={styles.onlineBanner}
              >
                <Zap size={14} color={COLORS.primaryLight} />
                <Text style={styles.onlineBannerText}>Dispatch engine active — accepting nearby orders</Text>
              </LinearGradient>
            )}
          </GlassCard>

          {/* ── Stats Row ── */}
          <View style={styles.statsRow}>
            <StatCard
              label="Today's Orders"
              value={`${todayOrderCount}`}
              icon={<Package size={22} color="#fff" />}
              gradient={['#6366F1', '#4338CA']}
              sub={orders.length > 0 ? `${orders.length} active` : 'No active orders'}
            />
            <View style={{ width: SIZES.sm }} />
            <StatCard
              label="Earnings"
              value={`₹${earnings}`}
              icon={<Wallet size={22} color="#fff" />}
              gradient={['#14B8A6', '#0D9488']}
              sub="Today's total"
            />
          </View>

          <View style={styles.statsRow}>
            <StatCard
              label="Avg. Rating"
              value={profile?.rating ? profile.rating.toFixed(1) : "5.0"}
              icon={<Star size={22} color="#fff" />}
              gradient={['#F59E0B', '#D97706']}
              sub={`${profile?.totalTrips || 0} trips`}
            />
            <View style={{ width: SIZES.sm }} />
            <StatCard
              label="Wallet"
              value={`₹${profile?.walletBalance?.toFixed(0) || 0}`}
              icon={<Clock size={22} color="#fff" />}
              gradient={['#EF4444', '#DC2626']}
              sub="Available bal"
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Navigation')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {isLoadingOrders ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={COLORS.primaryLight} />
              <Text style={styles.emptyText}>Loading orders...</Text>
            </View>
          ) : orders.length === 0 ? (
            <GlassCard style={styles.emptyState}>
              <WifiOff size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No Active Orders</Text>
              <Text style={styles.emptyText}>
                {isOnline
                  ? 'Waiting for nearby orders to be assigned...'
                  : 'Go online to start receiving orders'}
              </Text>
            </GlassCard>
          ) : (
            orders.map((order) => {
              const meta = STATUS_META[order.status] ?? STATUS_META['ASSIGNED'];
              const isUrgent = order.priority === 'URGENT';
              const orderId = order.orderId || order.id;
              return (
                <TouchableOpacity key={orderId} activeOpacity={0.85} style={{ marginBottom: SIZES.md }}>
                  <View style={[styles.orderCard, SHADOWS.md]}>
                    {isUrgent && (
                      <LinearGradient
                        colors={['rgba(239,68,68,0.15)', 'transparent']}
                        style={styles.urgentBanner}
                      >
                        <Zap size={12} color={COLORS.error} />
                        <Text style={styles.urgentText}>URGENT</Text>
                      </LinearGradient>
                    )}

                    <View style={styles.orderTop}>
                      <Text style={styles.orderNumber}>{order.trackingNumber}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                    </View>

                    <View style={styles.orderRoute}>
                      <View style={styles.routePoint}>
                        <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
                        <Text style={styles.routeText} numberOfLines={1}>{order.pickupAddress || 'Pickup Location'}</Text>
                      </View>
                      <View style={styles.routeConnector} />
                      <View style={styles.routePoint}>
                        <View style={[styles.routeDot, { backgroundColor: COLORS.success }]} />
                        <Text style={styles.routeText} numberOfLines={1}>{order.dropAddress || 'Drop Location'}</Text>
                      </View>
                    </View>

                    <View style={styles.orderFooter}>
                      <View style={styles.orderMeta}>
                        <MapPin size={13} color={COLORS.textMuted} />
                        <Text style={styles.orderMetaText}>
                          {order.distanceKm || order.estimatedDistance ? `${order.distanceKm || order.estimatedDistance} km` : '—'}
                        </Text>
                      </View>
                      <Text style={styles.orderFee}>₹{order.deliveryFee ?? 0}</Text>
                      <TouchableOpacity 
                        style={styles.viewBtn}
                        onPress={() => navigation.navigate('Navigation')}
                      >
                        <Text style={styles.viewBtnText}>Track</Text>
                        <ChevronRight size={14} color={COLORS.primaryLight} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* ── Quick Actions ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.actionsGrid}>
            {[
              { label: 'My Earnings', icon: <TrendingUp size={24} color={COLORS.accent} />, bg: 'rgba(20,184,166,0.15)', route: 'Earnings' as const },
              { label: 'Wallet', icon: <Wallet size={24} color={COLORS.primary} />, bg: 'rgba(99,102,241,0.15)', route: 'Earnings' as const },
              { label: 'Navigation', icon: <MapPin size={24} color={COLORS.warning} />, bg: 'rgba(245,158,11,0.15)', route: 'Navigation' as const },
              { label: 'My Rating', icon: <Star size={24} color={COLORS.error} />, bg: 'rgba(239,68,68,0.15)', route: 'Dashboard' as const },
            ].map((action, i) => (
              <TouchableOpacity 
                key={i} 
                style={styles.actionItem} 
                activeOpacity={0.8}
                onPress={() => navigation.navigate(action.route)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                  {action.icon}
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      <CustomAlert
        {...alertConfig}
        onDismiss={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SIZES.lg },
  topBlob: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    top: -150,
    right: -150,
    backgroundColor: COLORS.primary,
    opacity: 0.08,
  },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.xl },
  greetingLabel: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 },
  greetingName: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  headerRight: { flexDirection: 'row', gap: SIZES.sm },
  iconBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  notifDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.error,
    position: 'absolute', top: 8, right: 8,
    borderWidth: 1, borderColor: COLORS.background,
  },

  // Status Card
  statusCard: { marginBottom: SIZES.lg },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLeft: { flexDirection: 'row', alignItems: 'center' },
  pulseWrapper: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  pulseRing: {
    position: 'absolute',
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.success,
  },
  statusDot: { width: 16, height: 16, borderRadius: 8 },
  statusTitle: { ...TYPOGRAPHY.body1, fontWeight: '700' },
  statusSubtitle: { ...TYPOGRAPHY.body2, marginTop: 2 },
  onlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.xs,
    marginTop: SIZES.md, padding: SIZES.sm,
    borderRadius: SIZES.radius,
  },
  onlineBannerText: { ...TYPOGRAPHY.caption, color: COLORS.primaryLight, flex: 1 },

  // Stats
  statsRow: { flexDirection: 'row', marginBottom: SIZES.sm },

  // Section
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: SIZES.xl, marginBottom: SIZES.md,
  },
  sectionTitle: { ...TYPOGRAPHY.h3, fontSize: 18 },
  sectionLink: { ...TYPOGRAPHY.body2, color: COLORS.primaryLight, fontWeight: '600' },

  // Empty State
  emptyState: { alignItems: 'center', padding: SIZES.xl, gap: SIZES.md },
  emptyTitle: { ...TYPOGRAPHY.h3, color: COLORS.text },
  emptyText: { ...TYPOGRAPHY.body2, color: COLORS.textMuted, textAlign: 'center' },

  // Order Card
  orderCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  urgentBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.xs,
    padding: SIZES.xs, marginBottom: SIZES.sm,
    borderRadius: SIZES.xs,
    alignSelf: 'flex-start',
  },
  urgentText: { fontSize: 10, fontWeight: '800', color: COLORS.error, letterSpacing: 1.5 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
  orderNumber: { ...TYPOGRAPHY.body2, fontWeight: '700', color: COLORS.text, fontFamily: 'monospace' },
  statusBadge: { borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.sm, paddingVertical: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  orderRoute: { gap: SIZES.xs, marginBottom: SIZES.md },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeText: { ...TYPOGRAPHY.body2, flex: 1 },
  routeConnector: { width: 1, height: 12, backgroundColor: COLORS.border, marginLeft: 3.5 },
  orderFooter: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, paddingTop: SIZES.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  orderMetaText: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  orderFee: { fontSize: 18, fontWeight: '800', color: COLORS.success },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewBtnText: { ...TYPOGRAPHY.caption, color: COLORS.primaryLight, fontWeight: '700' },

  // Quick Actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
  actionItem: {
    width: (SIZES.width - SIZES.lg * 2 - SIZES.sm) / 2 - 2,
    backgroundColor: 'rgba(30,41,59,0.9)',
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'flex-start',
    gap: SIZES.sm,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { ...TYPOGRAPHY.body2, color: COLORS.text, fontWeight: '600' },
});
