// app/(tabs)/buyers.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, StatusBar, SafeAreaView, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { BuyerService, Buyer } from '../../services/BuyerService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, Stack } from 'expo-router';

const { width } = Dimensions.get('window');

export default function BuyersList() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [search, setSearch] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const fetchBuyers = useCallback(() => {
    const list = BuyerService.getBuyers();
    setBuyers(list);
  }, []);

  useFocusEffect(useCallback(() => { fetchBuyers(); }, [fetchBuyers]));

  const filteredBuyers = useMemo(() => {
    if (!search.trim()) return buyers;
    const q = search.toLowerCase();
    return buyers.filter(b => b.name.toLowerCase().includes(q) || (b.phone && b.phone.includes(q)));
  }, [search, buyers]);

  const handleSaveBuyer = () => {
    if (!name.trim()) { Alert.alert('Erreur', 'Le nom est obligatoire.'); return; }
    let success = editingId ? BuyerService.updateBuyer({ id: editingId, name, phone }) : !!BuyerService.addBuyer({ name, phone });
    if (success) { setModalVisible(false); fetchBuyers(); }
    else { Alert.alert('Erreur', "Impossible d'enregistrer."); }
  };

  const openModal = (buyer?: Buyer) => {
    setEditingId(buyer?.id || null);
    setName(buyer?.name || '');
    setPhone(buyer?.phone || '');
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: Buyer }) => (
    <View style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: '#1E293B' }]}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.phone && (
          <View style={styles.phoneRow}>
            <MaterialCommunityIcons name="phone" size={14} color="#94A3B8" />
            <Text style={styles.phone}>{item.phone}</Text>
          </View>
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => openModal(item)} style={styles.actionBtn}>
          <MaterialCommunityIcons name="pencil" size={20} color="#6366F1" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
            Alert.alert("Supprimer", "Supprimer cet acheteur ?", [
              { text: "Annuler", style: "cancel" },
              { text: "Supprimer", style: "destructive", onPress: () => item.id && BuyerService.deleteBuyer(item.id) && fetchBuyers() }
            ]);
          }} 
          style={styles.actionBtn}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen 
        options={{
          headerTitle: isSearchActive ? () => (
            <View style={styles.headerSearchContainer}>
              <TextInput
                style={styles.headerSearchInput}
                placeholder="Chercher un acheteur..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          ) : 'Acheteurs',
          headerRight: () => (
            <TouchableOpacity onPress={() => setIsSearchActive(!isSearchActive)} style={{ marginRight: 20 }}>
              <MaterialCommunityIcons name={isSearchActive ? "close" : "magnify"} size={26} color="#FFFFFF" />
            </TouchableOpacity>
          )
        }}
      />

      <FlatList
        data={filteredBuyers}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-search-outline" size={80} color="#1E293B" />
            <Text style={styles.emptyText}>Aucun acheteur trouvé</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <MaterialCommunityIcons name="account-plus" size={30} color="#000" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? "Modifier l'acheteur" : "Nouvel Acheteur"}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOM COMPLET</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex: Jean Dupont" placeholderTextColor="#4B5563" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>TÉLÉPHONE</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Ex: 034 00 000 00" keyboardType="phone-pad" placeholderTextColor="#4B5563" />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnTextCancel}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnAdd} onPress={handleSaveBuyer}>
                <Text style={styles.btnTextAdd}>{editingId ? "Mettre à jour" : "Enregistrer"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  headerSearchContainer: { flexDirection: 'row', alignItems: 'center', width: width * 0.6, backgroundColor: '#111827', borderRadius: 10, paddingHorizontal: 10, height: 35 },
  headerSearchInput: { flex: 1, color: '#FFF', fontSize: 14 },
  list: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: '#111827', padding: 18, borderRadius: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1E293B' },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: '#6366F1', fontSize: 20, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phone: { color: '#94A3B8', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { padding: 8, backgroundColor: '#1E293B', borderRadius: 12 },
  fab: { position: 'absolute', right: 25, bottom: 30, backgroundColor: '#A5B4FC', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 16, color: '#64748B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111827', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, borderTopWidth: 1, borderTopColor: '#1E293B' },
  modalTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginBottom: 25, textAlign: 'center' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#6366F1', fontSize: 12, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: '#0F172A', borderRadius: 12, padding: 15, color: '#FFFFFF', fontSize: 16, borderWidth: 1, borderColor: '#1E293B' },
  modalButtons: { flexDirection: 'row', gap: 15, marginTop: 15 },
  btnCancel: { flex: 1, padding: 18, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1E293B' },
  btnTextCancel: { color: '#EF4444', fontWeight: 'bold' },
  btnAdd: { flex: 2, backgroundColor: '#6366F1', padding: 18, borderRadius: 15, alignItems: 'center' },
  btnTextAdd: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }
});
