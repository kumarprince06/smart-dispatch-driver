import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Lock } from 'lucide-react-native';
import { COLORS, SIZES, TYPOGRAPHY, SHADOWS } from '../../theme/theme';
import { authApi } from '../../api/authApi';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../../components/common/Cards';

export const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully');
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to change password';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.background, '#1e1b4b']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ChevronLeft size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Change Password</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.content}>
            <GlassCard style={styles.card}>
              <View style={styles.iconHeader}>
                <View style={styles.iconBox}>
                  <Lock size={24} color={COLORS.primaryLight} />
                </View>
                <Text style={styles.sectionLabel}>Security</Text>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry
                />
              </View>
            </GlassCard>

            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleChangePassword} 
              disabled={saving}
            >
              <LinearGradient
                colors={[COLORS.primaryLight, COLORS.primary]}
                style={styles.saveBtn}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Update Password</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.lg, paddingBottom: SIZES.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  
  content: { padding: SIZES.lg },
  card: { padding: SIZES.lg, marginBottom: SIZES.lg },
  
  iconHeader: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginBottom: SIZES.lg },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.1)', justifyContent: 'center', alignItems: 'center' },
  sectionLabel: { ...TYPOGRAPHY.h3, color: COLORS.text },

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
