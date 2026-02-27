/**
 * Compute Screen — earn MYAI by sharing phone GPU
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch,
  TouchableOpacity, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useComputeStore } from '../store';
import { mobileComputeService } from '../services/mobileCompute';
import {
  AVAILABLE_MODELS,
  isModelDownloaded,
  downloadModel,
  deleteModel,
} from '../services/modelManager';
import { AvailableModel } from '../types/compute';

const BG     = '#080808';
const CARD   = '#111';
const ACCENT = '#7000ff';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT   = '#f0eee9';
const SUB    = 'rgba(240,238,233,0.45)';
const MUTED  = '#555';

type DownloadState = { [modelId: string]: { downloading: boolean; progress: number } };

export const ComputeScreen: React.FC = () => {
  const {
    isEnabled, setEnabled,
    nodeId, setNodeId, setDeviceId,
    computeTier, setComputeTier,
    estimatedEarningsPerHour, setEstimatedEarnings,
    jobsCompleted, tokensGenerated, myaiEarned, avgTokensPerSecond,
    status, setStatus, incrementJobsCompleted, addTokens, addEarnings,
  } = useComputeStore();

  const [downloadedModels, setDownloadedModels] = useState<string[]>([]);
  const [downloadStates, setDownloadStates] = useState<DownloadState>({});
  const [conditions, setConditions] = useState<any>(null);
  const [capabilities, setCapabilities] = useState<any>(null);
  const [toggling, setToggling] = useState(false);

  const refreshDownloads = useCallback(async () => {
    const downloaded: string[] = [];
    for (const m of AVAILABLE_MODELS) {
      if (await isModelDownloaded(m.id)) downloaded.push(m.id);
    }
    setDownloadedModels(downloaded);
  }, []);

  const refreshConditions = useCallback(async () => {
    const c = await mobileComputeService.getConditions();
    setConditions(c);
  }, []);

  useEffect(() => {
    refreshDownloads();
    refreshConditions();
    mobileComputeService.getCapabilities().then(setCapabilities);
    mobileComputeService.setCallbacks({
      onStatusChange: (s) => setStatus(s as any),
      onJobComplete: (metrics) => {
        incrementJobsCompleted();
        addTokens(metrics.total_tokens_generated);
        addEarnings(0.01);
      },
    });
  }, []);

  const handleToggle = async (value: boolean) => {
    setToggling(true);
    try {
      if (value) {
        const result = await mobileComputeService.register();
        if (!result) {
          Alert.alert('Registration Failed', 'Could not connect to the MyAI network. Check your connection and try again.');
          return;
        }
        setNodeId(result.node_id);
        setComputeTier(result.compute_tier);
        setEstimatedEarnings(result.estimated_earnings_per_hour);
        setDeviceId(mobileComputeService.getDeviceId() ?? '');
        mobileComputeService.startHeartbeat();
        setEnabled(true);
        setStatus('available');
      } else {
        mobileComputeService.stopHeartbeat();
        setEnabled(false);
        setStatus('offline');
      }
    } finally {
      setToggling(false);
    }
  };

  const handleDownload = async (model: AvailableModel) => {
    setDownloadStates(prev => ({ ...prev, [model.id]: { downloading: true, progress: 0 } }));
    try {
      await downloadModel(model.id, (pct) => {
        setDownloadStates(prev => ({ ...prev, [model.id]: { downloading: true, progress: pct } }));
      });
      await refreshDownloads();
    } catch (e) {
      Alert.alert('Download Failed', String(e));
    } finally {
      setDownloadStates(prev => ({ ...prev, [model.id]: { downloading: false, progress: 0 } }));
    }
  };

  const handleDelete = (model: AvailableModel) => {
    Alert.alert(
      `Delete ${model.name}?`,
      `This will free ${model.sizeMb}MB of storage.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await deleteModel(model.id);
            refreshDownloads();
          },
        },
      ]
    );
  };

  const conditionBlocking = conditions && (!conditions.is_plugged_in || conditions.thermal_state === 'serious' || conditions.thermal_state === 'critical' || conditions.is_low_power_mode);

  const tierLabel = computeTier === 'mobile_pro' ? '⚡ Mobile Pro' : '📱 Mobile Base';

  return (
    <ScrollView
      style={S.root}
      contentContainerStyle={S.scroll}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refreshDownloads(); refreshConditions(); }} tintColor={ACCENT} />}
    >
      {/* Header */}
      <View style={S.header}>
        <Text style={S.headerTitle}>Compute</Text>
        <Text style={S.headerSub}>Earn MYAI by sharing your phone's GPU</Text>
      </View>

      {/* Main toggle */}
      <View style={S.toggleCard}>
        <View style={S.toggleLeft}>
          <MaterialCommunityIcons name="cpu-64-bit" size={24} color={isEnabled ? ACCENT : MUTED} />
          <View style={{ marginLeft: 14 }}>
            <Text style={S.toggleTitle}>{isEnabled ? 'Compute Active' : 'Share Compute'}</Text>
            <Text style={S.toggleSub}>
              {isEnabled
                ? nodeId ? `Node ${nodeId.slice(0, 14)}…` : 'Registered'
                : 'Plug in to start earning'}
            </Text>
          </View>
        </View>
        {toggling
          ? <ActivityIndicator color={ACCENT} />
          : <Switch
              value={isEnabled}
              onValueChange={handleToggle}
              trackColor={{ false: '#222', true: ACCENT }}
              thumbColor="#fff"
            />
        }
      </View>

      {/* Blocking condition warning */}
      {isEnabled && conditionBlocking && (
        <View style={S.warningBanner}>
          <MaterialCommunityIcons name="alert-outline" size={16} color="#f59e0b" />
          <Text style={S.warningText}>
            {!conditions.is_plugged_in
              ? 'Plug in to receive jobs'
              : conditions.thermal_state === 'serious' || conditions.thermal_state === 'critical'
              ? 'Device too hot — jobs paused'
              : 'Low power mode — jobs paused'}
          </Text>
        </View>
      )}

      {/* Pitch when disabled */}
      {!isEnabled && (
        <View style={S.pitchCard}>
          {[
            { icon: 'lightning-bolt', text: 'Earn MYAI tokens for every AI job your phone completes' },
            { icon: 'battery-charging', text: 'Only runs while plugged in — no surprise battery drain' },
            { icon: 'shield-check-outline', text: 'Jobs are sandboxed — your data stays private' },
          ].map(item => (
            <View key={item.icon} style={S.pitchRow}>
              <MaterialCommunityIcons name={item.icon as any} size={18} color={ACCENT} />
              <Text style={S.pitchText}>{item.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Stats */}
      {isEnabled && (
        <>
          <Text style={S.sectionLabel}>Earnings Rate</Text>
          <View style={S.statsRow}>
            <View style={S.statCard}>
              <Text style={[S.statVal, { color: ACCENT }]}>
                {estimatedEarningsPerHour.toFixed(4)}
              </Text>
              <Text style={S.statLabel}>MYAI / hour</Text>
            </View>
            <View style={S.statCard}>
              <Text style={S.statVal}>{tierLabel}</Text>
              <Text style={S.statLabel}>Compute Tier</Text>
            </View>
          </View>

          <Text style={S.sectionLabel}>Session Stats</Text>
          <View style={S.statsRow}>
            <View style={S.statCard}>
              <Text style={S.statVal}>{jobsCompleted}</Text>
              <Text style={S.statLabel}>Jobs Done</Text>
            </View>
            <View style={S.statCard}>
              <Text style={S.statVal}>{tokensGenerated.toLocaleString()}</Text>
              <Text style={S.statLabel}>Tokens</Text>
            </View>
            <View style={S.statCard}>
              <Text style={[S.statVal, { color: ACCENT }]}>{myaiEarned.toFixed(4)}</Text>
              <Text style={S.statLabel}>MYAI Earned</Text>
            </View>
          </View>
        </>
      )}

      {/* Device conditions */}
      {conditions && (
        <>
          <Text style={S.sectionLabel}>Device Status</Text>
          <View style={S.condCard}>
            {[
              {
                icon: conditions.is_plugged_in ? 'battery-charging' : 'battery-outline',
                label: 'Power',
                value: conditions.is_plugged_in ? 'Plugged in' : `${Math.round(conditions.battery_level * 100)}%`,
                ok: conditions.is_plugged_in,
              },
              {
                icon: 'thermometer',
                label: 'Thermal',
                value: conditions.thermal_state,
                ok: conditions.thermal_state === 'nominal' || conditions.thermal_state === 'fair',
              },
              {
                icon: conditions.network_type === 'wifi' ? 'wifi' : 'signal',
                label: 'Network',
                value: conditions.network_type,
                ok: conditions.network_type !== 'offline',
              },
            ].map(c => (
              <View key={c.label} style={S.condRow}>
                <MaterialCommunityIcons name={c.icon as any} size={18} color={c.ok ? '#4ade80' : '#f59e0b'} />
                <Text style={S.condLabel}>{c.label}</Text>
                <Text style={[S.condValue, { color: c.ok ? TEXT : '#f59e0b' }]}>{c.value}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Model manager */}
      <Text style={S.sectionLabel}>Models</Text>
      {AVAILABLE_MODELS.filter(m =>
        !capabilities || capabilities.supported_models.includes(m.id)
      ).map(model => {
        const downloaded = downloadedModels.includes(model.id);
        const dlState = downloadStates[model.id];
        const isDownloading = dlState?.downloading;

        return (
          <View key={model.id} style={S.modelCard}>
            <View style={S.modelInfo}>
              <Text style={S.modelName}>{model.name}</Text>
              <Text style={S.modelDesc}>{model.description}</Text>
              <Text style={S.modelMeta}>
                {(model.sizeMb / 1024).toFixed(1)}GB · min {model.chip_min}
              </Text>
              {isDownloading && (
                <View style={S.progressBar}>
                  <View style={[S.progressFill, { width: `${dlState.progress}%` as any }]} />
                </View>
              )}
            </View>
            {isDownloading ? (
              <View style={S.modelAction}>
                <Text style={S.progressPct}>{dlState.progress}%</Text>
              </View>
            ) : downloaded ? (
              <TouchableOpacity style={S.modelBtnDelete} onPress={() => handleDelete(model)}>
                <Text style={S.modelBtnDeleteText}>Delete</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={S.modelBtnDownload} onPress={() => handleDownload(model)}>
                <MaterialCommunityIcons name="download" size={14} color="#fff" />
                <Text style={S.modelBtnText}>Get</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      <Text style={S.footer}>
        Jobs are only assigned when plugged in, network is WiFi or better, device is not overheating, and low power mode is off.
      </Text>
    </ScrollView>
  );
};

const S = StyleSheet.create({
  root:           { flex: 1, backgroundColor: BG },
  scroll:         { paddingBottom: 40 },
  header:         { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle:    { fontSize: 22, fontWeight: '800', color: TEXT, letterSpacing: -0.5 },
  headerSub:      { color: SUB, fontSize: 13, marginTop: 2 },
  sectionLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase', color: MUTED, marginBottom: 12, marginTop: 24, marginHorizontal: 20 },
  toggleCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 16, margin: 16, marginBottom: 0 },
  toggleLeft:     { flex: 1, flexDirection: 'row', alignItems: 'center' },
  toggleTitle:    { color: TEXT, fontWeight: '700', fontSize: 16 },
  toggleSub:      { color: MUTED, fontSize: 12, marginTop: 2 },
  warningBanner:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', borderRadius: 4, padding: 12, marginHorizontal: 16, marginTop: 10 },
  warningText:    { color: '#f59e0b', fontSize: 13, fontWeight: '600' },
  pitchCard:      { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 16, marginHorizontal: 16, marginTop: 12, gap: 14 },
  pitchRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  pitchText:      { color: SUB, fontSize: 14, flex: 1, lineHeight: 20 },
  statsRow:       { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  statCard:       { flex: 1, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 14 },
  statVal:        { fontSize: 20, fontWeight: '800', color: TEXT, letterSpacing: -0.5 },
  statLabel:      { fontSize: 11, color: SUB, marginTop: 4, fontWeight: '600' },
  condCard:       { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, marginHorizontal: 16 },
  condRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  condLabel:      { color: MUTED, fontSize: 13, flex: 1, fontWeight: '600' },
  condValue:      { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  modelCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 14, marginHorizontal: 16, marginBottom: 10 },
  modelInfo:      { flex: 1 },
  modelName:      { color: TEXT, fontWeight: '700', fontSize: 14 },
  modelDesc:      { color: MUTED, fontSize: 12, marginTop: 2 },
  modelMeta:      { color: '#444', fontSize: 11, marginTop: 4 },
  modelAction:    { marginLeft: 12 },
  progressBar:    { height: 3, backgroundColor: '#222', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  progressFill:   { height: 3, backgroundColor: ACCENT, borderRadius: 2 },
  progressPct:    { color: MUTED, fontSize: 12 },
  modelBtnDownload: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: ACCENT, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 7 },
  modelBtnText:   { color: '#fff', fontSize: 12, fontWeight: '700' },
  modelBtnDelete: { borderWidth: 1, borderColor: '#333', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 7 },
  modelBtnDeleteText: { color: MUTED, fontSize: 12 },
  footer:         { color: '#333', fontSize: 11, textAlign: 'center', paddingHorizontal: 24, marginTop: 24, lineHeight: 17 },
});

export default ComputeScreen;
