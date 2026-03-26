import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  SafeAreaView, 
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateUserPin } from '../database/database';

export default function Profile() {
  const router = useRouter();
  const [role, setRole] = useState<string>('');
  
  // États pour le changement de PIN
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    const getRole = async () => {
      const userRole = await AsyncStorage.getItem('userRole');
      setRole(userRole || 'Utilisateur');
    };
    getRole();
  }, []);

  const handleUpdatePin = async () => {
    if (newPin.length !== 4) {
      Alert.alert('Erreur', 'Le nouveau PIN doit contenir 4 chiffres.');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('Erreur', 'Les nouveaux PIN ne correspondent pas.');
      return;
    }

    // Dans cette implémentation simplifiée, on met à jour directement le PIN du rôle actuel
    const success = updateUserPin(role, newPin);

    if (success) {
      Alert.alert('Succès', 'Votre PIN a été mis à jour avec succès.');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setShowPasswordFields(false);
    } else {
      Alert.alert('Erreur', 'Impossible de mettre à jour le PIN.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: 'Mon Profil',
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#FFFFFF',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <MaterialCommunityIcons name="arrow-left" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          )
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{role.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>Agent iBillet</Text>
          <Text style={styles.userRole}>{role === 'admin' ? 'Administrateur' : 'Vérificateur'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATIONS</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account-outline" size={22} color="#6366F1" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Statut du compte</Text>
                <Text style={styles.infoValue}>Actif</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: '#1E293B', marginTop: 15, paddingTop: 15 }]}>
              <MaterialCommunityIcons name="shield-check-outline" size={22} color="#6366F1" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Niveau d'accès</Text>
                <Text style={styles.infoValue}>{role === 'admin' ? 'Accès Total' : 'Accès Restreint'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.expandHeader} 
            onPress={() => setShowPasswordFields(!showPasswordFields)}
          >
            <Text style={styles.sectionTitle}>SÉCURITÉ</Text>
            <MaterialCommunityIcons 
              name={showPasswordFields ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#6366F1" 
            />
          </TouchableOpacity>

          {showPasswordFields ? (
            <View style={styles.passwordCard}>
              <Text style={styles.cardDesc}>Modifiez votre code PIN à 4 chiffres pour sécuriser votre accès.</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NOUVEAU PIN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••"
                  placeholderTextColor="#4B5563"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  value={newPin}
                  onChangeText={setNewPin}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONFIRMER LE PIN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••"
                  placeholderTextColor="#4B5563"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                />
              </View>

              <TouchableOpacity style={styles.updateBtn} onPress={handleUpdatePin}>
                <Text style={styles.updateBtnText}>Mettre à jour le PIN</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.passwordSummaryCard}
              onPress={() => setShowPasswordFields(true)}
            >
              <MaterialCommunityIcons name="lock-reset" size={22} color="#6366F1" />
              <Text style={styles.passwordSummaryText}>Modifier le mot de passe (PIN)</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#4B5563" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={async () => {
            await AsyncStorage.removeItem('userRole');
            router.replace('/');
          }}
        >
          <MaterialCommunityIcons name="logout" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { padding: 20 },
  header: { alignItems: 'center', marginVertical: 30 },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 4,
    borderColor: '#1E293B',
  },
  avatarText: { color: '#FFFFFF', fontSize: 40, fontWeight: 'bold' },
  userName: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  userRole: { color: '#94A3B8', fontSize: 16, marginTop: 5 },
  section: { marginBottom: 30 },
  sectionTitle: { color: '#6366F1', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 15 },
  expandHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoCard: { backgroundColor: '#111827', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1E293B' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  infoTextContainer: { flex: 1 },
  infoLabel: { color: '#64748B', fontSize: 12 },
  infoValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginTop: 2 },
  passwordCard: { backgroundColor: '#111827', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1E293B' },
  cardDesc: { color: '#94A3B8', fontSize: 14, marginBottom: 20, lineHeight: 20 },
  passwordSummaryCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#111827', 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: '#1E293B' 
  },
  passwordSummaryText: { color: '#FFFFFF', flex: 1, marginLeft: 15, fontSize: 16 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { color: '#4B5563', fontSize: 11, fontWeight: 'bold', marginBottom: 8 },
  input: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    textAlign: 'center',
    letterSpacing: 10,
  },
  updateBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  updateBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 20,
    marginTop: 20,
  },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' }
});
