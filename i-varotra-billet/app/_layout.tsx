import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDB } from '../database/database';

export default function Layout() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initDB(); // Initialisation de la base SQLite
    setLoading(false);
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

  if (loading) return null;

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