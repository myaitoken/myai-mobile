import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient, Transaction } from '../api/client';

const ACCENT = '#7000ff';
const BG = '#080808';

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#f0eee9', letterSpacing: -0.5 },
  summaryRow: { flexDirection: 'row', gap: 10, padding: 16 },
  card: { flex: 1, backgroundColor: '#111', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: 16 },
  cardVal: { fontSize: 24, fontWeight: '800', color: '#f0eee9', letterSpacing: -1 },
  cardLabel: { fontSize: 10, color: 'rgba(240,238,233,0.4)', marginTop: 4, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase', color: '#555', paddingHorizontal: 16, marginBottom: 8, marginTop: 8 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', gap: 12 },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txType: { color: '#f0eee9', fontWeight: '600', fontSize: 14 },
  txDate: { color: '#555', fontSize: 11, marginTop: 2 },
  txAmount: { marginLeft: 'auto', alignItems: 'flex-end' },
  txAmountText: { fontWeight: '700', fontSize: 15 },
  txDesc: { color: '#555', fontSize: 11, marginTop: 2 },
  empty: { padding: 48, alignItems: 'center', opacity: 0.4 },
  emptyText: { color: '#f0eee9', marginTop: 12, fontSize: 14 },
});

const TX_ICONS: Record<string, { name: string; bg: string; color: string }> = {
  earning:      { name: 'arrow-down-circle', bg: 'rgba(0,200,100,0.12)', color: '#00c864' },
  job_payment:  { name: 'arrow-up-circle',   bg: 'rgba(255,68,68,0.12)',  color: '#ff4444' },
  deposit:      { name: 'plus-circle',        bg: 'rgba(112,0,255,0.12)',  color: ACCENT },
  withdrawal:   { name: 'minus-circle',       bg: 'rgba(255,170,0,0.12)', color: '#ffaa00' },
  default:      { name: 'circle-outline',     bg: 'rgba(255,255,255,0.06)', color: '#888' },
};

export function EarningsScreen() {
  const { data: txData, isLoading, refetch } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => apiClient.getTransactions(),
    refetchInterval: 30_000,
  });
  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => apiClient.getWallet(),
  });

  const transactions: Transaction[] = txData?.data ?? [];
  const wallet = walletData?.data;
  const earned = transactions.filter(t => t.type === 'earning').reduce((s, t) => s + t.amount, 0);
  const spent  = transactions.filter(t => t.type === 'job_payment').reduce((s, t) => s + t.amount, 0);

  const renderTx = useCallback(({ item: tx }: { item: Transaction }) => {
    const icon = TX_ICONS[tx.type] ?? TX_ICONS.default;
    const isPositive = tx.type === 'earning' || tx.type === 'deposit';
    const date = new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return (
      <View style={S.txRow}>
        <View style={[S.txIcon, { backgroundColor: icon.bg }]}>
          <MaterialCommunityIcons name={icon.name as any} size={20} color={icon.color} />
        </View>
        <View>
          <Text style={S.txType}>{tx.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
          <Text style={S.txDate}>{date}</Text>
        </View>
        <View style={S.txAmount}>
          <Text style={[S.txAmountText, { color: isPositive ? '#00c864' : '#ff6b6b' }]}>
            {isPositive ? '+' : '-'}{Math.abs(tx.amount).toFixed(4)} {tx.currency}
          </Text>
          {tx.usdEquiv > 0 && <Text style={S.txDesc}>${tx.usdEquiv.toFixed(2)}</Text>}
        </View>
      </View>
    );
  }, []);

  return (
    <View style={S.root}>
      <View style={S.header}>
        <Text style={S.headerTitle}>Earnings</Text>
      </View>
      <View style={S.summaryRow}>
        <View style={S.card}>
          <Text style={[S.cardVal, { color: ACCENT }]}>{wallet?.myaiBalance.toFixed(2) ?? '—'}</Text>
          <Text style={S.cardLabel}>Balance</Text>
        </View>
        <View style={S.card}>
          <Text style={[S.cardVal, { color: '#00c864' }]}>+{earned.toFixed(2)}</Text>
          <Text style={S.cardLabel}>Total Earned</Text>
        </View>
        <View style={S.card}>
          <Text style={[S.cardVal, { color: '#ff6b6b' }]}>-{spent.toFixed(2)}</Text>
          <Text style={S.cardLabel}>Total Spent</Text>
        </View>
      </View>
      <Text style={S.sectionLabel}>Transaction History</Text>
      <FlatList
        data={transactions}
        keyExtractor={t => t.id}
        renderItem={renderTx}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={ACCENT} />}
        ListEmptyComponent={
          <View style={S.empty}>
            <MaterialCommunityIcons name="history" size={40} color="#f0eee9" />
            <Text style={S.emptyText}>No transactions yet</Text>
          </View>
        }
      />
    </View>
  );
}
