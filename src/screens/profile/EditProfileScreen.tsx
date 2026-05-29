import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, User, Phone, MapPin } from 'lucide-react-native';
import { COLORS, SIZES, TYPOGRAPHY, SHADOWS } from '../../theme/theme';
import { driverApi, DriverProfile } from '../../api/driverApi';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../../components/common/Cards';

export const EditProfileScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phoneNo: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = await driverApi.getMe();
        const data = res.data.data;
        setProfileId(data.id);
        setForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phoneNo: data.phoneNumber || data.phoneNo || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
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
      await driverApi.updateProfile(profileId, form);
      navigation.goBack();
    } catch (e) {
      console.error(e);
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
          <Text style={styles.pageTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primaryLight} style={{ marginTop: 100 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <GlassCard style={styles.card}>
              <Text style={styles.sectionLabel}>Personal Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={form.firstName}
                  onChangeText={(t) => setForm({...form, firstName: t})}
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={form.lastName}
                  onChangeText={(t) => setForm({...form, lastName: t})}
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={form.phoneNo}
                  onChangeText={(t) => setForm({...form, phoneNo: t})}
                  keyboardType="phone-pad"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionLabel}>Address Details</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={form.address}
                  onChangeText={(t) => setForm({...form, address: t})}
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={form.city}
                    onChangeText={(t) => setForm({...form, city: t})}
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
                <View style={{ width: SIZES.md }} />
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.label}>State</Text>
                  <TextInput
                    style={styles.input}
                    value={form.state}
                    onChangeText={(t) => setForm({...form, state: t})}
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Pincode</Text>
                <TextInput
                  style={styles.input}
                  value={form.pincode}
                  onChangeText={(t) => setForm({...form, pincode: t})}
                  keyboardType="number-pad"
                  placeholderTextColor={COLORS.textMuted}
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
                  <Text style={styles.saveBtnText}>Save Changes</Text>
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
  sectionLabel: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: SIZES.lg },
  
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
