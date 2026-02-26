/**
 * MyAi Mobile App Type Definitions
 */

// GPU Agent Types
export interface GPUInfo {
  gpu_id: number;
  uuid: string;
  name: string;
  vendor: 'nvidia' | 'amd' | 'intel';
  vram_total_mb: number;
  vram_free_mb: number;
  vram_used_mb: number;
  temperature_c: number;
  power_usage_w: number;
  power_limit_w: number;
  utilization_gpu: number;
  utilization_memory: number;
  compute_capability?: string;
}

export interface AgentStatus {
  agent_id: string;
  agent_name: string;
  status: 'online' | 'offline' | 'busy' | 'error';
  last_seen: string;
  gpus: GPUInfo[];
  running_jobs: number;
  completed_jobs_24h: number;
  uptime_seconds: number;
  version: string;
}

export interface Agent {
  id: string;
  name: string;
  wallet_address: string;
  status: AgentStatus;
  created_at: string;
  price_per_hour_myai: number;
  max_concurrent_jobs: number;
}

// Job Types
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type JobType = 'inference' | 'training' | 'fine-tune' | 'benchmark';

export interface Job {
  job_id: string;
  job_type: JobType;
  status: JobStatus;
  docker_image: string;
  gpu_ids: number[];
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  exit_code?: number;
  reward_myai?: number;
  compute_hash?: string;
}

// Wallet & Earnings Types
export interface WalletInfo {
  address: string;
  balance_myai: number;
  pending_rewards: number;
  staked_myai: number;
  total_earned_myai: number;
}

export interface EarningsEntry {
  id: string;
  timestamp: string;
  amount_myai: number;
  job_id: string;
  job_type: JobType;
  gpu_seconds: number;
  tx_hash?: string;
  status: 'pending' | 'confirmed' | 'claimed';
}

export interface EarningsSummary {
  today_myai: number;
  week_myai: number;
  month_myai: number;
  all_time_myai: number;
  pending_myai: number;
  avg_daily_myai: number;
}

export interface EarningsChart {
  labels: string[];
  data: number[];
  period: 'day' | 'week' | 'month';
}

// Notification Types
export type NotificationType =
  | 'job_completed'
  | 'job_failed'
  | 'reward_received'
  | 'agent_offline'
  | 'agent_online'
  | 'earnings'
  | 'price_alert'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, unknown>;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// Settings Types
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
  notification_job_complete: boolean;
  notification_earnings: boolean;
  notification_agent_offline: boolean;
  currency_display: 'MYAI' | 'USD';
  refresh_interval_seconds: number;
}

// Navigation Types
export type RootStackParamList = {
  MainTabs: undefined;
  AgentDetails: { agentId: string };
  JobDetails: { jobId: string };
  Settings: undefined;
  WalletConnect: undefined;
  TransactionHistory: undefined;
  NotificationSettings: undefined;
};

export type MainTabsParamList = {
  Dashboard: undefined;
  Agents: undefined;
  Earnings: undefined;
  Wallet: undefined;
};
