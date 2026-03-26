import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AttendanceService, ValidationResult } from '../../services/AttendanceService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function Verifier() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    
    const validation = AttendanceService.validateTicket(data);
    setResult(validation);

    if (validation.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (validation.warning) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const closeResult = () => {
    setResult(null);
    setScanned(false);
  };

  if (!permission) {
    return <View style={styles.center}><Text>Vérification des permissions...</Text></View>;
  }
  
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 20 }}>L'accès à la caméra est requis pour scanner les billets.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Autoriser l'accès</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      
      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          <View style={styles.scanCornerTL} />
          <View style={styles.scanCornerTR} />
          <View style={styles.scanCornerBL} />
          <View style={styles.scanCornerBR} />
        </View>
        <Text style={styles.instruction}>Scannez le QR Code du billet</Text>
      </View>

      <Modal visible={result !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            result?.success ? styles.successBorder : (result?.warning ? styles.warningBorder : styles.errorBorder)
          ]}>
            <View style={[
              styles.iconContainer,
              result?.success ? styles.successBg : (result?.warning ? styles.warningBg : styles.errorBg)
            ]}>
              <MaterialCommunityIcons
                name={result?.success ? "check" : (result?.warning ? "alert" : "close")}
                size={40}
                color="#FFF"
              />
            </View>
            
            <Text style={styles.modalTitle}>{result?.success ? "BILLET VALIDE" : (result?.warning ? "DÉJÀ UTILISÉ" : "INVALIDE")}</Text>
            <Text style={styles.modalMessage}>{result?.message}</Text>

            {result?.ticket && (
              <View style={styles.ticketInfo}>
                <View style={styles.ticketInfoRow}>
                  <MaterialCommunityIcons name="ticket-outline" size={18} color="#94A3B8" />
                  <Text style={styles.ticketText}>{result.ticket.ticket_number}</Text>
                </View>
                <View style={styles.ticketInfoRow}>
                  <MaterialCommunityIcons name="calendar" size={18} color="#94A3B8" />
                  <Text style={styles.ticketText}>{result.ticket.event_name}</Text>
                </View>
                {result.ticket.buyer_name && (
                  <View style={styles.ticketInfoRow}>
                    <MaterialCommunityIcons name="account" size={18} color="#94A3B8" />
                    <Text style={styles.ticketText}>{result.ticket.buyer_name}</Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={closeResult}>
              <MaterialCommunityIcons name="qrcode-scan" size={20} color="#FFF" />
              <Text style={styles.closeButtonText}>Scanner un autre billet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  scanArea: { width: 250, height: 250, position: 'relative' },
  scanCornerTL: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderColor: '#007AFF', borderLeftWidth: 4, borderTopWidth: 4, borderTopLeftRadius: 20 },
  scanCornerTR: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderColor: '#007AFF', borderRightWidth: 4, borderTopWidth: 4, borderTopRightRadius: 20 },
  scanCornerBL: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderColor: '#007AFF', borderLeftWidth: 4, borderBottomWidth: 4, borderBottomLeftRadius: 20 },
  scanCornerBR: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderColor: '#007AFF', borderRightWidth: 4, borderBottomWidth: 4, borderBottomRightRadius: 20 },
  instruction: { marginTop: 40, color: '#FFF', fontSize: 18, fontWeight: 'bold', textShadowColor: '#000', textShadowRadius: 10, textShadowOffset: { width: 1, height: 1 } },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 25 },
  modalContent: { backgroundColor: '#111827', borderRadius: 24, padding: 30, alignItems: 'center', borderWidth: 1 },
  successBorder: { borderColor: '#34C759' },
  warningBorder: { borderColor: '#FF9500' },
  errorBorder: { borderColor: '#FF3B30' },
  iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successBg: { backgroundColor: '#34C759' },
  warningBg: { backgroundColor: '#FF9500' },
  errorBg: { backgroundColor: '#FF3B30' },
  modalTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 },
  modalMessage: { color: '#94A3B8', fontSize: 15, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  ticketInfo: { backgroundColor: '#1E293B', padding: 18, borderRadius: 16, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: '#1E293B' },
  ticketInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  ticketText: { color: '#E2E8F0', fontSize: 14, flex: 1 },
  closeButton: { backgroundColor: '#6366F1', flexDirection: 'row', paddingHorizontal: 25, paddingVertical: 16, borderRadius: 16, alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center' },
  closeButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  permissionBtn: { backgroundColor: '#007AFF', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12 },
  permissionBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});