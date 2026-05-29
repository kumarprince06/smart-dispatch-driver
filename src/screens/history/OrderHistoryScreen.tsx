import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Package, MapPin, ChevronLeft } from 'lucide-react-native';
import { COLORS, SIZES, TYPOGRAPHY, SHADOWS } from '../../theme/theme';
import { orderApi, OrderResponse } from '../../api/orderApi';
import { GlassCard } from '../../components/common/Cards';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';

type OrderHistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderHistory'>;

export const OrderHistoryScreen = () => {
  const navigation = useNavigation<OrderHistoryScreenNavigationProp>();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      // Fetch DELIVERED orders
      const res = await orderApi.getDriverOrders(0, 50, 'DELIVERED');
      setOrders(res.data?.data?.content ?? []);
    } catch (e) {
      console.error("Failed to fetch order history", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchHistory();
    setIsRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.background, '#1e1b4b']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Past Deliveries</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primaryLight} />}
        >
          {isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={COLORS.primaryLight} />
              <Text style={styles.emptyText}>Loading history...</Text>
            </View>
          ) : orders.length === 0 ? (
            <GlassCard style={styles.emptyState}>
              <Package size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No Deliveries Yet</Text>
              <Text style={styles.emptyText}>Complete orders to see them here.</Text>
            </GlassCard>
          ) : (
            orders.map((order, idx) => (
              <GlassCard key={order.orderId || order.id || idx} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.idContainer}>
                    <Package size={16} color={COLORS.primaryLight} />
                    <Text style={styles.trackingText}>{order.trackingNumber}</Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(order.createdAt)}</Text>
                </View>

                <View style={styles.addressRow}>
                  <MapPin size={16} color={COLORS.textMuted} />
                  <Text style={styles.addressText} numberOfLines={2}>{order.dropAddress}</Text>
                </View>

                <View style={styles.footerRow}>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Delivered</Text>
                  </View>
                  <Text style={styles.feeText}>₹{order.deliveryFee?.toFixed(2) || '0.00'}</Text>
                </View>
              </GlassCard>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.lg, paddingBottom: SIZES.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  scroll: { padding: SIZES.lg },
  
  emptyState: { alignItems: 'center', padding: SIZES.xl, gap: SIZES.md },
  emptyTitle: { ...TYPOGRAPHY.h3, color: COLORS.text },
  emptyText: { ...TYPOGRAPHY.body2, color: COLORS.textMuted, textAlign: 'center' },

  orderCard: { padding: SIZES.lg, marginBottom: SIZES.md },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
  idContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trackingText: { ...TYPOGRAPHY.body2, fontWeight: '700', color: COLORS.text },
  dateText: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginBottom: SIZES.lg },
  addressText: { ...TYPOGRAPHY.body2, color: COLORS.textMuted, flex: 1 },

  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SIZES.md },
  statusBadge: { backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '700', color: COLORS.success },
  feeText: { fontSize: 16, fontWeight: '800', color: COLORS.text },
});
