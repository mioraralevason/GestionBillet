import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { TicketService, Ticket } from '../../services/TicketService';
import { BuyerService, Buyer } from '../../services/BuyerService';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BatchAssign() {
  const { ids, eventId, mode } = useLocalSearchParams();
  const router = useRouter();
  const ticketIds = (ids as string).split(',').map(id => parseInt(id));

  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [showBuyerList, setShowBuyerList] = useState(false);
  const [buyerSearch, setBuyerSearch] = useState('');

  const [amounts, setAmounts] = useState<Record<number, string>>({});

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useFocusEffect(useCallback(() => { 
    setBuyers(BuyerService.getBuyers()); 
    const fetched = ticketIds.map(id => TicketService.getTicketById(id)).filter(t => t !== null) as Ticket[];
    setSelectedTickets(fetched);
    
    const initialAmounts: Record<number, string> = {};
    fetched.forEach(t => {
      if (mode === 'pay') {
        initialAmounts[t.id!] = t.price.toString();
      } else {
        initialAmounts[t.id!] = '0';
      }
    });
    setAmounts(initialAmounts);
  }, [ids, mode]));

  const updateAmount = (id: number, val: string) => {
    setAmounts(prev => ({ ...prev, [id]: val }));
  };

  const setAllToPaid = () => {
    const newAmounts: Record<number, string> = {};
    selectedTickets.forEach(t => {
      newAmounts[t.id!] = t.price.toString();
    });
    setAmounts(newAmounts);
  };

  const filteredBuyers = buyers.filter(b => 
    b.name.toLowerCase().includes(buyerSearch.toLowerCase())
  );

  const selectBuyer = (b: Buyer) => {
    setBuyerName(b.name);
    setBuyerPhone(b.phone || '');
    setShowBuyerList(false);
    setBuyerSearch('');
  };

  const handleQuickAddBuyer = () => {
    if (!newName.trim()) return;
    setBuyerName(newName.trim());
    setBuyerPhone(newPhone.trim());
    setShowAddModal(false);
    setNewName('');
    setNewPhone('');
  };

  const handleAction = () => {
    if (!buyerName.trim()) {
      Alert.alert('Erreur', 'Veuillez choisir un acheteur.');
      return;
    }

    const items = selectedTickets.map(t => ({
      id: t.id!,
      amount: parseFloat(amounts[t.id!] || '0')
    }));

    const data = {
      buyer_name: buyerName.trim(),
      buyer_phone: buyerPhone.trim(),
      items: items
    };

    if (TicketService.updateTicketsBatch(data)) {
      Alert.alert('Succès', 'Billets mis à jour avec succès.');
      router.back();
    } else {
      Alert.alert('Erreur', 'Impossible de mettre à jour les billets.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === 'assign' ? 'Assignation Groupée' : 'Paiement Groupé'}
          </Text>
          <Text style={styles.subtitle}>{ticketIds.length} Billets sélectionnés</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Acheteur pour tous les billets</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowBuyerList(!showBuyerList)}>
            <Text style={{ color: buyerName ? '#333' : '#999', fontSize: 16 }}>
              {buyerName || "Rechercher ou ajouter..."}
            </Text>
            <MaterialCommunityIcons name={showBuyerList ? "chevron-up" : "chevron-down"} size={20} />
          </TouchableOpacity>

          {showBuyerList && (
            <View style={styles.buyerList}>
              <View style={styles.searchDropdownWrapper}>
                <MaterialCommunityIcons name="magnify" size={18} color="#999" />
                <TextInput
                  style={styles.searchDropdownInput}
                  placeholder="Rechercher..."
                  value={buyerSearch}
                  onChangeText={setBuyerSearch}
                  autoFocus
                />
              </View>
              
              <TouchableOpacity 
                style={styles.addNewOption} 
                onPress={() => {
                  setNewName(buyerSearch);
                  setShowAddModal(true);
                  setShowBuyerList(false);
                }}
              >
                <MaterialCommunityIcons name="account-plus" size={24} color="#007AFF" />
                <Text style={styles.addNewText}>Nouvel acheteur</Text>
              </TouchableOpacity>

              {filteredBuyers.map(b => (
                <TouchableOpacity key={b.id} style={styles.buyerOption} onPress={() => selectBuyer(b)}>
                  <Text style={styles.buyerNameText}>{b.name}</Text>
                  {b.phone && <Text style={{ fontSize: 12, color: '#999' }}>{b.phone}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {buyerName ? (
          <View style={styles.selectedBuyerCard}>
            <MaterialCommunityIcons name="account-check" size={24} color="#34C759" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={{ fontWeight: 'bold' }}>{buyerName}</Text>
              {buyerPhone && <Text style={{ fontSize: 12, color: '#666' }}>{buyerPhone}</Text>}
            </View>
            <TouchableOpacity onPress={() => { setBuyerName(''); setBuyerPhone(''); }}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ) : null}

        {mode === 'pay' && (
          <View style={styles.ticketsSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.label}>Détails des paiements</Text>
              <TouchableOpacity onPress={setAllToPaid}>
                <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Tout payer totalement</Text>
              </TouchableOpacity>
            </View>
            
            {selectedTickets.map(t => (
              <View key={t.id} style={styles.ticketItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketNum}>{t.ticket_number}</Text>
                  <Text style={styles.ticketPrice}>{t.price} Ar</Text>
                </View>
                <TextInput
                  style={styles.amountInput}
                  keyboardType="numeric"
                  placeholder="Montant"
                  value={amounts[t.id!] || ''}
                  onChangeText={(val) => updateAmount(t.id!, val)}
                />
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.assignBtn, mode === 'pay' && { backgroundColor: '#34C759' }]} 
            onPress={handleAction}
          >
            <MaterialCommunityIcons 
              name={mode === 'assign' ? "account-check" : "cash-check"} 
              size={24} 
              color="#FFF" 
            />
            <Text style={styles.btnText}>
              {mode === 'assign' ? "Confirmer l'assignation" : "Confirmer le paiement"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={{ color: '#FF3B30', fontSize: 16 }}>Annuler</Text>
        </TouchableOpacity>

        <Modal visible={showAddModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nouvel Acheteur</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Nom complet" 
                value={newName}
                onChangeText={setNewName}
              />
              <TextInput 
                style={[styles.input, { marginTop: 10 }]} 
                placeholder="Téléphone" 
                keyboardType="phone-pad"
                value={newPhone}
                onChangeText={setNewPhone}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.btnCancel} onPress={() => setShowAddModal(false)}>
                  <Text style={styles.btnTextCancel}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnAdd} onPress={handleQuickAddBuyer}>
                  <Text style={styles.btnTextAdd}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scroll: { padding: 20 },
  header: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#007AFF' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 10, fontSize: 16 },
  dropdown: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  buyerList: { backgroundColor: '#FFF', elevation: 3, borderRadius: 10, marginTop: 5, maxHeight: 300, borderWidth: 1, borderColor: '#EEE', overflow: 'scroll' },
  searchDropdownWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingHorizontal: 10, paddingVertical: 8 },
  searchDropdownInput: { flex: 1, marginLeft: 8, fontSize: 14, height: 40 },
  buyerOption: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  buyerNameText: { fontSize: 16, fontWeight: '500' },
  addNewOption: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  addNewText: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },
  selectedBuyerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 15, borderRadius: 10, marginBottom: 20 },
  ticketsSection: { marginBottom: 30 },
  ticketItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F9F9F9', borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#EEE' },
  ticketNum: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  ticketPrice: { fontSize: 13, color: '#666' },
  amountInput: { backgroundColor: '#FFF', width: 100, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#CCC', textAlign: 'right', fontSize: 16 },
  actions: { gap: 15, marginTop: 10 },
  assignBtn: { backgroundColor: '#007AFF', padding: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { marginTop: 20, padding: 15, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  btnCancel: { flex: 1, padding: 15, alignItems: 'center' },
  btnTextCancel: { color: '#FF3B30', fontSize: 16 },
  btnAdd: { flex: 2, backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnTextAdd: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});