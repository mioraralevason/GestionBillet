import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  Dimensions,
  Keyboard,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventService, Event } from '../../services/EventService';
import { TicketService } from '../../services/TicketService';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import ConfirmModal from '../../components/ConfirmModal';
import { showSuccess, showError } from '../../utils/toast';
import EventCard from '../../components/EventCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchBar } from '../../components/ui/SearchBar';
import { SuggestionList } from '../../components/ui/SuggestionList';
import { FAB } from '../../components/ui/FAB';
import { IconButton } from '../../components/ui/IconButton';
import { useRole } from '../../hooks/useRole';
import { useEventSearch } from '../../hooks/useEventSearch';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const PEEK_AMOUNT = 20;

export default function EventsList() {
  const [events, setEvents] = useState<(Event & { stats?: any })[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

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

  const renderPagination = () => {
    if (filtered.length <= 1) return null;
    return (
      <View style={styles.pagination}>
        {filtered.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>
    );
  };

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
      ) : isSearchActive ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id?.toString() ?? ''}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => item.id && router.push(`/event/${item.id}`)}
              onEdit={role === 'admin' ? () => router.push({ pathname: '/add-event', params: { id: item.id } }) : undefined}
              onDelete={role === 'admin' ? () => item.id && handleDelete(item.id) : undefined}
              showActions={role === 'admin'}
            />
          )}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
        />
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={filtered}
            keyExtractor={(item) => item.id?.toString() ?? ''}
            horizontal
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 20}
            decelerationRate="fast"
            contentContainerStyle={styles.horizontalContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 20));
              setCurrentIndex(idx);
            }}
            renderItem={({ item }) => (
              <View style={styles.pageItem}>
                <EventCard
                  event={item}
                  onPress={() => item.id && router.push(`/event/${item.id}`)}
                  onEdit={role === 'admin' ? () => router.push({ pathname: '/add-event', params: { id: item.id } }) : undefined}
                  onDelete={role === 'admin' ? () => item.id && handleDelete(item.id) : undefined}
                  showActions={role === 'admin'}
                />
              </View>
            )}
          />
          {renderPagination()}
        </>
      )}

      {role !== 'verificateur' && (
        <FAB
          icon="plus"
          onPress={() => router.push('/add-event')}
          style={styles.fab}
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
    paddingBottom: 2,
  },
  countText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
  horizontalContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 20,
  },
  pageItem: {
    width: CARD_WIDTH,
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
  },
});
