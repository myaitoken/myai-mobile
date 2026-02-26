/**
 * EarningsChart Component - Displays earnings over time
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useEarningsStore, useWalletStore } from '../store';
import { formatMyai } from '../utils/format';

const { width } = Dimensions.get('window');
const CHART_HEIGHT = 180;
const BAR_WIDTH = 24;

interface ChartBarProps {
  value: number;
  maxValue: number;
  label: string;
}

const ChartBar: React.FC<ChartBarProps> = ({ value, maxValue, label }) => {
  const height = maxValue > 0 ? (value / maxValue) * (CHART_HEIGHT - 40) : 0;

  return (
    <View style={styles.barContainer}>
      <Text style={styles.barValue}>{value > 0 ? value.toFixed(1) : ''}</Text>
      <View style={styles.barWrapper}>
        <View
          style={[
            styles.bar,
            {
              height: Math.max(height, 4),
            },
          ]}
        />
      </View>
      <Text style={styles.barLabel}>{label}</Text>
    </View>
  );
};

export const EarningsChart: React.FC = () => {
  const { isConnected, address } = useWalletStore();
  const { chartData, chartPeriod, setChartData, setChartPeriod } = useEarningsStore();

  const { isLoading } = useQuery({
    queryKey: ['earnings-chart', address, chartPeriod],
    queryFn: async () => {
      const response = await apiClient.getEarningsChart(chartPeriod);
      if (response.success && response.data) {
        setChartData({
          labels: response.data.labels,
          data: response.data.data,
        });
      }
      return response.data;
    },
    enabled: isConnected,
  });

  const periods: Array<{ key: 'day' | 'week' | 'month'; label: string }> = [
    { key: 'day', label: '24H' },
    { key: 'week', label: '7D' },
    { key: 'month', label: '30D' },
  ];

  const maxValue = chartData ? Math.max(...chartData.data, 1) : 1;
  const totalEarnings = chartData ? chartData.data.reduce((a, b) => a + b, 0) : 0;

  return (
    <View style={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.periodButton,
              chartPeriod === key && styles.periodButtonActive,
            ]}
            onPress={() => setChartPeriod(key)}
          >
            <Text
              style={[
                styles.periodText,
                chartPeriod === key && styles.periodTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Total for period */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>
          {chartPeriod === 'day' ? 'Last 24 Hours' : chartPeriod === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
        </Text>
        <Text style={styles.totalValue}>{formatMyai(totalEarnings)}</Text>
      </View>

      {/* Chart */}
      <View style={styles.chart}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : chartData && chartData.data.length > 0 ? (
          <View style={styles.barsContainer}>
            {chartData.data.map((value, index) => (
              <ChartBar
                key={index}
                value={value}
                maxValue={maxValue}
                label={chartData.labels[index]}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No earnings data available</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#6366f1',
  },
  periodText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  periodTextActive: {
    color: '#fff',
  },
  totalContainer: {
    marginBottom: 16,
  },
  totalLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  totalValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  chart: {
    height: CHART_HEIGHT,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
    paddingTop: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 40,
  },
  barValue: {
    color: '#94a3b8',
    fontSize: 10,
    marginBottom: 4,
    height: 16,
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    width: BAR_WIDTH,
  },
  bar: {
    width: BAR_WIDTH,
    backgroundColor: '#6366f1',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
});

export default EarningsChart;
