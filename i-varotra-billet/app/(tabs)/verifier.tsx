import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AttendanceService, ValidationResult } from '../../services/AttendanceService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';

const SURFACE = '#111827';
const SURFACE2 = '#1E293B';
const TEXT = '#FFFFFF';
const TEXT2 = '#94A3B8';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const DANGER = '#EF4444';
const ACCENT = '#6366F1';

// ─── Permission screen ────────────────────────────────────────────────────────

function PermissionScreen({ onRequest }: { onRequest: () => void }) {
  return (
    <SafeAreaView style={styles.permScreen}>
      <View style={styles.permIconWrap}>
        <MaterialCommunityIcons name="camera-outline" size={56} color={ACCENT} />
      </View>
      <Text style={styles.permTitle}>Accès caméra requis</Text>
      <Text style={styles.permSub}>
        Pour scanner les QR codes des billets, l'application a besoin d'accéder à votre caméra.
      </Text>
      <TouchableOpacity style={styles.permBtn} onPress={onRequest} activeOpacity={0.8}>
        <MaterialCommunityIcons name="camera" size={20} color="#000" />
        <Text style={styles.permBtnText}>Autoriser l'accès</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Scan result card ─────────────────────────────────────────────────────────

interface ResultCardProps {
  result: ValidationResult;
  onClose: () => void;
}

function ResultCard({ result, onClose }: ResultCardProps) {
  const isSuccess = result.success;
  const isWarning = result.warning && !result.success;
  const color = isSuccess ? SUCCESS : isWarning ? WARNING : DANGER;

  const icon: any = isSuccess ? 'check-circle' : isWarning ? 'alert-circle' : 'close-circle';
  const title = isSuccess ? 'BILLET VALIDE' : isWarning ? 'DEJA UTILISE' : 'INVALIDE';

  return (
    <View style={[styles.resultCard, { borderColor: color + '60' }]}>
      {/* Status icon */}
      <View style={[styles.resultIconCircle, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={44} color={color} />
      </View>

      <Text style={[styles.resultTitle, { color }]}>{title}</Text>
      <Text style={styles.resultMessage}>{result.message}</Text>

      {/* Ticket info rows */}
      {result.ticket && (
        <View style={styles.infoBox}>
          <InfoRow icon="ticket-outline" value={result.ticket.ticket_number} />
          <InfoRow icon="calendar-outline" value={result.ticket.event_name} />
          {result.ticket.buyer_name && (
            <InfoRow icon="account-outline" value={result.ticket.buyer_name} last />
          )}
        </View>
      )}

      <TouchableOpacity style={[styles.scanAgainBtn, { backgroundColor: ACCENT }]} onPress={onClose} activeOpacity={0.85}>
        <MaterialCommunityIcons name="qrcode-scan" size={18} color={TEXT} />
        <Text style={styles.scanAgainText}>Scanner un autre billet</Text>
      </TouchableOpacity>
    </View>
  );
}

function InfoRow({ icon, value, last }: { icon: any; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <MaterialCommunityIcons name={icon} size={16} color={TEXT2} />
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Verifier() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    const validation = AttendanceService.validateTicket(data);
    setResult(validation);

    if (Platform.OS !== 'web') {
      if (validation.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (validation.warning) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [scanned]);

  const closeResult = useCallback(() => {
    setResult(null);
    setScanned(false);
  }, []);

  if (!permission) {
    return (
      <View style={styles.loadingScreen}>
        <MaterialCommunityIcons name="camera-outline" size={32} color={TEXT2} />
        <Text style={styles.loadingText}>Vérification des permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return <PermissionScreen onRequest={requestPermission} />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Dimmed overlay with cutout feel */}
      <View style={styles.overlayTop} />
      <View style={styles.overlayMiddle}>
        <View style={styles.overlaySide} />

        {/* Scan frame */}
        <View style={styles.scanFrame}>
          {/* Corners */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Scan line hint */}
          {!scanned && (
            <View style={styles.scanLineHint} />
          )}
        </View>

        <View style={styles.overlaySide} />
      </View>
      <View style={styles.overlayBottom}>
        <Text style={styles.instruction}>
          {scanned ? 'Traitement en cours...' : 'Placez le QR code dans le cadre'}
        </Text>
        <Text style={styles.instructionSub}>Scan automatique</Text>
      </View>

      {/* Result modal */}
      <Modal visible={result !== null} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {/* Drag handle */}
            <View style={styles.dragHandle} />
            {result && <ResultCard result={result} onClose={closeResult} />}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_WEIGHT = 3;
const FRAME_SIZE = 240;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Permission screen
  permScreen: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: SURFACE2,
  },
  permTitle: {
    color: TEXT,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  permSub: {
    color: TEXT2,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  permBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#A5B4FC',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
  },
  permBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },

  // Loading
  loadingScreen: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  loadingText: { color: TEXT2, fontSize: 15 },

  // Camera overlay layers
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: FRAME_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: 32,
  },

  // Scan frame
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#A5B4FC',
  },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: CORNER_WEIGHT, borderLeftWidth: CORNER_WEIGHT,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: CORNER_WEIGHT, borderRightWidth: CORNER_WEIGHT,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_WEIGHT, borderLeftWidth: CORNER_WEIGHT,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_WEIGHT, borderRightWidth: CORNER_WEIGHT,
    borderBottomRightRadius: 6,
  },
  scanLineHint: {
    position: 'absolute',
    top: '50%',
    left: 8,
    right: 8,
    height: 1.5,
    backgroundColor: 'rgba(165,180,252,0.4)',
    borderRadius: 1,
  },

  instruction: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  instructionSub: {
    color: TEXT2,
    fontSize: 13,
    textAlign: 'center',
  },

  // Result modal
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
    paddingBottom: 36,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: SURFACE2,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: SURFACE2,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },

  // Result card
  resultCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
  },
  resultIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  resultMessage: {
    color: TEXT2,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },

  // Info box inside result
  infoBox: {
    width: '100%',
    backgroundColor: SURFACE2,
    borderRadius: 14,
    marginBottom: 20,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#0F172A',
  },
  infoValue: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // Scan again button
  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  scanAgainText: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '700',
  },
});
