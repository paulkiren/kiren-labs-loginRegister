import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { LoginScreen } from './src/components/LoginScreen';
import { ProfileScreen } from './src/components/ProfileScreen';

function AppContent() {
  const { token } = useAuth();
  const isLoggedIn = Boolean(token);

  return (
    <View style={styles.body}>
      {isLoggedIn ? <ProfileScreen /> : <LoginScreen />}
    </View>
  );
}

function App() {
  return (
    <AuthProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0b1021" />
        <AppContent />
      </SafeAreaView>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b1021',
  },
  body: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0b1021',
  },
});

export default App;
