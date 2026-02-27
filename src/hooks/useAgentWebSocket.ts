/**
 * WebSocket Hook for Real-time Agent Monitoring
 * Connects to the coordinator for live updates on agent status and jobs
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAgentsStore, useEarningsStore, useNotificationsStore } from '../store';
import { notificationService } from '../services/notifications';
import { Agent, Job } from '../types';

// WebSocket message types
interface WSMessage {
  type: string;
  payload: unknown;
  timestamp: number;
}

interface AgentStatusUpdate {
  agent_id: string;
  status: 'online' | 'offline' | 'busy' | 'error';
  gpu_utilization?: number;
  memory_usage?: number;
  temperature?: number;
}

interface JobUpdate {
  job_id: string;
  agent_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress?: number;
  result?: {
    exit_code: number;
    compute_hash?: string;
    earned_myai?: number;
  };
  error?: string;
}

interface EarningsUpdate {
  agent_id: string;
  earned_myai: number;
  total_earned: number;
  pending_rewards: number;
}

interface UseAgentWebSocketOptions {
  coordinatorUrl: string;
  walletAddress: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

interface UseAgentWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  lastMessage: WSMessage | null;
}

export function useAgentWebSocket(
  options: UseAgentWebSocketOptions
): UseAgentWebSocketReturn {
  const {
    coordinatorUrl,
    walletAddress,
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);

  // Store hooks
  const { updateAgent, agents } = useAgentsStore();
  const { addEarning } = useEarningsStore();
  const { addNotification } = useNotificationsStore();

  // Get agent name helper
  const getAgentName = useCallback(
    (agentId: string): string => {
      const agent = agents.find((a) => a.id === agentId);
      return agent?.name || `Agent ${agentId.slice(0, 8)}`;
    },
    [agents]
  );

  // Handle incoming messages
  const handleMessage = useCallback(
    async (message: WSMessage) => {
      setLastMessage(message);

      switch (message.type) {
        case 'agent_status': {
          const update = message.payload as AgentStatusUpdate;
          const agentName = getAgentName(update.agent_id);

          // Update store
          updateAgent(update.agent_id, {
            status: update.status,
            gpuUtilization: update.gpu_utilization,
            memoryUsage: update.memory_usage,
            temperature: update.temperature,
          });

          // Send notifications for status changes
          if (update.status === 'offline') {
            await notificationService.notifyAgentOffline(update.agent_id, agentName);
            addNotification({
              id: `agent-offline-${update.agent_id}-${Date.now()}`,
              type: 'agent_offline',
              title: 'Agent Offline',
              message: `${agentName} has gone offline`,
              timestamp: new Date().toISOString(),
              read: false,
              data: { agentId: update.agent_id },
            });
          } else if (update.status === 'online') {
            await notificationService.notifyAgentOnline(update.agent_id, agentName);
            addNotification({
              id: `agent-online-${update.agent_id}-${Date.now()}`,
              type: 'agent_online',
              title: 'Agent Online',
              message: `${agentName} is now online`,
              timestamp: new Date().toISOString(),
              read: false,
              data: { agentId: update.agent_id },
            });
          }
          break;
        }

        case 'job_update': {
          const update = message.payload as JobUpdate;
          const agentName = getAgentName(update.agent_id);

          if (update.status === 'completed' && update.result) {
            const earned = update.result.earned_myai || 0;

            // Notify job completion
            await notificationService.notifyJobCompleted(
              update.job_id,
              agentName,
              earned
            );

            addNotification({
              id: `job-completed-${update.job_id}`,
              type: 'job_completed',
              title: 'Job Completed',
              message: `${agentName} earned ${earned.toFixed(4)} MYAI`,
              timestamp: new Date().toISOString(),
              read: false,
              data: {
                jobId: update.job_id,
                agentId: update.agent_id,
                earnedMyai: earned,
              },
            });
          } else if (update.status === 'failed') {
            await notificationService.notifyJobFailed(
              update.job_id,
              agentName,
              update.error || 'Unknown error'
            );

            addNotification({
              id: `job-failed-${update.job_id}`,
              type: 'job_failed',
              title: 'Job Failed',
              message: `${agentName}: ${update.error || 'Unknown error'}`,
              timestamp: new Date().toISOString(),
              read: false,
              data: {
                jobId: update.job_id,
                agentId: update.agent_id,
                error: update.error,
              },
            });
          }
          break;
        }

        case 'earnings_update': {
          const update = message.payload as EarningsUpdate;

          // Add to earnings history
          addEarning({
            date: new Date().toISOString().split('T')[0],
            earned_myai: update.earned_myai,
            jobs_completed: 1,
            compute_hours: 0, // Will be updated by periodic sync
          });

          // Check for rewards available
          if (update.pending_rewards > 0.01) {
            await notificationService.notifyRewardsAvailable(update.pending_rewards);
          }
          break;
        }

        case 'price_alert': {
          const { current_price, target_price, direction } = message.payload as {
            current_price: number;
            target_price: number;
            direction: 'above' | 'below';
          };

          await notificationService.notifyPriceAlert(
            current_price,
            target_price,
            direction
          );

          addNotification({
            id: `price-alert-${Date.now()}`,
            type: 'price_alert',
            title: 'Price Alert',
            message: `MYAI is ${direction} $${target_price.toFixed(4)}`,
            timestamp: new Date().toISOString(),
            read: false,
            data: { currentPrice: current_price, targetPrice: target_price, direction },
          });
          break;
        }

        case 'ping':
          // Respond to keepalive ping
          wsRef.current?.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    },
    [getAgentName, updateAgent, addEarning, addNotification]
  );

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const wsUrl = `${coordinatorUrl}/ws/agent?wallet=${walletAddress}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Send authentication
        ws.send(
          JSON.stringify({
            type: 'auth',
            wallet_address: walletAddress,
            token: apiClient.getSessionToken(),
            timestamp: Date.now(),
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;

        // Attempt reconnect if not intentional close
        if (event.code !== 1000 && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current - 1);

          console.log(
            `Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${reconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= reconnectAttempts) {
          setError('Connection failed after multiple attempts');
        }
      };

      wsRef.current = ws;
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      setIsConnecting(false);
      setError('Failed to connect');
    }
  }, [coordinatorUrl, walletAddress, reconnectAttempts, reconnectInterval, handleMessage]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && !isConnected && walletAddress) {
        // Reconnect when app comes to foreground
        reconnectAttemptsRef.current = 0;
        connect();
      } else if (nextAppState === 'background') {
        // Optionally disconnect when app goes to background
        // For this app, we keep connection alive for notifications
        // disconnect();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isConnected, walletAddress, connect]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && walletAddress) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, walletAddress, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    lastMessage,
  };
}

// Export message type for external use
export type { WSMessage, AgentStatusUpdate, JobUpdate, EarningsUpdate };
