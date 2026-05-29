import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Shield, Truck, Settings, LogOut, ChevronRight, Star, Package } from 'lucide-react-native';
import { COLORS, SIZES, TYPOGRAPHY, SHADOWS } from '../../theme/theme';
import { GlassCard } from '../../components/common/Cards';
import { useAuthStore } from '../../store/authStore';
import { driverApi } from '../../api/driverApi';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export const ProfileScreen = () => {
  const { logout, user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const fetchProfile = async () => {
    try {
      const res = await driverApi.getMe();
      setProfile(res.data?.data);
    } catch (e) {
      console.error('Failed to fetch profile', e);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfile();
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.background, '#1e1b4b']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primaryLight} />}
        >
          <Text style={styles.pageTitle}>Profile</Text>

          {/* Profile Header */}
          <GlassCard style={styles.profileCard}>
            <View style={styles.headerRow}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarPlaceholder}>
                  <User size={32} color={COLORS.textMuted} />
                </View>
                <View>
                  <Text style={styles.nameText}>{profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</Text>
                  <Text style={styles.emailText}>{user?.email}</Text>
                  <View style={styles.ratingBadge}>
                    <Star size={12} color="#FBBF24" fill="#FBBF24" />
                    <Text style={styles.ratingText}>{profile?.rating ? profile.rating.toFixed(1) : 'New'}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('EditProfile' as any)} style={styles.editIconBtn}>
                <Settings size={20} color={COLORS.primaryLight} />
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Vehicle Info */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vehicle Details</Text>
            <TouchableOpacity onPress={() => navigation.navigate('EditVehicle' as any)}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <GlassCard style={styles.sectionCard}>
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Truck size={20} color={COLORS.primaryLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Vehicle</Text>
                <Text style={styles.infoValue}>
                  {profile?.vehicleYear || 'N/A'} {profile?.vehicleModel || ''} {profile?.vehicleType ? `(${profile?.vehicleType?.replace('_', ' ')})` : ''}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Shield size={20} color={COLORS.primaryLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>License & Plate</Text>
                <Text style={styles.infoValue}>
                  {profile?.licenseNumber || 'Pending'} • {profile?.vehicleNumber || 'Pending'}
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Account Settings */}
          <Text style={styles.sectionTitle}>Settings</Text>
          <GlassCard style={styles.sectionCard}>
            <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('OrderHistory')}>
              <Package size={20} color={COLORS.text} />
              <Text style={styles.actionText}>Past Deliveries</Text>
              <ChevronRight size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('ChangePassword' as any)}>
              <Settings size={20} color={COLORS.text} />
              <Text style={styles.actionText}>Change Password</Text>
              <ChevronRight size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
            
            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
              <LogOut size={20} color={COLORS.error} />
              <Text style={[styles.actionText, { color: COLORS.error }]}>Log Out</Text>
            </TouchableOpacity>
          </GlassCard>

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
  
  profileCard: { padding: SIZES.lg, marginBottom: SIZES.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  editIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  avatarContainer: { flexDirection: 'row', alignItems: 'center', gap: SIZES.lg },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  nameText: { ...TYPOGRAPHY.h3, color: COLORS.text },
  emailText: { ...TYPOGRAPHY.body2, color: COLORS.textMuted, marginTop: 2 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(251, 191, 36, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginTop: SIZES.sm, gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#FBBF24' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md, marginLeft: SIZES.xs, marginRight: SIZES.sm },
  sectionTitle: { ...TYPOGRAPHY.body1, fontWeight: '700', color: COLORS.textMuted },
  editText: { ...TYPOGRAPHY.body2, color: COLORS.primaryLight, fontWeight: '700' },
  sectionCard: { padding: SIZES.md, marginBottom: SIZES.xl },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.md, paddingVertical: SIZES.sm },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.1)', justifyContent: 'center', alignItems: 'center' },
  infoLabel: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  infoValue: { ...TYPOGRAPHY.body1, fontWeight: '600', marginTop: 2 },
  
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SIZES.sm },
  
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.md, paddingVertical: SIZES.sm },
  actionText: { ...TYPOGRAPHY.body1, fontWeight: '600', flex: 1 },
});
