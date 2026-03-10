// app/assign-ticket/[id].tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { TicketService, Ticket } from '../../services/TicketService';
import { BuyerService, Buyer } from '../../services/BuyerService';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AssignTicket() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const ticketId = parseInt(id as string);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [buyerId, setBuyerId] = useState<number | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [showBuyerList, setShowBuyerList] = useState(false);
  const [buyerSearch, setBuyerSearch] = useState('');
  
  // États pour la création rapide d'acheteur
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const fetchData = useCallback(() => {
    const t = TicketService.getTicketById(ticketId);
    if (t) {
      setTicket(t);
      setBuyerId(t.buyer_id || null);
      setBuyerName(t.buyer_name || '');
      setBuyerPhone(t.buyer_phone || '');
      setAmountPaid(t.amount_paid?.toString() || '0');
    }
    setBuyers(BuyerService.getBuyers());
  }, [ticketId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

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
      fetchData(); // Rafraîchir la liste globale
    }
  };

  const handleSave = () => {
    if (!ticket) return;
    if (!buyerName) {
      Alert.alert('Erreur', 'Veuillez sélectionner un acheteur.');
      return;
    }

    const paid = parseFloat(amountPaid) || 0;
    
    const updatedTicket: Ticket = {
      ...ticket,
      buyer_id: buyerId,
      buyer_name: buyerName.trim(),
      buyer_phone: buyerPhone.trim(),
      amount_paid: paid,
      status: paid > 0 || buyerName.trim() ? 'vendu' : 'disponible'
    };

    if (TicketService.updateTicket(updatedTicket)) {
      Alert.alert('Succès', 'Billet mis à jour.');
      router.back();
    } else {
      Alert.alert('Erreur', 'Mise à jour impossible.');
    }
  };

  if (!ticket) return <View style={styles.center}><Text>Billet non trouvé</Text></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketNum}>{ticket.ticket_number}</Text>
          <Text style={styles.ticketPrice}>Prix: {ticket.price} Ar</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Choisir un acheteur</Text>
          <TouchableOpacity 
            style={styles.dropdown} 
            onPress={() => setShowBuyerList(!showBuyerList)}
          >
            <Text style={{ color: buyerName ? '#333' : '#999', fontSize: 16 }}>
              {buyerName || "Rechercher une personne..."}
            </Text>
            <MaterialCommunityIcons name={showBuyerList ? "chevron-up" : "chevron-down"} size={20} color="#666" />
          </TouchableOpacity>

          {showBuyerList && (
            <View style={styles.buyerListDropdown}>
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

        <View style={styles.formGroup}>
          <Text style={styles.label}>Montant payé (Ar)</Text>
          <TextInput
            style={styles.input}
            placeholder="Montant encaissé"
            keyboardType="numeric"
            value={amountPaid}
            onChangeText={setAmountPaid}
          />
          {parseFloat(amountPaid) < ticket.price && (
            <Text style={styles.remaining}>Reste à payer: {ticket.price - (parseFloat(amountPaid) || 0)} Ar</Text>
          )}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <MaterialCommunityIcons name="content-save-check" size={24} color="#FFF" />
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20 },
  ticketHeader: { marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#EEE', alignItems: 'center' },
  ticketNum: { fontSize: 24, fontWeight: 'bold', color: '#007AFF' },
  ticketPrice: { fontSize: 16, color: '#666', marginTop: 5 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 15, fontSize: 16 },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, padding: 15 },
  buyerListDropdown: { backgroundColor: '#FFF', borderRadius: 10, marginTop: 5, borderWidth: 1, borderColor: '#EEE', elevation: 3, maxHeight: 300, overflow: 'scroll' },
  searchDropdownWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingHorizontal: 10, paddingVertical: 8 },
  searchDropdownInput: { flex: 1, marginLeft: 8, fontSize: 14, height: 40 },
  buyerOption: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  buyerNameText: { fontSize: 16, fontWeight: '500' },
  addNewOption: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  addNewText: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },
  selectedBuyerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 15, borderRadius: 10, marginBottom: 20 },
  noBuyer: { padding: 15, color: '#999', textAlign: 'center' },
  remaining: { fontSize: 13, color: '#FF3B30', marginTop: 5, fontWeight: '600' },
  saveButton: { backgroundColor: '#007AFF', flexDirection: 'row', borderRadius: 12, padding: 18, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  cancelButton: { padding: 15, alignItems: 'center', marginTop: 10 },
  cancelButtonText: { color: '#FF3B30', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btnCancel: { flex: 1, padding: 15, alignItems: 'center' },
  btnTextCancel: { color: '#FF3B30', fontSize: 16 },
  btnAdd: { flex: 2, backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnTextAdd: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});