import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../auth/AuthContext';

export function ProfileScreen() {
  const { profile, loading, error, fetchProfile, logout } = useAuth();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.secondary} onPress={logout}>
          <Text style={styles.secondaryText}>Log out</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.primary} onPress={fetchProfile} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{profile ? 'Refresh' : 'Load profile'}</Text>}
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {profile ? (
        <View style={styles.profileBox}>
          <Text style={styles.field}><Text style={styles.label}>ID: </Text>{profile.id}</Text>
          <Text style={styles.field}><Text style={styles.label}>Email: </Text>{profile.email}</Text>
          <Text style={styles.field}><Text style={styles.label}>Username: </Text>{profile.username}</Text>
        </View>
      ) : (
        <Text style={styles.muted}>No profile loaded yet.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#e5e7eb' },
  primary: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondary: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  secondaryText: { color: '#e5e7eb' },
  profileBox: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  label: { color: '#9ca3af' },
  field: { color: '#e5e7eb', fontSize: 15, marginBottom: 6 },
  muted: { color: '#9ca3af' },
  error: {
    color: '#fecdd3',
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.4)',
    borderRadius: 10,
    padding: 10,
  },
});
