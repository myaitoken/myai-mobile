/**
 * AgentCard Component - Displays agent summary
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Agent } from '../types';
import {
  formatRelativeTime,
  formatVram,
  formatPercent,
  getStatusColor,
} from '../utils/format';

interface AgentCardProps {
  agent: Agent;
  onPress?: () => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onPress }) => {
  const { status } = agent;
  const statusColor = getStatusColor(status.status);

  const totalVram = status.gpus.reduce((sum, gpu) => sum + gpu.vram_total_mb, 0);
  const avgUtilization =
    status.gpus.length > 0
      ? status.gpus.reduce((sum, gpu) => sum + gpu.utilization_gpu, 0) / status.gpus.length
      : 0;
  const avgTemp =
    status.gpus.length > 0
      ? status.gpus.reduce((sum, gpu) => sum + gpu.temperature_c, 0) / status.gpus.length
      : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.name} numberOfLines={1}>
            {agent.name}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color="#64748b" />
      </View>

      <View style={styles.statusRow}>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
        </Text>
        <Text style={styles.lastSeen}>
          {status.status === 'online' || status.status === 'busy'
            ? 'Active now'
            : `Last seen ${formatRelativeTime(status.last_seen)}`}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Icon name="chip" size={16} color="#94a3b8" />
          <Text style={styles.statValue}>
            {status.gpus.length} GPU{status.gpus.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.stat}>
          <Icon name="memory" size={16} color="#94a3b8" />
          <Text style={styles.statValue}>{formatVram(totalVram)}</Text>
        </View>

        <View style={styles.stat}>
          <Icon name="gauge" size={16} color="#94a3b8" />
          <Text style={styles.statValue}>{formatPercent(avgUtilization)}</Text>
        </View>

        <View style={styles.stat}>
          <Icon name="thermometer" size={16} color="#94a3b8" />
          <Text style={styles.statValue}>{Math.round(avgTemp)}°C</Text>
        </View>
      </View>

      {status.running_jobs > 0 && (
        <View style={styles.jobsRow}>
          <Icon name="play-circle" size={16} color="#f59e0b" />
          <Text style={styles.jobsText}>
            {status.running_jobs} job{status.running_jobs !== 1 ? 's' : ''} running
          </Text>
        </View>
      )}

      {status.gpus.length > 0 && (
        <View style={styles.gpuList}>
          {status.gpus.slice(0, 2).map((gpu, index) => (
            <View key={gpu.gpu_id} style={styles.gpuItem}>
              <Text style={styles.gpuName} numberOfLines={1}>
                {gpu.name}
              </Text>
              <View style={styles.gpuStats}>
                <Text style={styles.gpuStat}>{formatVram(gpu.vram_total_mb)}</Text>
                <Text style={styles.gpuStat}>•</Text>
                <Text style={styles.gpuStat}>{formatPercent(gpu.utilization_gpu)}</Text>
              </View>
            </View>
          ))}
          {status.gpus.length > 2 && (
            <Text style={styles.moreGpus}>+{status.gpus.length - 2} more</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    marginRight: 8,
  },
  lastSeen: {
    color: '#64748b',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: '#e2e8f0',
    fontSize: 13,
  },
  jobsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  jobsText: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '500',
  },
  gpuList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  gpuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gpuName: {
    color: '#94a3b8',
    fontSize: 12,
    flex: 1,
  },
  gpuStats: {
    flexDirection: 'row',
    gap: 6,
  },
  gpuStat: {
    color: '#64748b',
    fontSize: 12,
  },
  moreGpus: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
});

export default AgentCard;
