// app/event/[id].tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { EventService, Event } from '../../services/EventService';
import { TicketService } from '../../services/TicketService';
import { PdfService } from '../../services/PdfService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EventDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const eventId = parseInt(id as string);

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<any>({ total: 0, available: 0, sold: 0, validated: 0, total_collected: 0, total_pending: 0, total_potential_revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [ticketCount, setTicketCount] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [exporting, setExporting] = useState(false);

  const themeColor = event?.color || '#007AFF';

  const fetchData = useCallback(async () => {
    const userRole = await AsyncStorage.getItem('userRole');
    setRole(userRole);
    
    const ev = EventService.getEvents().find(e => e.id === eventId);
    if (ev) {
      setEvent(ev);
      const s = TicketService.getEventStats(eventId);
      setStats(s);
    }
    setLoading(false);
  }, [eventId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleGenerate = () => {
    const count = parseInt(ticketCount);
    const price = parseFloat(ticketPrice);

    if (isNaN(count) || count <= 0) {
      Alert.alert('Erreur', 'Nombre de billets invalide.');
      return;
    }

    if (TicketService.generateTickets(eventId, count, isNaN(price) ? 0 : price)) {
      Alert.alert('Succès', `${count} billets générés.`);
      setTicketCount('');
      fetchData();
    } else {
      Alert.alert('Erreur', 'Échec de la génération.');
    }
  };

  const handleExportPdf = async () => {
    if (!event) return;
    setExporting(true);
    const tickets = TicketService.getTicketsByEvent(eventId);
    if (tickets.length === 0) {
      Alert.alert('Information', 'Aucun billet à exporter.');
      setExporting(false);
      return;
    }

    const success = await PdfService.exportTicketsToPdf(event, tickets);
    if (!success) {
      Alert.alert('Erreur', 'Impossible de générer le PDF.');
    }
    setExporting(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer l\'événement',
      'Êtes-vous sûr de vouloir supprimer cet événement et tous les billets associés ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            if (EventService.deleteEvent(eventId)) {
              router.back();
            } else {
              Alert.alert('Erreur', 'Impossible de supprimer l\'événement.');
            }
          }
        }
      ]
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
  if (!event) return <View style={styles.center}><Text>Événement non trouvé</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{
          headerRight: () => role === 'admin' ? (
            <TouchableOpacity onPress={() => router.push({ pathname: '/add-event', params: { id: eventId } })}>
              <MaterialCommunityIcons name="pencil" size={24} color={themeColor} />
            </TouchableOpacity>
          ) : null
        }}
      />
      <View style={[styles.header, { borderLeftWidth: 8, borderLeftColor: themeColor }]}>
        <Text style={styles.title}>{event.name}</Text>
        <Text style={styles.date}>{event.event_date}</Text>
        {event.slogan && <Text style={[styles.slogan, { color: themeColor }]}>{event.slogan}</Text>}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#EEE' }]}>
          <Text style={styles.statValue}>{stats.sold}</Text>
          <Text style={styles.statLabel}>Vendus</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#34C759' }]}>{stats.validated}</Text>
          <Text style={styles.statLabel}>Validés</Text>
        </View>
      </View>

      {role === 'admin' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bilan Financier</Text>
          <View style={styles.financeRow}>
            <View style={styles.financeItem}>
              <Text style={styles.financeLabel}>Encaissé</Text>
              <Text style={[styles.financeValue, { color: '#34C759' }]}>{stats.total_collected.toLocaleString()} Ar</Text>
            </View>
            <View style={styles.financeItem}>
              <Text style={styles.financeLabel}>Reste</Text>
              <Text style={[styles.financeValue, { color: '#FF3B30' }]}>{stats.total_pending.toLocaleString()} Ar</Text>
            </View>
          </View>
          <View style={[styles.financeItem, { marginTop: 15, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10 }]}>
            <Text style={styles.financeLabel}>Chiffre d'affaires total prévu</Text>
            <Text style={[styles.financeValue, { fontSize: 20, color: themeColor }]}>{stats.total_potential_revenue.toLocaleString()} Ar</Text>
          </View>
        </View>
      )}

      {role === 'admin' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Générer des billets</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Quantité</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 50"
                keyboardType="numeric"
                value={ticketCount}
                onChangeText={setTicketCount}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Prix (Ar)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 20000"
                keyboardType="numeric"
                value={ticketPrice}
                onChangeText={setTicketPrice}
              />
            </View>
          </View>
          <TouchableOpacity style={[styles.button, { backgroundColor: themeColor }]} onPress={handleGenerate}>
            <MaterialCommunityIcons name="ticket-plus" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Créer les billets</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.card, { backgroundColor: '#34C759', marginTop: role === 'admin' ? 0 : 20 }]} 
        onPress={handleExportPdf}
        disabled={exporting}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          {exporting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <MaterialCommunityIcons name="file-pdf-box" size={24} color="#FFF" />
          )}
          <Text style={[styles.buttonText, { color: '#FFF' }]}>Exporter en PDF (A4 - 3x3)</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.card, styles.viewTickets]}
        onPress={() => router.push(`/tickets/${eventId}`)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="ticket-confirmation" size={24} color={themeColor} />
            <Text style={[styles.cardTitle, { marginBottom: 0, marginLeft: 10 }]}>Voir la liste des billets</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#CCC" />
        </View>
      </TouchableOpacity>

      {role === 'admin' && (
        <TouchableOpacity 
          style={[styles.card, styles.deleteButton]} 
          onPress={handleDelete}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Supprimer l'événement</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  date: { fontSize: 16, color: '#666', marginTop: 4 },
  slogan: { fontSize: 14, fontStyle: 'italic', color: '#007AFF', marginTop: 8 },
  statsContainer: { flexDirection: 'row', backgroundColor: '#FFF', marginTop: 20, paddingVertical: 15, elevation: 1 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  card: { backgroundColor: '#FFF', margin: 20, padding: 20, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  financeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  financeItem: { flex: 1 },
  financeLabel: { fontSize: 12, color: '#999', textTransform: 'uppercase', marginBottom: 5 },
  financeValue: { fontSize: 18, fontWeight: 'bold' },
  row: { flexDirection: 'row', marginBottom: 15 },
  label: { fontSize: 13, color: '#666', marginBottom: 5 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 12, fontSize: 16 },
  button: { backgroundColor: '#007AFF', flexDirection: 'row', borderRadius: 10, padding: 15, alignItems: 'center', justifyContent: 'center', gap: 10 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  viewTickets: { marginTop: 0, flexDirection: 'column' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderColor: '#FF3B30', borderWidth: 1, backgroundColor: 'transparent' },
  deleteButtonText: { color: '#FF3B30', fontWeight: 'bold' }
});