import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle,
  CreditCard, Calendar,
} from 'lucide-react-native';
import { GlassCard, StatCard } from '../../components/common/Cards';
import { COLORS, SIZES, TYPOGRAPHY, SHADOWS } from '../../theme/theme';
import { paymentApi, LedgerEntry } from '../../api/paymentApi';

export const EarningsScreen = () => {
  const [transactions, setTransactions] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await paymentApi.getMyTransactions();
      setTransactions(res.data?.data ?? []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchTransactions();
    setIsRefreshing(false);
  }, [fetchTransactions]);

  // Calculate totals
  const totalEarnings = transactions
    .filter(t => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = transactions
    .filter(t => t.type === 'DEBIT')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalEarnings - totalWithdrawals;

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
      <LinearGradient
        colors={[COLORS.background, '#1e1b4b']}
        style={StyleSheet.absoluteFill}
      />
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
          {/* Header */}
          <Text style={styles.pageTitle}>Earnings</Text>
          <Text style={styles.pageSubtitle}>Your wallet & transaction history</Text>

          {/* Balance Card */}
          <GlassCard style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>₹{balance.toFixed(2)}</Text>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceRow}>
              <View style={styles.balanceStat}>
                <ArrowDownCircle size={18} color={COLORS.success} />
                <View>
                  <Text style={styles.balanceStatLabel}>Total Earned</Text>
                  <Text style={[styles.balanceStatValue, { color: COLORS.success }]}>₹{totalEarnings.toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.balanceStat}>
                <ArrowUpCircle size={18} color={COLORS.error} />
                <View>
                  <Text style={styles.balanceStatLabel}>Withdrawals</Text>
                  <Text style={[styles.balanceStatValue, { color: COLORS.error }]}>₹{totalWithdrawals.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </GlassCard>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <StatCard
              label="This Month"
              value={`₹${totalEarnings.toFixed(0)}`}
              icon={<TrendingUp size={22} color="#fff" />}
              gradient={['#6366F1', '#4338CA']}
            />
            <View style={{ width: SIZES.sm }} />
            <StatCard
              label="Transactions"
              value={`${transactions.length}`}
              icon={<CreditCard size={22} color="#fff" />}
              gradient={['#14B8A6', '#0D9488']}
            />
          </View>

          {/* Transactions List */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
          </View>

          {isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={COLORS.primaryLight} />
              <Text style={styles.emptyText}>Loading transactions...</Text>
            </View>
          ) : transactions.length === 0 ? (
            <GlassCard style={styles.emptyState}>
              <Wallet size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No Transactions Yet</Text>
              <Text style={styles.emptyText}>Complete deliveries to start earning!</Text>
            </GlassCard>
          ) : (
            transactions.map((txn, index) => {
              const isCredit = txn.type === 'CREDIT';
              return (
                <View key={txn.id || index} style={[styles.txnCard, SHADOWS.md]}>
                  <View style={[styles.txnIcon, {
                    backgroundColor: isCredit ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'
                  }]}>
                    {isCredit
                      ? <ArrowDownCircle size={22} color={COLORS.success} />
                      : <ArrowUpCircle size={22} color={COLORS.error} />
                    }
                  </View>
                  <View style={styles.txnInfo}>
                    <Text style={styles.txnDesc} numberOfLines={1}>{txn.description || (isCredit ? 'Delivery Payment' : 'Withdrawal')}</Text>
                    <View style={styles.txnDateRow}>
                      <Calendar size={12} color={COLORS.textMuted} />
                      <Text style={styles.txnDate}>{formatDate(txn.createdAt)}</Text>
                    </View>
                  </View>
                  <Text style={[styles.txnAmount, { color: isCredit ? COLORS.success : COLORS.error }]}>
                    {isCredit ? '+' : '-'}₹{txn.amount.toFixed(2)}
                  </Text>
                </View>
              );
            })
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
  topBlob: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    top: -150,
    right: -150,
    backgroundColor: COLORS.accent,
    opacity: 0.08,
  },

  pageTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  pageSubtitle: { ...TYPOGRAPHY.body2, color: COLORS.textMuted, marginBottom: SIZES.xl },

  // Balance
  balanceCard: { padding: SIZES.xl, marginBottom: SIZES.lg },
  balanceLabel: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  balanceValue: { fontSize: 38, fontWeight: '800', color: COLORS.text, marginTop: SIZES.xs },
  balanceDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SIZES.lg },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceStat: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  balanceStatLabel: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  balanceStatValue: { fontSize: 16, fontWeight: '700' },

  statsRow: { flexDirection: 'row', marginBottom: SIZES.sm },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: SIZES.xl, marginBottom: SIZES.md,
  },
  sectionTitle: { ...TYPOGRAPHY.h3, fontSize: 18 },

  emptyState: { alignItems: 'center', padding: SIZES.xl, gap: SIZES.md },
  emptyTitle: { ...TYPOGRAPHY.h3, color: COLORS.text },
  emptyText: { ...TYPOGRAPHY.body2, color: COLORS.textMuted, textAlign: 'center' },

  // Transaction card
  txnCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
    marginBottom: SIZES.sm,
  },
  txnIcon: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  txnInfo: { flex: 1 },
  txnDesc: { ...TYPOGRAPHY.body1, fontWeight: '600' },
  txnDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  txnDate: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  txnAmount: { fontSize: 16, fontWeight: '800' },
});
