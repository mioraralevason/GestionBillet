// app/event/[id].tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
import ConfirmModal from '../../components/ConfirmModal';
import { showSuccess, showError, showWarning, showInfo } from '../../utils/toast';

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
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewSide, setPreviewSide] = useState<'recto' | 'verso'>('recto');
  const [isAdjusting, setIsAdjusting] = useState(false);
  
  // Image transformations
  const [imgScale, setImgScale] = useState(1.0);
  const [imgRotate, setImgRotate] = useState(0);
  const [imgX, setImgX] = useState(0);
  const [imgY, setImgY] = useState(0);
  const [isClearMode, setIsClearMode] = useState(false);

  // Confirmation modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportInfo, setShowExportInfo] = useState(false);
  const [showExportError, setShowExportError] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showSaveError, setShowSaveError] = useState(false);
  const [showDeleteError, setShowDeleteError] = useState(false);

  const themeColor = event?.color || theme.tint;

  /**
   * Fetches event data and statistics from services.
   */
  const fetchData = async () => {
    const userRole = await AsyncStorage.getItem('userRole');
    setRole(userRole);

    const ev = EventService.getEvents().find(e => e.id === eventId);
    if (ev) {
      setEvent(ev);
      const s = TicketService.getEventStats(eventId);
      setStats(s);
      const types = EventService.getTicketTypes(eventId);
      const allTickets = TicketService.getTicketsByEvent(eventId);

      // Calculate stats per ticket type
      const typesWithStats = types.map(type => {
        // Filter by ticket_type_id OR by ticket_type_name (fallback for old tickets)
        const typeTickets = allTickets.filter(t => {
          return t.ticket_type_id === type.id || t.ticket_type_name === type.name;
        });
        const soldTickets = typeTickets.filter(t => t.status_id === TicketService.STATUS_VENDU || t.status_id === TicketService.STATUS_VALIDE);
        return {
          ...type,
          total: typeTickets.length,
          sold: soldTickets.length,
          validated: typeTickets.filter(t => t.status_id === TicketService.STATUS_VALIDE).length,
          revenue: soldTickets.reduce((sum, t) => sum + (t.total_paid || 0), 0)
        };
      });

      setTicketTypes(typesWithStats);

      // Load image adjustments
      setImgScale(ev.img_scale || 1.0);
      setImgRotate(ev.img_rotate || 0);
      setImgX(ev.img_x || 0);
      setImgY(ev.img_y || 0);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  /**
   * Triggers PDF generation and sharing.
   */
  const handleExportPdf = async () => {
    if (!event) return;

    setShowExportConfirm(true);
  };

  const handleConfirmExport = async () => {
    setShowExportConfirm(false);
    setExporting(true);

    const tickets = TicketService.getTicketsByEvent(eventId);
    if (tickets.length === 0) {
      setShowExportInfo(true);
      setExporting(false);
      return;
    }

    const success = await PdfService.exportTicketsToPdf(event, tickets);
    if (!success) {
      setShowExportError(true);
    } else {
      showSuccess('PDF exporté avec succès');
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
      setShowSaveSuccess(true);
    } else {
      setShowSaveError(true);
    }
  };

  /**
   * Handles event deletion with confirmation.
   * Only accessible by admin users.
   */
  const handleDelete = () => {
    if (role !== 'admin') {
      showWarning('Seul un administrateur peut supprimer cet événement.');
      return;
    }

    setShowDeleteConfirm(true);
  };

  const executeDelete = () => {
    setShowDeleteConfirm(false);
    if (EventService.deleteEvent(eventId)) {
      router.back();
    } else {
      setShowDeleteError(true);
    }
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
              <Text style={[styles.financeValue, { color: theme.success }]}>{(stats.total_collected ?? 0).toLocaleString()} Ar</Text>
            </View>
            <View style={styles.financeItem}>
              <Text style={[styles.financeLabel, { color: theme.icon }]}>Reste</Text>
              <Text style={[styles.financeValue, { color: theme.danger }]}>{(stats.total_pending ?? 0).toLocaleString()} Ar</Text>
            </View>
          </View>
          <View style={[styles.financeItem, { marginTop: 15, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10 }]}>
            <Text style={[styles.financeLabel, { color: theme.icon }]}>Chiffre d'affaires total prévu</Text>
            <Text style={[styles.financeValue, { fontSize: 20, color: themeColor }]}>{(stats.total_potential_revenue ?? 0).toLocaleString()} Ar</Text>
          </View>
        </View>
      )}

      {ticketTypes.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Types de Billets</Text>
          {ticketTypes.map((type, index) => (
            <View key={type.id} style={[styles.ticketTypeRow, index < ticketTypes.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 10, marginBottom: 10 }]}>
              <View style={styles.ticketTypeInfo}>
                <Text style={[styles.ticketTypeName, { color: themeColor }]}>{type.name}</Text>
                <Text style={[styles.ticketTypePrice, { color: theme.icon }]}>{(type.price ?? 0).toLocaleString()} Ar</Text>
              </View>
              <View style={styles.ticketTypeStats}>
                <View style={styles.ticketTypeStatItem}>
                  <Text style={[styles.ticketTypeStatValue, { color: theme.text }]}>{type.total}</Text>
                  <Text style={[styles.ticketTypeStatLabel, { color: theme.icon }]}>Total</Text>
                </View>
                <View style={[styles.ticketTypeStatItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border }]}>
                  <Text style={[styles.ticketTypeStatValue, { color: theme.text }]}>{type.sold}</Text>
                  <Text style={[styles.ticketTypeStatLabel, { color: theme.icon }]}>Vendus</Text>
                </View>
                <View style={styles.ticketTypeStatItem}>
                  <Text style={[styles.ticketTypeStatValue, { color: theme.success }]}>{type.validated}</Text>
                  <Text style={[styles.ticketTypeStatLabel, { color: theme.icon }]}>Vérifiés</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Actions Grid - 2x2 Cards */}
      <View style={styles.actionsGridContainer}>
        {role === 'admin' && (
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: themeColor }]}
            onPress={() => router.push(`/event/${id}/generate`)}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconWrapper}>
              <MaterialCommunityIcons name="ticket-outline" size={32} color="#000" />
            </View>
            <Text style={[styles.actionText, { color: '#000' }]}>Générer billet</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: theme.success }]}
          onPress={handleExportPdf}
          disabled={exporting}
          activeOpacity={0.8}
        >
          <View style={styles.actionIconWrapper}>
            {exporting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <MaterialCommunityIcons name="file-pdf-box" size={32} color="#000" />
            )}
          </View>
          <Text style={[styles.actionText, { color: '#000' }]}>Exporter PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
          onPress={() => setShowPreview(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
            <MaterialCommunityIcons name="eye" size={32} color={theme.tint} />
          </View>
          <Text style={[styles.actionText, { color: theme.tint }]}>Visualiser modèle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
          onPress={() => router.push(`/tickets/${eventId}`)}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
            <MaterialCommunityIcons name="ticket-confirmation" size={32} color={themeColor} />
          </View>
          <Text style={[styles.actionText, { color: theme.text }]}>Voir liste</Text>
        </TouchableOpacity>
      </View>

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
                  { backgroundColor: '#FFF' },
                  previewSide !== 'recto' && { position: 'absolute', opacity: 0, zIndex: -1 }
                ]}
                pointerEvents={previewSide === 'recto' ? 'auto' : 'none'}
              >
                {/* Section colorée avec courbe */}
                <View style={[styles.rectoTopSection, { backgroundColor: themeColor }]}>
                  {event?.slogan && (
                    <Text style={styles.rectoSlogan} numberOfLines={1}>{event.slogan}</Text>
                  )}
                  <View style={styles.rectoTopContent}>
                    <Text style={styles.rectoTitle}>BILLET</Text>
                    <MaterialCommunityIcons name="ticket-outline" size={45} color="#000" />
                  </View>
                </View>
                {/* Section blanche avec courbe vers le haut */}
                <View style={[styles.rectoBottomSection, { backgroundColor: '#FFF' }]}>
                  <View style={styles.rectoEventInfo}>
                    <Text style={[styles.previewEventName, { color: themeColor }]} numberOfLines={2}>{event?.name}</Text>
                    <Text style={[styles.previewEventDate, { color: '#666' }]}>{event?.event_date}</Text>
                  </View>
                  <View style={styles.previewNumBox}>
                    <Text style={styles.previewNumText}>E{event?.id}-T0001</Text>
                  </View>
                  <MaterialCommunityIcons name="qrcode" size={110} color="#333" />
                </View>
              </View>

              {/* Face VERSO */}
              <View
                style={[
                  styles.ticketPreview,
                  styles.ticketVerso,
                  { backgroundColor: '#FFF' },
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

                {/* Logo au milieu */}
                <View style={styles.versoLogoContainer}>
                  <Image
                    source={require('../../assets/logo_iBillet.png')}
                    style={styles.versoLogo}
                    contentFit="contain"
                  />
                </View>

                {/* Description si présente */}
                {event?.description && (
                  <View style={styles.versoDescriptionContainer}>
                    <Text style={styles.versoDescription}>
                      {event.description}
                    </Text>
                  </View>
                )}

                {/* Footer avec copyright et téléphone */}
                <View style={styles.versoFooter}>
                  <Text style={styles.versoFooterText}>© 2026 iBillet - Tous droits réservés</Text>
                  <Text style={styles.versoFooterText}>📞 033 76 913 14</Text>
                </View>
              </View>
            </View>

            {previewSide === 'verso' && event?.image && role === 'admin' && (
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
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#64748B' }]} onPress={() => { setIsAdjusting(false); fetchData(); }}>
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

      {/* Confirmation Modals */}
      <ConfirmModal
        visible={showDeleteConfirm}
        title="Supprimer l'événement"
        message="Êtes-vous sûr de vouloir supprimer cet événement et tous les billets associés ? Cette action est irréversible."
        onConfirm={executeDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Supprimer"
        type="danger"
      />

      <ConfirmModal
        visible={showExportInfo}
        title="Aucun billet"
        message="Aucun billet n'a été généré pour cet événement."
        onConfirm={() => setShowExportInfo(false)}
        onCancel={() => setShowExportInfo(false)}
        confirmText="OK"
        type="info"
        showCancel={false}
      />

      <ConfirmModal
        visible={showExportConfirm}
        title="Exporter les billets en PDF"
        message={`Tous les billets de "${event?.name}" seront exportés dans un fichier PDF prêt à l'impression.`}
        onConfirm={handleConfirmExport}
        onCancel={() => setShowExportConfirm(false)}
        confirmText="Exporter"
        cancelText="Annuler"
        type="primary"
      />

      <ConfirmModal
        visible={showExportError}
        title="Erreur"
        message="Impossible de générer le PDF."
        onConfirm={() => setShowExportError(false)}
        onCancel={() => setShowExportError(false)}
        confirmText="OK"
        type="danger"
        showCancel={false}
      />

      <ConfirmModal
        visible={showSaveSuccess}
        title="Succès"
        message="Ajustements enregistrés."
        onConfirm={() => setShowSaveSuccess(false)}
        onCancel={() => setShowSaveSuccess(false)}
        confirmText="OK"
        type="success"
        showCancel={false}
      />

      <ConfirmModal
        visible={showSaveError}
        title="Erreur"
        message="Impossible d'enregistrer."
        onConfirm={() => setShowSaveError(false)}
        onCancel={() => setShowSaveError(false)}
        confirmText="OK"
        type="danger"
        showCancel={false}
      />

      <ConfirmModal
        visible={showDeleteError}
        title="Erreur"
        message="Impossible de supprimer l'événement."
        onConfirm={() => setShowDeleteError(false)}
        onCancel={() => setShowDeleteError(false)}
        confirmText="OK"
        type="danger"
        showCancel={false}
      />
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
  ticketTypeRow: { paddingVertical: 10 },
  ticketTypeInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  ticketTypeName: { fontSize: 16, fontWeight: 'bold' },
  ticketTypePrice: { fontSize: 14, fontWeight: '600' },
  ticketTypeStats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, paddingVertical: 8 },
  ticketTypeStatItem: { flex: 1, alignItems: 'center' },
  ticketTypeStatValue: { fontSize: 16, fontWeight: 'bold' },
  ticketTypeStatLabel: { fontSize: 10, marginTop: 2 },
  row: { flexDirection: 'row', marginBottom: 15 },
  label: { fontSize: 13, marginBottom: 5 },
  input: { borderRadius: 8, padding: 12, fontSize: 16 },
  button: { flexDirection: 'row', borderRadius: 10, padding: 15, alignItems: 'center', justifyContent: 'center', gap: 10 },
  buttonText: { fontSize: 16, fontWeight: 'bold' },
  viewTickets: { marginTop: 0, flexDirection: 'column' },
  actionsGridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10, gap: 15 },
  actionCard: { width: '47%', padding: 20, borderRadius: 16, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  actionIconWrapper: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionText: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  previewContent: { borderRadius: 24, padding: 20, maxHeight: '90%', backgroundColor: '#111827', borderWidth: 1, borderColor: '#1E293B' },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  previewTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  toggleContainer: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 20, backgroundColor: '#1E293B' },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleText: { fontWeight: 'bold' },
  ticketContainer: { alignItems: 'center', marginBottom: 20 },
  ticketPreview: { width: 250, height: 350, borderRadius: 16, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, overflow: 'hidden' },
  ticketRecto: {},
  ticketVerso: {},
  rectoTopSection: { width: '100%', height: '52%', justifyContent: 'flex-start', alignItems: 'center', paddingTop: 15 },
  rectoSlogan: { fontSize: 11, fontStyle: 'italic', color: '#000', textAlign: 'center', marginBottom: 8, paddingHorizontal: 10, opacity: 0.8 },
  rectoTopContent: { alignItems: 'center', zIndex: 10 },
  rectoTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 5, letterSpacing: 2 },
  rectoBottomSection: { flex: 1, width: '100%', paddingHorizontal: 20, paddingVertical: 15, alignItems: 'center', justifyContent: 'space-around', borderTopLeftRadius: 80, borderTopRightRadius: 80, marginTop: -60 },
  rectoEventInfo: { alignItems: 'center', marginTop: 10 },
  versoLogoContainer: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  versoLogo: { width: 120, height: 120 },
  versoDescriptionContainer: { paddingHorizontal: 20, paddingBottom: 60 },
  versoDescription: { fontSize: 12, color: '#333', textAlign: 'center', fontStyle: 'italic', lineHeight: 18 },
  previewEventName: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' },
  previewEventDate: { fontSize: 13, marginTop: 4, color: '#666' },
  sloganContainer: { alignItems: 'center', paddingHorizontal: 10 },
  previewNumBox: { backgroundColor: '#EEE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  previewNumText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  previewSlogan: { fontSize: 13, fontStyle: 'italic', textAlign: 'center' },
  versoFooter: { position: 'absolute', bottom: 15, left: 0, right: 0, alignItems: 'center', gap: 4 },
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
