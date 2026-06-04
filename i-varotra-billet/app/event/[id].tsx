import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { EventService, Event } from '../../services/EventService';
import { TicketService } from '../../services/TicketService';
import { PdfService, PdfExportOptions } from '../../services/PdfService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import ConfirmModal from '../../components/ConfirmModal';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import { useRole } from '../../hooks/useRole';

const SURFACE = '#111827';
const SURFACE2 = '#1E293B';
const BG = '#000000';
const TEXT = '#FFFFFF';
const TEXT2 = '#94A3B8';
const BORDER = '#1E293B';
const SUCCESS = '#10B981';
const DANGER = '#EF4444';

export default function EventDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const eventId = parseInt(id as string);
  const { role } = useRole();

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<any>({
    total: 0, available: 0, sold: 0, validated: 0,
    total_collected: 0, total_pending: 0, total_potential_revenue: 0,
  });
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Preview modal
  const [showPreview, setShowPreview] = useState(false);
  const [previewSide, setPreviewSide] = useState<'recto' | 'verso'>('recto');
  const [isClearMode, setIsClearMode] = useState(false);

  // Image adjustments
  const [imgScale, setImgScale] = useState(1.0);
  const [imgRotate, setImgRotate] = useState(0);
  const [imgX, setImgX] = useState(0);
  const [imgY, setImgY] = useState(0);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // PDF export options modal
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportTicketTypeId, setExportTicketTypeId] = useState<number | null>(null);
  const [exportFromNumber, setExportFromNumber] = useState('');
  const [exportToNumber, setExportToNumber] = useState('');

  // Confirmation modal (single, reused)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  const themeColor = event?.color || '#6366F1';

  const fetchData = useCallback(async () => {
    const ev = EventService.getEvents().find(e => e.id === eventId);
    if (ev) {
      setEvent(ev);
      setStats(TicketService.getEventStats(eventId));

      const types = EventService.getTicketTypes(eventId);
      const allTickets = TicketService.getTicketsByEvent(eventId);
      setTicketTypes(types.map(type => {
        const typeTickets = allTickets.filter(
          t => t.ticket_type_id === type.id || t.ticket_type_name === type.name
        );
        const soldTickets = typeTickets.filter(
          t => t.status_id === TicketService.STATUS_VENDU || t.status_id === TicketService.STATUS_VALIDE
        );
        return {
          ...type,
          total: typeTickets.length,
          sold: soldTickets.length,
          validated: typeTickets.filter(t => t.status_id === TicketService.STATUS_VALIDE).length,
        };
      }));

      setImgScale(ev.img_scale || 1.0);
      setImgRotate(ev.img_rotate || 0);
      setImgX(ev.img_x || 0);
      setImgY(ev.img_y || 0);
    }
    setLoading(false);
  }, [eventId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  // ─── PDF export ──────────────────────────────────────────────────────────────

  const handleExportPdf = () => {
    if (!event) return;
    setShowExportOptions(true);
  };

  const handleConfirmExport = () => {
    setShowExportOptions(false);
    setShowExportConfirm(true);
  };

  const handleDoExport = async () => {
    setShowExportConfirm(false);
    setExporting(true);

    const allTickets = TicketService.getTicketsByEvent(eventId);
    if (allTickets.length === 0) {
      showError('Aucun billet', 'Aucun billet n\'a été généré pour cet événement.');
      setExporting(false);
      return;
    }

    const options: PdfExportOptions = {};
    if (exportTicketTypeId) options.ticketTypeId = exportTicketTypeId;
    if (exportFromNumber) options.fromNumber = parseInt(exportFromNumber);
    if (exportToNumber) options.toNumber = parseInt(exportToNumber);

    const success = await PdfService.exportTicketsToPdf(event!, allTickets, options);
    if (success) {
      showSuccess('PDF exporté avec succès');
    } else {
      showError('Erreur', 'Impossible de générer le PDF.');
    }
    setExporting(false);
    setExportTicketTypeId(null);
    setExportFromNumber('');
    setExportToNumber('');
  };

  // ─── Image adjustments ───────────────────────────────────────────────────────

  const handleSaveAdjustments = () => {
    if (!event) return;
    const updated = { ...event, img_scale: imgScale, img_rotate: imgRotate, img_x: imgX, img_y: imgY };
    if (EventService.updateEvent(updated)) {
      setEvent(updated);
      setIsAdjusting(false);
      showSuccess('Ajustements enregistrés.');
    } else {
      showError('Erreur', 'Impossible d\'enregistrer.');
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────────

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
      showError('Erreur', 'Impossible de supprimer l\'événement.');
    }
  };

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const fillPercent = useMemo(() => {
    if (!stats.total) return 0;
    return Math.round(((stats.sold + stats.validated) / stats.total) * 100);
  }, [stats]);

  // ─── Loading / not found ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={{ color: TEXT2 }}>Événement non trouvé</Text>
      </View>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: BG },
          headerTintColor: TEXT,
          headerTitle: event.name ?? 'Événement',
          headerTitleStyle: { fontSize: 16, fontWeight: '700' },
          headerRight: () =>
            role === 'admin' ? (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/add-event', params: { id: eventId } })}
                style={{ marginRight: 16 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="pencil-outline" size={22} color={themeColor} />
              </TouchableOpacity>
            ) : null,
        }}
      />

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <View style={[styles.hero, { borderLeftColor: themeColor }]}>
        <View style={styles.heroTop}>
          <View style={[styles.colorDot, { backgroundColor: themeColor }]} />
          <Text style={styles.heroDate}>{event.event_date}</Text>
        </View>
        <Text style={styles.heroName}>{event.name}</Text>
        {event.slogan ? (
          <Text style={[styles.heroSlogan, { color: themeColor }]}>{event.slogan}</Text>
        ) : null}
      </View>

      {/* ── Stats bar ───────────────────────────────────────────────────── */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: themeColor }]}>{stats.sold}</Text>
          <Text style={styles.statLabel}>Vendus</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: SUCCESS }]}>{stats.validated}</Text>
          <Text style={styles.statLabel}>Vérifiés</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{fillPercent}%</Text>
          <Text style={styles.statLabel}>Remplissage</Text>
        </View>
      </View>

      {/* Fill progress */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${fillPercent}%` as any, backgroundColor: themeColor }]} />
      </View>

      {/* ── Finance card (admin only) ────────────────────────────────────── */}
      {role === 'admin' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bilan Financier</Text>
          <View style={styles.financeRow}>
            <View style={styles.financeItem}>
              <Text style={styles.financeLabel}>Encaissé</Text>
              <Text style={[styles.financeValue, { color: SUCCESS }]}>
                {(stats.total_collected ?? 0).toLocaleString()} Ar
              </Text>
            </View>
            <View style={styles.financeItem}>
              <Text style={styles.financeLabel}>Reste dû</Text>
              <Text style={[styles.financeValue, { color: DANGER }]}>
                {(stats.total_pending ?? 0).toLocaleString()} Ar
              </Text>
            </View>
          </View>
          <View style={styles.financeTotalRow}>
            <Text style={styles.financeLabel}>CA total prévu</Text>
            <Text style={[styles.financeValue, { color: themeColor, fontSize: 20 }]}>
              {(stats.total_potential_revenue ?? 0).toLocaleString()} Ar
            </Text>
          </View>
        </View>
      )}

      {/* ── Ticket types ────────────────────────────────────────────────── */}
      {ticketTypes.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Types de Billets</Text>
          {ticketTypes.map((type, index) => (
            <View
              key={type.id}
              style={[
                styles.typeRow,
                index < ticketTypes.length - 1 && styles.typeRowBorder,
              ]}
            >
              <View style={styles.typeInfo}>
                <Text style={[styles.typeName, { color: themeColor }]}>{type.name}</Text>
                <Text style={styles.typePrice}>{(type.price ?? 0).toLocaleString()} Ar</Text>
              </View>
              <View style={styles.typeStats}>
                <View style={styles.typeStatItem}>
                  <Text style={styles.typeStatValue}>{type.total}</Text>
                  <Text style={styles.typeStatLabel}>Total</Text>
                </View>
                <View style={[styles.typeStatItem, styles.typeStatBorder]}>
                  <Text style={[styles.typeStatValue, { color: themeColor }]}>{type.sold}</Text>
                  <Text style={styles.typeStatLabel}>Vendus</Text>
                </View>
                <View style={styles.typeStatItem}>
                  <Text style={[styles.typeStatValue, { color: SUCCESS }]}>{type.validated}</Text>
                  <Text style={styles.typeStatLabel}>Vérifiés</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── Action grid ─────────────────────────────────────────────────── */}
      <View style={styles.actionsGrid}>
        {role === 'admin' && (
          <ActionCard
            icon="ticket-outline"
            label="Générer billets"
            color={themeColor}
            textColor="#000"
            onPress={() => router.push(`/event/${id}/generate`)}
          />
        )}

        <ActionCard
          icon={exporting ? undefined : 'file-pdf-box'}
          label="Exporter PDF"
          color={SUCCESS}
          textColor="#000"
          onPress={handleExportPdf}
          disabled={exporting}
          loading={exporting}
        />

        <ActionCard
          icon="eye-outline"
          label="Aperçu billet"
          color={SURFACE}
          textColor={TEXT}
          borderColor={BORDER}
          iconColor={themeColor}
          onPress={() => setShowPreview(true)}
        />

        <ActionCard
          icon="ticket-confirmation-outline"
          label="Voir billets"
          color={SURFACE}
          textColor={TEXT}
          borderColor={BORDER}
          iconColor={themeColor}
          onPress={() => router.push(`/tickets/${eventId}`)}
        />
      </View>

      {/* ── Delete (admin only) ─────────────────────────────────────────── */}
      {role === 'admin' && (
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.7}>
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={DANGER} />
          <Text style={styles.deleteBtnText}>Supprimer l'événement</Text>
        </TouchableOpacity>
      )}

      {/* ── Ticket preview modal ─────────────────────────────────────────── */}
      <Modal visible={showPreview} transparent animationType="slide" onRequestClose={() => setShowPreview(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.previewSheet}>
            {/* Header */}
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Aperçu du Billet</Text>
              <View style={styles.previewHeaderRight}>
                {previewSide === 'verso' && event.image && (
                  <TouchableOpacity
                    onPress={() => setIsClearMode(v => !v)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons
                      name={isClearMode ? 'eye-off-outline' : 'image-outline'}
                      size={22}
                      color={isClearMode ? themeColor : TEXT2}
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowPreview(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialCommunityIcons name="close" size={24} color={TEXT} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Recto / Verso toggle */}
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, previewSide === 'recto' && { backgroundColor: themeColor }]}
                onPress={() => setPreviewSide('recto')}
              >
                <Text style={[styles.toggleText, { color: previewSide === 'recto' ? '#000' : TEXT2 }]}>RECTO</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, previewSide === 'verso' && { backgroundColor: themeColor }]}
                onPress={() => setPreviewSide('verso')}
              >
                <Text style={[styles.toggleText, { color: previewSide === 'verso' ? '#000' : TEXT2 }]}>VERSO</Text>
              </TouchableOpacity>
            </View>

            {/* Ticket preview */}
            <View style={styles.ticketContainer}>
              {/* RECTO */}
              <View
                style={[
                  styles.ticketPreview,
                  previewSide !== 'recto' && styles.ticketHidden,
                ]}
                pointerEvents={previewSide === 'recto' ? 'auto' : 'none'}
              >
                <View style={[styles.rectoTop, { backgroundColor: themeColor }]}>
                  {event.slogan ? (
                    <Text style={styles.rectoSlogan} numberOfLines={1}>{event.slogan}</Text>
                  ) : null}
                  <Text style={styles.rectoLabel}>BILLET</Text>
                  <MaterialCommunityIcons name="ticket-outline" size={40} color="#000" />
                </View>
                <View style={styles.rectoBottom}>
                  <Text style={[styles.rectoEventName, { color: themeColor }]} numberOfLines={2}>
                    {event.name}
                  </Text>
                  <Text style={styles.rectoEventDate}>{event.event_date}</Text>
                  <View style={styles.rectoNumBox}>
                    <Text style={styles.rectoNumText}>E{event.id}-T0001</Text>
                  </View>
                  <MaterialCommunityIcons name="qrcode" size={100} color="#333" />
                </View>
              </View>

              {/* VERSO */}
              <View
                style={[
                  styles.ticketPreview,
                  previewSide !== 'verso' && styles.ticketHidden,
                ]}
                pointerEvents={previewSide === 'verso' ? 'auto' : 'none'}
              >
                {event.image ? (
                  <Image
                    source={{ uri: event.image }}
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        transform: [
                          { scale: imgScale },
                          { rotate: `${imgRotate}deg` },
                          { translateX: imgX },
                          { translateY: imgY },
                        ],
                      },
                    ]}
                    contentFit="cover"
                  />
                ) : null}
                {event.image ? (
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      { backgroundColor: isClearMode ? 'transparent' : 'rgba(255,255,255,0.7)' },
                    ]}
                  />
                ) : null}
                <View style={styles.versoCenter}>
                  <Image
                    source={require('../../assets/logo_iBillet.png')}
                    style={styles.versoLogo}
                    contentFit="contain"
                  />
                </View>
                {event.description ? (
                  <View style={styles.versoDescBox}>
                    <Text style={styles.versoDesc} numberOfLines={3}>{event.description}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Image adjustment panel (admin + verso + image) */}
            {previewSide === 'verso' && event.image && role === 'admin' && (
              <View style={styles.adjSection}>
                {!isAdjusting ? (
                  <TouchableOpacity
                    style={[styles.adjToggleBtn, { borderColor: themeColor }]}
                    onPress={() => setIsAdjusting(true)}
                  >
                    <MaterialCommunityIcons name="cog-outline" size={18} color={themeColor} />
                    <Text style={[styles.adjToggleBtnText, { color: themeColor }]}>Ajuster la photo</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.adjPanel}>
                    <View style={styles.adjRow}>
                      <AdjControl
                        label="Zoom"
                        value={`${imgScale.toFixed(1)}x`}
                        onMinus={() => setImgScale(s => Math.max(0.5, parseFloat((s - 0.1).toFixed(1))))}
                        onPlus={() => setImgScale(s => Math.min(3, parseFloat((s + 0.1).toFixed(1))))}
                        color={themeColor}
                      />
                      <AdjControl
                        label="Rotation"
                        value={`${imgRotate}°`}
                        onMinus={() => setImgRotate(r => r - 10)}
                        onPlus={() => setImgRotate(r => r + 10)}
                        color={themeColor}
                      />
                    </View>
                    <View style={styles.adjMoveGrid}>
                      <View style={styles.adjMoveRow}>
                        <TouchableOpacity style={styles.adjMoveBtn} onPress={() => setImgY(y => y - 5)}>
                          <MaterialCommunityIcons name="chevron-up" size={20} color={TEXT2} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.adjMoveRow}>
                        <TouchableOpacity style={styles.adjMoveBtn} onPress={() => setImgX(x => x - 5)}>
                          <MaterialCommunityIcons name="chevron-left" size={20} color={TEXT2} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.adjMoveBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
                          onPress={() => { setImgX(0); setImgY(0); }}
                        >
                          <MaterialCommunityIcons name="close" size={16} color={DANGER} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.adjMoveBtn} onPress={() => setImgX(x => x + 5)}>
                          <MaterialCommunityIcons name="chevron-right" size={20} color={TEXT2} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.adjMoveRow}>
                        <TouchableOpacity style={styles.adjMoveBtn} onPress={() => setImgY(y => y + 5)}>
                          <MaterialCommunityIcons name="chevron-down" size={20} color={TEXT2} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.adjActions}>
                      <TouchableOpacity
                        style={styles.adjCancelBtn}
                        onPress={() => { setIsAdjusting(false); fetchData(); }}
                      >
                        <Text style={styles.adjCancelText}>Annuler</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.adjSaveBtn, { backgroundColor: themeColor }]}
                        onPress={handleSaveAdjustments}
                      >
                        <Text style={styles.adjSaveText}>Sauvegarder</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {!isAdjusting && (
              <Text style={styles.previewHint}>Aperçu fidèle au design PDF final.</Text>
            )}
          </View>
        </View>
      </Modal>

      {/* ── PDF export options modal ─────────────────────────────────────── */}
      <Modal
        visible={showExportOptions}
        animationType="slide"
        transparent
        onRequestClose={() => setShowExportOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.exportSheet}>
            <Text style={styles.exportTitle}>Options d'export PDF</Text>

            <Text style={styles.exportLabel}>Type de billet</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeChip, !exportTicketTypeId && { backgroundColor: themeColor, borderColor: themeColor }]}
                onPress={() => setExportTicketTypeId(null)}
              >
                <Text style={[styles.typeChipText, !exportTicketTypeId && { color: '#FFF', fontWeight: '700' }]}>Tous</Text>
              </TouchableOpacity>
              {ticketTypes.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeChip,
                    exportTicketTypeId === type.id && { backgroundColor: themeColor, borderColor: themeColor },
                  ]}
                  onPress={() => setExportTicketTypeId(type.id)}
                >
                  <Text style={[
                    styles.typeChipText,
                    exportTicketTypeId === type.id && { color: '#FFF', fontWeight: '700' },
                  ]}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.exportLabel}>Plage de numéros (optionnel)</Text>
            <View style={styles.numberRange}>
              <TextInput
                style={styles.numberInput}
                placeholder="Du n°"
                placeholderTextColor="#4B5563"
                value={exportFromNumber}
                onChangeText={setExportFromNumber}
                keyboardType="numeric"
              />
              <Text style={{ color: TEXT2 }}>—</Text>
              <TextInput
                style={styles.numberInput}
                placeholder="Au n°"
                placeholderTextColor="#4B5563"
                value={exportToNumber}
                onChangeText={setExportToNumber}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.exportButtons}>
              <TouchableOpacity
                style={styles.exportCancelBtn}
                onPress={() => {
                  setShowExportOptions(false);
                  setExportTicketTypeId(null);
                  setExportFromNumber('');
                  setExportToNumber('');
                }}
              >
                <Text style={styles.exportCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exportConfirmBtn, { backgroundColor: themeColor }]}
                onPress={handleConfirmExport}
              >
                <Text style={styles.exportConfirmText}>Continuer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Confirm modals ───────────────────────────────────────────────── */}
      <ConfirmModal
        visible={showDeleteConfirm}
        title="Supprimer l'événement"
        message="Cette action est irréversible. L'événement et tous ses billets seront supprimés."
        onConfirm={executeDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Supprimer"
        type="danger"
      />

      <ConfirmModal
        visible={showExportConfirm}
        title="Exporter les billets en PDF"
        message="Les billets seront exportés selon les critères sélectionnés."
        onConfirm={handleDoExport}
        onCancel={() => setShowExportConfirm(false)}
        confirmText="Exporter"
        type="primary"
      />
    </ScrollView>
  );
}

// ─── Small sub-components ───────────────────────────────────────────────────

interface ActionCardProps {
  icon?: string;
  label: string;
  color: string;
  textColor: string;
  borderColor?: string;
  iconColor?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

function ActionCard({ icon, label, color, textColor, borderColor, iconColor, onPress, disabled, loading }: ActionCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.actionCard,
        { backgroundColor: color },
        borderColor ? { borderColor, borderWidth: 1 } : null,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <View style={styles.actionIconWrap}>
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <MaterialCommunityIcons name={icon as any} size={24} color={iconColor ?? textColor} />
        )}
      </View>
      <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface AdjControlProps {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
  color: string;
}

function AdjControl({ label, value, onMinus, onPlus, color }: AdjControlProps) {
  return (
    <View style={styles.adjControl}>
      <Text style={styles.adjControlLabel}>{label}</Text>
      <View style={styles.adjControlRow}>
        <TouchableOpacity style={styles.adjBtn} onPress={onMinus}>
          <MaterialCommunityIcons name="minus" size={14} color={TEXT2} />
        </TouchableOpacity>
        <Text style={[styles.adjControlValue, { color }]}>{value}</Text>
        <TouchableOpacity style={styles.adjBtn} onPress={onPlus}>
          <MaterialCommunityIcons name="plus" size={14} color={TEXT2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG },

  // Hero
  hero: {
    backgroundColor: SURFACE,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 5,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  heroDate: { color: TEXT2, fontSize: 13, fontWeight: '600' },
  heroName: { color: TEXT, fontSize: 20, fontWeight: '800', lineHeight: 26, marginBottom: 4 },
  heroSlogan: { fontSize: 13, fontStyle: 'italic' },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: TEXT, fontSize: 18, fontWeight: '700' },
  statLabel: { color: TEXT2, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 3 },
  statDivider: { width: 1, backgroundColor: BORDER },

  // Progress
  progressTrack: {
    marginHorizontal: 16,
    marginTop: 6,
    height: 3,
    backgroundColor: SURFACE2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },

  // Cards
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: SURFACE,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardTitle: { color: TEXT, fontSize: 15, fontWeight: '700', marginBottom: 14 },

  // Finance
  financeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  financeItem: { flex: 1 },
  financeLabel: { color: TEXT2, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  financeValue: { fontSize: 17, fontWeight: '700', color: TEXT },
  financeTotalRow: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Ticket types
  typeRow: { paddingVertical: 10 },
  typeRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER, marginBottom: 10 },
  typeInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeName: { fontSize: 15, fontWeight: '700' },
  typePrice: { color: TEXT2, fontSize: 13, fontWeight: '600' },
  typeStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    paddingVertical: 8,
  },
  typeStatItem: { flex: 1, alignItems: 'center' },
  typeStatBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: BORDER },
  typeStatValue: { fontSize: 15, fontWeight: '700', color: TEXT },
  typeStatLabel: { color: TEXT2, fontSize: 9, marginTop: 2, textTransform: 'uppercase' },

  // Actions grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 14,
  },
  actionCard: {
    width: '47%',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  // Delete
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  deleteBtnText: { color: DANGER, fontSize: 15, fontWeight: '600' },

  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  // Ticket preview sheet
  previewSheet: {
    width: '100%',
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    maxHeight: '90%',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: { color: TEXT, fontSize: 17, fontWeight: '800' },
  previewHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },

  // Recto/Verso toggle
  toggle: {
    flexDirection: 'row',
    backgroundColor: SURFACE2,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  toggleText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  // Ticket card
  ticketContainer: { alignItems: 'center', marginBottom: 16 },
  ticketPreview: {
    width: 240,
    height: 340,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  ticketHidden: { position: 'absolute', opacity: 0, zIndex: -1 },

  // Recto
  rectoTop: {
    width: '100%',
    height: '52%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 14,
  },
  rectoSlogan: { fontSize: 10, fontStyle: 'italic', color: '#000', opacity: 0.75, marginBottom: 6, paddingHorizontal: 8, textAlign: 'center' },
  rectoLabel: { fontSize: 16, fontWeight: '800', color: '#000', letterSpacing: 2, marginBottom: 4 },
  rectoBottom: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 72,
    borderTopRightRadius: 72,
    marginTop: -52,
    backgroundColor: '#FFF',
  },
  rectoEventName: { fontSize: 13, fontWeight: '800', textAlign: 'center', textTransform: 'uppercase' },
  rectoEventDate: { fontSize: 11, color: '#666', marginTop: 2 },
  rectoNumBox: { backgroundColor: '#EEE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  rectoNumText: { fontSize: 11, fontWeight: '700', color: '#333' },

  // Verso
  versoCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  versoLogo: { width: 110, height: 110 },
  versoDescBox: { paddingHorizontal: 16, paddingBottom: 50, zIndex: 10 },
  versoDesc: { fontSize: 10, color: '#333', textAlign: 'center', fontStyle: 'italic', lineHeight: 16 },

  // Adjustment section
  adjSection: { marginTop: 12 },
  adjToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  adjToggleBtnText: { fontSize: 14, fontWeight: '600' },
  adjPanel: {
    backgroundColor: SURFACE2,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  adjRow: { flexDirection: 'row', gap: 12 },
  adjControl: { flex: 1, alignItems: 'center', gap: 6 },
  adjControlLabel: { color: TEXT2, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  adjControlRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adjControlValue: { fontSize: 12, fontWeight: '700', minWidth: 36, textAlign: 'center' },
  adjBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjMoveGrid: { alignItems: 'center', gap: 4 },
  adjMoveRow: { flexDirection: 'row', gap: 4, justifyContent: 'center' },
  adjMoveBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 10 },
  adjCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#374151',
  },
  adjCancelText: { color: TEXT, fontSize: 14, fontWeight: '600' },
  adjSaveBtn: { flex: 2, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  adjSaveText: { color: '#000', fontSize: 14, fontWeight: '700' },

  previewHint: { color: TEXT2, fontSize: 11, textAlign: 'center', fontStyle: 'italic', marginTop: 8 },

  // Export sheet
  exportSheet: {
    width: '100%',
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  exportTitle: { color: TEXT, fontSize: 17, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  exportLabel: { color: TEXT2, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 14 },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE2,
  },
  typeChipText: { color: TEXT2, fontSize: 13 },
  numberRange: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numberInput: {
    flex: 1,
    backgroundColor: SURFACE2,
    borderRadius: 10,
    padding: 10,
    color: TEXT,
    fontSize: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  exportButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  exportCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  exportCancelText: { color: TEXT2, fontWeight: '600' },
  exportConfirmBtn: { flex: 1.5, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  exportConfirmText: { color: '#FFF', fontWeight: '700' },
});
