import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { TicketService, Ticket } from '../../services/TicketService';
import { EventService } from '../../services/EventService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TicketCard } from '../../components/TicketCard';
import { SearchBar } from '../../components/ui/SearchBar';
import { SuggestionList } from '../../components/ui/SuggestionList';
import { EmptyState } from '../../components/ui/EmptyState';
import { useRole } from '../../hooks/useRole';
import { StatusBar } from 'expo-status-bar';
import ConfirmModal from '../../components/ConfirmModal';
import { showSuccess, showError } from '../../utils/toast';

// ─── Fuzzy match guard: empty query matches nothing ──────────────────────────
const fuzzyMatch = (text: string, query: string): boolean => {
  if (!query) return false;
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  let i = 0, j = 0;
  while (i < t.length && j < q.length) {
    if (t[i] === q[j]) j++;
    i++;
  }
  return j === q.length;
};

export default function TicketList() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const id = parseInt(eventId as string);
  const { role } = useRole();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [eventImage, setEventImage] = useState<string | undefined>();

  // Search
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Modals
  const [showResetModal, setShowResetModal] = useState(false);
  const [showBatchResetModal, setShowBatchResetModal] = useState(false);
  const [pendingResetTicket, setPendingResetTicket] = useState<Ticket | null>(null);

  const fetchTickets = useCallback(() => {
    setTickets(TicketService.getTicketsByEvent(id));
    setTicketTypes(EventService.getTicketTypes(id));
    const event = EventService.getEventById(id);
    setEventImage(event?.image);
  }, [id]);

  useFocusEffect(useCallback(() => { fetchTickets(); }, [fetchTickets]));

  // ─── Filtering ─────────────────────────────────────────────────────────────
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (selectedTypeId !== null && t.ticket_type_id !== selectedTypeId) return false;
      if (!search) return true;
      return (
        fuzzyMatch(t.ticket_number, search) ||
        !!(t.buyer_name && t.buyer_name.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [tickets, selectedTypeId, search]);

  // ─── Suggestions ───────────────────────────────────────────────────────────
  const suggestionItems = useMemo(() => {
    if (!search) return [];
    const lowerSearch = search.toLowerCase();
    const seen = new Set<string>();
    const results: { type: string; value: string }[] = [];

    tickets.forEach(t => {
      if (fuzzyMatch(t.ticket_number, search)) {
        const key = 'num:' + t.ticket_number;
        if (!seen.has(key)) { seen.add(key); results.push({ type: 'number', value: t.ticket_number }); }
      }
      if (t.buyer_name && t.buyer_name.toLowerCase().includes(lowerSearch)) {
        const key = 'name:' + t.buyer_name;
        if (!seen.has(key)) { seen.add(key); results.push({ type: 'name', value: t.buyer_name }); }
      }
    });

    return results.slice(0, 8);
  }, [tickets, search]);

  const handleSelectSuggestion = (value: string) => {
    setSearch(value);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  // ─── Selection ─────────────────────────────────────────────────────────────
  const toggleSelection = (ticketId: number) => {
    setSelectedIds(prev => {
      const next = prev.includes(ticketId) ? prev.filter(i => i !== ticketId) : [...prev, ticketId];
      if (next.length === 0) setSelectionMode(false);
      return next;
    });
  };

  const handleLongPress = (ticketId: number) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds([ticketId]);
    }
  };

  const handlePress = (ticket: Ticket) => {
    if (selectionMode) {
      toggleSelection(ticket.id!);
    } else {
      router.push(`/assign-ticket/${ticket.id}`);
    }
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds([]);
    setShowMoreMenu(false);
  };

  const handleBatchAssign = (mode: 'assign' | 'pay' = 'assign') => {
    router.push({
      pathname: '/assign-ticket/batch',
      params: { ids: selectedIds.join(','), eventId: id, mode },
    });
    cancelSelection();
  };

  // ─── Reset verification ────────────────────────────────────────────────────
  const handleResetVerification = (ticket: Ticket) => {
    setPendingResetTicket(ticket);
    setShowResetModal(true);
  };

  const confirmResetVerification = () => {
    setShowResetModal(false);
    if (!pendingResetTicket) return;
    if (TicketService.resetTicketVerification(pendingResetTicket.id!)) {
      fetchTickets();
      showSuccess('Succès', 'La vérification a été réinitialisée.');
    } else {
      showError('Erreur', 'Impossible de réinitialiser la vérification.');
    }
    setPendingResetTicket(null);
  };

  const handleBatchResetVerification = () => {
    setShowMoreMenu(false);
    setShowBatchResetModal(true);
  };

  const confirmBatchResetVerification = () => {
    setShowBatchResetModal(false);
    if (TicketService.resetTicketsVerificationBatch(selectedIds)) {
      fetchTickets();
      cancelSelection();
      showSuccess('Succès', 'Les vérifications ont été réinitialisées.');
    } else {
      showError('Erreur', 'Impossible de réinitialiser les vérifications.');
    }
  };

  // ─── Stats for sticky counter header ───────────────────────────────────────
  const verifiedCount = useMemo(
    () => filteredTickets.filter(t => t.status_id === TicketService.STATUS_VALIDE).length,
    [filteredTickets]
  );
  const soldCount = useMemo(
    () => filteredTickets.filter(t => t.status_id === TicketService.STATUS_VENDU).length,
    [filteredTickets]
  );

  const renderItem = ({ item }: { item: Ticket }) => (
    <TicketCard
      item={item}
      isSelected={selectedIds.includes(item.id!)}
      selectionMode={selectionMode}
      role={role}
      eventImage={eventImage}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onResetVerification={handleResetVerification}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '900' },
          headerTitle: 'Liste des Billets',
        }}
      />

      {/* ── Selection header (replaces search when active) ── */}
      {selectionMode ? (
        <View style={styles.selectionHeader}>
          <TouchableOpacity onPress={cancelSelection} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="close" size={22} color="#EF4444" />
          </TouchableOpacity>

          <Text style={styles.selectionCount}>{selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}</Text>

          <View style={styles.selectionActions}>
            {role === 'admin' && (
              <TouchableOpacity onPress={() => handleBatchAssign('assign')} style={styles.selectionActionBtn}>
                <Text style={styles.selectionActionText}>Assigner</Text>
              </TouchableOpacity>
            )}
            {(role === 'admin' || role === 'verificateur') && (
              <TouchableOpacity onPress={() => setShowMoreMenu(v => !v)} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="dots-vertical" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {showMoreMenu && (
            <View style={styles.moreMenu}>
              <TouchableOpacity style={styles.menuItem} onPress={handleBatchResetVerification}>
                <MaterialCommunityIcons name="refresh" size={18} color="#F59E0B" />
                <Text style={styles.menuText}>Réinitialiser vérification</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        /* ── Search bar ── */
        <View style={styles.searchWrapper}>
          <SearchBar
            placeholder="Rechercher par n° ou acheteur..."
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setShowSuggestions(text.length > 0);
            }}
            onClear={() => setShowSuggestions(false)}
            onFocus={() => search.length > 0 && setShowSuggestions(true)}
          />
          <SuggestionList
            visible={showSuggestions && suggestionItems.length > 0}
            items={suggestionItems}
            onSelect={handleSelectSuggestion}
          />
        </View>
      )}

      {/* ── Ticket type filter chips ── */}
      {!selectionMode && ticketTypes.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={[styles.chip, selectedTypeId === null && styles.chipActive]}
            onPress={() => setSelectedTypeId(null)}
          >
            <MaterialCommunityIcons name="ticket-outline" size={14} color={selectedTypeId === null ? '#000' : '#6366F1'} />
            <Text style={[styles.chipText, selectedTypeId === null && styles.chipTextActive]}>Tous</Text>
          </TouchableOpacity>

          {ticketTypes.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[styles.chip, selectedTypeId === type.id && styles.chipActive]}
              onPress={() => setSelectedTypeId(type.id)}
            >
              <MaterialCommunityIcons name="ticket" size={14} color={selectedTypeId === type.id ? '#000' : '#6366F1'} />
              <Text style={[styles.chipText, selectedTypeId === type.id && styles.chipTextActive]}>{type.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Sticky counter header ── */}
      {!selectionMode && filteredTickets.length > 0 && (
        <View style={styles.counterHeader}>
          <View style={styles.counterItem}>
            <Text style={styles.counterValue}>{filteredTickets.length}</Text>
            <Text style={styles.counterLabel}>Total</Text>
          </View>
          <View style={styles.counterDivider} />
          <View style={styles.counterItem}>
            <Text style={[styles.counterValue, styles.counterSold]}>{soldCount}</Text>
            <Text style={styles.counterLabel}>Vendus</Text>
          </View>
          <View style={styles.counterDivider} />
          <View style={styles.counterItem}>
            <Text style={[styles.counterValue, styles.counterVerified]}>{verifiedCount}</Text>
            <Text style={styles.counterLabel}>Vérifiés</Text>
          </View>
        </View>
      )}

      {/* ── Ticket list ── */}
      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon={search ? 'ticket-search-outline' : 'ticket-outline'}
            title={search ? 'Aucun résultat' : 'Aucun billet'}
            subtitle={
              search
                ? `Aucun billet ne correspond à "${search}"`
                : 'Aucun billet disponible pour cet événement.'
            }
          />
        }
      />

      {/* ── Floating pay button (selection mode) ── */}
      {selectionMode && role === 'admin' && (
        <TouchableOpacity
          style={styles.floatingPayBtn}
          onPress={() => handleBatchAssign('pay')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="cash-check" size={22} color="#000" />
          <Text style={styles.floatingPayText}>PAYER ({selectedIds.length})</Text>
        </TouchableOpacity>
      )}

      {/* ── Modals ── */}
      <ConfirmModal
        visible={showResetModal}
        title="Réinitialiser la vérification"
        message={
          pendingResetTicket
            ? `Annuler la validation du billet ${pendingResetTicket.ticket_number} ? Il redeviendra "Vendu".`
            : ''
        }
        onConfirm={confirmResetVerification}
        onCancel={() => { setShowResetModal(false); setPendingResetTicket(null); }}
        confirmText="Réinitialiser"
        cancelText="Annuler"
        type="warning"
      />

      <ConfirmModal
        visible={showBatchResetModal}
        title="Réinitialiser les vérifications"
        message={`Annuler la validation des ${selectedIds.length} billet${selectedIds.length > 1 ? 's' : ''} sélectionné${selectedIds.length > 1 ? 's' : ''} ?`}
        onConfirm={confirmBatchResetVerification}
        onCancel={() => setShowBatchResetModal(false)}
        confirmText="Réinitialiser"
        cancelText="Annuler"
        type="warning"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },

  // ── Selection header ──────────────────────────────────────────────────────
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#000000',
    zIndex: 1000,
    minHeight: 52,
  },
  iconBtn: { padding: 4 },
  selectionCount: {
    flex: 1,
    marginLeft: 12,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  selectionActionText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '700',
  },
  moreMenu: {
    position: 'absolute',
    top: 52,
    right: 12,
    backgroundColor: '#111827',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    zIndex: 2000,
    minWidth: 220,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuText: { color: '#E2E8F0', fontSize: 15 },

  // ── Search ────────────────────────────────────────────────────────────────
  searchWrapper: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    zIndex: 100,
  },

  // ── Filter chips ──────────────────────────────────────────────────────────
  filterScroll: {
    maxHeight: 48,
    marginTop: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  chipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  chipText: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#000000',
    fontWeight: '700',
  },

  // ── Counter header ────────────────────────────────────────────────────────
  counterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 10,
  },
  counterItem: {
    flex: 1,
    alignItems: 'center',
  },
  counterValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  counterSold: { color: '#6366F1' },
  counterVerified: { color: '#10B981' },
  counterLabel: {
    color: '#4B5563',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  counterDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#1E293B',
  },

  // ── List ──────────────────────────────────────────────────────────────────
  list: {
    padding: 16,
    paddingBottom: 120,
  },

  // ── Floating pay button ───────────────────────────────────────────────────
  floatingPayBtn: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: '#10B981',
    ...Platform.select({
      ios: { shadowColor: '#10B981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  floatingPayText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
