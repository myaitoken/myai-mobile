import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { apiClient, GpuAgent } from '../api/client';

const ACCENT = '#7000ff';
const BG = '#080808';

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#f0eee9', letterSpacing: -0.5 },
  headerSub: { color: 'rgba(240,238,233,0.35)', fontSize: 13, marginTop: 2 },
  list: { padding: 16 },
  card: { backgroundColor: '#111', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { color: '#f0eee9', fontWeight: '700', fontSize: 15, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#666', fontSize: 11 },
  jobs: { marginLeft: 'auto' },
  jobsNum: { color: ACCENT, fontWeight: '800', fontSize: 18, textAlign: 'right' },
  jobsLabel: { color: '#555', fontSize: 10, textAlign: 'right' },
  empty: { padding: 48, alignItems: 'center', opacity: 0.4 },
  emptyText: { color: '#f0eee9', marginTop: 12, fontSize: 14 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 2, borderWidth: 1 },
  filterText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
});

function parseGpu(gpus: string): string {
  try { const g = JSON.parse(gpus); return g[0]?.name || 'CPU'; } catch { return 'Unknown'; }
}

function platformIcon(p: string): string {
  if (p === 'Darwin') return 'apple';
  if (p === 'Windows') return 'microsoft-windows';
  return 'linux';
}

export function AgentsScreen() {
  const nav = useNavigation<any>();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['all-agents'],
    queryFn: () => apiClient.getAllAgents(),
    refetchInterval: 30_000,
  });

  const agents: GpuAgent[] = data?.data?.agents ?? [];
  const sorted = [...agents].sort((a, b) => b.jobs_completed - a.jobs_completed);

  const renderAgent = useCallback(({ item }: { item: GpuAgent }) => {
    const online = item.computed_status === 'online' || item.status === 'online';
    return (
      <TouchableOpacity style={S.card} onPress={() => nav.navigate('AgentDetails', { agent: item })}>
        <View style={S.cardTop}>
          <View style={[S.dot, { backgroundColor: online ? '#00c864' : '#444' }]} />
          <Text style={S.name}>{item.name}</Text>
          <View style={[S.badge, { backgroundColor: online ? 'rgba(0,200,100,0.12)' : 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: online ? 'rgba(0,200,100,0.3)' : 'rgba(255,255,255,0.08)' }]}>
            <Text style={[S.badgeText, { color: online ? '#00c864' : '#555' }]}>{online ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
        <View style={S.row}>
          <View style={S.meta}>
            <MaterialCommunityIcons name={platformIcon(item.platform) as any} size={13} color="#555" />
            <Text style={S.metaText}>{item.platform}</Text>
          </View>
          <View style={S.meta}>
            <MaterialCommunityIcons name="memory" size={13} color="#555" />
            <Text style={S.metaText}>{parseGpu(item.gpus)}</Text>
          </View>
          <View style={[S.meta, S.jobs]}>
            <Text style={S.jobsNum}>{item.jobs_completed}</Text>
            <Text style={S.jobsLabel}> jobs</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [nav]);

  return (
    <View style={S.root}>
      <View style={S.header}>
        <Text style={S.headerTitle}>Network Providers</Text>
        <Text style={S.headerSub}>{agents.length} agents · {agents.filter(a => a.computed_status === 'online' || a.status === 'online').length} online</Text>
      </View>
      <FlatList
        data={sorted}
        keyExtractor={a => a.id}
        renderItem={renderAgent}
        contentContainerStyle={S.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={ACCENT} />}
        ListEmptyComponent={
          <View style={S.empty}>
            <MaterialCommunityIcons name="server-off" size={40} color="#f0eee9" />
            <Text style={S.emptyText}>No agents found</Text>
          </View>
        }
      />
    </View>
  );
}
