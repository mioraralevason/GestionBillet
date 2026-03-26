// app/event/[id].tsx
import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator, 
  Modal,
  useColorScheme 
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { EventService, Event } from '../../services/EventService';
import { TicketService } from '../../services/TicketService';
import { PdfService } from '../../services/PdfService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { Colors } from '../../constants/theme';

/**
 * Screen displaying detailed information about a specific event.
 * Allows admins to generate tickets, view stats, and export PDFs.
 */
export default function EventDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const eventId = parseInt(id as string);
  
  const colorScheme = useColorScheme() || 'light';
  const theme = Colors[colorScheme];

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<any>({ total: 0, available: 0, sold: 0, validated: 0, total_collected: 0, total_pending: 0, total_potential_revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [ticketCount, setTicketCount] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewSide, setPreviewSide] = useState<'recto' | 'verso'>('recto');
  const [isAdjusting, setIsAdjusting] = useState(false);
  
  // Image transformations
  const [imgScale, setImgScale] = useState(1.0);
  const [imgRotate, setImgRotate] = useState(0);
  const [imgX, setImgX] = useState(0);
  const [imgY, setImgY] = useState(0);
  const [isClearMode, setIsClearMode] = useState(false);

  const themeColor = event?.color || theme.tint;

  /**
   * Fetches event data and statistics from services.
   */
  const fetchData = useCallback(async () => {
    const userRole = await AsyncStorage.getItem('userRole');
    setRole(userRole);
    
    const ev = EventService.getEvents().find(e => e.id === eventId);
    if (ev) {
      setEvent(ev);
      const s = TicketService.getEventStats(eventId);
      setStats(s);
      
      // Load image adjustments
      setImgScale(ev.img_scale || 1.0);
      setImgRotate(ev.img_rotate || 0);
      setImgX(ev.img_x || 0);
      setImgY(ev.img_y || 0);
    }
    setLoading(false);
  }, [eventId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  /**
   * Handles ticket generation for the current event.
   */
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
      Alert.alert('Erreur', 'Échec de la génération des billets.');
    }
  };

  /**
   * Triggers PDF generation and sharing.
   */
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

  /**
   * Saves image adjustments (scale, rotate, position) to the database.
   */
  const handleSaveAdjustments = () => {
    if (!event) return;
    const updatedEvent = {
      ...event,
      img_scale: imgScale,
      img_rotate: imgRotate,
      img_x: imgX,
      img_y: imgY
    };
    if (EventService.updateEvent(updatedEvent)) {
      setEvent(updatedEvent);
      setIsAdjusting(false);
      Alert.alert('Succès', 'Ajustements enregistrés.');
    } else {
      Alert.alert('Erreur', 'Impossible d\'enregistrer.');
    }
  };

  /**
   * Handles event deletion with confirmation.
   */
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

  if (loading) return <View style={[styles.center, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color={theme.tint} /></View>;
  if (!event) return <View style={[styles.center, { backgroundColor: theme.background }]}><Text style={{ color: theme.text }}>Événement non trouvé</Text></View>;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          headerStyle: { backgroundColor: theme.header },
          headerTintColor: theme.text,
          headerRight: () => role === 'admin' ? (
            <TouchableOpacity onPress={() => router.push({ pathname: '/add-event', params: { id: eventId } })}>
              <MaterialCommunityIcons name="pencil" size={24} color={themeColor} />
            </TouchableOpacity>
          ) : null
        }}
      />
      <View style={[styles.header, { backgroundColor: theme.header, borderBottomColor: theme.border, borderLeftWidth: 8, borderLeftColor: themeColor }]}>
        <Text style={[styles.title, { color: theme.text }]}>{event.name}</Text>
        <Text style={[styles.date, { color: theme.icon }]}>{event.event_date}</Text>
        {event.slogan && <Text style={[styles.slogan, { color: themeColor }]}>{event.slogan}</Text>}
      </View>

      <View style={[styles.statsContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: theme.text }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: theme.icon }]}>Total</Text>
        </View>
        <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border }]}>
          <Text style={[styles.statValue, { color: theme.text }]}>{stats.sold}</Text>
          <Text style={[styles.statLabel, { color: theme.icon }]}>Vendus</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: theme.success }]}>{stats.validated}</Text>
          <Text style={[styles.statLabel, { color: theme.icon }]}>Vérifiés</Text>
        </View>
      </View>

      {role === 'admin' && (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Bilan Financier</Text>
          <View style={styles.financeRow}>
            <View style={styles.financeItem}>
              <Text style={[styles.financeLabel, { color: theme.icon }]}>Encaissé</Text>
              <Text style={[styles.financeValue, { color: theme.success }]}>{stats.total_collected.toLocaleString()} Ar</Text>
            </View>
            <View style={styles.financeItem}>
              <Text style={[styles.financeLabel, { color: theme.icon }]}>Reste</Text>
              <Text style={[styles.financeValue, { color: theme.danger }]}>{stats.total_pending.toLocaleString()} Ar</Text>
            </View>
          </View>
          <View style={[styles.financeItem, { marginTop: 15, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10 }]}>
            <Text style={[styles.financeLabel, { color: theme.icon }]}>Chiffre d'affaires total prévu</Text>
            <Text style={[styles.financeValue, { fontSize: 20, color: themeColor }]}>{stats.total_potential_revenue.toLocaleString()} Ar</Text>
          </View>
        </View>
      )}

      {role === 'admin' && (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Générer des billets</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={[styles.label, { color: theme.icon }]}>Quantité</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F3F4F6', color: theme.text }]}
                placeholder="Ex: 50"
                placeholderTextColor={theme.icon}
                keyboardType="numeric"
                value={ticketCount}
                onChangeText={setTicketCount}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.icon }]}>Prix (Ar)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F3F4F6', color: theme.text }]}
                placeholder="Ex: 20000"
                placeholderTextColor={theme.icon}
                keyboardType="numeric"
                value={ticketPrice}
                onChangeText={setTicketPrice}
              />
            </View>
          </View>
          <TouchableOpacity style={[styles.button, { backgroundColor: themeColor }]} onPress={handleGenerate}>
            <MaterialCommunityIcons name="ticket-plus" size={20} color="#000" />
            <Text style={[styles.buttonText, { color: '#000' }]}>Créer les billets</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.success, marginTop: role === 'admin' ? 0 : 20 }]} 
        onPress={handleExportPdf}
        disabled={exporting}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          {exporting ? (
            <ActivityIndicator color="#000" />
          ) : (
            <MaterialCommunityIcons name="file-pdf-box" size={24} color="#000" />
          )}
          <Text style={[styles.buttonText, { color: '#000' }]}>Exporter en PDF (A4 - 3x3)</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 0 }]} 
        onPress={() => setShowPreview(true)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <MaterialCommunityIcons name="eye" size={24} color={theme.tint} />
          <Text style={[styles.buttonText, { color: theme.tint }]}>Visualiser le Modèle</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.card, styles.viewTickets, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => router.push(`/tickets/${eventId}`)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="ticket-confirmation" size={24} color={themeColor} />
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0, marginLeft: 10 }]}>Voir la liste des billets</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.icon} />
        </View>
      </TouchableOpacity>

      {/* Preview Modal */}
      <Modal visible={showPreview} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.previewContent, { backgroundColor: theme.card }]}>
            <View style={styles.previewHeader}>
              <Text style={[styles.previewTitle, { color: theme.text }]}>Aperçu du Billet</Text>
              <View style={{ flexDirection: 'row', gap: 15 }}>
                {previewSide === 'verso' && event?.image && (
                  <TouchableOpacity onPress={() => setIsClearMode(!isClearMode)}>
                    <MaterialCommunityIcons name={isClearMode ? "eye-off" : "image"} size={24} color={isClearMode ? themeColor : theme.icon} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowPreview(false)}>
                  <MaterialCommunityIcons name="close" size={28} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.toggleContainer, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F0F0F0' }]}>
              <TouchableOpacity 
                style={[styles.toggleBtn, previewSide === 'recto' && { backgroundColor: themeColor }]}
                onPress={() => setPreviewSide('recto')}
              >
                <Text style={[styles.toggleText, { color: previewSide === 'recto' ? '#000' : theme.icon }]}>RECTO</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, previewSide === 'verso' && { backgroundColor: themeColor }]}
                onPress={() => setPreviewSide('verso')}
              >
                <Text style={[styles.toggleText, { color: previewSide === 'verso' ? '#000' : theme.icon }]}>VERSO</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ticketContainer}>
              {/* Face RECTO */}
              <View 
                style={[
                  styles.ticketPreview, 
                  styles.ticketRecto, 
                  { backgroundColor: '#FFF', borderLeftColor: themeColor },
                  previewSide !== 'recto' && { position: 'absolute', opacity: 0, zIndex: -1 }
                ]}
                pointerEvents={previewSide === 'recto' ? 'auto' : 'none'}
              >
                <Text style={[styles.previewEventName, { color: themeColor }]}>{event?.name}</Text>
                <Text style={[styles.previewEventDate, { color: '#666' }]}>{event?.event_date}</Text>
                <View style={styles.previewNumBox}>
                  <Text style={styles.previewNumText}>E{event?.id}-T0001</Text>
                </View>
                <MaterialCommunityIcons name="qrcode" size={140} color="#333" />
                <Text style={[styles.previewSlogan, { color: themeColor }]}>{event?.slogan}</Text>
              </View>

              {/* Face VERSO */}
              <View 
                style={[
                  styles.ticketPreview, 
                  styles.ticketVerso, 
                  { backgroundColor: '#F9F9F9', borderRightColor: themeColor },
                  previewSide !== 'verso' && { position: 'absolute', opacity: 0, zIndex: -1 }
                ]}
                pointerEvents={previewSide === 'verso' ? 'auto' : 'none'}
              >
                {/* Image de fond avec transformations */}
                {event?.image && (
                  <Image 
                    source={{ uri: event.image }} 
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        transform: [
                          { scale: imgScale },
                          { rotate: `${imgRotate}deg` },
                          { translateX: imgX },
                          { translateY: imgY }
                        ]
                      }
                    ]}
                    contentFit="cover"
                  />
                )}
                
                {/* Calque de contraste atténué si mode clair */}
                {event?.image && (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: isClearMode ? 'transparent' : 'rgba(255,255,255,0.7)' }]} />
                )}
                
                {/* Contenu - Masqué si mode clair et image présente */}
                {(!isClearMode || !event?.image) && (
                  <View style={styles.versoContent}>
                    <Text style={styles.previewDescription}>
                      {event?.description || "Merci de votre participation ! Ce billet est unique et personnel."}
                    </Text>
                    <View style={styles.versoFooter}>
                      <Text style={styles.versoFooterText}>Billet : E{event?.id}-T0001 | Prix : {ticketPrice || '0'} Ar</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {previewSide === 'verso' && event?.image && (
              <View style={styles.adjustmentControls}>
                {!isAdjusting ? (
                  <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.tint }]} onPress={() => setIsAdjusting(true)}>
                    <MaterialCommunityIcons name="cog" size={20} color="#000" />
                    <Text style={[styles.controlBtnText, { color: '#000' }]}>Ajuster la photo</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.adjustmentPanel, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F9F9F9', borderColor: theme.border }]}>
                    <View style={styles.controlRow}>
                      <TouchableOpacity onPress={() => setImgScale(s => Math.max(0.5, s - 0.1))}><MaterialCommunityIcons name="minus-circle" size={24} color={theme.icon} /></TouchableOpacity>
                      <Text style={[styles.controlLabel, { color: theme.text }]}>Zoom: {imgScale.toFixed(1)}x</Text>
                      <TouchableOpacity onPress={() => setImgScale(s => Math.min(3, s + 0.1))}><MaterialCommunityIcons name="plus-circle" size={24} color={theme.icon} /></TouchableOpacity>
                    </View>
                    <View style={styles.controlRow}>
                      <TouchableOpacity onPress={() => setImgRotate(r => r - 10)}><MaterialCommunityIcons name="rotate-left" size={24} color={theme.icon} /></TouchableOpacity>
                      <Text style={[styles.controlLabel, { color: theme.text }]}>Rot: {imgRotate}°</Text>
                      <TouchableOpacity onPress={() => setImgRotate(r => r + 10)}><MaterialCommunityIcons name="rotate-right" size={24} color={theme.icon} /></TouchableOpacity>
                    </View>
                    <View style={styles.moveControls}>
                      <TouchableOpacity onPress={() => setImgY(y => y - 5)}><MaterialCommunityIcons name="chevron-up" size={24} color={theme.icon} /></TouchableOpacity>
                      <View style={{ flexDirection: 'row', gap: 20 }}>
                        <TouchableOpacity onPress={() => setImgX(x => x - 5)}><MaterialCommunityIcons name="chevron-left" size={24} color={theme.icon} /></TouchableOpacity>
                        <TouchableOpacity onPress={() => setImgX(x => x + 5)}><MaterialCommunityIcons name="chevron-right" size={24} color={theme.icon} /></TouchableOpacity>
                      </View>
                      <TouchableOpacity onPress={() => setImgY(y => y + 5)}><MaterialCommunityIcons name="chevron-down" size={24} color={theme.icon} /></TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.danger }]} onPress={() => { setIsAdjusting(false); fetchData(); }}>
                        <Text style={[styles.actionBtnText, { color: '#000' }]}>Annuler</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: themeColor }]} onPress={handleSaveAdjustments}>
                        <Text style={[styles.actionBtnText, { color: '#000' }]}>Sauvegarder</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {!isAdjusting && <Text style={[styles.previewHint, { color: theme.icon }]}>Note: Cet aperçu respecte le design du PDF final.</Text>}
          </View>
        </View>
      </Modal>

      {role === 'admin' && (
        <TouchableOpacity 
          style={[styles.card, styles.deleteButton, { borderColor: theme.danger, backgroundColor: 'transparent' }]} 
          onPress={handleDelete}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.danger} />
          <Text style={[styles.deleteButtonText, { color: theme.danger }]}>Supprimer l'événement</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  date: { fontSize: 16, marginTop: 4 },
  slogan: { fontSize: 14, fontStyle: 'italic', marginTop: 8 },
  statsContainer: { flexDirection: 'row', marginTop: 20, paddingVertical: 15, elevation: 1, borderBottomWidth: 1 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  card: { margin: 20, padding: 20, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, borderWidth: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  financeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  financeItem: { flex: 1 },
  financeLabel: { fontSize: 12, textTransform: 'uppercase', marginBottom: 5 },
  financeValue: { fontSize: 18, fontWeight: 'bold' },
  row: { flexDirection: 'row', marginBottom: 15 },
  label: { fontSize: 13, marginBottom: 5 },
  input: { borderRadius: 8, padding: 12, fontSize: 16 },
  button: { flexDirection: 'row', borderRadius: 10, padding: 15, alignItems: 'center', justifyContent: 'center', gap: 10 },
  buttonText: { fontSize: 16, fontWeight: 'bold' },
  viewTickets: { marginTop: 0, flexDirection: 'column' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  previewContent: { borderRadius: 20, padding: 20, maxHeight: '90%' },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  previewTitle: { fontSize: 20, fontWeight: 'bold' },
  toggleContainer: { flexDirection: 'row', borderRadius: 10, padding: 4, marginBottom: 20 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleText: { fontWeight: 'bold' },
  ticketContainer: { alignItems: 'center', marginBottom: 20 },
  ticketPreview: { width: 250, height: 350, borderRadius: 10, padding: 15, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' },
  ticketRecto: { borderLeftWidth: 10 },
  ticketVerso: { borderRightWidth: 10 },
  previewEventName: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' },
  previewEventDate: { fontSize: 14 },
  previewNumBox: { backgroundColor: '#EEE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  previewNumText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  previewSlogan: { fontSize: 13, fontStyle: 'italic', textAlign: 'center' },
  versoContent: { flex: 1, width: '100%', padding: 20, justifyContent: 'space-between', zIndex: 10 },
  previewDescription: { fontSize: 13, color: '#333', textAlign: 'left', lineHeight: 20, fontWeight: '500' },
  versoFooter: { borderTopWidth: 1, borderTopColor: '#DDD', paddingTop: 10, marginTop: 10 },
  versoFooterText: { fontSize: 10, color: '#999', textAlign: 'center' },
  previewHint: { fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
  adjustmentControls: { marginTop: 10, width: '100%' },
  controlBtn: { flexDirection: 'row', padding: 10, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 8 },
  controlBtnText: { fontWeight: 'bold' },
  adjustmentPanel: { borderRadius: 12, padding: 15, borderWidth: 1 },
  controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  controlLabel: { fontSize: 14, fontWeight: '600' },
  moveControls: { alignItems: 'center', marginVertical: 10 },
  actionBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { fontWeight: 'bold' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1 },
  deleteButtonText: { fontWeight: 'bold' }
});
