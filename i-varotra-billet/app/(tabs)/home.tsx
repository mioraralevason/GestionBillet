import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  RefreshControl,
  useColorScheme,
  StatusBar,
  TextInput,
  Platform,
  Dimensions,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { EventService, Event } from '../../services/EventService';
import { TicketService } from '../../services/TicketService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

const { width } = Dimensions.get('window');

const MonthYearPicker = ({ visible, onClose, onSelect, value }: any) => {
  const [selectedYear, setSelectedYear] = useState(value ? value.getFullYear() : new Date().getFullYear());
  
  useEffect(() => {
    if (value) setSelectedYear(value.getFullYear());
  }, [value, visible]);

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>Choisir un mois</Text>
          <View style={styles.yearSelector}>
            <TouchableOpacity onPress={() => setSelectedYear(selectedYear - 1)}>
              <MaterialCommunityIcons name="chevron-left" size={32} color="#6366F1" />
            </TouchableOpacity>
            <Text style={styles.yearText}>{selectedYear}</Text>
            <TouchableOpacity onPress={() => setSelectedYear(selectedYear + 1)}>
              <MaterialCommunityIcons name="chevron-right" size={32} color="#6366F1" />
            </TouchableOpacity>
          </View>
          <View style={styles.monthsGrid}>
            {months.map((month, index) => {
              const isSelected = value && value.getMonth() === index && value.getFullYear() === selectedYear;
              return (
                <TouchableOpacity 
                  key={month} 
                  style={[styles.monthItem, isSelected && styles.monthItemActive]}
                  onPress={() => {
                    const date = new Date(selectedYear, index, 1);
                    onSelect(date);
                    onClose();
                  }}
                >
                  <Text style={[styles.monthText, isSelected && styles.monthTextActive]}>
                    {month.substring(0, 4)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={styles.closePickerBtn} onPress={onClose}>
            <Text style={styles.closePickerBtnText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function Home() {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme];
  const currentYear = new Date().getFullYear();
  
  const [role, setRole] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [recentCreations, setRecentCreations] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [startMonthYear, setStartMonthYear] = useState<Date | null>(new Date(currentYear, 0, 1));
  const [endMonthYear, setEndMonthYear] = useState<Date | null>(new Date(currentYear, 11, 1));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const userRole = await AsyncStorage.getItem('userRole');
    setRole(userRole || 'Utilisateur');
    const allEvents = EventService.getEvents();
    setEvents(allEvents);
    const recent = EventService.getRecentCreations();
    setRecentCreations(recent);
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filteredData = useMemo(() => {
    let filteredEvents = events;
    if (startMonthYear && endMonthYear) {
      const startVal = startMonthYear.getFullYear() * 12 + startMonthYear.getMonth();
      const endVal = endMonthYear.getFullYear() * 12 + endMonthYear.getMonth();
      filteredEvents = events.filter(e => {
        const d = new Date(e.event_date);
        const currentVal = d.getFullYear() * 12 + d.getMonth();
        return currentVal >= startVal && currentVal <= endVal;
      });
    }
    
    // Historique des créations filtré par la même période
    let filteredHistory = recentCreations;
    if (startMonthYear && endMonthYear) {
        const startVal = startMonthYear.getFullYear() * 12 + startMonthYear.getMonth();
        const endVal = endMonthYear.getFullYear() * 12 + endMonthYear.getMonth();
        filteredHistory = recentCreations.filter(e => {
            const d = e.created_at ? new Date(e.created_at) : new Date();
            const val = d.getFullYear() * 12 + d.getMonth();
            return val >= startVal && val <= endVal;
        });
    }

    return { filteredEvents, filteredHistory };
  }, [startMonthYear, endMonthYear, events, recentCreations]);

  const soldTickets = filteredData.filteredEvents.reduce((acc, e) => {
    const stats = TicketService.getEventStats(e.id!);
    return acc + stats.sold + stats.validated;
  }, 0);

  const totalPossibleTickets = filteredData.filteredEvents.reduce((acc, e) => {
    const stats = TicketService.getEventStats(e.id!);
    return acc + stats.total;
  }, 0);

  const formatMonthYear = (date: Date | null) => {
    if (!date) return 'MM/AAAA';
    const m = date.toLocaleDateString('fr-FR', { month: 'long' });
    return `${m.charAt(0).toUpperCase() + m.slice(1)} ${date.getFullYear()}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen 
        options={{
          headerTitle: 'iBillet',
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push({ pathname: '/(tabs)/events', params: { autoSearch: 'true' } })} 
              style={{ marginRight: 20 }}
            >
              <MaterialCommunityIcons name="magnify" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          )
        }}
      />

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
      >
        <View style={styles.content}>
          <Text style={styles.welcomeText}>Agent iBillet</Text>

          <View style={styles.dateFilterContainer}>
            <View style={styles.datePickerRow}>
              <TouchableOpacity style={[styles.dateBtn, styles.dateBtnActive]} onPress={() => setShowStartPicker(true)}>
                <MaterialCommunityIcons name="calendar-import" size={18} color="#A5B4FC" />
                <Text style={styles.dateBtnText}>{formatMonthYear(startMonthYear)}</Text>
              </TouchableOpacity>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#4B5563" />
              <TouchableOpacity style={[styles.dateBtn, styles.dateBtnActive]} onPress={() => setShowEndPicker(true)}>
                <MaterialCommunityIcons name="calendar-export" size={18} color="#A5B4FC" />
                <Text style={styles.dateBtnText}>{formatMonthYear(endMonthYear)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetBtn} onPress={() => { setStartMonthYear(new Date(currentYear, 0, 1)); setEndMonthYear(new Date(currentYear, 11, 1)); }}>
                <MaterialCommunityIcons name="refresh" size={20} color="#6366F1" />
              </TouchableOpacity>
            </View>
            <Text style={styles.dateHint}>Période : Janv. - Déc. {currentYear}</Text>
          </View>

          <MonthYearPicker visible={showStartPicker} onClose={() => setShowStartPicker(false)} onSelect={setStartMonthYear} value={startMonthYear} />
          <MonthYearPicker visible={showEndPicker} onClose={() => setShowEndPicker(false)} onSelect={setEndMonthYear} value={endMonthYear} />

          <View style={styles.mainCard}>
            <Text style={styles.mainCardLabel}>Événements trouvés</Text>
            <Text style={styles.mainCardValue}>{filteredData.filteredEvents.length}</Text>
            <View style={styles.cardDivider} />
            <View style={styles.cardFooter}>
              <View style={styles.cardFooterItem}>
                <Text style={styles.footerLabel}>Billets vendus</Text>
                <Text style={styles.footerValue}>{soldTickets}</Text>
              </View>
              <View style={styles.cardFooterItem}>
                <Text style={styles.footerLabel}>Remplissage</Text>
                <Text style={styles.footerValue}>{totalPossibleTickets > 0 ? Math.round((soldTickets / totalPossibleTickets) * 100) : 0}%</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Historique d'événements</Text>
            <TouchableOpacity onPress={() => router.push('/events')}>
              <Text style={styles.viewAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {filteredData.filteredHistory.length > 0 ? (
            filteredData.filteredHistory.map((event, index) => (
              <TouchableOpacity key={index} style={styles.operationItem} onPress={() => router.push(`/event/${event.id}`)}>
                <View style={[styles.operationIconContainer, { borderColor: event.color || '#A5B4FC' }]}>
                  <MaterialCommunityIcons name="calendar-plus" size={22} color={event.color || "#A5B4FC"} />
                </View>
                <View style={styles.operationContent}>
                  <Text style={styles.operationTitle}>{event.name}</Text>
                  <Text style={styles.operationSubtitle}>
                    Créé le {new Date(event.created_at || '').toLocaleDateString('fr-FR')} pour le {new Date(event.event_date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>
                    {event.created_at ? new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>Aucun événement créé sur cette période</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 120 },
  content: { padding: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  pickerCard: { backgroundColor: '#111827', width: width * 0.85, borderRadius: 25, padding: 20, borderWidth: 1, borderColor: '#1E293B' },
  pickerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  yearSelector: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30, marginBottom: 25 },
  yearText: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  monthsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  monthItem: { width: '30%', backgroundColor: '#1E293B', paddingVertical: 15, borderRadius: 15, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  monthItemActive: { backgroundColor: '#6366F1', borderColor: '#818CF8' },
  monthText: { color: '#94A3B8', fontWeight: 'bold', fontSize: 14 },
  monthTextActive: { color: '#FFF' },
  closePickerBtn: { marginTop: 10, padding: 10, alignItems: 'center' },
  closePickerBtnText: { color: '#64748B', fontWeight: 'bold' },
  welcomeText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  dateFilterContainer: { marginBottom: 25 },
  datePickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 12, padding: 12, gap: 8, borderWidth: 1, borderColor: '#1E293B' },
  dateBtnActive: { borderColor: '#334155' },
  dateBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  dateHint: { color: '#4B5563', fontSize: 11, marginTop: 5, marginLeft: 5 },
  resetBtn: { padding: 10, backgroundColor: '#6366F115', borderRadius: 10 },
  mainCard: { backgroundColor: '#6366F1', borderRadius: 25, padding: 25, paddingVertical: 35, marginBottom: 30, elevation: 10 },
  mainCardLabel: { color: '#E0E7FF', fontSize: 14, textAlign: 'center', marginBottom: 10 },
  mainCardValue: { color: '#FFFFFF', fontSize: 48, fontWeight: 'bold', textAlign: 'center' },
  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 25 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-around' },
  cardFooterItem: { alignItems: 'center' },
  footerLabel: { color: '#E0E7FF', fontSize: 12, marginBottom: 5 },
  footerValue: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  viewAllText: { color: '#6366F1', fontSize: 14, fontWeight: 'bold' },
  operationItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  operationIconContainer: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#334155', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  operationContent: { flex: 1 },
  operationTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  operationSubtitle: { color: '#94A3B8', fontSize: 12 },
  timeContainer: { paddingLeft: 10 },
  timeText: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold' },
  emptyText: { color: '#64748B', textAlign: 'center', marginTop: 20, fontStyle: 'italic' }
});
