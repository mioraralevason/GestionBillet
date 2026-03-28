import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  useColorScheme
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { EventService } from '../../../services/EventService';
import { TicketService } from '../../../services/TicketService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/theme';

export default function GenerateTickets() {
  const { id: idParam } = useLocalSearchParams();
  const router = useRouter();
  const id = parseInt(idParam as string);

  const colorScheme = useColorScheme() || 'light';
  const theme = Colors[colorScheme];

  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [generateQuantities, setGenerateQuantities] = useState<{[key: number]: string}>({});
  const [newTicketType, setNewTicketType] = useState({ name: '', price: '' });

  const themeColor = event?.color || theme.tint;

  const fetchData = useCallback(() => {
    if (isNaN(id) || !id) {
      Alert.alert('Erreur', 'ID d\'événement invalide.');
      router.back();
      return;
    }
    
    const ev = EventService.getEvents().find(e => e.id === id);
    if (ev) {
      setEvent(ev);
      const types = EventService.getTicketTypes(id);
      setTicketTypes(types);
    } else {
      Alert.alert('Erreur', 'Événement non trouvé.');
      router.back();
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleGenerate = (ticketTypeId: number, price: number) => {
    const count = parseInt(generateQuantities[ticketTypeId] || '0');

    if (isNaN(count) || count <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer une quantité valide.');
      return;
    }

    if (TicketService.generateTickets(id, count, price, ticketTypeId)) {
      Alert.alert('Succès', `${count} billets générés.`);
      const newQuantities = { ...generateQuantities };
      delete newQuantities[ticketTypeId];
      setGenerateQuantities(newQuantities);
      fetchData();
    } else {
      Alert.alert('Erreur', 'Échec de la génération des billets.');
    }
  };

  const handleAddTicketType = () => {
    if (!newTicketType.name.trim() || !newTicketType.price) {
      Alert.alert('Erreur', 'Veuillez remplir le nom et le prix.');
      return;
    }

    const price = parseFloat(newTicketType.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Erreur', 'Prix invalide.');
      return;
    }

    if (isNaN(id) || !id) {
      Alert.alert('Erreur', 'ID d\'événement invalide.');
      return;
    }

    const typeId = EventService.addTicketType({
      event_id: id,
      name: newTicketType.name.trim(),
      price: price
    });

    if (typeId) {
      setNewTicketType({ name: '', price: '' });
      fetchData();
      Alert.alert('Succès', 'Type de billet ajouté.');
    } else {
      Alert.alert('Erreur', 'Impossible d\'ajouter le type de billet.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Event Info */}
        <View style={[styles.eventCard, { backgroundColor: theme.card, borderColor: theme.border, borderLeftColor: themeColor }]}>
          <Text style={[styles.eventName, { color: theme.text }]}>{event?.name}</Text>
          <Text style={[styles.eventDate, { color: theme.icon }]}>{event?.event_date}</Text>
        </View>

        {/* Existing Ticket Types */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Types existants</Text>
          
          {ticketTypes.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.icon }]}>Aucun type de billet disponible</Text>
          ) : (
            ticketTypes.map((type) => (
              <View key={type.id} style={[styles.ticketTypeRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <View style={styles.ticketTypeInfo}>
                  <Text style={[styles.ticketTypeName, { color: theme.text }]}>{type.name}</Text>
                  <Text style={[styles.ticketTypePrice, { color: themeColor }]}>{type.price.toLocaleString()} Ar</Text>
                </View>
                <View style={styles.generateRow}>
                  <TextInput
                    style={[styles.quantityInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Qté"
                    placeholderTextColor={theme.icon}
                    keyboardType="numeric"
                    value={generateQuantities[type.id] || ''}
                    onChangeText={(value) => setGenerateQuantities({ ...generateQuantities, [type.id]: value })}
                  />
                  <TouchableOpacity
                    style={[styles.generateBtn, { backgroundColor: themeColor }]}
                    onPress={() => handleGenerate(type.id, type.price)}
                  >
                    <MaterialCommunityIcons name="ticket-confirmation" size={20} color="#000" />
                    <Text style={styles.generateBtnText}>Générer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Add New Ticket Type */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Nouveau type</Text>
          <View style={[styles.newTypeForm, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <TextInput
              style={[styles.newTypeInput, { color: theme.text, borderColor: theme.border }]}
              placeholder="Nom du type"
              placeholderTextColor={theme.icon}
              value={newTicketType.name}
              onChangeText={(text) => setNewTicketType({ ...newTicketType, name: text })}
            />
            <TextInput
              style={[styles.newTypeInput, { color: theme.text, borderColor: theme.border }]}
              placeholder="Prix (Ar)"
              placeholderTextColor={theme.icon}
              keyboardType="numeric"
              value={newTicketType.price}
              onChangeText={(text) => setNewTicketType({ ...newTicketType, price: text })}
            />
            <TouchableOpacity
              style={[styles.addTypeBtn, { backgroundColor: theme.success }]}
              onPress={handleAddTicketType}
            >
              <MaterialCommunityIcons name="plus-circle" size={20} color="#000" />
              <Text style={styles.addTypeBtnText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  eventCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderLeftWidth: 6,
  },
  eventName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  eventDate: { fontSize: 14, },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  emptyText: { fontSize: 14, fontStyle: 'italic', textAlign: 'center', paddingVertical: 20 },
  ticketTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  ticketTypeInfo: { flex: 1 },
  ticketTypeName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  ticketTypePrice: { fontSize: 15, fontWeight: '700' },
  generateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quantityInput: {
    width: 80,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    borderWidth: 1,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  generateBtnText: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  newTypeForm: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    flexWrap: 'wrap',
  },
  newTypeInput: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  addTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addTypeBtnText: { fontSize: 14, fontWeight: 'bold', color: '#000' },
});
