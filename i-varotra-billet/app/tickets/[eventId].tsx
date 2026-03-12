import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { TicketService, Ticket } from '../../services/TicketService';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TicketList() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const id = parseInt(eventId as string);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState('');
  
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

  const filteredTickets = tickets.filter(t => 
    t.ticket_number.toLowerCase().includes(search.toLowerCase()) || 
    (t.buyer_name && t.buyer_name.toLowerCase().includes(search.toLowerCase()))
  );

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
            placeholder="Rechercher un billet..."
            value={search}
            onChangeText={setSearch}
          />
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