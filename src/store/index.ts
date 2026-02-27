import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, WalletInfo } from '../api/client';

// Auth store
interface AuthState {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Wallet store
interface WalletState {
  walletAddress: string | null;
  walletInfo: WalletInfo | null;
  connect: (address: string) => void;
  disconnect: () => void;
  setWalletInfo: (info: WalletInfo) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      walletAddress: null,
      walletInfo: null,
      connect: (address) => set({ walletAddress: address }),
      disconnect: () => set({ walletAddress: null, walletInfo: null }),
      setWalletInfo: (info) => set({ walletInfo: info }),
    }),
    {
      name: 'wallet-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Settings store
interface SettingsState {
  refreshInterval: number;
  setRefreshInterval: (v: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      refreshInterval: 30,
      setRefreshInterval: (v) => set({ refreshInterval: v }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
