// app/(tabs)/buyers.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { BuyerService, Buyer } from '../../services/BuyerService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

export default function BuyersList() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  
  // États pour le nouvel acheteur
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const fetchBuyers = useCallback(() => {
    const list = BuyerService.getBuyers();
    setBuyers(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBuyers();
    }, [fetchBuyers])
  );

  const handleAddBuyer = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire.');
      return;
    }

    if (BuyerService.addBuyer({ name, phone })) {
      setName('');
      setPhone('');
      setModalVisible(false);
      fetchBuyers();
    } else {
      Alert.alert('Erreur', "Impossible d'ajouter l'acheteur.");
    }
  };

  const filteredBuyers = buyers.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    (b.phone && b.phone.includes(search))
  );

  const renderItem = ({ item }: { item: Buyer }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.phone && <Text style={styles.phone}>{item.phone}</Text>}
      </View>
      <TouchableOpacity onPress={() => item.id && BuyerService.deleteBuyer(item.id) && fetchBuyers()}>
        <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color="#8E8E93" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Rechercher un acheteur..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredBuyers}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Aucun acheteur enregistré.</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialCommunityIcons name="account-plus" size={30} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouvel Acheteur</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Nom complet" 
              value={name}
              onChangeText={setName}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Téléphone" 
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnTextCancel}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnAdd} onPress={handleAddBuyer}>
                <Text style={styles.btnTextAdd}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 15, padding: 10, borderRadius: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  list: { padding: 15 },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold' },
  phone: { fontSize: 14, color: '#666' },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#007AFF', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 15 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btnCancel: { flex: 1, padding: 15, alignItems: 'center' },
  btnTextCancel: { color: '#FF3B30', fontSize: 16 },
  btnAdd: { flex: 1, backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnTextAdd: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});