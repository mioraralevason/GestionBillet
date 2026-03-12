import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { EventService, Event } from '../../services/EventService';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Home() {
  const [role, setRole] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const userRole = await AsyncStorage.getItem('userRole');
    setRole(userRole || 'Utilisateur');
    const allEvents = EventService.getEvents();
    setEvents(allEvents);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userRole');
    router.replace('/');
  };

  // Logique du tableau de bord
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingEvents = events
    .filter(e => new Date(e.event_date) >= now)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  const pastEvents = events
    .filter(e => new Date(e.event_date) < now)
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  const closestEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;
  const lastEvent = pastEvents.length > 0 ? pastEvents[0] : null;

  const getDaysRemaining = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Bonjour,</Text>
            <Text style={styles.roleName}>{role.toUpperCase()}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <MaterialCommunityIcons name="logout" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        <View style={styles.dashboard}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#007AFF' }]}>
              <MaterialCommunityIcons name="calendar-multiselect" size={30} color="#FFF" />
              <Text style={styles.statNumber}>{events.length}</Text>
              <Text style={styles.statLabel}>Événements</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#34C759' }]}>
              <MaterialCommunityIcons name="ticket-confirmation" size={30} color="#FFF" />
              <Text style={styles.statNumber}>{upcomingEvents.length}</Text>
              <Text style={styles.statLabel}>À venir</Text>
            </View>
          </View>

          {closestEvent && (
            <View style={styles.mainCard}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="clock-fast" size={24} color="#007AFF" />
                <Text style={styles.cardTitle}>Prochain Événement</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.eventName}>{closestEvent.name}</Text>
                <Text style={styles.eventDate}>📅 {closestEvent.event_date}</Text>
                <View style={styles.countdownBadge}>
                  <Text style={styles.countdownText}>
                    {getDaysRemaining(closestEvent.event_date) === 0 
                      ? "AUJOURD'HUI" 
                      : `J - ${getDaysRemaining(closestEvent.event_date)} JOURS`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.detailsBtn}
                onPress={() => router.push(`/event/${closestEvent.id}`)}
              >
                <Text style={styles.detailsBtnText}>Voir détails</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          )}

          {lastEvent && (
            <View style={[styles.mainCard, { borderLeftColor: '#8E8E93' }]}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="history" size={24} color="#8E8E93" />
                <Text style={[styles.cardTitle, { color: '#8E8E93' }]}>Dernier Passé</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.eventName, { color: '#666' }]}>{lastEvent.name}</Text>
                <Text style={styles.eventDate}>{lastEvent.event_date}</Text>
              </View>
            </View>
          )}

          <View style={styles.shortcuts}>
            <Text style={styles.sectionTitle}>Raccourcis</Text>
            <View style={styles.shortcutGrid}>
              <TouchableOpacity style={styles.shortcutItem} onPress={() => router.push('/verifier')}>
                <View style={[styles.shortcutIcon, { backgroundColor: '#FF9500' }]}>
                  <MaterialCommunityIcons name="qrcode-scan" size={24} color="#FFF" />
                </View>
                <Text style={styles.shortcutLabel}>Scanner</Text>
              </TouchableOpacity>

              {role === 'admin' && (
                <>
                  <TouchableOpacity style={styles.shortcutItem} onPress={() => router.push('/events')}>
                    <View style={[styles.shortcutIcon, { backgroundColor: '#5856D6' }]}>
                      <MaterialCommunityIcons name="calendar" size={24} color="#FFF" />
                    </View>
                    <Text style={styles.shortcutLabel}>Événements</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.shortcutItem} onPress={() => router.push('/buyers')}>
                    <View style={[styles.shortcutIcon, { backgroundColor: '#AF52DE' }]}>
                      <MaterialCommunityIcons name="account-group" size={24} color="#FFF" />
                    </View>
                    <Text style={styles.shortcutLabel}>Acheteurs</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { paddingBottom: 30 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 25, 
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  welcome: { fontSize: 16, color: '#8E8E93' },
  roleName: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E' },
  logoutBtn: { padding: 10, borderRadius: 12, backgroundColor: '#FFF5F5' },
  dashboard: { padding: 20 },
  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  statCard: { 
    flex: 1, 
    padding: 20, 
    borderRadius: 20, 
    alignItems: 'center',
    elevation: 3
  },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginTop: 5 },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  mainCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 20, 
    borderLeftWidth: 5, 
    borderLeftColor: '#007AFF',
    elevation: 2
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#007AFF', textTransform: 'uppercase' },
  cardContent: { marginBottom: 15 },
  eventName: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 5 },
  eventDate: { fontSize: 15, color: '#8E8E93' },
  countdownBadge: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#E1F0FF', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10, 
    marginTop: 10 
  },
  countdownText: { color: '#007AFF', fontWeight: 'bold', fontSize: 13 },
  detailsBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-end', 
    borderTopWidth: 1, 
    borderTopColor: '#F2F2F7', 
    paddingTop: 10 
  },
  detailsBtnText: { color: '#007AFF', fontWeight: '600', marginRight: 5 },
  shortcuts: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 15 },
  shortcutGrid: { flexDirection: 'row', gap: 15 },
  shortcutItem: { alignItems: 'center', flex: 1 },
  shortcutIcon: { 
    width: 60, 
    height: 60, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8,
    elevation: 2
  },
  shortcutLabel: { fontSize: 12, fontWeight: '600', color: '#1C1C1E' }
});
