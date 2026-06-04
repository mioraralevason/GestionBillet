import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export const useRole = () => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    const userRole = await AsyncStorage.getItem('userRole');
    setRole(userRole);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    fetchRole();
  }, [fetchRole]));

  return { role, loading, isAdmin: role === 'admin', isVerifier: role === 'verificateur' };
};
