import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

const ACCENT = '#7000ff';
const BG = '#080808';

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#f0eee9', letterSpacing: -0.5 },
  profileCard: { margin: 16, backgroundColor: '#111', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(112,0,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  profileName: { color: '#f0eee9', fontWeight: '700', fontSize: 16 },
  profileEmail: { color: '#555', fontSize: 12, marginTop: 2 },
  profilePlan: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(112,0,255,0.12)', borderWidth: 1, borderColor: 'rgba(112,0,255,0.3)', borderRadius: 2, paddingHorizontal: 8, paddingVertical: 3 },
  profilePlanText: { color: ACCENT, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  section: { marginHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase', color: '#555', marginBottom: 10 },
  row: { backgroundColor: '#111', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 2, gap: 12 },
  rowLabel: { color: '#f0eee9', fontSize: 14, flex: 1 },
  rowSub: { color: '#555', fontSize: 11, marginTop: 2 },
  logoutBtn: { margin: 16, backgroundColor: 'rgba(255,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(255,68,68,0.3)', borderRadius: 4, padding: 16, alignItems: 'center' },
  logoutBtnText: { color: '#ff4444', fontWeight: '700', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
  version: { textAlign: 'center', color: '#333', fontSize: 11, marginBottom: 32, letterSpacing: 1 },
});

interface Props { onLogout: () => void }

export function SettingsScreen({ onLogout }: Props) {
  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient.getMe(),
  });

  const user = data?.data;

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await apiClient.clearSession();
          onLogout();
        },
      },
    ]);
  }

  return (
    <View style={S.root}>
      <View style={S.header}>
        <Text style={S.headerTitle}>Settings</Text>
      </View>
      <ScrollView>
        {user && (
          <View style={S.profileCard}>
            <View style={S.avatar}>
              <MaterialCommunityIcons name="account" size={28} color={ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.profileName}>{user.name || 'Anonymous'}</Text>
              <Text style={S.profileEmail}>{user.email}</Text>
              <View style={S.profilePlan}>
                <Text style={S.profilePlanText}>{user.plan} plan</Text>
              </View>
            </View>
          </View>
        )}

        <View style={S.section}>
          <Text style={S.sectionTitle}>Network</Text>
          <View style={S.row}>
            <MaterialCommunityIcons name="server-network" size={18} color="#555" />
            <View>
              <Text style={S.rowLabel}>Coordinator</Text>
              <Text style={S.rowSub}>api.myaitoken.io</Text>
            </View>
            <MaterialCommunityIcons name="check-circle" size={16} color="#00c864" style={{ marginLeft: 'auto' }} />
          </View>
        </View>

        <View style={S.section}>
          <Text style={S.sectionTitle}>About</Text>
          <View style={S.row}>
            <MaterialCommunityIcons name="web" size={18} color="#555" />
            <Text style={S.rowLabel}>myaitoken.io</Text>
          </View>
          <View style={S.row}>
            <MaterialCommunityIcons name="github" size={18} color="#555" />
            <Text style={S.rowLabel}>github.com/myaitoken</Text>
          </View>
          <View style={S.row}>
            <MaterialCommunityIcons name="shield-check-outline" size={18} color="#555" />
            <Text style={S.rowLabel}>Privacy Policy</Text>
          </View>
          <View style={S.row}>
            <MaterialCommunityIcons name="file-document-outline" size={18} color="#555" />
            <Text style={S.rowLabel}>Terms of Service</Text>
          </View>
        </View>

        <TouchableOpacity style={S.logoutBtn} onPress={handleLogout}>
          <Text style={S.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={S.version}>MYAI v1.0.0 · BASE NETWORK</Text>
      </ScrollView>
    </View>
  );
}
