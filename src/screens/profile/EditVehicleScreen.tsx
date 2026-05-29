import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Truck } from 'lucide-react-native';
import { COLORS, SIZES, TYPOGRAPHY, SHADOWS } from '../../theme/theme';
import { driverApi } from '../../api/driverApi';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../../components/common/Cards';

export const EditVehicleScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);

  const [form, setForm] = useState({
    vehicleType: '',
    vehicleNumber: '',
    vehicleModel: '',
    vehicleColor: '',
    vehicleYear: '',
    vehicleCapacityKg: '',
    licenseNumber: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = await driverApi.getMe();
        const data = res.data.data;
        setProfileId(data.id);
        setForm({
          vehicleType: data.vehicleType || '',
          vehicleNumber: data.vehicleNumber || '',
          vehicleModel: data.vehicleModel || '',
          vehicleColor: data.vehicleColor || '',
          vehicleYear: data.vehicleYear ? String(data.vehicleYear) : '',
          vehicleCapacityKg: data.vehicleCapacityKg ? String(data.vehicleCapacityKg) : '',
          licenseNumber: data.licenseNumber || '',
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!profileId) return;
    setSaving(true);
    try {
      // Clean up number fields
      const payload = {
        ...form,
        vehicleYear: form.vehicleYear ? parseInt(form.vehicleYear, 10) : null,
        vehicleCapacityKg: form.vehicleCapacityKg ? parseFloat(form.vehicleCapacityKg) : null,
      };
      await driverApi.updateProfile(profileId, payload);
      Alert.alert('Success', 'Vehicle details updated successfully');
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to update vehicle details';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
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
          <Text style={styles.pageTitle}>Vehicle Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primaryLight} style={{ marginTop: 100 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <GlassCard style={styles.card}>
              <View style={styles.iconHeader}>
                <View style={styles.iconBox}>
                  <Truck size={24} color={COLORS.primaryLight} />
                </View>
                <Text style={styles.sectionLabel}>Vehicle Registration</Text>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Vehicle Type (e.g. TWO_WHEELER, LIGHT_TRUCK)</Text>
                <TextInput
                  style={styles.input}
                  value={form.vehicleType}
                  onChangeText={(t) => setForm({...form, vehicleType: t})}
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Registration Number (Plate)</Text>
                <TextInput
                  style={styles.input}
                  value={form.vehicleNumber}
                  onChangeText={(t) => setForm({...form, vehicleNumber: t})}
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Vehicle Model</Text>
                <TextInput
                  style={styles.input}
                  value={form.vehicleModel}
                  onChangeText={(t) => setForm({...form, vehicleModel: t})}
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              
              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.label}>Year</Text>
                  <TextInput
                    style={styles.input}
                    value={form.vehicleYear}
                    onChangeText={(t) => setForm({...form, vehicleYear: t})}
                    keyboardType="number-pad"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
                <View style={{ width: SIZES.md }} />
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.label}>Color</Text>
                  <TextInput
                    style={styles.input}
                    value={form.vehicleColor}
                    onChangeText={(t) => setForm({...form, vehicleColor: t})}
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Capacity (Kg)</Text>
                <TextInput
                  style={styles.input}
                  value={form.vehicleCapacityKg}
                  onChangeText={(t) => setForm({...form, vehicleCapacityKg: t})}
                  keyboardType="decimal-pad"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionLabel}>Driver License</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>License Number</Text>
                <TextInput
                  style={styles.input}
                  value={form.licenseNumber}
                  onChangeText={(t) => setForm({...form, licenseNumber: t})}
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="characters"
                />
              </View>
            </GlassCard>

            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleSave} 
              disabled={saving}
            >
              <LinearGradient
                colors={[COLORS.primaryLight, COLORS.primary]}
                style={styles.saveBtn}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Vehicle Info</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
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
  
  card: { padding: SIZES.lg, marginBottom: SIZES.lg },
  iconHeader: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginBottom: SIZES.lg },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.1)', justifyContent: 'center', alignItems: 'center' },
  sectionLabel: { ...TYPOGRAPHY.h3, color: COLORS.text },
  
  row: { flexDirection: 'row' },
  inputContainer: { marginBottom: SIZES.md },
  label: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    color: COLORS.text,
    fontSize: 16,
  },
  
  saveBtn: {
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.sm,
  },
  saveBtnText: {
    ...TYPOGRAPHY.h3,
    color: '#FFFFFF',
  },
});
