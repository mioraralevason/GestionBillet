import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { TicketService, Ticket } from '../../services/TicketService';
import { BuyerService, Buyer } from '../../services/BuyerService';
import { AttendanceService, ValidationResult } from '../../services/AttendanceService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import ConfirmModal from '../../components/ConfirmModal';
import { showSuccess, showError } from '../../utils/toast';
import { useRole } from '../../hooks/useRole';

const SURFACE = '#111827';
const SURFACE2 = '#1E293B';
const BG = '#000000';
const TEXT = '#FFFFFF';
const TEXT2 = '#94A3B8';
const BORDER = '#1E293B';
const ACCENT = '#6366F1';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const DANGER = '#EF4444';

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ statusId, statusName }: { statusId?: number; statusName?: string }) {
  const isVerified = statusId === TicketService.STATUS_VALIDE;
  const isSold = statusId === TicketService.STATUS_VENDU;
  const color = isVerified ? SUCCESS : isSold ? WARNING : ACCENT;
  const label = isVerified ? 'VERIFIE' : isSold ? 'VENDU' : 'DISPONIBLE';
  const icon: any = isVerified ? 'check-decagram' : isSold ? 'cash' : 'ticket-outline';

  return (
    <View style={[styles.statusBadge, { backgroundColor: color + '20', borderColor: color + '60' }]}>
      <MaterialCommunityIcons name={icon} size={13} color={color} />
      <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Payment bar ──────────────────────────────────────────────────────────────

function PaymentBar({ paid, total }: { paid: number; total: number }) {
  const pct = total > 0 ? Math.min(1, paid / total) : 0;
  const remaining = total - paid;
  const isPaid = remaining <= 0;

  return (
    <View style={styles.paymentBar}>
      <View style={styles.paymentBarHeader}>
        <Text style={styles.paymentBarLabel}>{isPaid ? 'Entierement paye' : 'Paiement partiel'}</Text>
        <Text style={[styles.paymentBarPct, { color: isPaid ? SUCCESS : WARNING }]}>
          {Math.round(pct * 100)}%
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[
          styles.progressFill,
          { width: `${pct * 100}%` as any, backgroundColor: isPaid ? SUCCESS : WARNING }
        ]} />
      </View>
      <View style={styles.paymentBarFooter}>
        <Text style={styles.paymentBarSub}>Paye : <Text style={styles.paymentBarAmount}>{paid.toLocaleString()} Ar</Text></Text>
        {!isPaid && (
          <Text style={[styles.paymentBarSub, { color: DANGER }]}>
            Reste : <Text style={[styles.paymentBarAmount, { color: DANGER }]}>{remaining.toLocaleString()} Ar</Text>
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AssignTicket() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const ticketId = parseInt(id as string);
  const { role } = useRole();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [amountPaid, setAmountPaid] = useState(0);

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

  const fetchData = useCallback(() => {
    const t = TicketService.getTicketById(ticketId);
    if (t) {
      setTicket(t);
      setBuyerName(t.buyer_name || '');
      setBuyerPhone(t.buyer_phone || '');
      setAmountPaid(t.total_paid || 0);
    }
    setBuyers(BuyerService.getBuyers());
  }, [ticketId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const filteredBuyers = buyers.filter(b =>
    b.name.toLowerCase().includes(buyerSearch.toLowerCase()) ||
    (b.phone && b.phone.includes(buyerSearch))
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

  const handleSave = (overrideAmount?: number) => {
    if (!ticket) return;
    if (!buyerName.trim()) {
      showError('Acheteur manquant', 'Veuillez selectionner ou creer un acheteur.');
      return;
    }
    const paid = overrideAmount !== undefined ? overrideAmount : 0;
    if (TicketService.assignTicket(ticketId, buyerName.trim(), buyerPhone.trim(), paid)) {
      showSuccess('Billet assigne avec succes.');
      fetchData();
    } else {
      showError('Erreur', 'Impossible d\'assigner le billet.');
    }
  };

  const handleAddPayment = () => {
    if (!ticket) return;
    const remaining = ticket.price - amountPaid;
    setTempAmount(remaining.toString());
    setShowPayModal(true);
  };

  const confirmPayment = () => {
    const remaining = (ticket?.price || 0) - amountPaid;
    const amount = Math.min(parseFloat(tempAmount) || 0, remaining);
    if (amount <= 0) { setShowPayModal(false); return; }
    handleSave(amount);
    setShowPayModal(false);
  };

  const handleVerify = () => {
    if (!ticket) return;
    const res = AttendanceService.verifyTicketById(ticketId);
    setValidationResult(res);
    if (Platform.OS !== 'web') {
      if (res.success) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (res.warning) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    if (res.success) fetchData();
  };

  const executeResetVerification = () => {
    setShowResetConfirm(false);
    if (ticket && TicketService.resetTicketVerification(ticket.id!)) {
      fetchData();
      showSuccess('Verification reinitialisee.');
    } else {
      showError('Erreur', 'Impossible de reinitialiser.');
    }
  };

  const executeCancelPayment = () => {
    setShowCancelPaymentConfirm(false);
    if (TicketService.cancelPayments(ticketId)) {
      fetchData();
      showSuccess('Paiements annules.');
    } else {
      showError('Erreur', 'Impossible d\'annuler les paiements.');
    }
  };

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: true, headerStyle: { backgroundColor: BG }, headerTintColor: TEXT, headerTitle: 'Billet' }} />
        <View style={styles.notFound}>
          <MaterialCommunityIcons name="ticket-off-outline" size={48} color={TEXT2} />
          <Text style={styles.notFoundText}>Billet introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isVerified = ticket.status_id === TicketService.STATUS_VALIDE;
  const isSold = ticket.status_id === TicketService.STATUS_VENDU;
  const isAvailable = ticket.status_id === TicketService.STATUS_DISPONIBLE;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: BG },
          headerTintColor: TEXT,
          headerTitleStyle: { fontWeight: '900' },
          headerTitle: 'Details Billet',
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* ── Ticket hero ── */}
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <Text style={styles.heroNum}>{ticket.ticket_number}</Text>
              <StatusBadge statusId={ticket.status_id} statusName={ticket.status_name} />
            </View>

            {ticket.ticket_type_name && (
              <View style={styles.heroTypeRow}>
                <MaterialCommunityIcons name="tag-outline" size={13} color={TEXT2} />
                <Text style={styles.heroTypeName}>{ticket.ticket_type_name}</Text>
              </View>
            )}

            <View style={styles.heroBottom}>
              <View style={styles.heroPriceBox}>
                <Text style={styles.heroPriceLabel}>Prix</Text>
                <Text style={styles.heroPriceValue}>{ticket.price.toLocaleString()} Ar</Text>
              </View>
              {ticket.buyer_name && (
                <View style={styles.heroBuyerBox}>
                  <MaterialCommunityIcons name="account" size={16} color={TEXT2} />
                  <Text style={styles.heroBuyerName} numberOfLines={1}>{ticket.buyer_name}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Payment bar (when sold/verified) ── */}
          {(isSold || isVerified) && (
            <PaymentBar paid={amountPaid} total={ticket.price} />
          )}

          {/* ── Buyer section ── */}
          {role === 'admin' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ACHETEUR</Text>

              {/* Buyer selector */}
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowBuyerList(!showBuyerList)}
                activeOpacity={0.8}
              >
                <View style={styles.dropdownIcon}>
                  <MaterialCommunityIcons name="account-circle-outline" size={20} color={ACCENT} />
                </View>
                <Text style={[styles.dropdownText, !buyerName && styles.dropdownPlaceholder]}>
                  {buyerName || 'Selectionner un acheteur...'}
                </Text>
                <MaterialCommunityIcons
                  name={showBuyerList ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={TEXT2}
                />
              </TouchableOpacity>

              {/* Inline buyer list */}
              {showBuyerList && (
                <View style={styles.buyerDropdown}>
                  <View style={styles.buyerSearchRow}>
                    <MaterialCommunityIcons name="magnify" size={17} color={TEXT2} />
                    <TextInput
                      style={styles.buyerSearchInput}
                      placeholder="Rechercher..."
                      placeholderTextColor="#4B5563"
                      value={buyerSearch}
                      onChangeText={setBuyerSearch}
                      autoFocus
                    />
                  </View>

                  {/* Quick add */}
                  <TouchableOpacity
                    style={styles.buyerNewBtn}
                    onPress={() => { setNewName(buyerSearch); setShowAddModal(true); setShowBuyerList(false); }}
                  >
                    <MaterialCommunityIcons name="account-plus-outline" size={18} color={ACCENT} />
                    <Text style={styles.buyerNewText}>Nouvel acheteur</Text>
                  </TouchableOpacity>

                  {filteredBuyers.length === 0 ? (
                    <Text style={styles.buyerEmptyText}>Aucun acheteur trouve</Text>
                  ) : (
                    <View style={styles.buyerList}>
                      {filteredBuyers.map(item => (
                        <TouchableOpacity key={item.id!.toString()} style={styles.buyerItem} onPress={() => selectBuyer(item)}>
                          <View style={styles.buyerItemAvatar}>
                            <Text style={styles.buyerItemAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                          </View>
                          <View style={styles.buyerItemInfo}>
                            <Text style={styles.buyerItemName}>{item.name}</Text>
                            {item.phone && <Text style={styles.buyerItemPhone}>{item.phone}</Text>}
                          </View>
                          {buyerName === item.name && (
                            <MaterialCommunityIcons name="check-circle" size={18} color={SUCCESS} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Selected phone display */}
              {buyerPhone && !showBuyerList && (
                <View style={styles.phoneRow}>
                  <MaterialCommunityIcons name="phone-outline" size={16} color={ACCENT} />
                  <Text style={styles.phoneText}>{buyerPhone}</Text>
                </View>
              )}
            </View>
          )}

          {/* Read-only buyer for verificateur */}
          {role === 'verificateur' && ticket.buyer_name && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ACHETEUR</Text>
              <View style={styles.readOnlyRow}>
                <MaterialCommunityIcons name="account-outline" size={18} color={ACCENT} />
                <Text style={styles.readOnlyText}>{ticket.buyer_name}</Text>
              </View>
              {ticket.buyer_phone && (
                <View style={[styles.readOnlyRow, { marginTop: 8 }]}>
                  <MaterialCommunityIcons name="phone-outline" size={18} color={ACCENT} />
                  <Text style={styles.readOnlyText}>{ticket.buyer_phone}</Text>
                </View>
              )}
            </View>
          )}

          {/* ── Action buttons ── */}
          <View style={styles.actionsSection}>
            {role === 'admin' && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#A5B4FC' }]} onPress={() => handleSave()} activeOpacity={0.8}>
                <MaterialCommunityIcons name="content-save-check-outline" size={20} color="#000" />
                <Text style={[styles.actionBtnText, { color: '#000' }]}>Enregistrer l'assignation</Text>
              </TouchableOpacity>
            )}

            {role === 'admin' && amountPaid < ticket.price && (isSold || isVerified) && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: SUCCESS }]} onPress={handleAddPayment} activeOpacity={0.8}>
                <MaterialCommunityIcons name="cash-plus" size={20} color="#000" />
                <Text style={[styles.actionBtnText, { color: '#000' }]}>Payer le reste</Text>
              </TouchableOpacity>
            )}

            {(role === 'admin' || role === 'verificateur') && !isVerified && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: ACCENT }]} onPress={handleVerify} activeOpacity={0.8}>
                <MaterialCommunityIcons name="check-decagram-outline" size={20} color={TEXT} />
                <Text style={styles.actionBtnText}>Verifier le billet</Text>
              </TouchableOpacity>
            )}

            {(role === 'admin' || role === 'verificateur') && isVerified && (
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]} onPress={() => setShowResetConfirm(true)} activeOpacity={0.8}>
                <MaterialCommunityIcons name="refresh" size={20} color={WARNING} />
                <Text style={[styles.actionBtnText, { color: WARNING }]}>Reinitialiser verification</Text>
              </TouchableOpacity>
            )}

            {role === 'admin' && amountPaid > 0 && (
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => setShowCancelPaymentConfirm(true)} activeOpacity={0.8}>
                <MaterialCommunityIcons name="cash-remove" size={18} color={DANGER} />
                <Text style={[styles.actionBtnText, { color: DANGER }]}>Annuler les paiements</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={16} color={TEXT2} />
            <Text style={styles.backLinkText}>Retour a la liste</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Validation result modal ── */}
      <Modal visible={validationResult !== null} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.dragHandle} />
            {validationResult && (
              <View style={styles.valResultContent}>
                {(() => {
                  const isSuccess = validationResult.success;
                  const isWarn = validationResult.warning && !validationResult.success;
                  const color = isSuccess ? SUCCESS : isWarn ? WARNING : DANGER;
                  const icon: any = isSuccess ? 'check-circle' : isWarn ? 'alert-circle' : 'close-circle';
                  const title = isSuccess ? 'BILLET VALIDE' : isWarn ? 'DEJA UTILISE' : 'INVALIDE';
                  return (
                    <>
                      <View style={[styles.valIconCircle, { backgroundColor: color + '20' }]}>
                        <MaterialCommunityIcons name={icon} size={44} color={color} />
                      </View>
                      <Text style={[styles.valTitle, { color }]}>{title}</Text>
                      <Text style={styles.valMessage}>{validationResult.message}</Text>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: ACCENT, marginTop: 8 }]}
                        onPress={() => setValidationResult(null)}
                      >
                        <MaterialCommunityIcons name="close" size={18} color={TEXT} />
                        <Text style={styles.actionBtnText}>Fermer</Text>
                      </TouchableOpacity>
                    </>
                  );
                })()}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Pay amount modal ── */}
      <Modal visible={showPayModal} transparent animationType="fade">
        <View style={styles.centeredOverlay}>
          <View style={styles.centeredCard}>
            <Text style={styles.centeredTitle}>Montant a payer</Text>
            {ticket && (
              <Text style={styles.centeredSub}>
                Reste : {(ticket.price - amountPaid).toLocaleString()} Ar
              </Text>
            )}
            <TextInput
              style={styles.amountInput}
              placeholder="Montant"
              placeholderTextColor="#4B5563"
              keyboardType="numeric"
              value={tempAmount}
              onChangeText={setTempAmount}
              autoFocus
            />
            <View style={styles.centeredButtons}>
              <TouchableOpacity style={[styles.centeredBtn, styles.centeredBtnCancel]} onPress={() => setShowPayModal(false)}>
                <Text style={styles.centeredBtnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.centeredBtn, { backgroundColor: ACCENT }]} onPress={confirmPayment}>
                <Text style={styles.centeredBtnConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── New buyer modal ── */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.dragHandle} />
            <Text style={styles.modalSheetTitle}>Nouvel Acheteur</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="Nom complet"
              placeholderTextColor="#4B5563"
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={[styles.sheetInput, { marginTop: 12 }]}
              placeholder="Telephone"
              placeholderTextColor="#4B5563"
              keyboardType="phone-pad"
              value={newPhone}
              onChangeText={setNewPhone}
            />
            <View style={styles.centeredButtons}>
              <TouchableOpacity style={[styles.centeredBtn, styles.centeredBtnCancel]} onPress={() => setShowAddModal(false)}>
                <Text style={styles.centeredBtnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.centeredBtn, { backgroundColor: ACCENT }]} onPress={handleQuickAddBuyer}>
                <Text style={styles.centeredBtnConfirmText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Confirm modals ── */}
      <ConfirmModal
        visible={showResetConfirm}
        title="Reinitialiser la verification"
        message={`Annuler la validation du billet ${ticket?.ticket_number} ? Il redeviendra "Vendu".`}
        onConfirm={executeResetVerification}
        onCancel={() => setShowResetConfirm(false)}
        confirmText="Reinitialiser"
        type="warning"
      />

      <ConfirmModal
        visible={showCancelPaymentConfirm}
        title="Annuler les paiements"
        message="Supprimer TOUS les paiements associes a ce billet ?"
        onConfirm={executeCancelPayment}
        onCancel={() => setShowCancelPaymentConfirm(false)}
        confirmText="Oui, annuler"
        type="danger"
      />

      {/* ── Not found ── */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  notFoundText: { color: TEXT2, fontSize: 16 },
  scroll: { padding: 20, paddingBottom: 60 },

  // Hero
  heroCard: {
    backgroundColor: SURFACE,
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroNum: { color: TEXT, fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  heroTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  heroTypeName: { color: TEXT2, fontSize: 13, fontWeight: '600' },
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 14,
  },
  heroPriceBox: {},
  heroPriceLabel: { color: TEXT2, fontSize: 11, marginBottom: 2 },
  heroPriceValue: { color: TEXT, fontSize: 20, fontWeight: '800' },
  heroBuyerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
    paddingLeft: 12,
  },
  heroBuyerName: { color: TEXT2, fontSize: 14, flex: 1, textAlign: 'right' },

  // Payment bar
  paymentBar: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  paymentBarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  paymentBarLabel: { color: TEXT2, fontSize: 12, fontWeight: '600' },
  paymentBarPct: { fontSize: 13, fontWeight: '800' },
  progressTrack: { height: 5, backgroundColor: SURFACE2, borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', borderRadius: 3 },
  paymentBarFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  paymentBarSub: { color: TEXT2, fontSize: 12 },
  paymentBarAmount: { fontWeight: '700', color: TEXT },

  // Section
  section: { marginBottom: 18 },
  sectionLabel: { color: ACCENT, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },

  // Buyer dropdown
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 10,
  },
  dropdownIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: SURFACE2, justifyContent: 'center', alignItems: 'center' },
  dropdownText: { flex: 1, color: TEXT, fontSize: 15 },
  dropdownPlaceholder: { color: '#4B5563' },
  buyerDropdown: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  buyerSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  buyerSearchInput: { flex: 1, color: TEXT, fontSize: 15, height: 36 },
  buyerNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  buyerNewText: { color: ACCENT, fontWeight: '700', fontSize: 15 },
  buyerList: { maxHeight: 210 },
  buyerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  buyerItemAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SURFACE2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyerItemAvatarText: { color: ACCENT, fontSize: 15, fontWeight: '700' },
  buyerItemInfo: { flex: 1 },
  buyerItemName: { color: TEXT, fontSize: 15, fontWeight: '600' },
  buyerItemPhone: { color: TEXT2, fontSize: 12, marginTop: 1 },
  buyerEmptyText: { color: TEXT2, textAlign: 'center', padding: 20, fontSize: 14 },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: SURFACE,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  phoneText: { color: TEXT, fontSize: 15 },

  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: SURFACE,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: BORDER,
  },
  readOnlyText: { color: TEXT, fontSize: 15 },

  // Actions
  actionsSection: { gap: 10, marginTop: 8, marginBottom: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  actionBtnText: { color: TEXT, fontSize: 15, fontWeight: '700' },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: WARNING + '60',
  },
  actionBtnDanger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: DANGER + '60',
  },

  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  backLinkText: { color: TEXT2, fontSize: 14 },

  // Bottom sheet modal
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalSheet: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: BORDER,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: SURFACE2,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalSheetTitle: { color: TEXT, fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  sheetInput: {
    backgroundColor: BG,
    borderRadius: 12,
    padding: 14,
    color: TEXT,
    fontSize: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },

  // Centered overlay (amount modal)
  centeredOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  centeredCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },
  centeredTitle: { color: TEXT, fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  centeredSub: { color: DANGER, fontSize: 14, textAlign: 'center', fontWeight: '700', marginBottom: 18 },
  amountInput: {
    backgroundColor: BG,
    borderRadius: 12,
    padding: 14,
    fontSize: 20,
    color: TEXT,
    borderWidth: 1,
    borderColor: BORDER,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 20,
  },
  centeredButtons: { flexDirection: 'row', gap: 12 },
  centeredBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  centeredBtnCancel: { backgroundColor: SURFACE2 },
  centeredBtnCancelText: { color: TEXT2, fontSize: 15, fontWeight: '600' },
  centeredBtnConfirmText: { color: TEXT, fontSize: 15, fontWeight: '700' },

  // Validation result inside sheet
  valResultContent: { alignItems: 'center', paddingBottom: 8 },
  valIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  valTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 0.5, marginBottom: 8 },
  valMessage: { color: TEXT2, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20, paddingHorizontal: 8 },
});
