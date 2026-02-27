/**
 * Mobile Compute Service
 * Registers the phone as a compute node, sends heartbeats, processes jobs.
 */

import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import * as Network from '@react-native-community/netinfo';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';
import { getModelPath, isModelDownloaded } from './modelManager';
import {
  DeviceCapabilities,
  DeviceConditions,
  ComputeMetrics,
  PendingJob,
  RegisterResult,
  ThermalState,
  NetworkType,
} from '../types/compute';

// Chip → neural engine TOPS mapping
const CHIP_TOPS: Record<string, number> = {
  'A14': 11, 'A15': 15.8, 'A16': 17, 'A17 Pro': 35,
  'A18': 35, 'A18 Pro': 38,
  'M1': 11, 'M2': 15.8, 'M3': 18, 'M4': 38,
};

// Chip → typical RAM for M-chip iPads (iPhones use Device.totalMemory)
const IPAD_CHIP_RAM_GB: Partial<Record<string, number>> = {
  'M1': 8, 'M2': 8, 'M3': 8, 'M4': 16,
};

function detectChip(modelId: string | null): string {
  if (!modelId) return 'Unknown';

  const map: [RegExp, string][] = [
    // ── iPhone ──────────────────────────────────────────────────────────────
    [/iPhone1[67],/,          'A18'],       // iPhone 16, 16 Plus, 16 Pro, 16 Pro Max
    [/iPhone1[45],/,          'A17 Pro'],   // iPhone 15 Pro, 15 Pro Max
    [/iPhone1[23],/,          'A16'],       // iPhone 14 Pro/Max, 15, 15 Plus
    [/iPhone1[01],/,          'A15'],       // iPhone 13 Pro/Max, 14, 14 Plus
    [/iPhone13,/,             'A15'],       // iPhone 13, 13 mini
    [/iPhone12,/,             'A14'],       // iPhone 12 series

    // ── iPad M4 ─────────────────────────────────────────────────────────────
    [/iPad16,[1-6]/,          'M4'],        // iPad Pro M4 (11"/13"), iPad mini M4

    // ── iPad M2 ─────────────────────────────────────────────────────────────
    [/iPad14,[3-9]/,          'M2'],        // iPad Pro M2 (11"/12.9"), iPad Air M2

    // ── iPad M1 ─────────────────────────────────────────────────────────────
    [/iPad13,1[6-9]/,         'M1'],        // iPad Air M1 (5th gen)
    [/iPad8,(9|10|11|12)/,    'M1'],        // iPad Pro M1 (11"/12.9")
  ];

  for (const [re, chip] of map) {
    if (re.test(modelId)) return chip;
  }
  return 'A15'; // safe fallback
}

function isIPad(modelId: string | null): boolean {
  return !!modelId && modelId.startsWith('iPad');
}

class MobileComputeService {
  private deviceId: string | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private metrics: ComputeMetrics = {
    jobs_completed: 0,
    total_tokens_generated: 0,
    average_tokens_per_second: 0,
    uptime_seconds: 0,
    myai_earned: 0,
  };
  private startedAt: number = 0;
  private onStatusChange?: (status: string) => void;
  private onJobComplete?: (metrics: ComputeMetrics) => void;

  setCallbacks(opts: {
    onStatusChange?: (status: string) => void;
    onJobComplete?: (metrics: ComputeMetrics) => void;
  }) {
    this.onStatusChange = opts.onStatusChange;
    this.onJobComplete = opts.onJobComplete;
  }

  async getCapabilities(): Promise<DeviceCapabilities> {
    const modelId = Device.modelId ?? null;
    const chip = detectChip(modelId);
    const tops = CHIP_TOPS[chip] ?? 11;
    const ipad = isIPad(modelId);

    // M-chip iPads: use known RAM values; iPhones: read from Device.totalMemory
    const ramBytes = Device.totalMemory ?? 4_000_000_000;
    const ramFromDevice = ramBytes / 1_073_741_824;
    const ram = ipad ? (IPAD_CHIP_RAM_GB[chip] ?? Math.round(ramFromDevice)) : Math.round(ramFromDevice);

    // Model support based on TOPS + RAM
    let supported_models: string[];
    if (tops >= 38 || ram >= 16) {
      // M4 / A18 Pro — can run 7B+ comfortably
      supported_models = ['llama3.2:1b', 'llama3.2:3b', 'phi3:mini', 'llama3.1:7b'];
    } else if (tops >= 35 || ram >= 8) {
      // M1–M3, A17 Pro, A18 — 3B models fine
      supported_models = ['llama3.2:1b', 'llama3.2:3b', 'phi3:mini'];
    } else {
      // A14–A16 iPhones — stick to 1B
      supported_models = ['llama3.2:1b'];
    }

    return {
      chip,
      ram_gb: ram,
      neural_engine_tops: tops,
      storage_gb: 128, // expo-device doesn't expose storage
      supported_models,
    };
  }

  async getConditions(): Promise<DeviceConditions> {
    const [batteryLevel, batteryState, netState] = await Promise.all([
      Battery.getBatteryLevelAsync().catch(() => 0.5),
      Battery.getBatteryStateAsync().catch(() => Battery.BatteryState.UNKNOWN),
      Network.fetch().catch(() => null),
    ]);

    const isPluggedIn = batteryState === Battery.BatteryState.CHARGING
      || batteryState === Battery.BatteryState.FULL;

    let networkType: NetworkType = 'wifi';
    if (netState?.type === 'cellular') networkType = 'cellular';
    else if (!netState?.isConnected) networkType = 'offline';

    return {
      battery_level: Math.round(batteryLevel * 100) / 100,
      is_plugged_in: isPluggedIn,
      thermal_state: 'nominal' as ThermalState, // iOS doesn't expose thermal via RN
      available_memory_mb: 1024, // placeholder — no RN API for this
      available_storage_mb: 10000,
      network_type: networkType,
      is_low_power_mode: false,
    };
  }

  async register(): Promise<RegisterResult | null> {
    try {
      const capabilities = await this.getCapabilities();
      const deviceId = await this.getOrCreateDeviceId();
      const deviceName = Device.deviceName ?? `${Device.modelName ?? 'iPhone'}`;

      const result = await apiClient.registerMobileDevice({
        device_id: deviceId,
        device_name: deviceName,
        device_model: Device.modelId ?? Device.modelName ?? 'iPhone',
        os_version: `${Platform.OS} ${Device.osVersion ?? ''}`.trim(),
        app_version: Application.nativeApplicationVersion ?? '1.0.0',
        capabilities,
      });

      if (result.success && result.data) {
        this.deviceId = deviceId;
        return result.data as RegisterResult;
      }
      return null;
    } catch (e) {
      console.error('[MobileCompute] Registration failed:', e);
      return null;
    }
  }

  startHeartbeat() {
    this.startedAt = Date.now();
    this.heartbeatTimer = setInterval(() => this.heartbeat(), 30_000);
    this.heartbeat(); // immediate first beat
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private async heartbeat() {
    if (!this.deviceId) return;
    try {
      const conditions = await this.getConditions();
      const uptimeSeconds = Math.floor((Date.now() - this.startedAt) / 1000);

      const result = await apiClient.sendHeartbeat({
        device_id: this.deviceId,
        status: conditions.is_plugged_in ? 'available' : 'charging_only',
        conditions,
        current_job_id: null,
        metrics: { ...this.metrics, uptime_seconds: uptimeSeconds },
      });

      if (result.success && result.data?.pending_jobs?.length) {
        for (const job of result.data.pending_jobs) {
          await this.processJob(job);
        }
      }

      this.onStatusChange?.(conditions.is_plugged_in ? 'available' : 'charging_only');
    } catch (e) {
      console.error('[MobileCompute] Heartbeat failed:', e);
    }
  }

  private async processJob(job: PendingJob) {
    if (!this.deviceId) return;
    const start = Date.now();
    try {
      this.onStatusChange?.('busy');

      let result = '';
      let tokens = 0;

      // Try on-device inference if model is downloaded
      const modelDownloaded = await isModelDownloaded(job.model_id);
      if (modelDownloaded) {
        try {
          // react-native-executorch inference
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { LLM } = require('react-native-executorch');
          const modelPath = getModelPath(job.model_id);
          const llm = await LLM.create({ modelSource: { uri: `file://${modelPath}` } });
          result = await llm.generate(job.prompt ?? '');
          tokens = result.split(' ').length * 1.3; // rough estimate
        } catch {
          // Native inference unavailable — fallback to coordinator
          const r = await apiClient.submitParallelJob(job.prompt ?? '', job.model_id, 1);
          result = r.data?.result ?? 'inference unavailable';
          tokens = 50;
        }
      } else {
        // No model downloaded — relay to coordinator
        const r = await apiClient.submitParallelJob(job.prompt ?? '', job.model_id, 1);
        result = r.data?.result ?? 'inference unavailable';
        tokens = 50;
      }

      const durationMs = Date.now() - start;
      const tps = tokens / (durationMs / 1000);

      await apiClient.completeMobileJob(job.job_id, {
        device_id: this.deviceId,
        result,
        tokens_generated: Math.round(tokens),
        duration_ms: durationMs,
      });

      // Update metrics
      this.metrics.jobs_completed += 1;
      this.metrics.total_tokens_generated += Math.round(tokens);
      this.metrics.average_tokens_per_second = tps;
      this.metrics.myai_earned += 0.01; // placeholder until real earnings API

      this.onJobComplete?.({ ...this.metrics });
      this.onStatusChange?.('available');
    } catch (e) {
      console.error('[MobileCompute] Job processing failed:', e);
      await apiClient.failMobileJob(job.job_id, {
        device_id: this.deviceId!,
        error: String(e),
        retry: true,
      }).catch(() => {});
      this.onStatusChange?.('available');
    }
  }

  getMetrics(): ComputeMetrics {
    return { ...this.metrics, uptime_seconds: Math.floor((Date.now() - this.startedAt) / 1000) };
  }

  getDeviceId(): string | null {
    return this.deviceId;
  }

  private async getOrCreateDeviceId(): Promise<string> {
    // Use SecureStore (Keychain/Keystore) — device ID is a stable identity token
    const stored = await SecureStore.getItemAsync('compute_device_id').catch(() => null);
    if (stored) return stored;

    // Generate a cryptographically random UUID
    const id = Crypto.randomUUID();
    await SecureStore.setItemAsync('compute_device_id', id).catch(() => {});
    return id;
  }
}

export const mobileComputeService = new MobileComputeService();
