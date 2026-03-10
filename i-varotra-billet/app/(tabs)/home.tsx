import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function Home() {
  const [role, setRole] = useState('');
  const router = useRouter();

  useEffect(() => {
    const getRole = async () => {
      const userRole = await AsyncStorage.getItem('userRole');
      setRole(userRole || 'Utilisateur');
    };
    getRole();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userRole');
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Bienvenue {role.charAt(0).toUpperCase() + role.slice(1)}
      </Text>
      <Text style={{ fontSize: 16, color: 'gray' }}>Vous êtes connecté avec succès.</Text>
      <Button title="Se déconnecter" onPress={handleLogout} color="red" />
    </View>
  );
}