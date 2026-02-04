import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { BASE_URL, setStaffId } from '../config/env';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin_vehicles/driver_app_login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: username, password })
      });
      const data = await res.json();
      if (data && data.success && data.staff_id) {
        // persist staff id in runtime env wrapper for use elsewhere
        try { setStaffId(data.staff_id); } catch (e) { /* ignore */ }
        // persist staff id across reloads (used by websocket filtering, etc.)
        try { await AsyncStorage.setItem('STAFF_ID', String(data.staff_id)); } catch (e) { /* ignore */ }
        // Create minimal user object with only id
        await login({
          id: data.staff_id,
          name: '',
          phone: '',
          email: '',
          address: '',
          dateOfBirth: '',
          joiningDate: '',
          experience: '',
          role: '',
          stats: {
            tasksCompleted: 0,
            hoursLogged: 0,
            rating: 0,
            safetyScore: 0,
          },
        });
        // navigation to HomeScreen is handled by RootNavigator on isAuthenticated
      } else {
        Alert.alert('Error', 'Invalid credentials.');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F8F5" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        
        {/* HEADER SECTION */}
        <View style={styles.headerContainer}>
          {/* Green Icon Circle */}
          <View style={styles.logoCircle}>
             {/* Using a text character as a placeholder for the icon. 
                 Replace with <Icon name="user" /> from your icon library */}
             <Text style={styles.logoIcon}>👤</Text>
          </View>
          
          <Text style={styles.appTitle}>FARM DRIVER APP</Text>
          <Text style={styles.appSubtitle}>FLEET MANAGEMENT SYSTEM</Text>
        </View>

        {/* FORM SECTION */}
        <View style={styles.formContainer}>
          
          {/* Username Input */}
          <Text style={styles.label}>USERNAME</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter username"
              placeholderTextColor="#A0A0A0"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor="#A0A0A0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Sign In Button */}
          <TouchableOpacity 
            style={[styles.loginButton, loading && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={loading ? undefined : handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
            ) : null}
            <Text style={styles.loginButtonText}>{loading ? 'LOGGING IN...' : 'LOGIN'}</Text>
            {!loading && <Text style={styles.loginButtonArrow}>→</Text>}
          </TouchableOpacity>
        </View>

        {/* FOOTER SECTION */}
        <View style={styles.footerContainer}>
          {/* Demo Credentials Box */}
          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>DEMO CREDENTIALS</Text>
            <View style={styles.demoRow}>
              <Text style={styles.demoLabel}>Username: </Text>
              <Text style={styles.demoValue}>driver</Text>
            </View>
            <View style={styles.demoRow}>
              <Text style={styles.demoLabel}>Password: </Text>
              <Text style={styles.demoValue}>farm2024</Text>
            </View>
          </View>

          <Text style={styles.copyright}>© 2026 Farm Company. All rights reserved.</Text>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8F5', // Light minty background
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  
  // Header Styles
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    backgroundColor: '#00C853', // Bright Green
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  logoIcon: {
    fontSize: 40,
    color: '#fff',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0D1F2D',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#546E7A',
    letterSpacing: 1,
    fontWeight: '500',
  },

  // Form Styles
  formContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#546E7A',
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 15,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
    opacity: 0.5,
  },
  input: {
    flex: 1,
    color: '#333',
    fontSize: 16,
    height: '100%',
  },
  loginButton: {
    backgroundColor: '#00C853', // Primary Green
    height: 55,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    elevation: 3,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  loginButtonArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    marginTop: -2, // Visual alignment
  },

  // Footer Styles
  footerContainer: {
    alignItems: 'center',
  },
  demoBox: {
    width: '100%',
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 30,
  },
  demoTitle: {
    fontSize: 12,
    color: '#78909C',
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  demoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  demoLabel: {
    color: '#455A64',
    fontSize: 14,
  },
  demoValue: {
    color: '#00C853', // Green text for credentials
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', // Monospaced for code-like look
  },
  copyright: {
    fontSize: 12,
    color: '#90A4AE',
  },
});

export default LoginScreen;