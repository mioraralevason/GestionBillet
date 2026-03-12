import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { TicketService, Ticket } from '../../services/TicketService';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TicketList() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const id = parseInt(eventId as string);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fetchTickets = useCallback(() => {
    const list = TicketService.getTicketsByEvent(id);
    setTickets(list);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
    }, [fetchTickets])
  );

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

  const handleBatchAssign = () => {
    router.push({
      pathname: '/assign-ticket/batch',
      params: { ids: selectedIds.join(','), eventId: id }
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

  const filteredTickets = tickets.filter(t => 
    fuzzyMatch(t.ticket_number, search) || 
    (t.buyer_name && t.buyer_name.toLowerCase().includes(search.toLowerCase()))
  );

  const getSuggestions = () => {
    if (search.length === 0) return [];
    const lowerSearch = search.toLowerCase();
    const results: { type: 'name' | 'number', value: string }[] = [];
    const seen = new Set<string>();

    tickets.forEach(t => {
      // Vérifier le numéro de billet avec fuzzy match
      if (fuzzyMatch(t.ticket_number, search)) {
        if (!seen.has('num:' + t.ticket_number)) {
          results.push({ type: 'number', value: t.ticket_number });
          seen.add('num:' + t.ticket_number);
        }
      }
      // Vérifier le nom de l'acheteur (inclusion simple pour éviter trop de bruit sur les noms)
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

  const getStatusColor = (statusName?: string) => {
    const name = statusName?.toLowerCase() || '';
    if (name.includes('disponible')) return '#8E8E93';
    if (name.includes('vendu')) return '#007AFF';
    if (name.includes('validé')) return '#34C759';
    return '#8E8E93';
  };

  const renderItem = ({ item }: { item: Ticket }) => {
    const isSelected = selectedIds.includes(item.id!);
    const statusText = item.status_name || 'Inconnu';
    const totalPaid = item.total_paid || 0;
    
    return (
      <TouchableOpacity 
        style={[
          styles.ticketCard, 
          isSelected && styles.selectedCard
        ]}
        onPress={() => handlePress(item)}
        onLongPress={() => handleLongPress(item.id!)}
        activeOpacity={0.7}
      >
        <View style={styles.ticketLeft}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {selectionMode && (
              <MaterialCommunityIcons 
                name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
                size={22} 
                color={isSelected ? "#007AFF" : "#CCC"} 
                style={{ marginRight: 10 }}
              />
            )}
            <Text style={styles.ticketNum}>{item.ticket_number}</Text>
          </View>
          <Text style={styles.buyerName}>{item.buyer_name || 'Disponible'}</Text>
        </View>
        
        <View style={styles.ticketRight}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(statusText) }]}>
            <Text style={styles.statusText}>{statusText.toUpperCase()}</Text>
          </View>
          <Text style={styles.price}>{item.price} Ar</Text>
          {totalPaid < item.price && statusText.toLowerCase().includes('vendu') && (
            <Text style={styles.remaining}>Reste: {item.price - totalPaid} Ar</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {selectionMode ? (
        <View style={styles.selectionHeader}>
          <TouchableOpacity onPress={cancelSelection}>
            <Text style={styles.headerBtnTextCancel}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.selectionCount}>{selectedIds.length} sélectionnés</Text>
          <TouchableOpacity onPress={handleBatchAssign}>
            <Text style={styles.headerBtnTextAssign}>Assigner</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#8E8E93" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Rechercher par n° ou acheteur..."
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setShowSuggestions(text.length > 0);
            }}
            onFocus={() => setShowSuggestions(search.length > 0)}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setShowSuggestions(false); }}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {!selectionMode && showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsList}>
          {suggestions.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.suggestionItem} 
              onPress={() => handleSelectSuggestion(item.value)}
            >
              <MaterialCommunityIcons 
                name={item.type === 'name' ? "account" : "ticket-outline"} 
                size={18} 
                color={item.type === 'name' ? "#FF9500" : "#007AFF"} 
              />
              <Text style={styles.suggestionValue}>{item.value}</Text>
              <MaterialCommunityIcons name="arrow-top-left" size={16} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Aucun billet trouvé</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  selectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#EEE',
    elevation: 3,
    zIndex: 10
  },
  headerBtnTextCancel: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
  headerBtnTextAssign: { color: '#007AFF', fontSize: 16, fontWeight: 'bold' },
  selectionCount: { fontSize: 18, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 15, padding: 10, borderRadius: 10, elevation: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  suggestionsList: { 
    position: 'absolute', 
    top: 75, 
    left: 15, 
    right: 15, 
    backgroundColor: '#FFF', 
    borderRadius: 10, 
    elevation: 5, 
    zIndex: 100, 
    borderWidth: 1, 
    borderColor: '#EEE',
    maxHeight: 250
  },
  suggestionItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0' 
  },
  suggestionValue: { flex: 1, marginLeft: 10, fontSize: 16, color: '#333' },
  list: { padding: 15 },
  ticketCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  selectedCard: { backgroundColor: '#E1F0FF', borderColor: '#007AFF', borderWidth: 1 },
  ticketLeft: { flex: 1 },
  ticketNum: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  buyerName: { fontSize: 14, color: '#666', marginTop: 4 },
  ticketRight: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 5 },
  statusText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  price: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  remaining: { fontSize: 10, color: '#FF3B30', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});