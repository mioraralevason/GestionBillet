// app/(tabs)/events.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { EventService, Event } from '../../services/EventService';
import { TicketService } from '../../services/TicketService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

export default function EventsList() {
  const [events, setEvents] = useState<(Event & { stats?: any })[]>([]);
  const router = useRouter();

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

  const handleDelete = (id: number) => {
    Alert.alert('Supprimer', 'Voulez-vous vraiment supprimer cet événement ?', [
      { text: 'Annuler', style: 'cancel' },
      { 
        text: 'Supprimer', 
        style: 'destructive',
        onPress: () => {
          if (EventService.deleteEvent(id)) {
            fetchEvents();
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: Event & { stats?: any } }) => (
    <TouchableOpacity 
      style={styles.eventCard}
      onPress={() => item.id && router.push(`/event/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.eventInfo}>
        <View style={styles.cardHeader}>
          <Text style={styles.eventName}>{item.name || 'Sans nom'}</Text>
          <View style={styles.ticketBadge}>
            <MaterialCommunityIcons name="ticket" size={14} color="#FFF" />
            <Text style={styles.ticketCount}>{item.stats?.total || 0}</Text>
          </View>
        </View>
        <Text style={styles.eventDate}>
          <MaterialCommunityIcons name="calendar-clock" size={14} /> {item.date}
        </Text>
        {item.slogan && <Text style={styles.eventSlogan} numberOfLines={1}>"{item.slogan}"</Text>}
      </View>
      <TouchableOpacity 
        onPress={() => item.id && handleDelete(item.id)}
        style={styles.deleteButton}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="calendar-blank" size={80} color="#DDD" />
          <Text style={styles.emptyText}>Aucun événement créé pour le moment</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id?.toString() || ''}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      {/* Bouton pour ajouter un événement */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/add-event')}
      >
        <MaterialCommunityIcons name="plus" size={30} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  listContainer: {
    padding: 15,
  },
  eventCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  ticketBadge: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  ticketCount: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  eventDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
  },
  eventSlogan: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#007AFF',
  },
  deleteButton: {
    padding: 5,
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});