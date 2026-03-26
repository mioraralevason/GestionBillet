import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDB } from '../database/database';

export default function Layout() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const initialize = async () => {
      await initDB(); // Initialisation de la base SQLite
      // Un court délai pour montrer le logo lors du chargement initial
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
    };
    initialize();
  }, []);

  useEffect(() => {
    if (loading) return;

    const checkAuthAndRedirect = async () => {
      const role = await AsyncStorage.getItem('userRole');
      const inTabsGroup = segments[0] === '(tabs)';

      if (!role && inTabsGroup) {
        // Rediriger vers l'écran de login si non connecté
        router.replace('/');
      }
    };

    checkAuthAndRedirect();
  }, [segments, loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Image 
          source={require('../assets/logo_iBillet.png')} 
          style={styles.loadingLogo}
          contentFit="contain"
        />
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="add-event" 
        options={{ 
          presentation: 'modal', 
          headerShown: true, 
          headerTitle: 'Nouvel Événement' 
        }} 
      />
      <Stack.Screen 
        name="event/[id]" 
        options={{ 
          headerShown: true, 
          headerTitle: 'Détails de l\'Événement' 
        }} 
      />
      <Stack.Screen 
        name="tickets/[eventId]" 
        options={{ 
          headerShown: true, 
          headerTitle: 'Liste des Billets' 
        }} 
      />
      <Stack.Screen 
        name="assign-ticket/[id]" 
        options={{ 
          presentation: 'modal',
          headerShown: true, 
          headerTitle: 'Assigner Billet' 
        }} 
      />
      <Stack.Screen 
        name="assign-ticket/batch" 
        options={{ 
          presentation: 'modal',
          headerShown: true, 
          headerTitle: 'Assignation Groupée' 
        }} 
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    width: 80,
    height: 80,
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
});
