import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient, GpuAgent, NetworkStats } from '../api/client';

const ACCENT = '#7000ff';
const BG     = '#080808';
const CARD   = '#111';

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#f0eee9', letterSpacing: -0.5 },
  headerSub: { color: 'rgba(240,238,233,0.35)', fontSize: 13, marginTop: 2 },
  scroll: { padding: 16 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase', color: '#555', marginBottom: 12, marginTop: 24 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: CARD, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: 16 },
  statVal: { fontSize: 26, fontWeight: '800', color: '#f0eee9', letterSpacing: -1 },
  statLabel: { fontSize: 11, color: 'rgba(240,238,233,0.4)', marginTop: 4, fontWeight: '600' },
  statAccent: { color: ACCENT },
  agentCard: { backgroundColor: CARD, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  agentDot: { width: 8, height: 8, borderRadius: 4 },
  agentName: { color: '#f0eee9', fontWeight: '600', fontSize: 14 },
  agentSub: { color: '#555', fontSize: 11, marginTop: 2 },
  agentJobs: { marginLeft: 'auto', alignItems: 'flex-end' },
  agentJobsNum: { color: ACCENT, fontWeight: '700', fontSize: 16 },
  agentJobsLabel: { color: '#555', fontSize: 10, marginTop: 2 },
  emptyBox: { padding: 32, alignItems: 'center', opacity: 0.4 },
  emptyText: { color: '#f0eee9', marginTop: 8, fontSize: 13 },
});

function parseGpu(gpus: string): string {
  try { const g = JSON.parse(gpus); return g[0]?.name || 'CPU'; } catch { return 'Unknown'; }
}

export function DashboardScreen() {
  const { data: networkData, isLoading: networkLoading, refetch: refetchNetwork } = useQuery({
    queryKey: ['network-health'],
    queryFn: () => apiClient.getOnlineAgents(),
    refetchInterval: 30_000,
  });

  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['network-stats'],
    queryFn: () => apiClient.getNetworkStats(),
    refetchInterval: 60_000,
  });

  const { data: walletData, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => apiClient.getWallet(),
    refetchInterval: 30_000,
  });

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchNetwork(), refetchStats(), refetchWallet()]);
  }, [refetchNetwork, refetchStats, refetchWallet]);

  const agents: GpuAgent[] = networkData?.data?.agents ?? [];
  const online = agents.filter(a => a.computed_status === 'online' || a.status === 'online');
  const stats: NetworkStats = statsData?.data ?? {};
  const wallet = walletData?.data;

  return (
    <View style={S.root}>
      <View style={S.header}>
        <Text style={S.headerTitle}>MyAI Network</Text>
        <Text style={S.headerSub}>Decentralized GPU Compute</Text>
      </View>

      <ScrollView
        style={S.scroll}
        refreshControl={<RefreshControl refreshing={networkLoading} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        {/* Wallet balance */}
        <Text style={S.sectionLabel}>Your Balance</Text>
        <View style={S.statsRow}>
          <View style={S.statCard}>
            <Text style={[S.statVal, { color: ACCENT }]}>{wallet ? wallet.myaiBalance.toFixed(2) : '—'}</Text>
            <Text style={S.statLabel}>MYAI BALANCE</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statVal}>{wallet ? `$${wallet.usdBalance.toFixed(2)}` : '—'}</Text>
            <Text style={S.statLabel}>USD BALANCE</Text>
          </View>
        </View>

        {/* Network stats */}
        <Text style={S.sectionLabel}>Network</Text>
        <View style={S.statsRow}>
          <View style={S.statCard}>
            <Text style={S.statVal}>{online.length}</Text>
            <Text style={S.statLabel}>AGENTS ONLINE</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statVal}>{stats.totalJobs ?? networkData?.data?.count ?? '—'}</Text>
            <Text style={S.statLabel}>JOBS COMPLETED</Text>
          </View>
        </View>

        {/* Online agents */}
        <Text style={S.sectionLabel}>Online Providers</Text>
        {online.length === 0 ? (
          <View style={S.emptyBox}>
            <MaterialCommunityIcons name="server-off" size={32} color="#f0eee9" />
            <Text style={S.emptyText}>No agents online</Text>
          </View>
        ) : (
          online.slice(0, 5).map(agent => (
            <View key={agent.id} style={S.agentCard}>
              <View style={[S.agentDot, { backgroundColor: '#00c864' }]} />
              <View style={{ flex: 1 }}>
                <Text style={S.agentName}>{agent.name}</Text>
                <Text style={S.agentSub}>{parseGpu(agent.gpus)} · {agent.platform}</Text>
              </View>
              <View style={S.agentJobs}>
                <Text style={S.agentJobsNum}>{agent.jobs_completed}</Text>
                <Text style={S.agentJobsLabel}>JOBS</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
