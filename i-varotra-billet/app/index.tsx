import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Text, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserByPin } from '../database/database';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

export default function Login() {
  const [pin, setPin] = useState('');
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // S'assurer que le clavier est toujours présent
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
        // Succès : Vibration légère et redirection
        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        await AsyncStorage.setItem('userRole', role);
        
        // Redirection intelligente selon le rôle si nécessaire, 
        // ici on va vers home qui gère l'affichage selon le rôle
        router.replace('/(tabs)/home');
      } else {
        // Échec : Vibration forte et erreur
        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Vibration.vibrate(400);
        }
        
        Alert.alert('Erreur', 'PIN incorrect. Accès refusé.', [
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.content}>
          <Image 
            source={require('../assets/logo_iBillet.png')} 
            style={styles.logo}
            contentFit="contain"
          />
          
          <Text style={styles.title}>iBillet</Text>
          <Text style={styles.subtitle}>Sécurisez vos accès</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Entrez votre PIN à 4 chiffres</Text>
            <TextInput
              ref={inputRef}
              value={pin}
              onChangeText={handlePinChange}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              autoFocus={true}
              showSoftInputOnFocus={true}
              placeholder="••••"
              placeholderTextColor="#CCC"
              style={styles.input}
              onBlur={() => inputRef.current?.focus()} // Garde le focus même si on clique ailleurs
            />
            
            <View style={styles.pinIndicatorContainer}>
              {[...Array(4)].map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.pinDot, 
                    pin.length > i ? styles.pinDotFilled : styles.pinDotEmpty
                  ]} 
                />
              ))}
            </View>
          </View>

          <Text style={styles.footer}>© 2026 iBillet</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 30,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    position: 'absolute', // On cache l'input réel tout en gardant le focus
    opacity: 0,
    width: '100%',
    height: 60,
  },
  pinIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  pinDotFilled: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pinDotEmpty: {
    backgroundColor: 'transparent',
    borderColor: '#DDD',
  },
  footer: {
    marginTop: 60,
    fontSize: 12,
    color: '#AAA',
  },
});