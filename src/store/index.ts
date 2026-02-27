import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, WalletInfo } from '../api/client';
import { ComputeTier } from '../types/compute';

// ── Auth ──────────────────────────────────────────────────────────────────────
interface AuthState {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
}
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({ user: null, setUser: (user) => set({ user }) }),
    { name: 'auth-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);

// ── Wallet ────────────────────────────────────────────────────────────────────
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
    { name: 'wallet-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);

// ── Compute ───────────────────────────────────────────────────────────────────
type ComputeStatus = 'idle' | 'available' | 'busy' | 'charging_only' | 'offline';

interface ComputeState {
  isEnabled: boolean;
  nodeId: string | null;
  deviceId: string | null;
  computeTier: ComputeTier | null;
  estimatedEarningsPerHour: number;
  jobsCompleted: number;
  tokensGenerated: number;
  myaiEarned: number;
  avgTokensPerSecond: number;
  status: ComputeStatus;
  setEnabled: (v: boolean) => void;
  setNodeId: (id: string) => void;
  setDeviceId: (id: string) => void;
  setComputeTier: (tier: ComputeTier) => void;
  setEstimatedEarnings: (rate: number) => void;
  setStatus: (s: ComputeStatus) => void;
  incrementJobsCompleted: () => void;
  addTokens: (n: number) => void;
  addEarnings: (n: number) => void;
  resetSession: () => void;
}
export const useComputeStore = create<ComputeState>()(
  persist(
    (set) => ({
      isEnabled: false,
      nodeId: null,
      deviceId: null,
      computeTier: null,
      estimatedEarningsPerHour: 0,
      jobsCompleted: 0,
      tokensGenerated: 0,
      myaiEarned: 0,
      avgTokensPerSecond: 0,
      status: 'offline',
      setEnabled: (v) => set({ isEnabled: v }),
      setNodeId: (id) => set({ nodeId: id }),
      setDeviceId: (id) => set({ deviceId: id }),
      setComputeTier: (tier) => set({ computeTier: tier }),
      setEstimatedEarnings: (rate) => set({ estimatedEarningsPerHour: rate }),
      setStatus: (s) => set({ status: s }),
      incrementJobsCompleted: () => set((state) => ({ jobsCompleted: state.jobsCompleted + 1 })),
      addTokens: (n) => set((state) => ({ tokensGenerated: state.tokensGenerated + n })),
      addEarnings: (n) => set((state) => ({ myaiEarned: state.myaiEarned + n })),
      resetSession: () => set({ jobsCompleted: 0, tokensGenerated: 0, myaiEarned: 0, avgTokensPerSecond: 0 }),
    }),
    { name: 'compute-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);

// ── Settings ──────────────────────────────────────────────────────────────────
interface SettingsState {
  refreshInterval: number;
  setRefreshInterval: (v: number) => void;
}
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({ refreshInterval: 30, setRefreshInterval: (v) => set({ refreshInterval: v }) }),
    { name: 'settings-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);
