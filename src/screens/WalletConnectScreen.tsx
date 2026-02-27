/**
 * Wallet Connect Screen — Connect Althea wallet
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useWalletStore } from '../store';
import { apiClient } from '../api/client';

const BG     = '#080808';
const CARD   = '#111';
const ACCENT = '#7000ff';
const BORDER = 'rgba(255,255,255,0.07)';

export const WalletConnectScreen: React.FC = () => {
  const navigation = useNavigation();
  const { connect, setWalletInfo } = useWalletStore();
  const [manualAddress, setManualAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  const handleWalletConnect = () => {
    Alert.alert(
      'WalletConnect',
      'WalletConnect integration coming soon. Use manual address entry for now.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Enter Manually', onPress: () => setShowManualInput(true) },
      ]
    );
  };

  const handleKeplrConnect = () => {
    Alert.alert(
      'Keplr',
      'Keplr deep-link integration coming soon. Use manual address entry for now.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Enter Manually', onPress: () => setShowManualInput(true) },
      ]
    );
  };

  const handleManualConnect = async () => {
    if (!manualAddress.trim()) {
      Alert.alert('Error', 'Please enter a wallet address');
      return;
    }
    // Althea bech32: prefix 'althea1' + 38 lowercase alphanumeric chars
    const ALTHEA_RE = /^althea1[a-z0-9]{38,}$/;
    if (!ALTHEA_RE.test(manualAddress.trim())) {
      Alert.alert('Invalid Address', 'Please enter a valid Althea wallet address (format: althea1...)');
      return;
    }

    setIsConnecting(true);
    try {
      apiClient.setWalletAddress(manualAddress.trim());
      const response = await apiClient.getWalletInfo();
      if (response.success && response.data) {
        connect(manualAddress.trim());
        setWalletInfo(response.data);
      } else {
        connect(manualAddress.trim());
      }
      navigation.goBack();
    } catch {
      connect(manualAddress.trim());
      navigation.goBack();
    } finally {
      setIsConnecting(false);
    }
  };

  if (showManualInput) {
    return (
      <View style={S.root}>
        <View style={S.manualHeader}>
          <TouchableOpacity onPress={() => setShowManualInput(false)} style={S.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#f0eee9" />
          </TouchableOpacity>
          <Text style={S.manualTitle}>Enter Wallet Address</Text>
        </View>
        <View style={S.manualBody}>
          <Text style={S.label}>Althea Wallet Address</Text>
          <TextInput
            style={S.input}
            placeholder="althea1..."
            placeholderTextColor="rgba(240,238,233,0.25)"
            value={manualAddress}
            onChangeText={setManualAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={S.hint}>Enter the wallet address associated with your GPU agents</Text>
          <TouchableOpacity
            style={[S.connectBtn, (!manualAddress.trim() || isConnecting) && S.connectBtnDisabled]}
            onPress={handleManualConnect}
            disabled={!manualAddress.trim() || isConnecting}
          >
            {isConnecting
              ? <ActivityIndicator color="#fff" />
              : <Text style={S.connectBtnText}>Connect Wallet</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={S.root} contentContainerStyle={S.scroll}>
      <View style={S.hero}>
        <MaterialCommunityIcons name="wallet-outline" size={64} color={ACCENT} />
        <Text style={S.heroTitle}>Connect Your Wallet</Text>
        <Text style={S.heroSub}>
          Connect your Althea wallet to view earnings and manage your GPU agents
        </Text>
      </View>

      <View style={S.options}>
        {[
          { icon: 'qrcode-scan',   title: 'WalletConnect',  sub: 'Scan QR code with your wallet app', onPress: handleWalletConnect },
          { icon: 'link-variant',  title: 'Keplr Wallet',   sub: 'Connect via Keplr deep link',       onPress: handleKeplrConnect },
          { icon: 'pencil-outline',title: 'Enter Manually', sub: 'Type your wallet address directly', onPress: () => setShowManualInput(true) },
        ].map(opt => (
          <TouchableOpacity key={opt.title} style={S.optionCard} onPress={opt.onPress}>
            <View style={S.optionIcon}>
              <MaterialCommunityIcons name={opt.icon as any} size={24} color={ACCENT} />
            </View>
            <View style={S.optionText}>
              <Text style={S.optionTitle}>{opt.title}</Text>
              <Text style={S.optionSub}>{opt.sub}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#555" />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={S.disclaimer}>
        Your private keys are never shared with our servers.
      </Text>
    </ScrollView>
  );
};

const S = StyleSheet.create({
  root:             { flex: 1, backgroundColor: BG },
  scroll:           { padding: 20, paddingTop: 40 },
  hero:             { alignItems: 'center', paddingVertical: 32 },
  heroTitle:        { fontSize: 24, fontWeight: '800', color: '#f0eee9', marginTop: 16, letterSpacing: -0.5 },
  heroSub:          { fontSize: 14, color: 'rgba(240,238,233,0.45)', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  options:          { gap: 10, marginTop: 8 },
  optionCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 16, gap: 14 },
  optionIcon:       { width: 44, height: 44, borderRadius: 4, backgroundColor: 'rgba(112,0,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  optionText:       { flex: 1 },
  optionTitle:      { color: '#f0eee9', fontWeight: '700', fontSize: 15 },
  optionSub:        { color: '#555', fontSize: 12, marginTop: 2 },
  disclaimer:       { color: '#444', fontSize: 12, textAlign: 'center', marginTop: 32, lineHeight: 18 },
  manualHeader:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: BORDER },
  backBtn:          { marginRight: 14 },
  manualTitle:      { fontSize: 18, fontWeight: '700', color: '#f0eee9' },
  manualBody:       { padding: 20 },
  label:            { color: 'rgba(240,238,233,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  input:            { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 14, color: '#f0eee9', fontSize: 15, fontFamily: 'monospace' },
  hint:             { color: '#555', fontSize: 12, marginTop: 8, marginBottom: 28 },
  connectBtn:       { backgroundColor: ACCENT, borderRadius: 4, padding: 16, alignItems: 'center' },
  connectBtnDisabled: { opacity: 0.4 },
  connectBtnText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default WalletConnectScreen;
