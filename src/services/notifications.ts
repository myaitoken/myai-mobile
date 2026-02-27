/**
 * Push Notification Service for MyAi GPU Agent Mobile App
 * Handles registration, permissions, and notification display
 */

import { Platform } from 'react-native';

// Types for notification handling
export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  category?: NotificationCategory;
  timestamp: number;
}

export type NotificationCategory =
  | 'job_completed'
  | 'job_failed'
  | 'agent_offline'
  | 'agent_online'
  | 'earnings'
  | 'rewards_available'
  | 'price_alert'
  | 'system';

export interface NotificationPreferences {
  enabled: boolean;
  jobCompleted: boolean;
  jobFailed: boolean;
  agentStatus: boolean;
  earnings: boolean;
  priceAlerts: boolean;
  dailyDigest: boolean;
  sound: boolean;
  vibration: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string;   // HH:mm format
}

export const defaultNotificationPreferences: NotificationPreferences = {
  enabled: true,
  jobCompleted: true,
  jobFailed: true,
  agentStatus: true,
  earnings: true,
  priceAlerts: false,
  dailyDigest: true,
  sound: true,
  vibration: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

// Notification channel IDs for Android
export const NotificationChannels = {
  JOBS: 'myai-jobs',
  AGENTS: 'myai-agents',
  EARNINGS: 'myai-earnings',
  ALERTS: 'myai-alerts',
  SYSTEM: 'myai-system',
} as const;

// Badge count management
let currentBadgeCount = 0;

class NotificationService {
  private pushToken: string | null = null;
  private isInitialized = false;
  private onNotificationReceived: ((notification: NotificationPayload) => void) | null = null;
  private onNotificationOpened: ((notification: NotificationPayload) => void) | null = null;

  /**
   * Initialize the notification service
   * This should be called early in app startup
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permissions not granted');
        return false;
      }

      // Setup notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Get push token
      this.pushToken = await this.getPushToken();

      // Setup notification handlers
      this.setupNotificationHandlers();

      this.isInitialized = true;
      console.log('Notification service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return false;
    }
  }

  /**
   * Request notification permissions from the user
   */
  async requestPermissions(): Promise<boolean> {
    // In a real implementation, this would use:
    // - react-native-permissions
    // - @react-native-firebase/messaging
    // - expo-notifications

    // Placeholder implementation
    console.log('Requesting notification permissions...');

    // Simulate permission request
    // In production, use actual permission APIs
    return new Promise((resolve) => {
      // Simulated async permission check
      setTimeout(() => {
        resolve(true);
      }, 100);
    });
  }

  /**
   * Check if notifications are currently permitted
   */
  async checkPermissions(): Promise<boolean> {
    // In production, check actual permission status
    return true;
  }

  /**
   * Get the device push token for remote notifications
   */
  async getPushToken(): Promise<string | null> {
    // In a real implementation, this would use:
    // - Firebase Cloud Messaging (FCM) for Android
    // - Apple Push Notification service (APNs) for iOS

    // Placeholder - returns a mock token
    const mockToken = `mock-push-token-${Platform.OS}-${Date.now()}`;
    console.log('Push token obtained:', mockToken);
    return mockToken;
  }

  /**
   * Register the push token with the backend
   */
  async registerTokenWithBackend(walletAddress: string): Promise<boolean> {
    if (!this.pushToken) {
      console.error('No push token available');
      return false;
    }

    try {
      // In production, send token to your backend
      // await apiClient.registerPushToken({
      //   token: this.pushToken,
      //   platform: Platform.OS,
      //   walletAddress,
      // });

      if (__DEV__) console.log('[Notifications] Push token registered with backend');
      return true;
    } catch (error) {
      console.error('Failed to register push token:', error);
      return false;
    }
  }

  /**
   * Setup Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    // In production, use @notifee/react-native or similar
    // to create notification channels

    const channels = [
      {
        id: NotificationChannels.JOBS,
        name: 'Job Notifications',
        description: 'Notifications about GPU job completions and failures',
        importance: 4, // HIGH
        sound: 'default',
      },
      {
        id: NotificationChannels.AGENTS,
        name: 'Agent Status',
        description: 'Notifications about GPU agent online/offline status',
        importance: 3, // DEFAULT
        sound: 'default',
      },
      {
        id: NotificationChannels.EARNINGS,
        name: 'Earnings',
        description: 'Notifications about earnings and rewards',
        importance: 3, // DEFAULT
        sound: 'default',
      },
      {
        id: NotificationChannels.ALERTS,
        name: 'Price Alerts',
        description: 'MYAI token price alerts',
        importance: 4, // HIGH
        sound: 'alert',
      },
      {
        id: NotificationChannels.SYSTEM,
        name: 'System',
        description: 'System notifications and updates',
        importance: 2, // LOW
        sound: 'default',
      },
    ];

    for (const channel of channels) {
      console.log('Created Android notification channel:', channel.id);
    }
  }

  /**
   * Setup handlers for incoming notifications
   */
  private setupNotificationHandlers(): void {
    // In production, this would setup listeners for:
    // - Foreground notifications
    // - Background notifications
    // - Notification tap/open events

    console.log('Notification handlers configured');
  }

  /**
   * Set callback for when a notification is received while app is in foreground
   */
  setOnNotificationReceived(callback: (notification: NotificationPayload) => void): void {
    this.onNotificationReceived = callback;
  }

  /**
   * Set callback for when a notification is opened/tapped
   */
  setOnNotificationOpened(callback: (notification: NotificationPayload) => void): void {
    this.onNotificationOpened = callback;
  }

  /**
   * Display a local notification
   */
  async showLocalNotification(
    title: string,
    body: string,
    category: NotificationCategory,
    data?: Record<string, unknown>
  ): Promise<void> {
    const notification: NotificationPayload = {
      id: `local-${Date.now()}`,
      title,
      body,
      category,
      data,
      timestamp: Date.now(),
    };

    // Check if we're in quiet hours
    if (await this.isInQuietHours()) {
      console.log('Notification suppressed due to quiet hours');
      return;
    }

    // Get the appropriate channel for Android
    const channelId = this.getChannelForCategory(category);

    // In production, use notifee or similar to display notification
    console.log('Displaying local notification:', {
      ...notification,
      channelId,
    });

    // Increment badge count
    this.incrementBadge();

    // Call the foreground handler if set
    if (this.onNotificationReceived) {
      this.onNotificationReceived(notification);
    }
  }

  /**
   * Show notification for job completion
   */
  async notifyJobCompleted(
    jobId: string,
    agentName: string,
    earnedMyai: number
  ): Promise<void> {
    await this.showLocalNotification(
      'Job Completed',
      `${agentName} completed job. Earned ${earnedMyai.toFixed(4)} MYAI`,
      'job_completed',
      { jobId, agentName, earnedMyai }
    );
  }

  /**
   * Show notification for job failure
   */
  async notifyJobFailed(
    jobId: string,
    agentName: string,
    reason: string
  ): Promise<void> {
    await this.showLocalNotification(
      'Job Failed',
      `${agentName}: ${reason}`,
      'job_failed',
      { jobId, agentName, reason }
    );
  }

  /**
   * Show notification for agent going offline
   */
  async notifyAgentOffline(agentId: string, agentName: string): Promise<void> {
    await this.showLocalNotification(
      'Agent Offline',
      `${agentName} has gone offline`,
      'agent_offline',
      { agentId, agentName }
    );
  }

  /**
   * Show notification for agent coming online
   */
  async notifyAgentOnline(agentId: string, agentName: string): Promise<void> {
    await this.showLocalNotification(
      'Agent Online',
      `${agentName} is now online and ready for jobs`,
      'agent_online',
      { agentId, agentName }
    );
  }

  /**
   * Show notification for earnings milestone
   */
  async notifyEarningsMilestone(
    totalEarned: number,
    milestone: string
  ): Promise<void> {
    await this.showLocalNotification(
      'Earnings Milestone! 🎉',
      `You've earned ${totalEarned.toFixed(2)} MYAI - ${milestone}`,
      'earnings',
      { totalEarned, milestone }
    );
  }

  /**
   * Show notification for claimable rewards
   */
  async notifyRewardsAvailable(amount: number): Promise<void> {
    await this.showLocalNotification(
      'Rewards Available',
      `You have ${amount.toFixed(4)} MYAI ready to claim`,
      'rewards_available',
      { amount }
    );
  }

  /**
   * Show notification for price alert
   */
  async notifyPriceAlert(
    currentPrice: number,
    targetPrice: number,
    direction: 'above' | 'below'
  ): Promise<void> {
    await this.showLocalNotification(
      'Price Alert',
      `MYAI is now ${direction} $${targetPrice.toFixed(4)} (Current: $${currentPrice.toFixed(4)})`,
      'price_alert',
      { currentPrice, targetPrice, direction }
    );
  }

  /**
   * Show daily digest notification
   */
  async notifyDailyDigest(
    jobsCompleted: number,
    earnedToday: number,
    activeAgents: number
  ): Promise<void> {
    await this.showLocalNotification(
      'Daily Summary',
      `${jobsCompleted} jobs completed, ${earnedToday.toFixed(4)} MYAI earned, ${activeAgents} agents active`,
      'system',
      { jobsCompleted, earnedToday, activeAgents }
    );
  }

  /**
   * Get the appropriate notification channel for a category
   */
  private getChannelForCategory(category: NotificationCategory): string {
    switch (category) {
      case 'job_completed':
      case 'job_failed':
        return NotificationChannels.JOBS;
      case 'agent_offline':
      case 'agent_online':
        return NotificationChannels.AGENTS;
      case 'earnings':
      case 'rewards_available':
        return NotificationChannels.EARNINGS;
      case 'price_alert':
        return NotificationChannels.ALERTS;
      default:
        return NotificationChannels.SYSTEM;
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private async isInQuietHours(): Promise<boolean> {
    // In production, read from user preferences store
    // For now, return false (quiet hours disabled)
    return false;
  }

  /**
   * Increment the app badge count
   */
  incrementBadge(): void {
    currentBadgeCount++;
    this.updateBadge(currentBadgeCount);
  }

  /**
   * Update the app badge count
   */
  updateBadge(count: number): void {
    currentBadgeCount = count;
    // In production, use react-native-push-notification or similar
    console.log('Badge count updated:', count);
  }

  /**
   * Clear the app badge
   */
  clearBadge(): void {
    currentBadgeCount = 0;
    this.updateBadge(0);
  }

  /**
   * Get current badge count
   */
  getBadgeCount(): number {
    return currentBadgeCount;
  }

  /**
   * Cancel a specific notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    // In production, use notification library to cancel
    console.log('Cancelled notification:', notificationId);
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    // In production, use notification library to cancel all
    console.log('Cancelled all notifications');
    this.clearBadge();
  }

  /**
   * Schedule a notification for future delivery
   */
  async scheduleNotification(
    title: string,
    body: string,
    category: NotificationCategory,
    triggerTime: Date,
    data?: Record<string, unknown>
  ): Promise<string> {
    const notificationId = `scheduled-${Date.now()}`;

    // In production, use notification library to schedule
    console.log('Scheduled notification:', {
      id: notificationId,
      title,
      body,
      category,
      triggerTime: triggerTime.toISOString(),
      data,
    });

    return notificationId;
  }

  /**
   * Unregister from push notifications
   */
  async unregister(): Promise<void> {
    this.pushToken = null;
    this.isInitialized = false;
    await this.cancelAllNotifications();
    console.log('Unregistered from push notifications');
  }

  /**
   * Get the current push token
   */
  getToken(): string | null {
    return this.pushToken;
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export hook for React components
export function useNotificationService() {
  return notificationService;
}
