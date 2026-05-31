import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Wallet, TrendingUp, Package, Clock } from 'lucide-react-native';
import { COLORS, SIZES, TYPOGRAPHY, SHADOWS } from '../../theme/theme';
import { driverApi, DriverProfile } from '../../api/driverApi';
import { StatCard, GlassCard } from '../../components/common/Cards';

export const EarningsScreen = () => {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEarnings = useCallback(async () => {
    try {
      const [resProfile, resTx] = await Promise.all([
        driverApi.getMe(),
        driverApi.getTransactions()
      ]);
      setProfile(resProfile.data?.data);
      setTransactions(resTx.data?.data?.content || []);
    } catch (e) {
      console.error('Failed to fetch earnings', e);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchEarnings();
    setIsRefreshing(false);
  };

  const totalEarnings = profile?.totalEarnings || 0;
  const walletBalance = profile?.walletBalance || 0;
  const totalDeliveries = profile?.totalDeliveries || 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.background, '#1e1b4b']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primaryLight} />}
        >
          <Text style={styles.pageTitle}>Earnings</Text>

          {/* Main Balance Card */}
          <GlassCard style={styles.balanceCard}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceGradient}
            >
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceValue}>₹{walletBalance.toFixed(2)}</Text>
              
              <View style={styles.balanceFooter}>
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>Total Earnings</Text>
                  <Text style={styles.footerValue}>₹{totalEarnings.toFixed(2)}</Text>
                </View>
                <View style={styles.footerDivider} />
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>Withdrawals</Text>
                  <Text style={styles.footerValue}>₹{(totalEarnings - walletBalance).toFixed(2)}</Text>
                </View>
              </View>
            </LinearGradient>
          </GlassCard>

          <Text style={styles.sectionTitle}>Performance</Text>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard 
              label="Deliveries" 
              value={totalDeliveries} 
              icon={<Package size={24} color="#fff" />} 
              gradient={['#10B981', '#059669']} 
            />
            <StatCard 
              label="Avg per order" 
              value={`₹${totalDeliveries > 0 ? (totalEarnings / totalDeliveries).toFixed(0) : 0}`} 
              icon={<TrendingUp size={24} color="#fff" />} 
              gradient={['#F59E0B', '#D97706']} 
            />
          </View>

          {/* Recent Payouts / Transactions */}
          <Text style={[styles.sectionTitle, { marginTop: SIZES.lg }]}>Recent Transactions</Text>
          {transactions.length === 0 ? (
            <GlassCard style={styles.emptyState}>
              <Clock size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No Recent Transactions</Text>
              <Text style={styles.emptyText}>Complete deliveries to see your earnings history here.</Text>
            </GlassCard>
          ) : (
            transactions.map(tx => (
              <GlassCard key={tx.id} style={{ marginBottom: SIZES.md, padding: SIZES.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ ...TYPOGRAPHY.body1, fontWeight: '700', color: COLORS.text }}>{tx.type || 'DELIVERY_PAYOUT'}</Text>
                  <Text style={{ ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginTop: 4 }}>
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={{ ...TYPOGRAPHY.h3, color: COLORS.success }}>
                  +₹{tx.amount?.toFixed(2)}
                </Text>
              </GlassCard>
            ))
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SIZES.lg },
  pageTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: SIZES.xl },
  
  balanceCard: { padding: 0, overflow: 'hidden', marginBottom: SIZES.xl },
  balanceGradient: { padding: SIZES.xl },
  balanceLabel: { ...TYPOGRAPHY.body2, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  balanceValue: { ...TYPOGRAPHY.h1, color: '#fff', marginVertical: SIZES.sm },
  
  balanceFooter: { flexDirection: 'row', marginTop: SIZES.lg, backgroundColor: 'rgba(0,0,0,0.1)', padding: SIZES.md, borderRadius: SIZES.radius },
  footerItem: { flex: 1 },
  footerDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: SIZES.md },
  footerLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: '700' },
  footerValue: { fontSize: 14, color: '#fff', fontWeight: '800', marginTop: 2 },

  sectionTitle: { ...TYPOGRAPHY.body1, fontWeight: '700', color: COLORS.textMuted, marginBottom: SIZES.md, marginLeft: SIZES.xs },
  
  statsGrid: { flexDirection: 'row', gap: SIZES.md },
  
  emptyState: { alignItems: 'center', padding: SIZES.xl, gap: SIZES.md },
  emptyTitle: { ...TYPOGRAPHY.h3, color: COLORS.text },
  emptyText: { ...TYPOGRAPHY.body2, color: COLORS.textMuted, textAlign: 'center' },
});
