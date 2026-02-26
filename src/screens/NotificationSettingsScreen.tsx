/**
 * Notification Settings Screen
 * Allows users to configure push notification preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  notificationService,
  NotificationPreferences,
  defaultNotificationPreferences,
} from '../services/notifications';
import { useSettingsStore } from '../store';

interface SettingRowProps {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  title,
  description,
  value,
  onValueChange,
  disabled = false,
}) => (
  <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
    <View style={styles.settingTextContainer}>
      <Text style={[styles.settingTitle, disabled && styles.textDisabled]}>
        {title}
      </Text>
      {description && (
        <Text style={[styles.settingDescription, disabled && styles.textDisabled]}>
          {description}
        </Text>
      )}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: '#3e3e3e', true: '#4ade80' }}
      thumbColor={value ? '#22c55e' : '#f4f3f4'}
      ios_backgroundColor="#3e3e3e"
    />
  </View>
);

interface TimePickerRowProps {
  title: string;
  value: string;
  onPress: () => void;
  disabled?: boolean;
}

const TimePickerRow: React.FC<TimePickerRowProps> = ({
  title,
  value,
  onPress,
  disabled = false,
}) => (
  <TouchableOpacity
    style={[styles.settingRow, disabled && styles.settingRowDisabled]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[styles.settingTitle, disabled && styles.textDisabled]}>
      {title}
    </Text>
    <Text style={[styles.timeValue, disabled && styles.textDisabled]}>
      {value}
    </Text>
  </TouchableOpacity>
);

export const NotificationSettingsScreen: React.FC = () => {
  const { notificationsEnabled, setNotificationsEnabled } = useSettingsStore();
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    defaultNotificationPreferences
  );
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const permitted = await notificationService.checkPermissions();
    setHasPermission(permitted);
  };

  const requestPermissions = async () => {
    const granted = await notificationService.requestPermissions();
    setHasPermission(granted);
    if (granted) {
      await notificationService.initialize();
      updatePreference('enabled', true);
    } else {
      Alert.alert(
        'Permissions Required',
        'Please enable notifications in your device settings to receive alerts.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              // In production, open app settings
              // Linking.openSettings();
              console.log('Would open app settings');
            },
          },
        ]
      );
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));

    // Sync with settings store for enabled state
    if (key === 'enabled') {
      setNotificationsEnabled(value as boolean);
    }

    // In production, persist to AsyncStorage or backend
    console.log('Preference updated:', key, value);
  };

  const handleMasterToggle = (enabled: boolean) => {
    if (enabled && !hasPermission) {
      requestPermissions();
    } else {
      updatePreference('enabled', enabled);
    }
  };

  const showTimePicker = (field: 'quietHoursStart' | 'quietHoursEnd') => {
    // In production, show a time picker
    // For now, show an alert with options
    const times = [
      '06:00', '07:00', '08:00', '09:00', '10:00',
      '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
    ];

    Alert.alert(
      field === 'quietHoursStart' ? 'Quiet Hours Start' : 'Quiet Hours End',
      'Select a time',
      times.map((time) => ({
        text: time,
        onPress: () => updatePreference(field, time),
      }))
    );
  };

  const testNotification = async () => {
    await notificationService.showLocalNotification(
      'Test Notification',
      'This is a test notification from MyAi GPU Agent',
      'system',
      { test: true }
    );
  };

  const notificationsDisabled = !preferences.enabled || !hasPermission;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Permission Warning */}
        {!hasPermission && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              Notifications are disabled. Tap to enable.
            </Text>
            <TouchableOpacity
              style={styles.enableButton}
              onPress={requestPermissions}
            >
              <Text style={styles.enableButtonText}>Enable</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Master Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <SettingRow
            title="Push Notifications"
            description="Receive notifications about your GPU agents"
            value={preferences.enabled && hasPermission}
            onValueChange={handleMasterToggle}
          />
        </View>

        {/* Job Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Alerts</Text>
          <SettingRow
            title="Job Completed"
            description="Notify when a GPU job finishes successfully"
            value={preferences.jobCompleted}
            onValueChange={(v) => updatePreference('jobCompleted', v)}
            disabled={notificationsDisabled}
          />
          <SettingRow
            title="Job Failed"
            description="Notify when a GPU job fails or errors"
            value={preferences.jobFailed}
            onValueChange={(v) => updatePreference('jobFailed', v)}
            disabled={notificationsDisabled}
          />
        </View>

        {/* Agent Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agent Status</Text>
          <SettingRow
            title="Agent Status Changes"
            description="Notify when agents go online or offline"
            value={preferences.agentStatus}
            onValueChange={(v) => updatePreference('agentStatus', v)}
            disabled={notificationsDisabled}
          />
        </View>

        {/* Earnings Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings</Text>
          <SettingRow
            title="Earnings Updates"
            description="Notify about earnings milestones and rewards"
            value={preferences.earnings}
            onValueChange={(v) => updatePreference('earnings', v)}
            disabled={notificationsDisabled}
          />
          <SettingRow
            title="Daily Digest"
            description="Receive a daily summary of your GPU activity"
            value={preferences.dailyDigest}
            onValueChange={(v) => updatePreference('dailyDigest', v)}
            disabled={notificationsDisabled}
          />
        </View>

        {/* Price Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Alerts</Text>
          <SettingRow
            title="MYAI Price Alerts"
            description="Notify when MYAI reaches your target price"
            value={preferences.priceAlerts}
            onValueChange={(v) => updatePreference('priceAlerts', v)}
            disabled={notificationsDisabled}
          />
        </View>

        {/* Sound & Vibration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sound & Vibration</Text>
          <SettingRow
            title="Sound"
            description="Play a sound for notifications"
            value={preferences.sound}
            onValueChange={(v) => updatePreference('sound', v)}
            disabled={notificationsDisabled}
          />
          <SettingRow
            title="Vibration"
            description="Vibrate for notifications"
            value={preferences.vibration}
            onValueChange={(v) => updatePreference('vibration', v)}
            disabled={notificationsDisabled}
          />
        </View>

        {/* Quiet Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <SettingRow
            title="Enable Quiet Hours"
            description="Silence notifications during specific hours"
            value={preferences.quietHoursEnabled}
            onValueChange={(v) => updatePreference('quietHoursEnabled', v)}
            disabled={notificationsDisabled}
          />
          <TimePickerRow
            title="Start Time"
            value={preferences.quietHoursStart}
            onPress={() => showTimePicker('quietHoursStart')}
            disabled={notificationsDisabled || !preferences.quietHoursEnabled}
          />
          <TimePickerRow
            title="End Time"
            value={preferences.quietHoursEnd}
            onPress={() => showTimePicker('quietHoursEnd')}
            disabled={notificationsDisabled || !preferences.quietHoursEnabled}
          />
        </View>

        {/* Test Notification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Testing</Text>
          <TouchableOpacity
            style={[
              styles.testButton,
              notificationsDisabled && styles.testButtonDisabled,
            ]}
            onPress={testNotification}
            disabled={notificationsDisabled}
          >
            <Text
              style={[
                styles.testButtonText,
                notificationsDisabled && styles.textDisabled,
              ]}
            >
              Send Test Notification
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            {Platform.OS === 'android'
              ? 'You can further customize notification channels in your device settings.'
              : 'Notification preferences are synced with your device settings.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#7c2d12',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  warningText: {
    flex: 1,
    color: '#fed7aa',
    fontSize: 14,
  },
  enableButton: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  enableButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#9ca3af',
  },
  textDisabled: {
    color: '#6b7280',
  },
  timeValue: {
    fontSize: 16,
    color: '#4ade80',
    fontWeight: '500',
  },
  testButton: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4ade80',
  },
  testButtonDisabled: {
    borderColor: '#3e3e3e',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ade80',
  },
  infoSection: {
    padding: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default NotificationSettingsScreen;
