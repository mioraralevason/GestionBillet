// app/(tabs)/events.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, StatusBar, Dimensions, Keyboard, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { EventService, Event } from '../../services/EventService';
import { TicketService } from '../../services/TicketService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, Stack, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';

import Toast from 'react-native-toast-message';
import ConfirmModal from '../../components/ConfirmModal';

const { width } = Dimensions.get('window');

const getEventStatus = (dateStr: string) => {
  try {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return { label: 'Date inconnue', color: '#64748B' };
    const eventDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (eventDate.toDateString() === now.toDateString()) return { label: 'Aujourd\'hui', color: '#10B981' };
    if (eventDate < now) return { label: 'Terminé', color: '#64748B' };
    return { label: 'À venir', color: '#6366F1' };
  } catch (e) {
    return { label: 'À venir', color: '#6366F1' };
  }
};

export default function EventsList() {
  const [events, setEvents] = useState<(Event & { stats?: any })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  const router = useRouter();

  // Animations
  const scrollY = React.useRef(new Animated.Value(0)).current;

  // Fetch role
  useEffect(() => {
    const fetchRole = async () => {
      const userRole = await AsyncStorage.getItem('userRole');
      setRole(userRole);
    };
    fetchRole();
  }, []);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    const allEvents = EventService.getEvents();
    const eventsWithStats = allEvents.map(event => ({
      ...event,
      stats: TicketService.getEventStats(event.id!)
    }));
    setEvents(eventsWithStats);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    return events.filter(event =>
      event.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [events, searchQuery]);

  // Search suggestions
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return filteredEvents.map(event => event.name || '').slice(0, 5);
  }, [filteredEvents, searchQuery]);

  const handleDelete = (id: number) => {
    if (role !== 'admin') {
      Toast.show({
        type: 'error',
        text1: 'Accès refusé',
        text2: 'Seul un administrateur peut supprimer cet événement.'
      });
      return;
    }
    
    setEventToDelete(id);
    setConfirmVisible(true);
  };

  const onConfirmDelete = () => {
    if (eventToDelete !== null) {
      if (EventService.deleteEvent(eventToDelete)) {
        fetchEvents();
        Toast.show({
          type: 'success',
          text1: 'Succès',
          text2: 'Événement supprimé.'
        });
      }
    }
    setConfirmVisible(false);
    setEventToDelete(null);
  };

  const renderItem = ({ item, index }: { item: Event & { stats?: any }, index: number }) => {
    const status = getEventStatus(item.event_date);
    const sold = item.stats?.sold || 0;
    const total = item.stats?.total || 1;
    const progress = (sold / total) * 100;
    
    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => item.id && router.push(`/event/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.cardImageContainer}>
          {item.image ? (
            <Image 
              source={{ uri: item.image }} 
              style={styles.cardImage} 
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: item.color || '#6366F1' }]}>
              <MaterialCommunityIcons name="calendar-star" size={40} color="#FFFFFF" opacity={0.5} />
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusText}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={styles.eventName} numberOfLines={1}>{item.name}</Text>
            {role === 'admin' && (
              <View style={styles.adminActions}>
                <TouchableOpacity 
                  onPress={() => router.push({ pathname: '/add-event', params: { id: item.id } })} 
                  style={styles.actionIcon}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={18} color="#A5B4FC" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => item.id && handleDelete(item.id)} 
                  style={[styles.actionIcon, { marginLeft: 8 }]}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="calendar-blank" size={14} color="#94A3B8" />
              <Text style={styles.infoText}>{item.event_date}</Text>
            </View>
            {item.slogan ? (
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="tag-outline" size={14} color="#94A3B8" />
                <Text style={styles.infoText} numberOfLines={1}>{item.slogan}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Ventes</Text>
              <Text style={styles.progressValue}>{sold} / {total}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${progress}%`, backgroundColor: item.color || '#6366F1' }
                ]} 
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
                setShowSuggestions(false);
                Keyboard.dismiss();
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
          <View style={styles.emptyIconContainer}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={60} color="#1E293B" />
          </View>
          <Text style={styles.emptyTitle}>Aucun événement</Text>
          <Text style={styles.emptySubtitle}>Vous n'avez pas encore d'événements enregistrés ou votre recherche n'a rien donné.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id?.toString() || ''}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        />
      )}
      
      {role !== 'verificateur' && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => router.push('/add-event')}
          activeOpacity={0.8}
        >
          <BlurView intensity={20} style={styles.fabBlur}>
            <MaterialCommunityIcons name="plus" size={32} color="#000" />
          </BlurView>
        </TouchableOpacity>
      )}

      <ConfirmModal
        visible={confirmVisible}
        title="Supprimer l'événement"
        message="Êtes-vous sûr de vouloir supprimer cet événement et tous les billets associés ? Cette action est irréversible."
        onConfirm={onConfirmDelete}
        onCancel={() => setConfirmVisible(false)}
        confirmText="Supprimer"
        type="danger"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  listContainer: { padding: 16, paddingBottom: 120 },
  headerSearchContainer: { flexDirection: 'row', alignItems: 'center', width: width * 0.6, backgroundColor: '#111827', borderRadius: 12, paddingHorizontal: 12, height: 40 },
  headerSearchInput: { flex: 1, color: '#FFF', fontSize: 15 },
  suggestionsContainer: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#111827', zIndex: 2000, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1E293B', gap: 12 },
  suggestionText: { color: '#E2E8F0', fontSize: 16 },
  
  // Card Styles
  eventCard: { backgroundColor: '#111827', borderRadius: 24, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#1E293B', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  cardImageContainer: { height: 160, width: '100%', position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  statusBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  
  cardContent: { padding: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  eventName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', flex: 1 },
  adminActions: { flexDirection: 'row' },
  actionIcon: { backgroundColor: '#1E293B', padding: 8, borderRadius: 10 },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 14, color: '#94A3B8' },
  
  progressContainer: { marginTop: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold' },
  progressValue: { fontSize: 12, color: '#FFFFFF', fontWeight: 'bold' },
  progressBarBg: { height: 8, backgroundColor: '#1E293B', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#1E293B' },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#94A3B8', textAlign: 'center', lineHeight: 22 },
  
  fab: { position: 'absolute', right: 24, bottom: 100, width: 64, height: 64, borderRadius: 32, backgroundColor: '#A5B4FC', overflow: 'hidden', elevation: 10, shadowColor: '#A5B4FC', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
  fabBlur: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

