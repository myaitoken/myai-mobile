import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../api/client';

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080808' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { alignItems: 'center', marginBottom: 48 },
  logoText: { fontSize: 32, fontWeight: '900', color: '#f0eee9', letterSpacing: -1 },
  logoAccent: { color: '#7000ff' },
  subtitle: { color: 'rgba(240,238,233,0.45)', fontSize: 14, marginTop: 6 },
  card: { backgroundColor: '#111', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: 28 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: '#666', marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 4, color: '#f0eee9', padding: 14, fontSize: 15, marginBottom: 20 },
  btn: { backgroundColor: '#7000ff', borderRadius: 4, padding: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 6 },
  switchText: { color: 'rgba(240,238,233,0.4)', fontSize: 13 },
  switchLink: { color: '#7000ff', fontSize: 13, fontWeight: '600' },
  error: { color: '#ff4444', fontSize: 13, marginBottom: 16, textAlign: 'center' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 24 },
  tagline: { textAlign: 'center', color: 'rgba(240,238,233,0.25)', fontSize: 11, marginTop: 32, letterSpacing: 1 },
});

interface Props { onLogin: () => void }

export function LoginScreen({ onLogin }: Props) {
  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function submit() {
    if (!email.trim() || !password.trim()) { setError('Email and password are required'); return; }
    if (mode === 'register' && !name.trim()) { setError('Name is required'); return; }
    setLoading(true); setError('');

    const res = mode === 'login'
      ? await apiClient.login(email.trim().toLowerCase(), password)
      : await apiClient.register(email.trim().toLowerCase(), password, name.trim());

    if (!res.success || !res.data) {
      setError(res.error || 'Something went wrong');
      setLoading(false);
      return;
    }

    await apiClient.setSession(res.data.token, res.data.user.id);
    onLogin();
  }

  return (
    <KeyboardAvoidingView style={S.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled">
        <View style={S.logo}>
          <MaterialCommunityIcons name="lightning-bolt" size={40} color="#7000ff" />
          <Text style={S.logoText}>MY<Text style={S.logoAccent}>AI</Text></Text>
          <Text style={S.subtitle}>Decentralized GPU Compute</Text>
        </View>

        <View style={S.card}>
          <Text style={[S.label, { marginBottom: 24, fontSize: 14, color: '#f0eee9', letterSpacing: -0.3, textTransform: 'none', fontWeight: '700' }]}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </Text>

          {error ? <Text style={S.error}>{error}</Text> : null}

          {mode === 'register' && (
            <>
              <Text style={S.label}>Name</Text>
              <TextInput
                style={S.input} placeholder="Your name" placeholderTextColor="#444"
                value={name} onChangeText={setName} autoCapitalize="words"
              />
            </>
          )}

          <Text style={S.label}>Email</Text>
          <TextInput
            style={S.input} placeholder="you@example.com" placeholderTextColor="#444"
            value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none" autoComplete="email"
          />

          <Text style={S.label}>Password</Text>
          <TextInput
            style={S.input} placeholder="••••••••" placeholderTextColor="#444"
            value={password} onChangeText={setPassword}
            secureTextEntry autoCapitalize="none"
          />

          <TouchableOpacity style={[S.btn, loading && S.btnDisabled]} onPress={submit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={S.btnText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>}
          </TouchableOpacity>
        </View>

        <View style={S.switchRow}>
          <Text style={S.switchText}>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </Text>
          <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            <Text style={S.switchLink}>{mode === 'login' ? 'Sign up' : 'Sign in'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={S.tagline}>MYAITOKEN.IO · BASE NETWORK</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
