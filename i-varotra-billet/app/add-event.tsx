import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions,
  Animated
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { EventService } from '../services/EventService';
import { TicketService } from '../services/TicketService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');

export default function AddEventCarousel() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = id ? parseInt(id as string) : null;
  const isEditing = !!eventId;

  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Step 1: Info
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');

  // Step 2: Design
  const [slogan, setSlogan] = useState('');
  const [color, setColor] = useState('#6366F1');
  const [image, setImage] = useState<string | null>(null);

  // Step 3: Billets
  const [ticketCount, setTicketCount] = useState('50');
  const [ticketPrice, setTicketPrice] = useState('20000');

  const colorPresets = ['#6366F1', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6', '#000000', '#00E5FF'];

  useEffect(() => {
    if (isEditing) {
      const event = EventService.getEvents().find(e => e.id === eventId);
      if (event) {
        setName(event.name || '');
        if (event.event_date) setDate(new Date(event.event_date));
        setSlogan(event.slogan || '');
        setDescription(event.description || '');
        setColor(event.color || '#6366F1');
        setImage(event.image || null);
      }
    }
  }, [eventId, isEditing]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      const imageAsset = result.assets[0];
      setImage(imageAsset.base64 ? `data:image/jpeg;base64,${imageAsset.base64}` : imageAsset.uri);
    }
  };

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      Alert.alert('Attention', 'Veuillez donner un nom à votre événement.');
      return;
    }
    if (step < totalSteps) setStep(step + 1);
    else handleSave();
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const handleSave = () => {
    const eventData = {
      id: eventId || undefined,
      name: name.trim(),
      event_date: date.toISOString().split('T')[0],
      slogan: slogan.trim(),
      description: description.trim(),
      color: color,
      image: image || '',
    };

    let resultId = eventId;
    let success = false;

    if (isEditing) {
      success = EventService.updateEvent(eventData);
    } else {
      resultId = EventService.addEvent(eventData);
      success = !!resultId;
    }

    if (success && !isEditing) {
      // Génération automatique des billets au premier enregistrement si demandés
      const count = parseInt(ticketCount);
      const price = parseFloat(ticketPrice);
      if (!isNaN(count) && count > 0) {
        TicketService.generateTickets(resultId!, count, isNaN(price) ? 0 : price);
      }
    }

    if (success) {
      Alert.alert('Succès', isEditing ? 'Événement mis à jour !' : 'Événement et billets créés !');
      router.replace('/(tabs)/home');
    } else {
      Alert.alert('Erreur', "Impossible d'enregistrer.");
    }
  };

  const StepIndicator = () => (
    <View style={styles.indicatorContainer}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.indicatorWrapper}>
          <View style={[
            styles.dot, 
            step >= i ? { backgroundColor: color } : { backgroundColor: '#1E293B' }
          ]} />
          {i < 3 && <View style={[
            styles.line, 
            step > i ? { backgroundColor: color } : { backgroundColor: '#1E293B' }
          ]} />}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrev} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Édition' : 'Nouvel événement'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <StepIndicator />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {step === 1 && (
            <Animated.View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Informations générales</Text>
              <Text style={styles.stepSub}>Dites-nous en plus sur l'événement.</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NOM DE L'ÉVÉNEMENT</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Soirée de Gala 2026"
                  placeholderTextColor="#4B5563"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>DATE DE L'ÉVÉNEMENT</Text>
                <TouchableOpacity 
                  style={styles.datePickerBtn} 
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialCommunityIcons name="calendar-edit" size={22} color={color} />
                  <Text style={styles.dateText}>
                    {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    onChange={(e, d) => { setShowDatePicker(false); if(d) setDate(d); }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>DESCRIPTION</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Précisez les détails..."
                  placeholderTextColor="#4B5563"
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Design & Visuel</Text>
              <Text style={styles.stepSub}>Personnalisez l'apparence de vos billets.</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>SLOGAN / PHRASE ACCROCHEUSE</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Une nuit inoubliable"
                  placeholderTextColor="#4B5563"
                  value={slogan}
                  onChangeText={setSlogan}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>COULEUR DU THÈME</Text>
                <View style={styles.colorGrid}>
                  {colorPresets.map(c => (
                    <TouchableOpacity 
                      key={c} 
                      style={[styles.colorCircle, { backgroundColor: c }, color === c && { borderColor: '#FFF', borderWidth: 3 }]} 
                      onPress={() => setColor(c)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>IMAGE DE FOND (AFFICHE)</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <MaterialCommunityIcons name="cloud-upload-outline" size={40} color="#4B5563" />
                      <Text style={styles.imagePlaceholderText}>Importer une image</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {step === 3 && (
            <Animated.View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Billetterie</Text>
              <Text style={styles.stepSub}>Configurez la génération automatique.</Text>

              <View style={styles.infoBox}>
                <MaterialCommunityIcons name="information-outline" size={20} color="#A5B4FC" />
                <Text style={styles.infoText}>
                  Les billets seront générés automatiquement après la création de l'événement.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>NOMBRE DE BILLETS À GÉNÉRER</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={ticketCount}
                  onChangeText={setTicketCount}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PRIX UNITAIRE (Ar)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={ticketPrice}
                  onChangeText={setTicketPrice}
                />
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Récapitulatif</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total billets :</Text>
                  <Text style={styles.summaryValue}>{ticketCount}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Chiffre d'affaires prévu :</Text>
                  <Text style={[styles.summaryValue, { color: color }]}>
                    {(parseInt(ticketCount) * parseFloat(ticketPrice) || 0).toLocaleString()} Ar
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.prevBtn} onPress={handlePrev}>
          <Text style={styles.prevBtnText}>{step === 1 ? 'Annuler' : 'Retour'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.nextBtn, { backgroundColor: color }]} 
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>
            {step === totalSteps ? 'Terminer' : 'Suivant'}
          </Text>
          <MaterialCommunityIcons 
            name={step === totalSteps ? "check-circle" : "arrow-right"} 
            size={20} 
            color="#000" 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

import { SafeAreaView } from 'react-native-safe-area-context';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  backBtn: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  indicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    width: 40,
    height: 3,
    marginHorizontal: 5,
  },
  scrollContent: { padding: 25 },
  stepContent: { flex: 1 },
  stepTitle: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  stepSub: { color: '#94A3B8', fontSize: 16, marginBottom: 35 },
  inputGroup: { marginBottom: 25 },
  label: { color: '#A5B4FC', fontSize: 12, fontWeight: '800', marginBottom: 10, letterSpacing: 1 },
  input: {
    backgroundColor: '#111827',
    borderRadius: 15,
    padding: 18,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  datePickerBtn: {
    backgroundColor: '#111827',
    borderRadius: 15,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  dateText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  textArea: { height: 120, textAlignVertical: 'top' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorCircle: { width: 45, height: 45, borderRadius: 23 },
  imagePicker: {
    height: 200,
    backgroundColor: '#111827',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1E293B',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderText: { color: '#4B5563', marginTop: 10, fontWeight: '600' },
  infoBox: {
    backgroundColor: '#1E293B',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 25,
  },
  infoText: { color: '#A5B4FC', fontSize: 13, flex: 1 },
  summaryCard: {
    backgroundColor: '#111827',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginTop: 10,
  },
  summaryTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { color: '#94A3B8', fontSize: 14 },
  summaryValue: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    gap: 15,
  },
  prevBtn: {
    flex: 1,
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  prevBtnText: { color: '#94A3B8', fontSize: 16, fontWeight: 'bold' },
  nextBtn: {
    flex: 2,
    padding: 18,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  nextBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});
