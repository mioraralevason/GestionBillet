import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Calendar from 'react-native-calendars/src/calendar';
import LocaleConfig from 'xdate';
import { EventService, Event } from '../../services/EventService';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Configuration de la locale française pour le calendrier
LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  monthNamesShort: ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui"
};
LocaleConfig.defaultLocale = 'fr';

export default function CalendarScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const router = useRouter();

  const fetchEvents = useCallback(() => {
    const list = EventService.getEvents();
    setEvents(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  // Marquer les dates ayant des événements
  const markedDates = useMemo(() => {
    const marks: any = {};
    
    // D'abord, on marque tous les événements
    events.forEach(event => {
      if (event.event_date) {
        marks[event.event_date] = {
          marked: true,
          dotColor: '#FFF', // Point blanc sur fond bleu
          customStyles: {
            container: {
              backgroundColor: '#007AFF',
              borderRadius: 8,
            },
            text: {
              color: '#FFF',
              fontWeight: 'bold',
            }
          }
        };
      }
    });

    // Ensuite, on gère la date sélectionnée
    if (selectedDate) {
      const isEventDay = !!marks[selectedDate];
      
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        // Si c'est un jour d'événement, on garde le style bleu mais on ajoute une bordure ou on change l'opacité
        // Si ce n'est pas un jour d'événement, on met un cercle gris clair
        selectedColor: isEventDay ? '#0056b3' : '#E1E1E1',
        selectedTextColor: isEventDay ? '#FFF' : '#000',
      };
    }

    return marks;
  }, [events, selectedDate]);

  // Filtrer les événements pour la date sélectionnée
  const filteredEvents = useMemo(() => {
    return events.filter(e => e.event_date === selectedDate);
  }, [events, selectedDate]);

  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity 
      style={styles.eventCard}
      onPress={() => item.id && router.push(`/event/${item.id}`)}
    >
      <View style={styles.eventInfo}>
        <Text style={styles.eventName}>{item.name}</Text>
        {item.slogan && <Text style={styles.eventSlogan} numberOfLines={1}>{item.slogan}</Text>}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        markingType={'custom'} // Très important pour utiliser customStyles
        theme={{
          todayTextColor: '#FF9500', // Orange pour aujourd'hui
          arrowColor: '#007AFF',
          indicatorColor: '#007AFF',
          textDayFontWeight: '500',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
        }}
      />
      
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {filteredEvents.length > 0 
            ? `Événements du ${new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
            : "Aucun événement à cette date"
          }
        </Text>
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id?.toString() || ''}
        renderItem={renderEventItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank" size={60} color="#DDD" />
            <Text style={styles.emptyText}>Rien de prévu pour aujourd'hui</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listHeader: {
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    marginTop: 10,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    padding: 15,
  },
  eventCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  eventSlogan: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#8E8E93',
  },
});
