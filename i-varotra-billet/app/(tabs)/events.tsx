import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Keyboard,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventService, Event } from '../../services/EventService';
import { TicketService } from '../../services/TicketService';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import ConfirmModal from '../../components/ConfirmModal';
import { showSuccess, showError } from '../../utils/toast';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchBar } from '../../components/ui/SearchBar';
import { SuggestionList } from '../../components/ui/SuggestionList';
import { FAB } from '../../components/ui/FAB';
import { IconButton } from '../../components/ui/IconButton';
import { useRole } from '../../hooks/useRole';
import { useEventSearch } from '../../hooks/useEventSearch';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HistoryItem from '../../components/HistoryItem';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EventsList() {
  const [events, setEvents] = useState<(Event & { stats?: any })[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const { role } = useRole();
  const { query, setQuery, filtered, suggestions } = useEventSearch(events);

  const fetchEvents = useCallback(() => {
    const allEvents = EventService.getEvents();
    setEvents(allEvents.map(e => ({ ...e, stats: TicketService.getEventStats(e.id!) })));
  }, []);

  useFocusEffect(useCallback(() => { fetchEvents(); }, [fetchEvents]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  const handleDelete = (id: number) => {
    if (role !== 'admin') {
      showError('Accès refusé', 'Seul un administrateur peut supprimer cet événement.');
      return;
    }
    setEventToDelete(id);
    setConfirmVisible(true);
  };

  const onConfirmDelete = () => {
    if (eventToDelete !== null && EventService.deleteEvent(eventToDelete)) {
      fetchEvents();
      showSuccess('Succès', 'Événement supprimé.');
    }
    setConfirmVisible(false);
    setEventToDelete(null);
  };

  const handleSearchSelect = (value: string) => {
    setQuery(value);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleSearchToggle = () => {
    if (isSearchActive) {
      setIsSearchActive(false);
      setQuery('');
      setShowSuggestions(false);
    } else {
      setIsSearchActive(true);
    }
  };

  const suggestionItems = useMemo(
    () => suggestions.map(s => ({ type: 'event', value: s, icon: 'calendar-text' })),
    [suggestions]
  );

  // Group events by year
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const e of filtered) {
      const year = e.event_date ? new Date(e.event_date).getFullYear().toString() : 'Inconnu';
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const sections: ({ type: 'header'; year: string } | { type: 'item'; event: Event & { stats?: any } })[] = useMemo(() => {
    const result: any[] = [];
    for (const [year, items] of grouped) {
      result.push({ type: 'header', year });
      for (const e of items) result.push({ type: 'item', event: e });
    }
    return result;
  }, [grouped]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen
        options={{
          headerTitle: 'Événements',
          headerRight: () => (
            <IconButton
              icon={isSearchActive ? 'close' : 'magnify'}
              onPress={handleSearchToggle}
              style={{ marginRight: 12 }}
              color="#FFFFFF"
            />
          ),
        }}
      />

      {isSearchActive && (
        <View style={styles.searchWrapper}>
          <SearchBar
            placeholder="Rechercher un événement..."
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setShowSuggestions(text.length > 0);
            }}
            onClear={() => setShowSuggestions(false)}
            autoFocus
          />
          <SuggestionList
            visible={showSuggestions && suggestionItems.length > 0}
            items={suggestionItems}
            onSelect={handleSearchSelect}
          />
        </View>
      )}

      {!isSearchActive && filtered.length > 0 && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>{filtered.length} événement{filtered.length > 1 ? 's' : ''}</Text>
        </View>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={isSearchActive ? 'calendar-search' : 'calendar-plus-outline'}
          title={isSearchActive ? 'Aucun résultat' : 'Aucun événement'}
          subtitle={
            isSearchActive
              ? `Aucun événement ne correspond à "${query}"`
              : 'Créez votre premier événement en appuyant sur +'
          }
          actionLabel={!isSearchActive && role !== 'verificateur' ? 'Créer un événement' : undefined}
          onAction={() => router.push('/add-event')}
        />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item, index) =>
            item.type === 'header' ? `header-${item.year}` : `event-${item.event.id ?? index}`
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <View style={styles.yearHeader}>
                  <View style={styles.yearLine} />
                  <Text style={styles.yearText}>{item.year}</Text>
                  <View style={styles.yearLine} />
                </View>
              );
            }
            return (
              <HistoryItem
                event={item.event}
                onPress={() => item.event.id && router.push(`/event/${item.event.id}`)}
                onEdit={role === 'admin' ? () => router.push({ pathname: '/add-event', params: { id: item.event.id } }) : undefined}
                onDelete={role === 'admin' ? () => item.event.id && handleDelete(item.event.id) : undefined}
                showActions={role === 'admin'}
              />
            );
          }}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
        />
      )}

      {role !== 'verificateur' && (
        <FAB
          icon="plus"
          onPress={() => router.push('/add-event')}
          style={styles.fab}
        />
      )}

      {role !== 'verificateur' && (
        <FAB
          icon="account-plus"
          onPress={() => router.push('/(tabs)/buyers')}
          backgroundColor="#8B5CF6"
          style={styles.buyerFab}
        />
      )}

      <ConfirmModal
        visible={confirmVisible}
        title="Supprimer l'événement"
        message="Cette action est irréversible. Tous les billets associés seront supprimés."
        onConfirm={onConfirmDelete}
        onCancel={() => { setConfirmVisible(false); setEventToDelete(null); }}
        confirmText="Supprimer"
        type="danger"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  searchWrapper: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    zIndex: 100,
  },
  countRow: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 4,
  },
  countText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  // Year header separator
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  yearLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
  yearText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
  },
  buyerFab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#8B5CF6',
  },
});
