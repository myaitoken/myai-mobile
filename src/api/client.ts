/**
 * MyAI API Client — wired to real coordinator + website endpoints
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const COORDINATOR_URL = 'https://api.myaitoken.io';
const WEBSITE_URL    = 'https://myaitoken.io';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  base?: 'coordinator' | 'website';
}

class ApiClient {
  private sessionToken: string | null = null;
  private userId: string | null = null;

  async initialize(): Promise<void> {
    try {
      const [token, userId] = await Promise.all([
        AsyncStorage.getItem('session_token'),
        AsyncStorage.getItem('user_id'),
      ]);
      this.sessionToken = token;
      this.userId = userId;
    } catch {}
  }

  async setSession(token: string, userId: string): Promise<void> {
    this.sessionToken = token;
    this.userId = userId;
    await Promise.all([
      AsyncStorage.setItem('session_token', token),
      AsyncStorage.setItem('user_id', userId),
    ]);
  }

  async clearSession(): Promise<void> {
    this.sessionToken = null;
    this.userId = null;
    await Promise.all([
      AsyncStorage.removeItem('session_token'),
      AsyncStorage.removeItem('user_id'),
    ]);
  }

  isAuthenticated(): boolean {
    return !!this.sessionToken;
  }

  getUserId(): string | null {
    return this.userId;
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {}, timeout = 15000, base = 'website' } = config;
    const baseUrl = base === 'coordinator' ? COORDINATOR_URL : WEBSITE_URL;
    const url = `${baseUrl}${endpoint}`;

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    };
    if (this.sessionToken) {
      reqHeaders['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, {
        method,
        headers: reqHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(tid);
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data?.error || data?.message || `HTTP ${res.status}` };
      }
      return { success: true, data: data as T };
    } catch (err) {
      clearTimeout(tid);
      if (err instanceof Error) {
        return { success: false, error: err.name === 'AbortError' ? 'Request timed out' : err.message };
      }
      return { success: false, error: 'Unknown error' };
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  private walletAddress: string | null = null;

  setWalletAddress(address: string): void {
    this.walletAddress = address;
  }

  getWalletAddress(): string | null {
    return this.walletAddress;
  }

  async getWalletInfo(): Promise<ApiResponse<WalletInfo>> {
    return this.request('/api/wallet');
  }

  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: UserProfile }>> {
    return this.request('/api/mobile/auth', {
      method: 'POST',
      body: { email, password },
    });
  }

  async register(email: string, password: string, name: string): Promise<ApiResponse<{ token: string; user: UserProfile }>> {
    return this.request('/api/mobile/auth/register', {
      method: 'POST',
      body: { email, password, name },
    });
  }

  async getMe(): Promise<ApiResponse<UserProfile>> {
    return this.request('/api/mobile/auth/me');
  }

  // ── Coordinator: Network ───────────────────────────────────────────────────

  async getNetworkHealth(): Promise<ApiResponse<{ status: string; version: string }>> {
    return this.request('/', { base: 'coordinator' });
  }

  async getOnlineAgents(): Promise<ApiResponse<{ count: number; agents: GpuAgent[] }>> {
    return this.request<{ data: { count: number; agents: GpuAgent[] } }>('/api/v1/agents/gpu/online', { base: 'coordinator' })
      .then(r => r.success && r.data ? { success: true, data: r.data.data } : r as any);
  }

  async getAllAgents(): Promise<ApiResponse<{ count: number; agents: GpuAgent[] }>> {
    return this.request<{ data: { count: number; agents: GpuAgent[] } }>('/api/v1/agents/gpu/all', { base: 'coordinator' })
      .then(r => r.success && r.data ? { success: true, data: r.data.data } : r as any);
  }

  async dispatchJob(agentId: string, prompt: string, model = 'llama3.2'): Promise<ApiResponse<DispatchResult>> {
    return this.request(`/api/v1/agents/${agentId}/dispatch`, {
      method: 'POST',
      body: { prompt, model },
      base: 'coordinator',
    });
  }

  async submitParallelJob(prompt: string, model = 'llama3.2', chunks = 2): Promise<ApiResponse<ParallelJobResult>> {
    return this.request('/api/v1/jobs/parallel', {
      method: 'POST',
      body: { prompt, model, num_chunks: chunks },
      base: 'coordinator',
    });
  }

  async getJobStatus(jobId: string): Promise<ApiResponse<ParallelJobResult>> {
    return this.request(`/api/v1/jobs/parallel/${jobId}`, { base: 'coordinator' });
  }

  // ── Website: Wallet ────────────────────────────────────────────────────────

  async getWallet(): Promise<ApiResponse<WalletInfo>> {
    return this.request('/api/wallet');
  }

  async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    return this.request<{ transactions: Transaction[] }>('/api/wallet/transactions')
      .then(r => r.success && r.data ? { success: true, data: r.data.transactions } : r as any);
  }

  async topUp(amount: number, currency: string): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request('/api/wallet/topup', {
      method: 'POST',
      body: { amount, currency },
    });
  }

  // ── Website: Jobs ─────────────────────────────────────────────────────────

  async getJobs(): Promise<ApiResponse<Job[]>> {
    return this.request<{ jobs: Job[] }>('/api/jobs')
      .then(r => r.success && r.data ? { success: true, data: r.data.jobs } : r as any);
  }

  async submitJob(task: string, model = 'llama3.2'): Promise<ApiResponse<Job>> {
    return this.request('/api/jobs', {
      method: 'POST',
      body: { task, model },
    });
  }

  // ── Website: Providers ────────────────────────────────────────────────────

  async getProviders(): Promise<ApiResponse<Provider[]>> {
    return this.request<{ providers: Provider[] }>('/api/providers')
      .then(r => r.success && r.data ? { success: true, data: r.data.providers } : r as any);
  }

  async registerProvider(data: RegisterProviderPayload): Promise<ApiResponse<Provider>> {
    return this.request('/api/providers/register', { method: 'POST', body: data as any });
  }

  // ── Website: Stats ────────────────────────────────────────────────────────

  async getNetworkStats(): Promise<ApiResponse<NetworkStats>> {
    return this.request('/api/stats');
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  myaiBalance: number;
  usdBalance: number;
  walletAddress: string | null;
  plan: string;
  createdAt: string;
}

export interface GpuAgent {
  id: string;
  name: string;
  platform: string;
  status: string;
  computed_status: string;
  jobs_completed: number;
  gpus: string;
  models: string;
  last_heartbeat: string;
}

export interface WalletInfo {
  myaiBalance: number;
  usdBalance: number;
  walletAddress: string | null;
}

export interface Transaction {
  id: string;
  type: string;
  currency: string;
  amount: number;
  usdEquiv: number;
  status: string;
  description: string;
  createdAt: string;
}

export interface Job {
  id: string;
  task: string;
  model: string;
  status: string;
  result: string | null;
  duration: number | null;
  myaiCost: number;
  createdAt: string;
}

export interface Provider {
  id: string;
  name: string;
  gpuModel: string;
  gpuVram: number;
  models: string;
  pricePerJob: number;
  status: string;
  reputationScore: number;
  jobsCompleted: number;
  myaiEarned: number;
}

export interface RegisterProviderPayload {
  name: string;
  apiEndpoint: string;
  gpuModel: string;
  gpuVram: number;
  models: string;
  walletAddress?: string;
}

export interface DispatchResult {
  job_id: string;
  chunk_id: string;
  status: string;
}

export interface ParallelJobResult {
  job_id: string;
  status: string;
  result: string | null;
  chunks_total: number;
  chunks_completed: number;
  created_at: string;
}

export interface NetworkStats {
  totalProviders?: number;
  onlineProviders?: number;
  totalJobs?: number;
  totalMyaiPaid?: number;
}

// Singleton
export const apiClient = new ApiClient();
export default ApiClient;
