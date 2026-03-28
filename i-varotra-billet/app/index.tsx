import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Text, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Vibration, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserByPin } from '../database/database';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Login() {
  const [pin, setPin] = useState('');
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handlePinChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setPin(cleaned);

    if (cleaned.length === 4) {
      processLogin(cleaned);
    }
  };

  const processLogin = (code: string) => {
    getUserByPin(code, async (role) => {
      if (role) {
        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        await AsyncStorage.setItem('userRole', role);
        router.replace('/(tabs)/home');
      } else {
        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Vibration.vibrate(400);
        }
        Alert.alert('Accès refusé', 'Le code PIN est incorrect.', [
          { text: 'Réessayer', onPress: () => {
            setPin('');
            inputRef.current?.focus();
          }}
        ]);
        setPin('');
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="always"
        >
          <View style={styles.content}>
            {/* Logo Section */}
            <View style={styles.logoBox}>
              <Image 
                source={require('../assets/logo_iBillet.png')} 
                style={styles.logo}
                contentFit="contain"
              />
            </View>
            
            <Text style={styles.title}>iBillet</Text>
            <Text style={styles.subtitle}>Gestion de billetterie intelligente</Text>

            <View style={styles.form}>
              <Text style={styles.label}>ENTREZ VOTRE PIN DE SÉCURITÉ</Text>
              
              <TextInput
                ref={inputRef}
                value={pin}
                onChangeText={handlePinChange}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                autoFocus={true}
                showSoftInputOnFocus={true}
                style={styles.hiddenInput}
                onBlur={() => inputRef.current?.focus()}
              />
              
              <View style={styles.pinIndicatorContainer}>
                {[...Array(4)].map((_, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.pinDot, 
                      pin.length > i ? styles.pinDotFilled : styles.pinDotEmpty
                    ]} 
                  >
                    {pin.length > i && (
                      <MaterialCommunityIcons name="shield-check" size={16} color="#000" />
                    )}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>© 2026 iBillet</Text>
              <Text style={[styles.footerSubtext, { color: '#94A3B8', marginTop: 5, fontWeight: '600' }]}>033 76 913 14</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 40,
    alignItems: 'center',
  },
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 60,
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    width: '100%',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 30,
    letterSpacing: 2,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: 60,
  },
  pinIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 25,
    width: '100%',
  },
  pinDot: {
    width: 50,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1E293B',
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDotFilled: {
    backgroundColor: '#A5B4FC',
    borderColor: '#A5B4FC',
  },
  pinDotEmpty: {
    backgroundColor: '#111827',
  },
  footer: {
    marginTop: 80,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
