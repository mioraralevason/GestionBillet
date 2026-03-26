import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { TicketService, Ticket } from '../../services/TicketService';
import { BuyerService, Buyer } from '../../services/BuyerService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

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
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen 
        options={{ 
          headerShown: true,
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '900' },
          headerTitle: mode === 'assign' ? 'Assignation Groupée' : 'Paiement Groupé'
        }} 
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons 
                name={mode === 'assign' ? "account-multiple-plus" : "cash-register"} 
                size={40} 
                color="#6366F1" 
              />
            </View>
            <Text style={styles.subtitle}>{ticketIds.length} Billets sélectionnés</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>ACHETEUR POUR TOUS</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowBuyerList(!showBuyerList)}>
              <MaterialCommunityIcons name="account" size={20} color="#6366F1" style={{ marginRight: 10 }} />
              <Text style={{ color: buyerName ? '#FFFFFF' : '#64748B', fontSize: 16, flex: 1 }}>
                {buyerName || "Rechercher ou ajouter..."}
              </Text>
              <MaterialCommunityIcons name={showBuyerList ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
            </TouchableOpacity>

            {showBuyerList && (
              <View style={styles.buyerList}>
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

          {buyerName ? (
            <View style={styles.selectedBuyerCard}>
              <MaterialCommunityIcons name="account-check" size={24} color="#10B981" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>{buyerName}</Text>
                {buyerPhone && <Text style={{ fontSize: 12, color: '#94A3B8' }}>{buyerPhone}</Text>}
              </View>
              <TouchableOpacity onPress={() => { setBuyerName(''); setBuyerPhone(''); }}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#FF2E63" />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.ticketsSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={styles.label}>DÉTAILS DES BILLETS</Text>
              {mode === 'pay' && (
                <TouchableOpacity onPress={setAllToPaid}>
                  <Text style={{ color: '#6366F1', fontWeight: 'bold', fontSize: 12 }}>TOUT PAYER</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {selectedTickets.map(t => (
              <View key={t.id} style={styles.ticketItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketNum}>{t.ticket_number}</Text>
                  <Text style={styles.ticketPrice}>{t.price} Ar</Text>
                </View>
                {mode === 'pay' ? (
                  <TextInput
                    style={styles.amountInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#64748B"
                    value={amounts[t.id!] || ''}
                    onChangeText={(val) => updateAmount(t.id!, val)}
                  />
                ) : (
                  <MaterialCommunityIcons name="check-circle" size={20} color="#6366F1" />
                )}
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.assignBtn, mode === 'pay' ? { backgroundColor: '#10B981' } : { backgroundColor: '#A5B4FC' }]} 
              onPress={handleAction}
            >
              <MaterialCommunityIcons 
                name={mode === 'assign' ? "account-check" : "cash-check"} 
                size={24} 
                color={mode === 'pay' ? "#FFF" : "#000"} 
              />
              <Text style={[styles.btnText, mode === 'pay' ? { color: '#FFF' } : { color: '#000' }]}>
                {mode === 'assign' ? "Confirmer l'assignation" : "Confirmer le paiement"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={{ color: '#94A3B8', fontSize: 16, fontWeight: '600' }}>Annuler</Text>
          </TouchableOpacity>

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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scroll: { padding: 20 },
  header: { marginBottom: 30, alignItems: 'center' },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  subtitle: { fontSize: 16, color: '#94A3B8', fontWeight: '600' },
  
  section: { marginBottom: 25 },
  label: { fontSize: 12, fontWeight: '800', color: '#6366F1', marginBottom: 12, letterSpacing: 2 },
  
  dropdown: { 
    backgroundColor: '#111827', 
    padding: 15, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  buyerList: { 
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

  selectedBuyerCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#10B9811A', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#10B981'
  },

  ticketsSection: { marginBottom: 30 },
  ticketItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    backgroundColor: '#111827', 
    borderRadius: 12, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#1E293B' 
  },
  ticketNum: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  ticketPrice: { fontSize: 13, color: '#94A3B8' },
  amountInput: { 
    backgroundColor: '#000000', 
    width: 100, 
    padding: 10, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#1E293B', 
    textAlign: 'right', 
    fontSize: 16,
    color: '#FFFFFF'
  },

  actions: { gap: 15, marginTop: 10 },
  assignBtn: { 
    padding: 18, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10 
  },
  btnText: { fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  cancelBtn: { marginTop: 15, padding: 15, alignItems: 'center' },

  modalOverlayDark: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 25 },
  modalContentDark: { backgroundColor: '#111827', borderRadius: 24, padding: 25, borderWidth: 1, borderColor: '#1E293B' },
  modalTitleDark: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginBottom: 20, textAlign: 'center' },
  darkInput: { backgroundColor: '#0F172A', borderRadius: 12, padding: 15, fontSize: 16, color: '#FFFFFF', borderWidth: 1, borderColor: '#1E293B' },
  modalButtons: { flexDirection: 'row', gap: 15, marginTop: 25 },
  btnCancel: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1E293B' },
  btnTextCancel: { color: '#94A3B8', fontSize: 16, fontWeight: '600' },
  btnConfirm: { flex: 2, backgroundColor: '#6366F1', padding: 15, borderRadius: 12, alignItems: 'center' },
  btnTextConfirm: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
