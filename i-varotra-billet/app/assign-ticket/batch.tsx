// app/assign-ticket/batch.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { TicketService } from '../../services/TicketService';
import { BuyerService, Buyer } from '../../services/BuyerService';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BatchAssign() {
  const { ids, eventId } = useLocalSearchParams();
  const router = useRouter();
  const ticketIds = (ids as string).split(',').map(id => parseInt(id));

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [buyerId, setBuyerId] = useState<number | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [showBuyerList, setShowBuyerList] = useState(false);
  const [buyerSearch, setBuyerSearch] = useState('');

  // États pour la création rapide d'acheteur
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useFocusEffect(useCallback(() => { 
    setBuyers(BuyerService.getBuyers()); 
  }, []));

  const filteredBuyers = buyers.filter(b => 
    b.name.toLowerCase().includes(buyerSearch.toLowerCase())
  );

  const selectBuyer = (b: Buyer) => {
    setBuyerId(b.id || null);
    setBuyerName(b.name);
    setBuyerPhone(b.phone || '');
    setShowBuyerList(false);
    setBuyerSearch('');
  };

  const handleQuickAddBuyer = () => {
    if (!newName.trim()) return;
    const newId = BuyerService.addBuyer({ name: newName, phone: newPhone });
    if (newId) {
      const b = { id: newId, name: newName, phone: newPhone };
      selectBuyer(b);
      setShowAddModal(false);
      setNewName('');
      setNewPhone('');
      setBuyers(BuyerService.getBuyers());
    }
  };

  const handleAction = (action: 'assign' | 'pay') => {
    if (!buyerName.trim()) {
      Alert.alert('Erreur', 'Veuillez choisir un acheteur.');
      return;
    }

    const tickets = TicketService.getTicketsByEvent(parseInt(eventId as string));
    const selectedTickets = tickets.filter(t => ticketIds.includes(t.id!));
    const totalPrice = selectedTickets.reduce((sum, t) => sum + t.price, 0);

    const data: any = {
      buyer_id: buyerId,
      buyer_name: buyerName.trim(),
      buyer_phone: buyerPhone.trim(),
      status: 'vendu'
    };

    if (action === 'pay') {
      data.amount_paid = totalPrice; // Paiement total pour tous
    }

    if (TicketService.updateTicketsBatch(ticketIds, data)) {
      Alert.alert('Succès', 'Billets mis à jour avec succès.');
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{ticketIds.length} Billets sélectionnés</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Choisir un acheteur</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowBuyerList(!showBuyerList)}>
            <Text style={{ color: buyerName ? '#333' : '#999', fontSize: 16 }}>
              {buyerName || "Rechercher une personne..."}
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
              {filteredBuyers.length === 0 ? (
                <TouchableOpacity 
                  style={styles.addNewOption} 
                  onPress={() => {
                    setNewName(buyerSearch);
                    setShowAddModal(true);
                    setShowBuyerList(false);
                  }}
                >
                  <MaterialCommunityIcons name="account-plus" size={24} color="#007AFF" />
                  <Text style={styles.addNewText}>Ajouter "{buyerSearch}"</Text>
                </TouchableOpacity>
              ) : (
                filteredBuyers.map(b => (
                  <TouchableOpacity key={b.id} style={styles.buyerOption} onPress={() => selectBuyer(b)}>
                    <Text style={styles.buyerNameText}>{b.name}</Text>
                    {b.phone && <Text style={{ fontSize: 12, color: '#999' }}>{b.phone}</Text>}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {buyerName ? (
          <View style={styles.selectedBuyerCard}>
            <MaterialCommunityIcons name="account-check" size={24} color="#34C759" />
            <View style={{ marginLeft: 10 }}>
              <Text style={{ fontWeight: 'bold' }}>{buyerName}</Text>
              {buyerPhone && <Text style={{ fontSize: 12, color: '#666' }}>{buyerPhone}</Text>}
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.assignBtn} onPress={() => handleAction('assign')}>
            <MaterialCommunityIcons name="account-check" size={24} color="#FFF" />
            <Text style={styles.btnText}>Assigner uniquement</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.payBtn} onPress={() => handleAction('pay')}>
            <MaterialCommunityIcons name="cash-check" size={24} color="#FFF" />
            <Text style={styles.btnText}>Assigner et Payer Totalement</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={{ color: '#FF3B30' }}>Annuler</Text>
        </TouchableOpacity>

        {/* Modal Création Rapide Acheteur */}
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
                style={styles.input} 
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
                  <Text style={styles.btnTextAdd}>Créer et Assigner</Text>
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
  formGroup: { marginBottom: 20 },
  label: { fontWeight: 'bold', marginBottom: 5 },
  input: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 10, fontSize: 16 },
  dropdown: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  buyerList: { backgroundColor: '#FFF', elevation: 3, borderRadius: 10, marginTop: 5, maxHeight: 300, borderWidth: 1, borderColor: '#EEE', overflow: 'scroll' },
  searchDropdownWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingHorizontal: 10, paddingVertical: 8 },
  searchDropdownInput: { flex: 1, marginLeft: 8, fontSize: 14, height: 40 },
  buyerOption: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  buyerNameText: { fontSize: 16, fontWeight: '500' },
  addNewOption: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  addNewText: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },
  selectedBuyerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 15, borderRadius: 10, marginBottom: 20 },
  noBuyer: { padding: 15, color: '#999', textAlign: 'center' },
  actions: { gap: 15, marginTop: 10 },
  assignBtn: { backgroundColor: '#007AFF', padding: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  payBtn: { backgroundColor: '#34C759', padding: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { marginTop: 20, padding: 15, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btnCancel: { flex: 1, padding: 15, alignItems: 'center' },
  btnTextCancel: { color: '#FF3B30', fontSize: 16 },
  btnAdd: { flex: 2, backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnTextAdd: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});