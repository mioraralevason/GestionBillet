import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { EventService, Event } from '../../services/EventService';
import { TicketService } from '../../services/TicketService';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Configuration de la locale française
LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  monthNamesShort: ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui"
};
LocaleConfig.defaultLocale = 'fr';

export default function CalendarScreen() {
  const [events, setEvents] = useState<(Event & { stats?: any })[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const router = useRouter();

  const fetchEvents = useCallback(() => {
    const list = EventService.getEvents();
    const listWithStats = list.map(ev => ({
      ...ev,
      stats: ev.id ? TicketService.getEventStats(ev.id) : null
    }));
    setEvents(listWithStats);
  }, []);

  useFocusEffect(useCallback(() => { fetchEvents(); }, [fetchEvents]));

  const markedDates = useMemo(() => {
    const marks: any = {};
    events.forEach(event => {
      if (event.event_date) {
        marks[event.event_date] = {
          marked: true,
          dotColor: event.color || '#6366F1',
        };
      }
    });

    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: '#6366F1',
      selectedTextColor: '#FFF',
    };

    return marks;
  }, [events, selectedDate]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => e.event_date === selectedDate);
  }, [events, selectedDate]);

  const renderEventItem = ({ item }: { item: Event & { stats?: any } }) => (
    <TouchableOpacity 
      style={[styles.eventCard, { borderLeftColor: item.color || '#6366F1' }]}
      onPress={() => item.id && router.push(`/event/${item.id}`)}
    >
      <View style={styles.eventInfo}>
        <Text style={styles.eventName}>{item.name}</Text>
        <Text style={styles.eventStats}>
          {item.stats?.sold || 0} vendus / {item.stats?.total || 0} total
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#4B5563" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Calendar
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          backgroundColor: '#000000',
          calendarBackground: '#000000',
          textSectionTitleColor: '#94A3B8',
          selectedDayBackgroundColor: '#6366F1',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#A5B4FC',
          dayTextColor: '#E2E8F0',
          textDisabledColor: '#334155',
          dotColor: '#6366F1',
          selectedDotColor: '#ffffff',
          arrowColor: '#6366F1',
          monthTextColor: '#FFFFFF',
          indicatorColor: '#6366F1',
          textDayFontWeight: '500',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 14,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 12
        }}
      />
      
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <MaterialCommunityIcons name="calendar-clock" size={20} color="#A5B4FC" />
          <Text style={styles.listTitle}>
            {new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </Text>
        </View>

        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id?.toString() || ''}
          renderItem={renderEventItem}
          contentContainerStyle={styles.flatList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={60} color="#1E293B" />
              <Text style={styles.emptyText}>Aucun événement ce jour</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  listContainer: { flex: 1, backgroundColor: '#0F172A', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, marginTop: 10 },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, paddingHorizontal: 5 },
  listTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  flatList: { paddingBottom: 20 },
  eventCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
  },
  eventInfo: { flex: 1 },
  eventName: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  eventStats: { color: '#94A3B8', fontSize: 13 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  emptyText: { color: '#4B5563', fontSize: 15, marginTop: 15 }
});
