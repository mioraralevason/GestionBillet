import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabsLayout() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const getRole = async () => {
      const userRole = await AsyncStorage.getItem('userRole');
      setRole(userRole);
    };
    getRole();
  }, []);

  return (
    <Tabs screenOptions={{ 
      headerShown: true,
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: '#8E8E93',
    }}>
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="events" 
        options={{ 
          title: 'Événements',
          href: role === 'verificateur' ? null : '/(tabs)/events',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar" color={color} size={size} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="buyers" 
        options={{ 
          title: 'Acheteurs',
          href: role === 'verificateur' ? null : '/(tabs)/buyers',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="verifier" 
        options={{ 
          title: 'Vérifier',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="qrcode-scan" color={color} size={size} />
          ),
        }} 
      />
    </Tabs>
  );
}