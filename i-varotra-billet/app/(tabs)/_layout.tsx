import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity, View, StyleSheet, Text, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomSidebar } from '../../components/CustomSidebar';

const { width } = Dimensions.get('window');

function MyTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          // FILTRE STRICT : On n'affiche QUE ces 3 routes là
          if (!['home', 'events', 'verifier'].includes(route.name)) return null;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName: any = 'home-outline';
          let labelText = 'Accueil';

          if (route.name === 'home') {
            iconName = isFocused ? 'home' : 'home-outline';
            labelText = 'Accueil';
          } else if (route.name === 'events') {
            iconName = isFocused ? 'calendar-text' : 'calendar-text-outline';
            labelText = 'Events';
          } else if (route.name === 'verifier') {
            iconName = 'qrcode-scan';
            labelText = 'Scan';
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons 
                name={iconName} 
                size={24} 
                color={isFocused ? '#A5B4FC' : '#94A3B8'} 
              />
              {isFocused && (
                <Text style={styles.tabLabel}>{labelText}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const [role, setRole] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const getRole = async () => {
      const userRole = await AsyncStorage.getItem('userRole');
      setRole(userRole);
    };
    getRole();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <Tabs 
        tabBar={props => <MyTabBar {...props} />}
        screenOptions={{ 
          headerShown: true,
          headerStyle: { backgroundColor: '#000000', elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
          headerTintColor: '#FFFFFF',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity style={{ marginLeft: 20 }} onPress={() => setIsSidebarOpen(true)}>
              <MaterialCommunityIcons name="menu" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      >
        <Tabs.Screen 
          name="home" 
          options={{ 
            title: 'iBillet',
            headerRight: () => (
              <TouchableOpacity style={{ marginRight: 20 }}>
                <MaterialCommunityIcons name="white-balance-sunny" size={24} color="#FDB813" />
              </TouchableOpacity>
            ),
          }} 
        />
        <Tabs.Screen name="events" options={{ title: 'Événements' }} />
        <Tabs.Screen name="verifier" options={{ title: 'Scanner' }} />
        <Tabs.Screen name="calendar" options={{ href: null }} />
        <Tabs.Screen name="buyers" options={{ href: null }} />
      </Tabs>

      <CustomSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role={role} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111118',
    borderRadius: 35,
    height: 65,
    width: width - 40,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#1E1E2E',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 45,
    paddingHorizontal: 15,
    borderRadius: 25,
  },
  tabItemActive: {
    backgroundColor: '#1E1E2E',
  },
  tabLabel: {
    color: '#A5B4FC',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  }
});
