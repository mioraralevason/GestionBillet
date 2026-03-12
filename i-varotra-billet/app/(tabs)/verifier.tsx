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
            result?.success ? styles.successBg : (result?.warning ? styles.warningBg : styles.errorBg)
          ]}>
            <MaterialCommunityIcons 
              name={result?.success ? "check-circle" : (result?.warning ? "alert" : "alert-circle")} 
              size={80} 
              color="#FFF" 
            />
            <Text style={styles.modalTitle}>{result?.success ? "VALIDE" : (result?.warning ? "DÉJÀ UTILISÉ" : "INVALIDE")}</Text>
            <Text style={styles.modalMessage}>{result?.message}</Text>
            
            {result?.ticket && (
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketText}>Billet: {result.ticket.ticket_number}</Text>
                <Text style={styles.ticketText}>Événement: {result.ticket.event_name}</Text>
                <Text style={styles.ticketText}>Acheteur: {result.ticket.buyer_name || 'Inconnu'}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={closeResult}>
              <Text style={styles.closeButtonText}>Scanner le suivant</Text>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 30, alignItems: 'center' },
  successBg: { backgroundColor: '#34C759' },
  warningBg: { backgroundColor: '#FF9500' },
  errorBg: { backgroundColor: '#FF3B30' },
  modalTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginVertical: 10 },
  modalMessage: { color: '#FFF', fontSize: 18, textAlign: 'center', marginBottom: 20 },
  ticketInfo: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 15, borderRadius: 10, width: '100%', marginBottom: 20 },
  ticketText: { color: '#FFF', fontSize: 14, marginBottom: 5 },
  closeButton: { backgroundColor: '#FFF', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12 },
  closeButtonText: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  permissionBtn: { backgroundColor: '#007AFF', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12 },
  permissionBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});