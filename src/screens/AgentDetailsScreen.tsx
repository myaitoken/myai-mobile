import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, GpuAgent } from '../api/client';

const ACCENT = '#7000ff';
const BG = '#080808';

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  hero: { padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  heroName: { fontSize: 22, fontWeight: '800', color: '#f0eee9', flex: 1, letterSpacing: -0.5 },
  heroId: { color: '#555', fontSize: 11, fontFamily: 'monospace' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#111', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: 12, alignItems: 'center' },
  statVal: { color: '#f0eee9', fontWeight: '800', fontSize: 20 },
  statLabel: { color: '#555', fontSize: 10, marginTop: 4, fontWeight: '600', letterSpacing: 1 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase', color: '#555', marginBottom: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', gap: 12 },
  metaLabel: { color: '#555', fontSize: 13, flex: 1 },
  metaValue: { color: '#f0eee9', fontSize: 13, fontWeight: '600', flex: 2, textAlign: 'right' },
  dispatchBtn: { margin: 20, backgroundColor: ACCENT, borderRadius: 4, padding: 16, alignItems: 'center' },
  dispatchBtnText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' },
});

function parseGpu(gpus: string): string {
  try { const g = JSON.parse(gpus); return g.map((x: any) => x.name).join(', ') || 'CPU'; } catch { return 'Unknown'; }
}
function parseModels(m: string): string {
  try { return JSON.parse(m).join(', '); } catch { return m; }
}

export function AgentDetailsScreen({ route }: any) {
  const agent: GpuAgent = route.params?.agent;
  const qc = useQueryClient();
  const online = agent.computed_status === 'online' || agent.status === 'online';

  const dispatchMutation = useMutation({
    mutationFn: () => apiClient.dispatchJob(agent.id, 'Hello from MyAI mobile! Respond with a brief greeting.'),
    onSuccess: (res) => {
      if (res.success) {
        Alert.alert('Job Dispatched', `Job ID: ${res.data?.job_id ?? 'sent'}\n\nJob is being processed.`);
      } else {
        Alert.alert('Error', res.error ?? 'Dispatch failed');
      }
    },
    onError: () => Alert.alert('Error', 'Failed to dispatch job'),
  });

  const hb = agent.last_heartbeat ? new Date(agent.last_heartbeat).toLocaleString() : 'Never';

  return (
    <View style={S.root}>
      <ScrollView>
        <View style={S.hero}>
          <View style={S.heroTop}>
            <View style={[S.dot, { backgroundColor: online ? '#00c864' : '#444' }]} />
            <Text style={S.heroName}>{agent.name}</Text>
          </View>
          <Text style={S.heroId}>{agent.id}</Text>

          <View style={[S.statsRow, { marginTop: 16 }]}>
            <View style={S.statCard}>
              <Text style={S.statVal}>{agent.jobs_completed}</Text>
              <Text style={S.statLabel}>JOBS</Text>
            </View>
            <View style={S.statCard}>
              <Text style={[S.statVal, { color: online ? '#00c864' : '#444' }]}>{online ? 'Online' : 'Offline'}</Text>
              <Text style={S.statLabel}>STATUS</Text>
            </View>
          </View>
        </View>

        <View style={S.section}>
          <Text style={S.sectionTitle}>Hardware</Text>
          {[
            ['GPU', parseGpu(agent.gpus)],
            ['Platform', agent.platform],
            ['Models', parseModels(agent.models)],
            ['Last Seen', hb],
          ].map(([label, value]) => (
            <View key={label} style={S.metaRow}>
              <Text style={S.metaLabel}>{label}</Text>
              <Text style={S.metaValue} numberOfLines={1}>{value}</Text>
            </View>
          ))}
        </View>

        {online && (
          <TouchableOpacity
            style={[S.dispatchBtn, dispatchMutation.isPending && { opacity: 0.6 }]}
            onPress={() => dispatchMutation.mutate()}
            disabled={dispatchMutation.isPending}
          >
            <Text style={S.dispatchBtnText}>{dispatchMutation.isPending ? 'Dispatching…' : 'Dispatch Test Job'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
