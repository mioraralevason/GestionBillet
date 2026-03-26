import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity, View, useColorScheme, StyleSheet, Platform, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/theme';
import { CustomSidebar } from '../../components/CustomSidebar';

export default function TabsLayout() {
  const [role, setRole] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme];

  // Couleurs Electro / Premium
  const activeColor = '#FFFFFF'; // Texte blanc sur fond coloré
  const inactiveColor = '#64748B'; // Gris ardoise éteint
  const barBg = '#0F172A'; // Bleu nuit très profond
  const activePillBg = '#6366F1'; // Indigo vif pour l'élément actif

  useEffect(() => {
    const getRole = async () => {
      const userRole = await AsyncStorage.getItem('userRole');
      setRole(userRole);
    };
    getRole();
  }, []);

  const darkHeaderOptions = {
    headerShown: true,
    headerStyle: { 
      backgroundColor: '#000000', 
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 1,
      borderBottomColor: '#1E293B',
    },
    headerTintColor: '#FFFFFF',
    headerTitleStyle: {
      fontWeight: 'bold' as const,
      fontSize: 18,
    },
    headerLeft: () => (
      <TouchableOpacity 
        style={{ marginLeft: 20 }} 
        onPress={() => setIsSidebarOpen(true)}
      >
        <MaterialCommunityIcons name="menu" size={26} color="#FFFFFF" />
      </TouchableOpacity>
    ),
  };

  const TabIconWithLabel = ({ focused, icon, label }: { focused: boolean, icon: any, label: string }) => {
    return (
      <View style={[
        styles.tabItem, 
        focused && { backgroundColor: activePillBg, shadowColor: activePillBg, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 }
      ]}>
        <MaterialCommunityIcons 
          name={icon} 
          color={focused ? activeColor : inactiveColor} 
          size={22} 
        />
        {focused && (
          <Text style={[styles.tabLabel, { color: activeColor }]}>{label}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <Tabs screenOptions={{ 
        ...darkHeaderOptions,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          elevation: 20,
          backgroundColor: barBg,
          borderRadius: 30,
          height: 65,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: '#1E293B',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          height: 65,
        }
      }}>
        <Tabs.Screen 
          name="home" 
          options={{ 
            title: 'iBillet',
            headerTitleAlign: 'center',
            headerRight: () => (
              <TouchableOpacity style={{ marginRight: 20 }}>
                <MaterialCommunityIcons name="white-balance-sunny" size={24} color="#FDB813" />
              </TouchableOpacity>
            ),
            tabBarIcon: ({ focused }) => (
              <TabIconWithLabel focused={focused} icon="home-variant" label="Accueil" />
            ),
          }} 
        />

        <Tabs.Screen 
          name="events" 
          options={{ 
            title: 'Événements',
            headerTitleAlign: 'center',
            tabBarIcon: ({ focused }) => (
              <TabIconWithLabel focused={focused} icon="calendar-text" label="Events" />
            ),
          }} 
        />

        <Tabs.Screen 
          name="verifier" 
          options={{ 
            title: 'Scanner',
            headerTitleAlign: 'center',
            tabBarIcon: ({ focused }) => (
              <TabIconWithLabel focused={focused} icon="qrcode-scan" label="Scan" />
            ),
          }} 
        />

        <Tabs.Screen name="calendar" options={{ href: null }} />
        <Tabs.Screen name="buyers" options={{ href: null }} />
      </Tabs>

      <CustomSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        role={role} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  tabLabel: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
});
