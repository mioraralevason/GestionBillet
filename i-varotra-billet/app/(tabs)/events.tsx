// app/(tabs)/events.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, TextInput, StatusBar, SafeAreaView, Dimensions, Keyboard } from 'react-native';
import { EventService, Event } from '../../services/EventService';
import { TicketService } from '../../services/TicketService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, Stack, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');

export default function EventsList() {
  const params = useLocalSearchParams();
  const [events, setEvents] = useState<(Event & { stats?: any })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false); // Nouvel état
  const router = useRouter();

  useEffect(() => {
    if (params.autoSearch === 'true') {
      setIsSearchActive(true);
    }
  }, [params.autoSearch]);

  const fetchEvents = useCallback(() => {
    const list = EventService.getEvents();
    const listWithStats = list.map(ev => ({
      ...ev,
      stats: ev.id ? TicketService.getEventStats(ev.id) : null
    }));
    setEvents(listWithStats);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(e => e.name.toLowerCase().includes(q) || e.event_date.includes(q));
  }, [searchQuery, events]);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || !isSearchActive) return [];
    const q = searchQuery.toLowerCase();
    return events
      .filter(e => e.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map(e => e.name);
  }, [searchQuery, events, isSearchActive]);

  const handleDelete = (id: number) => {
    Alert.alert('Supprimer', 'Voulez-vous vraiment supprimer cet événement ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => { if (EventService.deleteEvent(id)) fetchEvents(); } }
    ]);
  };

  const renderItem = ({ item }: { item: Event & { stats?: any } }) => (
    <TouchableOpacity 
      style={[styles.eventCard, { borderLeftColor: item.color || '#6366F1' }]}
      onPress={() => item.id && router.push(`/event/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.eventInfo}>
        <Text style={styles.eventName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar-clock" size={14} color="#94A3B8" />
          <Text style={styles.eventDate}>{item.event_date}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statMini}>
            <Text style={styles.statVal}>{item.stats?.sold || 0}</Text>
            <Text style={styles.statLab}>Vendus</Text>
          </View>
          <View style={styles.statMini}>
            <Text style={styles.statVal}>{item.stats?.total || 0}</Text>
            <Text style={styles.statLab}>Total</Text>
          </View>
        </View>
      </View>
      <View style={styles.actionColumn}>
        <TouchableOpacity onPress={() => router.push({ pathname: '/add-event', params: { id: item.id } })} style={styles.editBtn}>
          <MaterialCommunityIcons name="pencil" size={20} color="#6366F1" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => item.id && handleDelete(item.id)} style={styles.deleteBtn}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen 
        options={{
          headerTitle: isSearchActive ? () => (
            <View style={styles.headerSearchContainer}>
              <TextInput
                style={styles.headerSearchInput}
                placeholder="Rechercher..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setShowSuggestions(text.length > 0);
                }}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setShowSuggestions(false); }}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          ) : 'Événements',
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => {
                setIsSearchActive(!isSearchActive);
                setShowSuggestions(false);
                if (isSearchActive) setSearchQuery('');
              }} 
              style={{ marginRight: 20 }}
            >
              <MaterialCommunityIcons 
                name={isSearchActive ? "close" : "magnify"} 
                size={26} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          )
        }}
      />

      {/* Suggestions Dropdown */}
      {isSearchActive && showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.suggestionItem}
              onPress={() => {
                setSearchQuery(item);
                setShowSuggestions(false); // Faire disparaître la suggestion
                Keyboard.dismiss(); // Optionnel : fermer le clavier
              }}
            >
              <MaterialCommunityIcons name="history" size={18} color="#64748B" />
              <Text style={styles.suggestionText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {filteredEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="calendar-search" size={80} color="#1E293B" />
          <Text style={styles.emptyText}>Aucun événement trouvé</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id?.toString() || ''}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-event')}>
        <MaterialCommunityIcons name="plus" size={30} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  listContainer: { padding: 20, paddingBottom: 100 },
  headerSearchContainer: { flexDirection: 'row', alignItems: 'center', width: width * 0.6, backgroundColor: '#111827', borderRadius: 10, paddingHorizontal: 10, height: 35 },
  headerSearchInput: { flex: 1, color: '#FFF', fontSize: 14 },
  suggestionsContainer: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#111827', zIndex: 2000, borderBottomWidth: 1, borderBottomColor: '#1E293B', paddingBottom: 10 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#1E293B', gap: 12 },
  suggestionText: { color: '#E2E8F0', fontSize: 15 },
  eventCard: { backgroundColor: '#111827', borderRadius: 20, padding: 18, marginBottom: 15, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 6, borderWidth: 1, borderColor: '#1E293B' },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 5 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  eventDate: { fontSize: 14, color: '#94A3B8' },
  statsRow: { flexDirection: 'row', gap: 15 },
  statMini: { alignItems: 'flex-start' },
  statVal: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  statLab: { color: '#64748B', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  actionColumn: { gap: 10, marginLeft: 15 },
  editBtn: { backgroundColor: '#6366F115', padding: 10, borderRadius: 12 },
  deleteBtn: { backgroundColor: '#EF444415', padding: 10, borderRadius: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 20, fontSize: 16, color: '#64748B' },
  fab: { position: 'absolute', right: 25, bottom: 110, backgroundColor: '#A5B4FC', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#A5B4FC', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 }
});
