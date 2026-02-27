import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { EarningsScreen } from '../screens/EarningsScreen';
import { AgentsScreen } from '../screens/AgentsScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AgentDetailsScreen } from '../screens/AgentDetailsScreen';
import { JobsScreen } from '../screens/JobsScreen';
import { WalletConnectScreen } from '../screens/WalletConnectScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { ComputeScreen } from '../screens/ComputeScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_BG     = '#0d0d0d';
const TAB_BORDER = 'rgba(255,255,255,0.07)';
const ACCENT     = '#7000ff';
const INACTIVE   = '#444';

const HEADER_OPTS = {
  headerStyle: { backgroundColor: '#0d0d0d' },
  headerTintColor: '#f0eee9',
  headerTitleStyle: { fontWeight: '700' as const },
  headerShadowVisible: false,
};

function MainTabs({ onLogout }: { onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: TAB_BG,
          borderTopColor: TAB_BORDER,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard-outline" color={color} size={size} /> }} />
      <Tab.Screen name="Earnings" component={EarningsScreen}
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="lightning-bolt" color={color} size={size} /> }} />
      <Tab.Screen name="Jobs" component={JobsScreen}
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cpu-64-bit" color={color} size={size} /> }} />
      <Tab.Screen name="Compute" component={ComputeScreen}
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="chip" color={color} size={size} /> }} />
      <Tab.Screen name="Agents" component={AgentsScreen}
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="server-network" color={color} size={size} /> }} />
      <Tab.Screen name="Wallet" component={WalletScreen}
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="wallet-outline" color={color} size={size} /> }} />
      <Tab.Screen name="Settings" options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cog-outline" color={color} size={size} /> }}>
        {() => <SettingsScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export function AppNavigator({ isAuthed, onAuthChange }: { isAuthed: boolean; onAuthChange: (v: boolean) => void }) {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: { background: '#080808', card: '#0d0d0d', text: '#f0eee9', border: TAB_BORDER, notification: ACCENT, primary: ACCENT },
        fonts: { regular: { fontFamily: 'System', fontWeight: '400' }, medium: { fontFamily: 'System', fontWeight: '500' }, bold: { fontFamily: 'System', fontWeight: '700' }, heavy: { fontFamily: 'System', fontWeight: '900' } },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthed ? (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLogin={() => onAuthChange(true)} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Main">
              {() => <MainTabs onLogout={() => onAuthChange(false)} />}
            </Stack.Screen>
            <Stack.Screen name="AgentDetails" component={AgentDetailsScreen}
              options={{ headerShown: true, headerTitle: 'Agent Details', ...HEADER_OPTS }} />
            <Stack.Screen name="WalletConnect" component={WalletConnectScreen}
              options={{ headerShown: true, headerTitle: 'Connect Wallet', ...HEADER_OPTS }} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen}
              options={{ headerShown: true, headerTitle: 'Notifications', ...HEADER_OPTS }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
