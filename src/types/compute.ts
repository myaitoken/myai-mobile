export type ThermalState = 'nominal' | 'fair' | 'serious' | 'critical';
export type ComputeTier = 'mobile_base' | 'mobile_pro';
export type DeviceStatus = 'available' | 'busy' | 'charging_only' | 'offline';
export type NetworkType = 'wifi' | 'cellular' | 'offline';

export interface DeviceCapabilities {
  chip: string;
  ram_gb: number;
  neural_engine_tops: number;
  storage_gb: number;
  supported_models: string[];
}

export interface DeviceConditions {
  battery_level: number;
  is_plugged_in: boolean;
  thermal_state: ThermalState;
  available_memory_mb: number;
  available_storage_mb: number;
  network_type: NetworkType;
  is_low_power_mode: boolean;
}

export interface ComputeMetrics {
  jobs_completed: number;
  total_tokens_generated: number;
  average_tokens_per_second: number;
  uptime_seconds: number;
  myai_earned: number;
}

export interface PendingJob {
  job_id: string;
  job_type: string;
  model_id: string;
  prompt: string;
  priority: number;
}

export interface HeartbeatPayload {
  device_id: string;
  status: DeviceStatus;
  conditions: DeviceConditions;
  current_job_id: string | null;
  metrics: ComputeMetrics;
}

export interface HeartbeatResult {
  acknowledged: boolean;
  server_time: string;
  pending_jobs: PendingJob[];
}

export interface RegisterPayload {
  device_id: string;
  device_name: string;
  device_model: string;
  os_version: string;
  app_version: string;
  push_token?: string;
  capabilities: DeviceCapabilities;
}

export interface RegisterResult {
  node_id: string;
  registered_at: string;
  compute_tier: ComputeTier;
  estimated_earnings_per_hour: number;
}

export interface AvailableModel {
  id: string;
  name: string;
  description: string;
  sizeMb: number;
  tier: ComputeTier;
  chip_min: string;
}
