import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

const ACCENT = '#7000ff';
const BG = '#080808';

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#f0eee9', letterSpacing: -0.5 },
  balanceCard: { margin: 16, backgroundColor: '#111', borderWidth: 1, borderColor: 'rgba(112,0,255,0.25)', borderRadius: 4, padding: 24, alignItems: 'center' },
  balanceLbl: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: '#555' },
  balanceVal: { fontSize: 48, fontWeight: '900', color: '#f0eee9', letterSpacing: -2, marginVertical: 8 },
  balanceAccent: { color: ACCENT },
  balanceSub: { color: 'rgba(240,238,233,0.35)', fontSize: 13 },
  row: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 24 },
  actionBtn: { flex: 1, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: 14, alignItems: 'center', gap: 6 },
  actionLabel: { color: '#888', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase', color: '#555', paddingHorizontal: 16, marginBottom: 12 },
  topUpCard: { marginHorizontal: 16, backgroundColor: '#111', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: 20, marginBottom: 24 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: '#666', marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4, color: '#f0eee9', padding: 14, fontSize: 16, marginBottom: 16 },
  currencyRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  currencyBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 2, borderWidth: 1 },
  currencyText: { fontSize: 12, fontWeight: '700' },
  submitBtn: { backgroundColor: ACCENT, borderRadius: 4, padding: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' },
  walletAddr: { marginHorizontal: 16, backgroundColor: '#111', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  walletAddrText: { color: '#555', fontSize: 11, fontFamily: 'monospace', flex: 1 },
});

const CURRENCIES = ['MYAI', 'USD', 'ETH', 'USDC'];

export function WalletScreen() {
  const qc = useQueryClient();
  const [amount, setAmount]     = useState('');
  const [currency, setCurrency] = useState('MYAI');

  const { data: walletData, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => apiClient.getWallet(),
  });

  const topUpMutation = useMutation({
    mutationFn: () => apiClient.topUp(parseFloat(amount), currency),
    onSuccess: () => {
      Alert.alert('Success', `${amount} ${currency} added to your balance`);
      setAmount('');
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: () => Alert.alert('Error', 'Top-up failed. Please try again.'),
  });

  const wallet = walletData?.data;

  function handleTopUp() {
    const val = parseFloat(amount);
    if (!val || val <= 0) { Alert.alert('Invalid amount'); return; }
    Alert.alert('Confirm', `Add ${amount} ${currency} to your balance?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => topUpMutation.mutate() },
    ]);
  }

  return (
    <View style={S.root}>
      <View style={S.header}>
        <Text style={S.headerTitle}>Wallet</Text>
      </View>
      <ScrollView>
        <View style={S.balanceCard}>
          <Text style={S.balanceLbl}>MYAI Balance</Text>
          {isLoading
            ? <ActivityIndicator color={ACCENT} style={{ marginVertical: 20 }} />
            : <Text style={S.balanceVal}>{wallet ? wallet.myaiBalance.toFixed(2) : '—'}<Text style={S.balanceAccent}> ◆</Text></Text>
          }
          {wallet?.usdBalance !== undefined && (
            <Text style={S.balanceSub}>${wallet.usdBalance.toFixed(2)} USD</Text>
          )}
        </View>

        <View style={S.row}>
          <TouchableOpacity style={S.actionBtn}>
            <MaterialCommunityIcons name="arrow-up" size={20} color="#888" />
            <Text style={S.actionLabel}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.actionBtn}>
            <MaterialCommunityIcons name="arrow-down" size={20} color="#888" />
            <Text style={S.actionLabel}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.actionBtn}>
            <MaterialCommunityIcons name="swap-horizontal" size={20} color="#888" />
            <Text style={S.actionLabel}>Swap</Text>
          </TouchableOpacity>
        </View>

        {wallet?.walletAddress && (
          <>
            <Text style={S.sectionLabel}>Wallet Address</Text>
            <View style={S.walletAddr}>
              <Text style={S.walletAddrText} numberOfLines={1} ellipsizeMode="middle">
                {wallet.walletAddress}
              </Text>
              <MaterialCommunityIcons name="content-copy" size={16} color="#555" />
            </View>
          </>
        )}

        <Text style={S.sectionLabel}>Top Up Balance</Text>
        <View style={S.topUpCard}>
          <Text style={S.label}>Amount</Text>
          <TextInput
            style={S.input} placeholder="0.00" placeholderTextColor="#444"
            value={amount} onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          <Text style={S.label}>Currency</Text>
          <View style={S.currencyRow}>
            {CURRENCIES.map(c => (
              <TouchableOpacity
                key={c} style={[S.currencyBtn, { borderColor: c === currency ? ACCENT : 'rgba(255,255,255,0.1)', backgroundColor: c === currency ? 'rgba(112,0,255,0.12)' : 'transparent' }]}
                onPress={() => setCurrency(c)}
              >
                <Text style={[S.currencyText, { color: c === currency ? ACCENT : '#555' }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={S.submitBtn} onPress={handleTopUp} disabled={topUpMutation.isPending}>
            {topUpMutation.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={S.submitBtnText}>Add {currency}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
