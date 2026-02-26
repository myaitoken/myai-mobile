import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, Job } from '../api/client';

const ACCENT = '#7000ff';
const BG = '#080808';
const MODELS = ['llama3.2', 'llama3.1', 'mistral', 'gemma2', 'phi3'];

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#f0eee9', letterSpacing: -0.5, flex: 1 },
  newBtn: { backgroundColor: ACCENT, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 2 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 11, letterSpacing: 1.5 },
  jobCard: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  task: { color: '#f0eee9', fontSize: 14, flex: 1, lineHeight: 20 },
  meta: { color: '#555', fontSize: 11, marginTop: 4 },
  cost: { color: ACCENT, fontWeight: '700', fontSize: 13 },
  empty: { padding: 48, alignItems: 'center', opacity: 0.4 },
  emptyText: { color: '#f0eee9', marginTop: 12, fontSize: 14 },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#111', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 24, paddingBottom: 40 },
  sheetTitle: { color: '#f0eee9', fontSize: 18, fontWeight: '800', marginBottom: 20, letterSpacing: -0.5 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: '#666', marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4, color: '#f0eee9', padding: 14, fontSize: 14, marginBottom: 16, minHeight: 100, textAlignVertical: 'top' },
  modelRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  modelBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 2, borderWidth: 1 },
  modelText: { fontSize: 12, fontWeight: '600' },
  submitBtn: { backgroundColor: ACCENT, borderRadius: 4, padding: 16, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' },
});

const STATUS_COLORS: Record<string, string> = {
  completed: '#00c864', pending: '#ffaa00', running: ACCENT, failed: '#ff4444',
};

export function JobsScreen() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [prompt, setPrompt]       = useState('');
  const [model, setModel]         = useState('llama3.2');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => apiClient.getJobs(),
    refetchInterval: 15_000,
  });

  const submitMutation = useMutation({
    mutationFn: () => apiClient.submitJob(prompt, model),
    onSuccess: () => {
      Alert.alert('Job Submitted', 'Your job has been queued for processing.');
      setPrompt(''); setShowModal(false);
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: () => Alert.alert('Error', 'Failed to submit job. Check your MYAI balance.'),
  });

  const jobs: Job[] = data?.data ?? [];

  const renderJob = useCallback(({ item }: { item: Job }) => {
    const color = STATUS_COLORS[item.status] ?? '#888';
    const date = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return (
      <View style={S.jobCard}>
        <View style={[S.statusDot, { backgroundColor: color }]} />
        <View style={{ flex: 1 }}>
          <Text style={S.task} numberOfLines={2}>{item.task}</Text>
          <Text style={S.meta}>{item.model} · {date}</Text>
          {item.duration && <Text style={S.meta}>{(item.duration / 1000).toFixed(1)}s</Text>}
        </View>
        <Text style={S.cost}>{item.myaiCost} MYAI</Text>
      </View>
    );
  }, []);

  return (
    <View style={S.root}>
      <View style={S.header}>
        <Text style={S.headerTitle}>Jobs</Text>
        <TouchableOpacity style={S.newBtn} onPress={() => setShowModal(true)}>
          <Text style={S.newBtnText}>+ NEW</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={j => j.id}
        renderItem={renderJob}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={ACCENT} />}
        ListEmptyComponent={
          <View style={S.empty}>
            <MaterialCommunityIcons name="cpu-64-bit" size={40} color="#f0eee9" />
            <Text style={S.emptyText}>No jobs yet. Submit one above.</Text>
          </View>
        }
      />

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={S.overlay}>
          <View style={S.sheet}>
            <Text style={S.sheetTitle}>Submit Compute Job</Text>
            <Text style={S.label}>Prompt</Text>
            <TextInput
              style={S.input} placeholder="Enter your prompt…" placeholderTextColor="#444"
              value={prompt} onChangeText={setPrompt} multiline
            />
            <Text style={S.label}>Model</Text>
            <View style={S.modelRow}>
              {MODELS.map(m => (
                <TouchableOpacity
                  key={m} style={[S.modelBtn, { borderColor: m === model ? ACCENT : 'rgba(255,255,255,0.1)', backgroundColor: m === model ? 'rgba(112,0,255,0.12)' : 'transparent' }]}
                  onPress={() => setModel(m)}
                >
                  <Text style={[S.modelText, { color: m === model ? ACCENT : '#666' }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={S.submitBtn} onPress={() => submitMutation.mutate()} disabled={!prompt.trim() || submitMutation.isPending}>
              {submitMutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={S.submitBtnText}>Submit Job</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
