import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TicketService, Ticket } from '../../services/TicketService';
import { BuyerService, Buyer } from '../../services/BuyerService';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AssignTicket() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const ticketId = parseInt(id as string);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [showBuyerList, setShowBuyerList] = useState(false);
  const [buyerSearch, setBuyerSearch] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const [tempAmount, setTempAmount] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);

  const fetchData = useCallback(async () => {
    const userRole = await AsyncStorage.getItem('userRole');
    setRole(userRole);

    const t = TicketService.getTicketById(ticketId);
    if (t) {
      setTicket(t);
      setBuyerName(t.buyer_name || '');
      setBuyerPhone(t.buyer_phone || '');
      setAmountPaid(t.total_paid?.toString() || '0');
    }
    setBuyers(BuyerService.getBuyers());
  }, [ticketId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

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

  const handleSave = (finalAmount?: string) => {
    if (!ticket) return;
    if (!buyerName) {
      Alert.alert('Erreur', 'Veuillez sélectionner ou créer un acheteur.');
      return;
    }

    const paid = parseFloat(finalAmount !== undefined ? finalAmount : amountPaid) || 0;
    
    const success = TicketService.assignTicket(
      ticketId,
      buyerName.trim(),
      buyerPhone.trim(),
      paid
    );

    if (success) {
      Alert.alert('Succès', 'Opération effectuée avec succès.');
      fetchData(); // Rafraîchir les données pour afficher le nouveau statut
    } else {
      Alert.alert('Erreur', 'Impossible d\'effectuer l\'opération.');
    }
  };

  const handleCancelPayment = () => {
    Alert.alert(
      'Annuler les paiements',
      'Voulez-vous vraiment supprimer TOUS les paiements associés à ce billet ?',
      [
        { text: 'Non', style: 'cancel' },
        { 
          text: 'Oui, annuler', 
          style: 'destructive',
          onPress: () => {
            if (TicketService.cancelPayments(ticketId)) {
              Alert.alert('Succès', 'Paiements annulés.');
              fetchData();
            } else {
              Alert.alert('Erreur', 'Impossible d\'annuler les paiements.');
            }
          }
        }
      ]
    );
  };

  if (!ticket) return <View style={styles.center}><Text>Billet non trouvé</Text></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.ticketHeader}>
          <Text style={styles.headerTitle}>Détails Billet</Text>
          <Text style={styles.ticketNum}>{ticket.ticket_number}</Text>
          <Text style={styles.ticketPrice}>Prix: {ticket.price} Ar</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Acheteur</Text>
          {role === 'admin' ? (
            <TouchableOpacity 
              style={styles.dropdown} 
              onPress={() => setShowBuyerList(!showBuyerList)}
            >
              <Text style={{ color: buyerName ? '#333' : '#999', fontSize: 16 }}>
                {buyerName || "Rechercher ou ajouter..."}
              </Text>
              <MaterialCommunityIcons name={showBuyerList ? "chevron-up" : "chevron-down"} size={20} color="#666" />
            </TouchableOpacity>
          ) : (
            <View style={[styles.input, { backgroundColor: '#F3F4F6' }]}>
              <Text style={{ color: '#333', fontSize: 16 }}>{buyerName || 'Non assigné'}</Text>
            </View>
          )}

          {role === 'admin' && showBuyerList && (
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

        {buyerName && role === 'admin' ? (
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

        <View style={styles.formGroup}>
          <Text style={styles.label}>Statut du paiement</Text>
          {parseFloat(amountPaid) >= (ticket?.price || 0) ? (
            <View style={styles.paidBadge}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#34C759" />
              <Text style={styles.paidText}>PAYÉ ({amountPaid} Ar)</Text>
            </View>
          ) : (
            <>
              <TextInput
                style={[styles.input, { backgroundColor: '#E9ECEF', color: '#666' }]}
                value={amountPaid}
                editable={false}
              />
              {ticket && (
                <Text style={styles.remaining}>Reste à payer: {ticket.price - (parseFloat(amountPaid) || 0)} Ar</Text>
              )}
            </>
          )}
        </View>

        {role === 'admin' && (
          <TouchableOpacity style={styles.saveButton} onPress={() => handleSave()}>
            <MaterialCommunityIcons name="content-save-check" size={24} color="#FFF" />
            <Text style={styles.saveButtonText}>Enregistrer l'assignation</Text>
          </TouchableOpacity>
        )}

        {role === 'admin' && parseFloat(amountPaid) < ticket.price && (
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: '#34C759' }]} 
            onPress={() => {
              const remaining = ticket.price - (parseFloat(amountPaid) || 0);
              setTempAmount(remaining.toString());
              setShowPayModal(true);
            }}
          >
            <MaterialCommunityIcons name="cash-plus" size={24} color="#FFF" />
            <Text style={styles.saveButtonText}>Payer</Text>
          </TouchableOpacity>
        )}

        {role === 'admin' && parseFloat(amountPaid) > 0 && (
          <TouchableOpacity 
            style={styles.cancelPaymentBtn} 
            onPress={handleCancelPayment}
          >
            <MaterialCommunityIcons name="cash-remove" size={20} color="#FF3B30" />
            <Text style={styles.cancelPaymentText}>Annuler les paiements</Text>
          </TouchableOpacity>
        )}

        {(role === 'admin' || role === 'verificateur') && ticket.status_id === TicketService.STATUS_VALIDE && (
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: '#FF9500' }]} 
            onPress={() => handleResetVerification(ticket)}
          >
            <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
            <Text style={styles.saveButtonText}>Réinitialiser vérification</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>

        {/* Modal pour le paiement */}
        <Modal visible={showPayModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Montant à payer</Text>
              <Text style={{ textAlign: 'center', marginBottom: 15, color: '#FF3B30', fontWeight: 'bold' }}>
                Reste à payer: {ticket.price - (parseFloat(amountPaid) || 0)} Ar
              </Text>
              <TextInput 
                style={styles.input} 
                placeholder="Montant" 
                keyboardType="numeric"
                value={tempAmount}
                onChangeText={setTempAmount}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.btnCancel} onPress={() => setShowPayModal(false)}>
                  <Text style={styles.btnTextCancel}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.btnAdd} 
                  onPress={() => {
                    const remaining = ticket.price - (parseFloat(amountPaid) || 0);
                    const amount = parseFloat(tempAmount) || 0;
                    if (amount > remaining) {
                      Alert.alert('Attention', `Le montant dépasse le reste à payer (${remaining} Ar). Le paiement sera ajusté au reste.`);
                      handleSave(remaining.toString());
                    } else {
                      handleSave(amount.toString());
                    }
                    setShowPayModal(false);
                  }}
                >
                  <Text style={styles.btnTextAdd}>Confirmer le paiement</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20 },
  ticketHeader: { marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#EEE', alignItems: 'center' },
  headerTitle: { fontSize: 18, color: '#666', marginBottom: 10, fontWeight: '600' },
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
  addNewOption: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  addNewText: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },
  selectedBuyerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 15, borderRadius: 10, marginBottom: 20 },
  paidBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#34C759' },
  paidText: { color: '#34C759', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  remaining: { fontSize: 13, color: '#FF3B30', marginTop: 5, fontWeight: '600' },
  saveButton: { backgroundColor: '#007AFF', flexDirection: 'row', borderRadius: 12, padding: 18, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  cancelPaymentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, marginTop: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#FF3B30', borderRadius: 10, gap: 8 },
  cancelPaymentText: { color: '#FF3B30', fontSize: 15, fontWeight: '600' },
  cancelButton: { padding: 15, alignItems: 'center', marginTop: 10 },
  cancelButtonText: { color: '#FF3B30', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  btnCancel: { flex: 1, padding: 15, alignItems: 'center' },
  btnTextCancel: { color: '#FF3B30', fontSize: 16 },
  btnAdd: { flex: 2, backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnTextAdd: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});