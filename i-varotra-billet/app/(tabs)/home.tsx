import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { EventService, Event } from '../../services/EventService';
import { TicketService } from '../../services/TicketService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRole } from '../../hooks/useRole';
import EventCard from '../../components/EventCard';
import { IconButton } from '../../components/ui/IconButton';
import MonthYearPicker from '../../components/Pickers/MonthYearPicker';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

// ─── KPI Card ───────────────────────────────────────────────────────────────

interface KpiCardProps {
  eventCount: number;
  soldTickets: number;
  fillPercent: number;
}

const KpiCard: React.FC<KpiCardProps> = ({ eventCount, soldTickets, fillPercent }) => (
  <View style={styles.kpiCard}>
    <View style={styles.kpiMain}>
      <Text style={styles.kpiLabel}>Événements</Text>
      <Text style={styles.kpiValue}>{eventCount}</Text>
    </View>

    <View style={styles.kpiDivider} />

    <View style={styles.kpiRow}>
      <View style={styles.kpiItem}>
        <MaterialCommunityIcons name="ticket-confirmation-outline" size={20} color="rgba(255,255,255,0.7)" />
        <Text style={styles.kpiItemValue}>{soldTickets}</Text>
        <Text style={styles.kpiItemLabel}>Billets vendus</Text>
      </View>
      <View style={styles.kpiItemSeparator} />
      <View style={styles.kpiItem}>
        <MaterialCommunityIcons name="chart-pie" size={20} color="rgba(255,255,255,0.7)" />
        <Text style={styles.kpiItemValue}>{fillPercent}%</Text>
        <Text style={styles.kpiItemLabel}>Remplissage</Text>
      </View>
    </View>

    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(fillPercent, 100)}%` as any }]} />
    </View>
  </View>
);

// ─── Period Filter ──────────────────────────────────────────────────────────

const formatPeriod = (date: Date | null): string => {
  if (!date) return 'MM/AAAA';
  const m = date.toLocaleDateString('fr-FR', { month: 'short' });
  return `${m.charAt(0).toUpperCase() + m.slice(1)} ${date.getFullYear()}`;
};

const dateVal = (d: Date | null) => (d ? d.getFullYear() * 12 + d.getMonth() : null);

// ─── Home Screen ────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const { role } = useRole();
  const currentYear = new Date().getFullYear();

  const [events, setEvents] = useState<Event[]>([]);
  const [recentCreations, setRecentCreations] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(new Date(currentYear, 0, 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date(currentYear, 11, 1));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyRef = useRef<FlatList>(null);

  const fetchData = useCallback(async () => {
    setEvents(EventService.getEvents());
    setRecentCreations(EventService.getRecentCreations());
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Filter events & history by period
  const { filteredEvents, filteredHistory } = useMemo(() => {
    const startV = dateVal(startDate);
    const endV = dateVal(endDate);

    const inRange = (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        const v = d.getFullYear() * 12 + d.getMonth();
        return startV == null || endV == null || (v >= startV && v <= endV);
      } catch {
        return true;
      }
    };

    const filteredEvents = startV == null ? events : events.filter(e => inRange(e.event_date));
    const filteredHistory = startV == null ? recentCreations : recentCreations.filter(e => inRange(e.created_at || e.event_date));

    return { filteredEvents, filteredHistory };
  }, [events, recentCreations, startDate, endDate]);

  // KPI calculations
  const { soldTickets, totalTickets } = useMemo(() => {
    let sold = 0;
    let total = 0;
    filteredEvents.forEach(e => {
      const s = TicketService.getEventStats(e.id!);
      sold += s.sold + s.validated;
      total += s.total;
    });
    return { soldTickets: sold, totalTickets: total };
  }, [filteredEvents]);

  const fillPercent = totalTickets > 0 ? Math.round((soldTickets / totalTickets) * 100) : 0;

  // Add stats to history items for EventCard
  const historyWithStats = useMemo(() =>
    filteredHistory.map(e => ({ ...e, stats: TicketService.getEventStats(e.id!) })),
    [filteredHistory]
  );

  const resetPeriod = useCallback(() => {
    setStartDate(new Date(currentYear, 0, 1));
    setEndDate(new Date(currentYear, 11, 1));
  }, [currentYear]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen
        options={{
          headerTitle: 'iBillet',
          headerRight: () => (
            <IconButton
              icon="magnify"
              onPress={() => router.push('/(tabs)/events' as any)}
              style={{ marginRight: 12 }}
              color="#FFFFFF"
            />
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
      >
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingLabel}>Tableau de bord</Text>
            <Text style={styles.greetingName}>Agent iBillet</Text>
          </View>
          <View style={styles.greetingBadge}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#6366F1" />
            <Text style={styles.greetingRole}>{role === 'admin' ? 'Admin' : 'Vérif.'}</Text>
          </View>
        </View>

        {/* Period Filter */}
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowStartPicker(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="calendar-import" size={15} color="#94A3B8" />
            <Text style={styles.filterBtnText}>{formatPeriod(startDate)}</Text>
          </TouchableOpacity>

          <MaterialCommunityIcons name="arrow-right" size={14} color="#334155" />

          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowEndPicker(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="calendar-export" size={15} color="#94A3B8" />
            <Text style={styles.filterBtnText}>{formatPeriod(endDate)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetBtn} onPress={resetPeriod} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="refresh" size={18} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {/* KPI Card */}
        <KpiCard
          eventCount={filteredEvents.length}
          soldTickets={soldTickets}
          fillPercent={fillPercent}
        />

        {/* Historique Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historique</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/events' as any)} activeOpacity={0.7}>
            <Text style={styles.sectionLink}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {historyWithStats.length === 0 ? (
          <View style={styles.emptyHistory}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={40} color="#1E293B" />
            <Text style={styles.emptyText}>Aucun événement sur cette période</Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={historyRef}
              data={historyWithStats}
              keyExtractor={item => item.id?.toString() ?? ''}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + 12}
              decelerationRate="fast"
              contentContainerStyle={styles.historyList}
              scrollEnabled
              onMomentumScrollEnd={e => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 12));
                setHistoryIndex(idx);
              }}
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
                  <EventCard
                    event={item}
                    onPress={() => router.push(`/event/${item.id}`)}
                    showActions={false}
                  />
                </View>
              )}
            />

            {historyWithStats.length > 1 && (
              <View style={styles.pagination}>
                {historyWithStats.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === historyIndex && styles.dotActive]}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Pickers */}
      <MonthYearPicker
        visible={showStartPicker}
        onClose={() => setShowStartPicker(false)}
        onSelect={setStartDate}
        value={startDate}
      />
      <MonthYearPicker
        visible={showEndPicker}
        onClose={() => setShowEndPicker(false)}
        onSelect={setEndDate}
        value={endDate}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scroll: { paddingBottom: 130 },

  // Greeting
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greetingLabel: { color: '#4B5563', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  greetingName: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  greetingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  greetingRole: { color: '#818CF8', fontSize: 12, fontWeight: '700' },

  // Period filter
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  filterBtnText: { color: '#E2E8F0', fontSize: 12, fontWeight: '600', flex: 1 },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99,102,241,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // KPI Card
  kpiCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#6366F1',
    borderRadius: 20,
    padding: 22,
  },
  kpiMain: { alignItems: 'center', marginBottom: 8 },
  kpiLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  kpiValue: { color: '#FFFFFF', fontSize: 52, fontWeight: '900', lineHeight: 56 },
  kpiDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 16 },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  kpiItem: { alignItems: 'center', gap: 4 },
  kpiItemValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  kpiItemLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '500' },
  kpiItemSeparator: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 2 },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  sectionLink: { color: '#6366F1', fontSize: 13, fontWeight: '600' },

  // History list
  historyList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  historyItem: {
    width: CARD_WIDTH,
  },

  // Pagination dots
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    paddingBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E293B',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },

  // Empty state
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 10,
    marginHorizontal: 20,
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  emptyText: { color: '#4B5563', fontSize: 14, fontStyle: 'italic' },

});
