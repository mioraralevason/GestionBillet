import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabsLayout() {
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
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar" color={color} size={size} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="buyers" 
        options={{ 
          title: 'Acheteurs',
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