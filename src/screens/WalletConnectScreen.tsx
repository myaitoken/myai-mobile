/**
 * Wallet Connect Screen - Connect Althea wallet
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useWalletStore } from '../store';
import { apiClient } from '../api/client';

export const WalletConnectScreen: React.FC = () => {
  const navigation = useNavigation();
  const { connect, setWalletInfo } = useWalletStore();
  const [manualAddress, setManualAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  const handleWalletConnect = async () => {
    setIsConnecting(true);
    try {
      // In a real app, this would use WalletConnect
      // For now, we'll show the manual input option
      Alert.alert(
        'WalletConnect',
        'WalletConnect integration coming soon! Use manual address entry for now.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enter Manually', onPress: () => setShowManualInput(true) },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleKeplrConnect = async () => {
    setIsConnecting(true);
    try {
      // In a real app, this would use Keplr deep link
      Alert.alert(
        'Keplr',
        'Keplr integration coming soon! Use manual address entry for now.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enter Manually', onPress: () => setShowManualInput(true) },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManualConnect = async () => {
    if (!manualAddress.trim()) {
      Alert.alert('Error', 'Please enter a wallet address');
      return;
    }

    if (!manualAddress.startsWith('althea1')) {
      Alert.alert('Error', 'Please enter a valid Althea wallet address');
      return;
    }

    setIsConnecting(true);
    try {
      // Set the wallet address in the API client
      apiClient.setWalletAddress(manualAddress.trim());

      // Try to fetch wallet info to verify
      const response = await apiClient.getWalletInfo();

      if (response.success && response.data) {
        connect(manualAddress.trim());
        setWalletInfo(response.data);
        navigation.goBack();
      } else {
        // Even if API fails, allow connection (might be new wallet)
        connect(manualAddress.trim());
        navigation.goBack();
      }
    } catch (error) {
      // Allow connection even if verification fails
      connect(manualAddress.trim());
      navigation.goBack();
    } finally {
      setIsConnecting(false);
    }
  };

  if (showManualInput) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowManualInput(false)}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Enter Wallet Address</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Althea Wallet Address</Text>
          <TextInput
            style={styles.input}
            placeholder="althea1..."
            placeholderTextColor="#64748b"
            value={manualAddress}
            onChangeText={setManualAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.hint}>
            Enter the wallet address associated with your GPU agents
          </Text>

          <TouchableOpacity
            style={[
              styles.connectButton,
              (!manualAddress.trim() || isConnecting) && styles.connectButtonDisabled,
            ]}
            onPress={handleManualConnect}
            disabled={!manualAddress.trim() || isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.connectButtonText}>Connect</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.heroSection}>
        <Icon name="wallet-outline" size={80} color="#6366f1" />
        <Text style={styles.heroTitle}>Connect Your Wallet</Text>
        <Text style={styles.heroSubtitle}>
          Connect your Althea wallet to view earnings and manage your GPU agents
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleWalletConnect}
          disabled={isConnecting}
        >
          <View style={styles.optionIcon}>
            <Icon name="qrcode-scan" size={28} color="#6366f1" />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>WalletConnect</Text>
            <Text style={styles.optionSubtitle}>
              Scan QR code with your wallet app
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleKeplrConnect}
          disabled={isConnecting}
        >
          <View style={styles.optionIcon}>
            <Icon name="link-variant" size={28} color="#6366f1" />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Keplr Wallet</Text>
            <Text style={styles.optionSubtitle}>Connect with Keplr browser extension</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => setShowManualInput(true)}
          disabled={isConnecting}
        >
          <View style={styles.optionIcon}>
            <Icon name="pencil" size={28} color="#6366f1" />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Enter Manually</Text>
            <Text style={styles.optionSubtitle}>
              Type your wallet address directly
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      <Text style={styles.disclaimer}>
        By connecting your wallet, you agree to our Terms of Service and Privacy
        Policy. Your private keys are never shared with our servers.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  label: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hint: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 24,
  },
  connectButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  connectButtonDisabled: {
    backgroundColor: '#475569',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 48,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 24,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6366f120',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  optionSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  disclaimer: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 'auto',
    paddingTop: 24,
    lineHeight: 18,
  },
});

export default WalletConnectScreen;
