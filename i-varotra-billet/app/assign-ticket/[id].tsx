// app/assign-ticket/[id].tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfirmModal from '../../components/ConfirmModal';
import { AttendanceService, ValidationResult } from '../../services/AttendanceService';
import { Buyer, BuyerService } from '../../services/BuyerService';
import { Ticket, TicketService } from '../../services/TicketService';
import { showError, showSuccess } from '../../utils/toast';

export default function AssignTicket() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const ticketId = parseInt(id as string, 10);

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
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCancelPaymentConfirm, setShowCancelPaymentConfirm] = useState(false);
  const [showSaveError, setShowSaveError] = useState(false);
  const [showPayAdjustment, setShowPayAdjustment] = useState(false);
  const [adjustmentMessage, setAdjustmentMessage] = useState('');

  const fetchData = useCallback(async () => {
    if (!ticketId || isNaN(ticketId)) return;

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

  useEffect(() => {
    if (ticketId) fetchData();
  }, [ticketId]);

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
    if (!buyerName.trim()) {
      setShowSaveError(true);
      return;
    }
    const paid = finalAmount !== undefined ? parseFloat(finalAmount) || 0 : 0;
    const success = TicketService.assignTicket(ticketId, buyerName.trim(), buyerPhone.trim(), paid);
    if (success) {
      showSuccess('Assignation enregistrée avec succès');
      fetchData();
    } else {
      showError('Impossible d\'enregistrer');
    }
  };

  const handleVerify = () => {
    if (!ticket) return;
    const res = AttendanceService.verifyTicketById(ticketId);
    setValidationResult(res);
    if (res.success) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    fetchData();
  };

  const handleResetVerification = () => setShowResetConfirm(true);
  const executeResetVerification = () => {
    setShowResetConfirm(false);
    if (ticket && TicketService.resetTicketVerification(ticket.id!)) {
      fetchData();
      showSuccess('La vérification a été réinitialisée.');
    } else {
      showError('Impossible de réinitialiser la vérification.');
    }
  };

  const handleCancelPayment = () => setShowCancelPaymentConfirm(true);
  const executeCancelPayment = () => {
    setShowCancelPaymentConfirm(false);
    if (TicketService.cancelPayments(ticketId)) {
      showSuccess('Paiements annulés.');
      fetchData();
    } else {
      showError('Impossible d\'annuler les paiements.');
    }
  };

  if (!ticket) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: '#FFF', fontSize: 18 }}>Aucun billet trouvé</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={{ color: '#6366F1' }}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '900' },
          headerTitle: `Billet #${ticket.ticket_number}`,
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.headerCard}>
            <View style={styles.logoBox}>
              <MaterialCommunityIcons name="ticket-confirmation" size={40} color="#6366F1" />
            </View>
            <Text style={styles.ticketNum}>{ticket.ticket_number}</Text>
            <Text style={styles.ticketPrice}>{ticket.price} Ar</Text>
            <View style={[styles.statusBadge,
              ticket.status_id === TicketService.STATUS_VALIDE ? styles.statusValide :
              ticket.status_id === TicketService.STATUS_VENDU ? styles.statusVendu : styles.statusLibre]}>
              <Text style={styles.statusText}>{ticket.status_name?.toUpperCase()}</Text>
            </View>
          </View>

          {/* Acheteur */}
          <View style={styles.section}>
            <Text style={styles.label}>ACHETEUR</Text>
            {role === 'admin' ? (
              <View>
                <TouchableOpacity style={styles.dropdown} onPress={() => {
                  setShowBuyerList(!showBuyerList);
                  if (!showBuyerList) setBuyerSearch('');
                }}>
                  <MaterialCommunityIcons name="account" size={20} color="#6366F1" style={{ marginRight: 10 }} />
                  <Text style={{ color: buyerName ? '#FFFFFF' : '#64748B', fontSize: 16, flex: 1 }}>
                    {buyerName || "Sélectionner un acheteur..."}
                  </Text>
                  <MaterialCommunityIcons name={showBuyerList ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
                </TouchableOpacity>

                {showBuyerList && (
                  <View style={styles.buyerListDropdown}>
                    <View style={styles.searchDropdownWrapper}>
                      <MaterialCommunityIcons name="magnify" size={18} color="#94A3B8" />
                      <TextInput
                        style={styles.searchDropdownInput}
                        placeholder="Rechercher un acheteur..."
                        placeholderTextColor="#64748B"
                        value={buyerSearch}
                        onChangeText={setBuyerSearch}
                        autoFocus
                      />
                    </View>

                    <TouchableOpacity style={styles.addNewOption} onPress={() => {
                      setNewName(buyerSearch);
                      setShowAddModal(true);
                      setShowBuyerList(false);
                    }}>
                      <MaterialCommunityIcons name="account-plus" size={24} color="#6366F1" />
                      <Text style={styles.addNewText}>Créer un nouvel acheteur</Text>
                    </TouchableOpacity>

                    <ScrollView style={styles.buyerListScroll} nestedScrollEnabled>
                      {buyerSearch.length > 0 ? (
                        filteredBuyers.length > 0 ? (
                          filteredBuyers.map(b => (
                            <TouchableOpacity key={b.id} style={styles.buyerOption} onPress={() => selectBuyer(b)}>
                              <Text style={styles.buyerNameText}>{b.name}</Text>
                              {b.phone && <Text style={styles.buyerPhoneText}>{b.phone}</Text>}
                            </TouchableOpacity>
                          ))
                        ) : (
                          <Text style={styles.noResultText}>Aucun acheteur trouvé</Text>
                        )
                      ) : (
                        <Text style={styles.noResultText}>Tapez pour rechercher...</Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.readOnlyBox}>
                <MaterialCommunityIcons name="account" size={20} color="#6366F1" style={{ marginRight: 10 }} />
                <Text style={{ color: '#FFFFFF', fontSize: 16 }}>{buyerName || 'Non assigné'}</Text>
              </View>
            )}

            {buyerName && buyerPhone && (
              <View style={styles.phoneBox}>
                <MaterialCommunityIcons name="phone" size={20} color="#6366F1" style={{ marginRight: 10 }} />
                <Text style={{ color: '#FFFFFF', fontSize: 16 }}>{buyerPhone}</Text>
              </View>
            )}
          </View>

          {/* Paiement */}
          <View style={styles.section}>
            <Text style={styles.label}>PAIEMENT</Text>
            {parseFloat(amountPaid) >= (ticket.price || 0) ? (
              <View style={styles.paidBadge}>
                <MaterialCommunityIcons name="cash-check" size={24} color="#A5B4FC" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.paidTitle}>TOTALEMENT PAYÉ</Text>
                  <Text style={styles.paidAmount}>{amountPaid} Ar</Text>
                </View>
              </View>
            ) : (
              <View style={styles.unpaidBox}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Déjà payé :</Text>
                  <Text style={styles.paymentValue}>{amountPaid} Ar</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Reste à payer :</Text>
                  <Text style={[styles.paymentValue, { color: '#FF2E63' }]}>
                    {ticket.price - parseFloat(amountPaid || '0')} Ar
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Boutons */}
          <View style={styles.buttonContainer}>
            {role === 'admin' && (
              <TouchableOpacity style={styles.saveButton} onPress={() => handleSave()}>
                <MaterialCommunityIcons name="content-save-check" size={24} color="#000" />
                <Text style={styles.saveButtonText}>Enregistrer l'assignation</Text>
              </TouchableOpacity>
            )}

            {role === 'admin' && parseFloat(amountPaid) < (ticket.price || 0) && (
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#10B981' }]} onPress={() => {
                const remaining = ticket.price - parseFloat(amountPaid || '0');
                setTempAmount(remaining.toString());
                setShowPayModal(true);
              }}>
                <MaterialCommunityIcons name="cash-plus" size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>Payer le reste</Text>
              </TouchableOpacity>
            )}

            {(role === 'admin' || role === 'verificateur') && ticket.status_id !== TicketService.STATUS_VALIDE && (
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#6366F1' }]} onPress={handleVerify}>
                <MaterialCommunityIcons name="check-decagram" size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>Vérifier Billet</Text>
              </TouchableOpacity>
            )}

            {(role === 'admin' || role === 'verificateur') && ticket.status_id === TicketService.STATUS_VALIDE && (
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F59E0B' }]} onPress={handleResetVerification}>
                <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>Réinitialiser vérification</Text>
              </TouchableOpacity>
            )}

            {role === 'admin' && parseFloat(amountPaid) > 0 && (
              <TouchableOpacity style={styles.cancelPaymentBtn} onPress={handleCancelPayment}>
                <MaterialCommunityIcons name="cash-remove" size={20} color="#FF2E63" />
                <Text style={styles.cancelPaymentText}>Annuler les paiements</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour à la liste</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Nouvel Acheteur */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlayDark}>
          <View style={styles.modalContentDark}>
            <Text style={styles.modalTitleDark}>Nouvel Acheteur</Text>
            <TextInput style={styles.darkInput} placeholder="Nom complet" value={newName} onChangeText={setNewName} />
            <TextInput style={[styles.darkInput, { marginTop: 15 }]} placeholder="Téléphone" keyboardType="phone-pad" value={newPhone} onChangeText={setNewPhone} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setShowAddModal(false)}>
                <Text style={styles.btnTextCancel}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirm} onPress={handleQuickAddBuyer}>
                <Text style={styles.btnTextConfirm}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Paiement */}
      <Modal visible={showPayModal} transparent animationType="fade">
        <View style={styles.modalOverlayDark}>
          <View style={styles.modalContentDark}>
            <Text style={styles.modalTitleDark}>Montant à payer</Text>
            <Text style={styles.remainingText}>Reste : {ticket.price - parseFloat(amountPaid || '0')} Ar</Text>
            <TextInput style={styles.darkInput} placeholder="Montant" keyboardType="numeric" value={tempAmount} onChangeText={setTempAmount} autoFocus />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setShowPayModal(false)}>
                <Text style={styles.btnTextCancel}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirm} onPress={() => {
                const remaining = ticket.price - parseFloat(amountPaid || '0');
                const amount = parseFloat(tempAmount) || 0;
                if (amount > remaining) {
                  setAdjustmentMessage(`Le montant a été ajusté à ${remaining} Ar`);
                  setShowPayAdjustment(true);
                  handleSave(remaining.toString());
                } else {
                  handleSave(amount.toString());
                }
                setShowPayModal(false);
              }}>
                <Text style={styles.btnTextConfirm}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Modals */}
      <ConfirmModal visible={showResetConfirm} title="Réinitialiser la vérification" message={`Voulez-vous vraiment annuler la validation du billet ${ticket?.ticket_number} ?`} onConfirm={executeResetVerification} onCancel={() => setShowResetConfirm(false)} confirmText="Réinitialiser" type="warning" />

      <ConfirmModal visible={showCancelPaymentConfirm} title="Annuler les paiements" message="Voulez-vous vraiment supprimer TOUS les paiements associés à ce billet ?" onConfirm={executeCancelPayment} onCancel={() => setShowCancelPaymentConfirm(false)} confirmText="Oui, annuler" type="danger" />

      <ConfirmModal visible={showSaveError} title="Erreur" message="Veuillez sélectionner ou créer un acheteur." onConfirm={() => setShowSaveError(false)} type="danger" showCancel={false} />

      <ConfirmModal visible={showPayAdjustment} title="Attention" message={adjustmentMessage} onConfirm={() => setShowPayAdjustment(false)} type="warning" showCancel={false} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },
  scroll: { padding: 20 },

  headerCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  logoBox: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  ticketNum: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  ticketPrice: { fontSize: 20, color: '#94A3B8', marginTop: 5 },
  statusBadge: { marginTop: 15, paddingHorizontal: 15, paddingVertical: 6, borderRadius: 12 },
  statusValide: { backgroundColor: '#10B98133', borderWidth: 1, borderColor: '#10B981' },
  statusVendu: { backgroundColor: '#F59E0B33', borderWidth: 1, borderColor: '#F59E0B' },
  statusLibre: { backgroundColor: '#6366F133', borderWidth: 1, borderColor: '#6366F1' },
  statusText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  remainingText: { color: '#94A3B8', marginBottom: 12, textAlign: 'center' },
  
  section: { marginBottom: 25 },
  label: { fontSize: 12, fontWeight: '800', color: '#6366F1', marginBottom: 12, letterSpacing: 2 },

  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#1E293B',
  },

  buyerListDropdown: {
    backgroundColor: '#111827',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    elevation: 10,
    maxHeight: 340,
    overflow: 'hidden',
  },

  searchDropdownWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    padding: 12,
  },
  searchDropdownInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#FFFFFF' },

  buyerListScroll: { maxHeight: 260 },
  buyerOption: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  buyerNameText: { fontSize: 16, fontWeight: '500', color: '#FFFFFF' },
  buyerPhoneText: { fontSize: 13, color: '#94A3B8' },

  addNewOption: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  addNewText: { color: '#6366F1', fontWeight: 'bold' },

  noResultText: { textAlign: 'center', padding: 25, color: '#64748B', fontStyle: 'italic' },

  readOnlyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#1E293B' },
  phoneBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 12, padding: 15, marginTop: 10, borderWidth: 1, borderColor: '#1E293B' },

  paidBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B9811A', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#10B981' },
  paidTitle: { color: '#A5B4FC', fontWeight: '800', fontSize: 12 },
  paidAmount: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 20 },

  unpaidBox: { backgroundColor: '#111827', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#1E293B' },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  paymentLabel: { color: '#94A3B8' },
  paymentValue: { color: '#FFFFFF', fontWeight: 'bold' },

  buttonContainer: { gap: 12, marginTop: 20 },
  saveButton: { backgroundColor: '#A5B4FC', flexDirection: 'row', borderRadius: 16, padding: 18, alignItems: 'center', justifyContent: 'center', gap: 10 },
  saveButtonText: { color: '#000', fontSize: 16, fontWeight: '900' },
  actionButton: { flexDirection: 'row', borderRadius: 16, padding: 18, alignItems: 'center', justifyContent: 'center', gap: 10 },
  actionButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cancelPaymentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#FF2E63', borderRadius: 12, gap: 8 },
  cancelPaymentText: { color: '#FF2E63', fontWeight: '700' },

  backButton: { padding: 20, alignItems: 'center' },
  backButtonText: { color: '#94A3B8', fontSize: 16 },

  modalOverlayDark: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 25 },
  modalContentDark: { backgroundColor: '#111827', borderRadius: 24, padding: 25, borderWidth: 1, borderColor: '#1E293B' },
  modalTitleDark: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 20 },
  darkInput: { backgroundColor: '#0F172A', borderRadius: 12, padding: 15, color: '#FFFFFF', borderWidth: 1, borderColor: '#1E293B' },
  modalButtons: { flexDirection: 'row', gap: 15, marginTop: 25 },
  btnCancel: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1E293B' },
  btnTextCancel: { color: '#94A3B8', fontWeight: '600' },
  btnConfirm: { flex: 2, backgroundColor: '#6366F1', padding: 15, borderRadius: 12, alignItems: 'center' },
  btnTextConfirm: { color: '#FFF', fontWeight: 'bold' },
});