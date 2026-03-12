import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, Keyboard, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { TicketService, Ticket } from '../../services/TicketService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TicketList() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const id = parseInt(eventId as string);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const fetchTickets = useCallback(() => {
    const list = TicketService.getTicketsByEvent(id);
    setTickets(list);
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
    Alert.alert(
      'Réinitialiser la vérification',
      `Voulez-vous vraiment annuler la validation du billet ${ticket.ticket_number} ? Il redeviendra "Vendu".`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Réinitialiser', 
          style: 'destructive',
          onPress: () => {
            if (TicketService.resetTicketVerification(ticket.id!)) {
              fetchTickets();
              Alert.alert('Succès', 'La vérification a été réinitialisée.');
            } else {
              Alert.alert('Erreur', 'Impossible de réinitialiser la vérification.');
            }
          }
        }
      ]
    );
  };

  const handleBatchResetVerification = () => {
    setShowMoreMenu(false);
    if (role !== 'admin' && role !== 'verificateur') return;

    Alert.alert(
      'Réinitialiser les vérifications',
      `Voulez-vous vraiment annuler la validation des ${selectedIds.length} billets sélectionnés ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Réinitialiser', 
          style: 'destructive',
          onPress: () => {
            if (TicketService.resetTicketsVerificationBatch(selectedIds)) {
              fetchTickets();
              cancelSelection();
              Alert.alert('Succès', 'Les vérifications ont été réinitialisées.');
            } else {
              Alert.alert('Erreur', 'Impossible de réinitialiser les vérifications.');
            }
          }
        }
      ]
    );
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
            {statusText.toLowerCase().includes('validé') && (
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="check-decagram" size={16} color="#34C759" />
                <Text style={styles.verifiedLabel}>Vérifié</Text>
                {(role === 'admin' || role === 'verificateur') && (
                  <TouchableOpacity 
                    style={styles.resetBtn} 
                    onPress={() => handleResetVerification(item)}
                  >
                    <MaterialCommunityIcons name="refresh" size={14} color="#007AFF" />
                  </TouchableOpacity>
                )}
              </View>
            )}
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
          <TouchableOpacity onPress={cancelSelection} style={styles.headerIconBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#FF3B30" />
          </TouchableOpacity>
          
          <Text style={styles.selectionCount}>{selectedIds.length} sélectionnés</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {role === 'admin' && (
              <TouchableOpacity onPress={() => handleBatchAssign('assign')} style={{ marginRight: 15 }}>
                <Text style={styles.headerBtnTextAssign}>Assigner</Text>
              </TouchableOpacity>
            )}
            
            {(role === 'admin' || role === 'verificateur') && (
              <TouchableOpacity onPress={() => setShowMoreMenu(!showMoreMenu)} style={styles.headerIconBtn}>
                <MaterialCommunityIcons name="dots-vertical" size={24} color="#333" />
              </TouchableOpacity>
            )}
          </View>

          {showMoreMenu && (
            <View style={styles.moreMenu}>
              <TouchableOpacity style={styles.menuItem} onPress={handleBatchResetVerification}>
                <MaterialCommunityIcons name="refresh" size={20} color="#FF9500" />
                <Text style={styles.menuText}>Réinitialiser vérification</Text>
              </TouchableOpacity>
            </View>
          )}
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

      {selectionMode && role === 'admin' && (
        <TouchableOpacity 
          style={styles.floatingPayBtn} 
          onPress={() => handleBatchAssign('pay')}
        >
          <MaterialCommunityIcons name="cash-check" size={28} color="#FFF" />
          <Text style={styles.floatingPayText}>PAYER ({selectedIds.length})</Text>
        </TouchableOpacity>
      )}
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
    padding: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#EEE',
    elevation: 3,
    zIndex: 1000,
    height: 60
  },
  headerIconBtn: { padding: 5 },
  headerBtnTextCancel: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
  headerBtnTextAssign: { color: '#007AFF', fontSize: 16, fontWeight: 'bold' },
  selectionCount: { fontSize: 18, fontWeight: 'bold' },
  moreMenu: {
    position: 'absolute',
    top: 55,
    right: 10,
    backgroundColor: '#FFF',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 2000,
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 10
  },
  menuText: {
    fontSize: 16,
    color: '#333'
  },
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
  verifiedBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginLeft: 8, 
    backgroundColor: '#E8F5E9', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4 
  },
  verifiedLabel: { 
    fontSize: 10, 
    color: '#34C759', 
    fontWeight: 'bold', 
    marginLeft: 4 
  },
  resetBtn: {
    marginLeft: 10,
    backgroundColor: '#FFF',
    padding: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF'
  },
  buyerName: { fontSize: 14, color: '#666', marginTop: 4 },
  ticketRight: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 5 },
  statusText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  price: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  remaining: { fontSize: 10, color: '#FF3B30', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
  floatingPayBtn: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#34C759',
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
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  }
});