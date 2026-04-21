import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Keyboard, useColorScheme, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { TicketService, Ticket } from '../../services/TicketService';
import { EventService } from '../../services/EventService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/theme';
import { TicketCard } from '../../components/TicketCard';
import { StatusBar } from 'expo-status-bar';
import ConfirmModal from '../../components/ConfirmModal';
import { showSuccess, showError } from '../../utils/toast';

export default function TicketList() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const id = parseInt(eventId as string);

  const colorScheme = useColorScheme() || 'light';
  const theme = {
    ...Colors[colorScheme],
    header: '#000000',
    background: '#000000',
    card: '#111827',
    border: '#1E293B',
    text: '#FFFFFF',
    icon: '#94A3B8',
    tint: '#6366F1'
  };

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [showBatchResetModal, setShowBatchResetModal] = useState(false);
  const [pendingResetTicket, setPendingResetTicket] = useState<Ticket | null>(null);

  const fetchTickets = useCallback(() => {
    const list = TicketService.getTicketsByEvent(id);
    setTickets(list);
    
    // Fetch ticket types for filter
    const types = EventService.getTicketTypes(id);
    setTicketTypes(types);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
      const getRole = async () => {
        const userRole = await AsyncStorage.getItem('userRole');
        setRole(userRole);
      };
      getRole();
    }, [fetchTickets])
  );

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
    if (role !== 'admin' && role !== 'verificateur') return;

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

  const toggleSelection = (ticketId: number) => {
    setSelectedIds(prev => {
      if (prev.includes(ticketId)) {
        const next = prev.filter(i => i !== ticketId);
        if (next.length === 0) setSelectionMode(false);
        return next;
      } else {
        return [...prev, ticketId];
      }
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
  };

  const handleBatchAssign = (mode: 'assign' | 'pay' = 'assign') => {
    router.push({
      pathname: '/assign-ticket/batch',
      params: { ids: selectedIds.join(','), eventId: id, mode: mode }
    });
    cancelSelection();
  };

  const fuzzyMatch = (text: string, query: string) => {
    const t = text.toLowerCase();
    const q = query.toLowerCase();
    let i = 0, j = 0;
    while (i < t.length && j < q.length) {
      if (t[i] === q[j]) j++;
      i++;
    }
    return j === q.length;
  };

  const filteredTickets = tickets.filter(t => {
    // Filter by type
    if (selectedTypeId !== null && t.ticket_type_id !== selectedTypeId) {
      return false;
    }
    // Filter by search
    return fuzzyMatch(t.ticket_number, search) ||
      (t.buyer_name && t.buyer_name.toLowerCase().includes(search.toLowerCase()));
  });

  const getSuggestions = () => {
    if (search.length === 0) return [];
    const lowerSearch = search.toLowerCase();
    const results: { type: 'name' | 'number', value: string }[] = [];
    const seen = new Set<string>();

    tickets.forEach(t => {
      if (fuzzyMatch(t.ticket_number, search)) {
        if (!seen.has('num:' + t.ticket_number)) {
          results.push({ type: 'number', value: t.ticket_number });
          seen.add('num:' + t.ticket_number);
        }
      }
      if (t.buyer_name && t.buyer_name.toLowerCase().includes(lowerSearch)) {
        if (!seen.has('name:' + t.buyer_name)) {
          results.push({ type: 'name', value: t.buyer_name });
          seen.add('name:' + t.buyer_name);
        }
      }
    });

    return results.slice(0, 8);
  };

  const suggestions = getSuggestions();

  const handleSelectSuggestion = (value: string) => {
    setSearch(value);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const renderItem = ({ item }: { item: Ticket }) => (
    <TicketCard 
      item={item}
      isSelected={selectedIds.includes(item.id!)}
      selectionMode={selectionMode}
      role={role}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onResetVerification={handleResetVerification}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <Stack.Screen 
        options={{ 
          headerShown: true,
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '900' },
          headerTitle: 'Liste des Billets'
        }} 
      />
      {selectionMode ? (
        <View style={[styles.selectionHeader, { backgroundColor: theme.header, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={cancelSelection} style={styles.headerIconBtn}>
            <MaterialCommunityIcons name="close" size={24} color={theme.danger} />
          </TouchableOpacity>
          
          <Text style={[styles.selectionCount, { color: theme.text }]}>{selectedIds.length} sélectionnés</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {role === 'admin' && (
              <TouchableOpacity onPress={() => handleBatchAssign('assign')} style={{ marginRight: 15 }}>
                <Text style={[styles.headerBtnTextAssign, { color: theme.tint }]}>Assigner</Text>
              </TouchableOpacity>
            )}
            
            {(role === 'admin' || role === 'verificateur') && (
              <TouchableOpacity onPress={() => setShowMoreMenu(!showMoreMenu)} style={styles.headerIconBtn}>
                <MaterialCommunityIcons name="dots-vertical" size={24} color={theme.text} />
              </TouchableOpacity>
            )}
          </View>

          {showMoreMenu && (
            <View style={[styles.moreMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TouchableOpacity style={styles.menuItem} onPress={handleBatchResetVerification}>
                <MaterialCommunityIcons name="refresh" size={20} color={theme.warning} />
                <Text style={[styles.menuText, { color: theme.text }]}>Réinitialiser vérification</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={theme.icon} />
          <TextInput 
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Rechercher par n° ou acheteur..."
            placeholderTextColor={theme.icon}
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setShowSuggestions(text.length > 0);
            }}
            onFocus={() => setShowSuggestions(search.length > 0)}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setShowSuggestions(false); }}>
              <MaterialCommunityIcons name="close-circle" size={18} color={theme.icon} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {!selectionMode && showSuggestions && suggestions.length > 0 && (
        <View style={[styles.suggestionsList, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {suggestions.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.suggestionItem, { borderBottomColor: theme.border }]} 
              onPress={() => handleSelectSuggestion(item.value)}
            >
              <MaterialCommunityIcons 
                name={item.type === 'name' ? "account" : "ticket-outline"} 
                size={18} 
                color={item.type === 'name' ? theme.warning : theme.tint} 
              />
              <Text style={[styles.suggestionValue, { color: theme.text }]}>{item.value}</Text>
              <MaterialCommunityIcons name="arrow-top-left" size={16} color={theme.icon} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Ticket Type Filter */}
      {!selectionMode && ticketTypes.length > 0 && (
        <View style={[styles.filterSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.filterHeader}>
            <MaterialCommunityIcons name="filter-variant" size={18} color={theme.tint} />
            <Text style={[styles.filterLabel, { color: theme.text }]}>Filtrer par type</Text>
            {selectedTypeId !== null && (
              <TouchableOpacity onPress={() => setSelectedTypeId(null)} style={styles.clearFilterBtn}>
                <Text style={[styles.clearFilterText, { color: theme.danger }]}>Effacer</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedTypeId === null && { backgroundColor: theme.tint, borderColor: theme.tint }
              ]}
              onPress={() => setSelectedTypeId(null)}
            >
              <MaterialCommunityIcons 
                name="ticket-outline" 
                size={16} 
                color={selectedTypeId === null ? '#000' : theme.tint} 
              />
              <Text style={[
                styles.filterChipText,
                selectedTypeId === null && { color: '#000', fontWeight: 'bold' }
              ]}>
                Tous
              </Text>
            </TouchableOpacity>

            {ticketTypes.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.filterChip,
                  selectedTypeId === type.id && { backgroundColor: theme.tint, borderColor: theme.tint }
                ]}
                onPress={() => setSelectedTypeId(type.id)}
              >
                <MaterialCommunityIcons 
                  name="ticket" 
                  size={16} 
                  color={selectedTypeId === type.id ? '#000' : theme.tint} 
                />
                <Text style={[
                  styles.filterChipText,
                  selectedTypeId === type.id && { color: '#000', fontWeight: 'bold' }
                ]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={[styles.empty, { color: theme.icon }]}>Aucun billet trouvé</Text>}
      />

      {selectionMode && role === 'admin' && (
        <TouchableOpacity
          style={[styles.floatingPayBtn, { backgroundColor: theme.success }]}
          onPress={() => handleBatchAssign('pay')}
        >
          <MaterialCommunityIcons name="cash-check" size={28} color="#000" />
          <Text style={styles.floatingPayText}>PAYER ({selectedIds.length})</Text>
        </TouchableOpacity>
      )}

      <ConfirmModal
        visible={showResetModal}
        title="Réinitialiser la vérification"
        message={pendingResetTicket ? `Voulez-vous vraiment annuler la validation du billet ${pendingResetTicket.ticket_number} ? Il redeviendra "Vendu".` : ''}
        onConfirm={confirmResetVerification}
        onCancel={() => { setShowResetModal(false); setPendingResetTicket(null); }}
        confirmText="Réinitialiser"
        cancelText="Annuler"
        type="danger"
      />

      <ConfirmModal
        visible={showBatchResetModal}
        title="Réinitialiser les vérifications"
        message={`Voulez-vous vraiment annuler la validation des ${selectedIds.length} billets sélectionnés ?`}
        onConfirm={confirmBatchResetVerification}
        onCancel={() => setShowBatchResetModal(false)}
        confirmText="Réinitialiser"
        cancelText="Annuler"
        type="danger"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  selectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 10, 
    borderBottomWidth: 1, 
    elevation: 3,
    zIndex: 1000,
    height: 60
  },
  headerIconBtn: { padding: 5 },
  headerBtnTextAssign: { fontSize: 16, fontWeight: 'bold' },
  selectionCount: { fontSize: 18, fontWeight: 'bold' },
  moreMenu: {
    position: 'absolute',
    top: 55,
    right: 10,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 2000,
    minWidth: 200,
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 10
  },
  menuText: {
    fontSize: 16,
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    margin: 15, 
    padding: 10, 
    borderRadius: 12, 
    elevation: 1,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  suggestionsList: { 
    position: 'absolute', 
    top: 120, 
    left: 15, 
    right: 15, 
    borderRadius: 10, 
    elevation: 8, 
    zIndex: 2000, 
    borderWidth: 1, 
    maxHeight: 250
  },
  suggestionItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderBottomWidth: 1, 
  },
  suggestionValue: { flex: 1, marginLeft: 10, fontSize: 16 },
  list: { padding: 15 },
  empty: { textAlign: 'center', marginTop: 50 },
  floatingPayBtn: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    gap: 8
  },
  floatingPayText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold'
  },
  filterSection: {
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  clearFilterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  clearFilterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterScroll: { maxHeight: 45 },
  filterContainer: { flexDirection: 'row', gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600'
  }
});
