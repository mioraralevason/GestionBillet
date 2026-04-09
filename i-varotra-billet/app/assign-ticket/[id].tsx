import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Modal, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TicketService, Ticket } from '../../services/TicketService';
import { BuyerService, Buyer } from '../../services/BuyerService';
import { AttendanceService, ValidationResult } from '../../services/AttendanceService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import ConfirmModal from '../../components/ConfirmModal';
import { showSuccess, showError, showWarning } from '../../utils/toast';

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

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Confirmation modals state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCancelPaymentConfirm, setShowCancelPaymentConfirm] = useState(false);
  const [showSaveError, setShowSaveError] = useState(false);
  const [showPayAdjustment, setShowPayAdjustment] = useState(false);
  const [adjustmentMessage, setAdjustmentMessage] = useState('');

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
      setShowSaveError(true);
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
      showSuccess('Opération effectuée avec succès.');
      fetchData(); // Rafraîchir les données pour afficher le nouveau statut
    } else {
      showError('Impossible d\'effectuer l\'opération.');
    }
  };

  const handleVerify = () => {
    if (!ticket) return;
    
    const res = AttendanceService.verifyTicketById(ticketId);
    setValidationResult(res);

    if (res.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchData();
    } else if (res.warning) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleResetVerification = (t: Ticket) => {
    setShowResetConfirm(true);
  };

  const executeResetVerification = () => {
    setShowResetConfirm(false);
    if (ticket && TicketService.resetTicketVerification(ticket.id!)) {
      fetchData();
      showSuccess('La vérification a été réinitialisée.');
    } else {
      showError('Impossible de réinitialiser la vérification.');
    }
  };

  const handleCancelPayment = () => {
    setShowCancelPaymentConfirm(true);
  };

  const executeCancelPayment = () => {
    setShowCancelPaymentConfirm(false);
    if (TicketService.cancelPayments(ticketId)) {
      showSuccess('Paiements annulés.');
      fetchData();
    } else {
      showError('Impossible d\'annuler les paiements.');
    }
  };

  if (!ticket) return <View style={styles.center}><Text style={{color: '#FFF'}}>Billet non trouvé</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen 
        options={{ 
          headerShown: true,
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '900' },
          headerTitle: 'Détails Billet'
        }} 
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          
          {/* Header Card */}
          <View style={styles.headerCard}>
            <View style={styles.logoBox}>
              <MaterialCommunityIcons name="ticket-confirmation" size={40} color="#6366F1" />
            </View>
            <Text style={styles.ticketNum}>{ticket.ticket_number}</Text>
            <Text style={styles.ticketPrice}>{ticket.price} Ar</Text>
            <View style={[styles.statusBadge, ticket.status_id === TicketService.STATUS_VALIDE ? styles.statusValide : (ticket.status_id === TicketService.STATUS_VENDU ? styles.statusVendu : styles.statusLibre)]}>
              <Text style={styles.statusText}>
                {ticket.status_name?.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>ACHETEUR</Text>
            {role === 'admin' ? (
              <View>
                <TouchableOpacity 
                  style={styles.dropdown} 
                  onPress={() => setShowBuyerList(!showBuyerList)}
                >
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
                        placeholder="Rechercher..."
                        placeholderTextColor="#64748B"
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
                      <MaterialCommunityIcons name="account-plus" size={24} color="#6366F1" />
                      <Text style={styles.addNewText}>Nouvel acheteur</Text>
                    </TouchableOpacity>

                    {filteredBuyers.map(b => (
                      <TouchableOpacity key={b.id} style={styles.buyerOption} onPress={() => selectBuyer(b)}>
                        <Text style={styles.buyerNameText}>{b.name}</Text>
                        {b.phone && <Text style={{ fontSize: 12, color: '#94A3B8' }}>{b.phone}</Text>}
                      </TouchableOpacity>
                    ))}
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

          <View style={styles.section}>
            <Text style={styles.label}>PAIEMENT</Text>
            {parseFloat(amountPaid) >= (ticket?.price || 0) ? (
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
                  <Text style={styles.paymentLabel}>Déjà payé:</Text>
                  <Text style={styles.paymentValue}>{amountPaid} Ar</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Reste:</Text>
                  <Text style={[styles.paymentValue, { color: '#FF2E63' }]}>
                    {ticket.price - (parseFloat(amountPaid) || 0)} Ar
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            {role === 'admin' && (
              <TouchableOpacity style={styles.saveButton} onPress={() => handleSave()}>
                <MaterialCommunityIcons name="content-save-check" size={24} color="#000" />
                <Text style={styles.saveButtonText}>Enregistrer l'assignation</Text>
              </TouchableOpacity>
            )}

            {role === 'admin' && parseFloat(amountPaid) < ticket.price && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#10B981' }]} 
                onPress={() => {
                  const remaining = ticket.price - (parseFloat(amountPaid) || 0);
                  setTempAmount(remaining.toString());
                  setShowPayModal(true);
                }}
              >
                <MaterialCommunityIcons name="cash-plus" size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>Payer le reste</Text>
              </TouchableOpacity>
            )}

            {(role === 'admin' || role === 'verificateur') && ticket.status_id !== TicketService.STATUS_VALIDE && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#6366F1' }]} 
                onPress={handleVerify}
              >
                <MaterialCommunityIcons name="check-decagram" size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>Vérifier Billet</Text>
              </TouchableOpacity>
            )}

            {(role === 'admin' || role === 'verificateur') && ticket.status_id === TicketService.STATUS_VALIDE && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#F59E0B' }]} 
                onPress={() => handleResetVerification(ticket)}
              >
                <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>Réinitialiser vérification</Text>
              </TouchableOpacity>
            )}

            {role === 'admin' && parseFloat(amountPaid) > 0 && (
              <TouchableOpacity 
                style={styles.cancelPaymentBtn} 
                onPress={handleCancelPayment}
              >
                <MaterialCommunityIcons name="cash-remove" size={20} color="#FF2E63" />
                <Text style={styles.cancelPaymentText}>Annuler les paiements</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour à la liste</Text>
          </TouchableOpacity>

          {/* Modal de Résultat de Vérification */}
          <Modal visible={validationResult !== null} transparent animationType="fade">
            <View style={styles.modalOverlayDark}>
              <View style={[
                styles.modalContentResult,
                validationResult?.success ? styles.successBorder : (validationResult?.warning ? styles.warningBorder : styles.errorBorder)
              ]}>
                <View style={[
                  styles.iconContainer,
                  validationResult?.success ? styles.successBg : (validationResult?.warning ? styles.warningBg : styles.errorBg)
                ]}>
                  <MaterialCommunityIcons
                    name={validationResult?.success ? "check" : (validationResult?.warning ? "alert" : "close")}
                    size={40}
                    color="#FFF"
                  />
                </View>
                <Text style={styles.modalTitleResult}>{validationResult?.success ? "BILLET VALIDE" : (validationResult?.warning ? "DÉJÀ UTILISÉ" : "INVALIDE")}</Text>
                <Text style={styles.modalMessageResult}>{validationResult?.message}</Text>

                <TouchableOpacity style={styles.closeButtonResult} onPress={() => setValidationResult(null)}>
                  <MaterialCommunityIcons name="check-decagram" size={20} color="#FFF" />
                  <Text style={styles.closeButtonTextResult}>Scanner un autre billet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Modal pour le paiement */}
          <Modal visible={showPayModal} transparent animationType="fade">
            <View style={styles.modalOverlayDark}>
              <View style={styles.modalContentDark}>
                <Text style={styles.modalTitleDark}>Montant à payer</Text>
                <Text style={styles.remainingText}>
                  Reste: {ticket.price - (parseFloat(amountPaid) || 0)} Ar
                </Text>
                <TextInput 
                  style={styles.darkInput} 
                  placeholder="Montant" 
                  placeholderTextColor="#64748B"
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
                    style={styles.btnConfirm}
                    onPress={() => {
                      const remaining = ticket.price - (parseFloat(amountPaid) || 0);
                      const amount = parseFloat(tempAmount) || 0;
                      if (amount > remaining) {
                        setAdjustmentMessage(`Le montant dépasse le reste à payer. Ajusté à ${remaining} Ar.`);
                        setShowPayAdjustment(true);
                        handleSave(remaining.toString());
                      } else {
                        handleSave(amount.toString());
                      }
                      setShowPayModal(false);
                    }}
                  >
                    <Text style={styles.btnTextConfirm}>Confirmer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Modal Nouvel Acheteur */}
          <Modal visible={showAddModal} transparent animationType="slide">
            <View style={styles.modalOverlayDark}>
              <View style={styles.modalContentDark}>
                <Text style={styles.modalTitleDark}>Nouvel Acheteur</Text>
                <TextInput 
                  style={styles.darkInput} 
                  placeholder="Nom complet" 
                  placeholderTextColor="#64748B"
                  value={newName}
                  onChangeText={setNewName}
                />
                <TextInput 
                  style={[styles.darkInput, { marginTop: 15 }]} 
                  placeholder="Téléphone" 
                  placeholderTextColor="#64748B"
                  keyboardType="phone-pad"
                  value={newPhone}
                  onChangeText={setNewPhone}
                />
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

          {/* ConfirmModal Components */}
          <ConfirmModal
            visible={showResetConfirm}
            title="Réinitialiser la vérification"
            message={`Voulez-vous vraiment annuler la validation du billet ${ticket?.ticket_number} ? Il redeviendra "Vendu".`}
            onConfirm={executeResetVerification}
            onCancel={() => setShowResetConfirm(false)}
            confirmText="Réinitialiser"
            type="warning"
          />

          <ConfirmModal
            visible={showCancelPaymentConfirm}
            title="Annuler les paiements"
            message="Voulez-vous vraiment supprimer TOUS les paiements associés à ce billet ?"
            onConfirm={executeCancelPayment}
            onCancel={() => setShowCancelPaymentConfirm(false)}
            confirmText="Oui, annuler"
            type="danger"
          />

          <ConfirmModal
            visible={showSaveError}
            title="Erreur"
            message="Veuillez sélectionner ou créer un acheteur."
            onConfirm={() => setShowSaveError(false)}
            onCancel={() => setShowSaveError(false)}
            confirmText="OK"
            type="danger"
            showCancel={false}
          />

          <ConfirmModal
            visible={showPayAdjustment}
            title="Attention"
            message={adjustmentMessage}
            onConfirm={() => setShowPayAdjustment(false)}
            onCancel={() => setShowPayAdjustment(false)}
            confirmText="Compris"
            type="warning"
            showCancel={false}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#374151',
  },
  ticketNum: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  ticketPrice: { fontSize: 20, color: '#94A3B8', marginTop: 5, fontWeight: '600' },
  
  statusBadge: {
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusValide: { backgroundColor: '#10B98133', borderWidth: 1, borderColor: '#10B981' },
  statusVendu: { backgroundColor: '#F59E0B33', borderWidth: 1, borderColor: '#F59E0B' },
  statusLibre: { backgroundColor: '#6366F133', borderWidth: 1, borderColor: '#6366F1' },
  statusText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 1 },

  section: { marginBottom: 25 },
  label: { fontSize: 12, fontWeight: '800', color: '#6366F1', marginBottom: 12, letterSpacing: 2 },
  
  dropdown: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#111827', 
    borderRadius: 12, 
    padding: 15,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  readOnlyBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#111827', 
    borderRadius: 12, 
    padding: 15,
    borderWidth: 1,
    borderColor: '#1E293B',
    opacity: 0.8
  },
  phoneBox: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#111827', 
    borderRadius: 12, 
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#1E293B'
  },

  buyerListDropdown: { 
    backgroundColor: '#111827', 
    borderRadius: 12, 
    marginTop: 8, 
    borderWidth: 1, 
    borderColor: '#1E293B', 
    elevation: 5, 
    maxHeight: 250 
  },
  searchDropdownWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#1E293B', 
    paddingHorizontal: 12, 
    paddingVertical: 10 
  },
  searchDropdownInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#FFFFFF', height: 40 },
  buyerOption: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  buyerNameText: { fontSize: 16, fontWeight: '500', color: '#FFFFFF' },
  addNewOption: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  addNewText: { color: '#6366F1', fontWeight: 'bold', fontSize: 16 },

  paidBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#10B9811A', 
    padding: 20, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#10B981' 
  },
  paidTitle: { color: '#A5B4FC', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  paidAmount: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 20 },

  unpaidBox: {
    backgroundColor: '#111827',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  paymentLabel: { color: '#94A3B8', fontSize: 14 },
  paymentValue: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  buttonContainer: { gap: 12, marginTop: 10 },
  saveButton: { 
    backgroundColor: '#A5B4FC', 
    flexDirection: 'row', 
    borderRadius: 16, 
    padding: 18, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10,
  },
  saveButtonText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  
  actionButton: { 
    flexDirection: 'row', 
    borderRadius: 16, 
    padding: 18, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10 
  },
  actionButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  cancelPaymentBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 15, 
    marginTop: 5, 
    borderStyle: 'dashed', 
    borderWidth: 1, 
    borderColor: '#FF2E63', 
    borderRadius: 12, 
    gap: 8 
  },
  cancelPaymentText: { color: '#FF2E63', fontSize: 14, fontWeight: '700' },
  
  backButton: { padding: 20, alignItems: 'center' },
  backButtonText: { color: '#94A3B8', fontSize: 15, fontWeight: '600' },

  modalOverlayDark: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 25 },
  modalContentDark: { backgroundColor: '#111827', borderRadius: 24, padding: 25, borderWidth: 1, borderColor: '#1E293B' },
  modalTitleDark: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginBottom: 10, textAlign: 'center' },
  remainingText: { textAlign: 'center', marginBottom: 20, color: '#FF2E63', fontWeight: 'bold', fontSize: 16 },
  darkInput: { backgroundColor: '#0F172A', borderRadius: 12, padding: 15, fontSize: 16, color: '#FFFFFF', borderWidth: 1, borderColor: '#1E293B' },

  modalButtons: { flexDirection: 'row', gap: 15, marginTop: 25 },
  btnCancel: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1E293B' },
  btnTextCancel: { color: '#94A3B8', fontSize: 16, fontWeight: '600' },
  btnConfirm: { flex: 2, backgroundColor: '#6366F1', padding: 15, borderRadius: 12, alignItems: 'center' },
  btnTextConfirm: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  modalContentResult: { backgroundColor: '#111827', borderRadius: 24, padding: 30, alignItems: 'center', borderWidth: 1 },
  successBorder: { borderColor: '#10B981' },
  warningBorder: { borderColor: '#F59E0B' },
  errorBorder: { borderColor: '#EF4444' },
  iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successBg: { backgroundColor: '#10B981' },
  warningBg: { backgroundColor: '#F59E0B' },
  errorBg: { backgroundColor: '#EF4444' },
  modalTitleResult: { color: '#FFF', fontSize: 22, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 },
  modalMessageResult: { color: '#94A3B8', fontSize: 15, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  closeButtonResult: { backgroundColor: '#10B981', flexDirection: 'row', paddingHorizontal: 30, paddingVertical: 16, borderRadius: 16, alignItems: 'center', gap: 10 },
  closeButtonTextResult: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
