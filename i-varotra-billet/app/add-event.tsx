import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { EventService } from '../services/EventService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function AddEvent() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = id ? parseInt(id as string) : null;
  const isEditing = !!eventId;

  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [slogan, setSlogan] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isEditing) {
      const event = EventService.getEvents().find(e => e.id === eventId);
      if (event) {
        setName(event.name || '');
        if (event.event_date) {
          setDate(new Date(event.event_date));
        }
        setSlogan(event.slogan || '');
        setDescription(event.description || '');
      }
    }
  }, [eventId, isEditing]);

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Champs requis', 'Veuillez saisir un nom pour l\'événement.');
      return;
    }

    const eventData = {
      id: eventId || undefined,
      name: name.trim(),
      event_date: date.toISOString().split('T')[0], // On stocke la date au format ISO YYYY-MM-DD
      slogan: slogan.trim(),
      description: description.trim(),
    };

    if (isEditing) {
      if (EventService.updateEvent(eventData)) {
        Alert.alert('Succès', 'Événement mis à jour avec succès !');
        router.back();
      } else {
        Alert.alert('Erreur', "Impossible de mettre à jour l'événement.");
      }
    } else {
      const id = EventService.addEvent(eventData);
      if (id) {
        Alert.alert('Succès', 'Événement créé avec succès !');
        router.back();
      } else {
        Alert.alert('Erreur', "Impossible de créer l'événement.");
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen 
        options={{ 
          headerTitle: isEditing ? 'Modifier l\'Événement' : 'Nouvel Événement' 
        }} 
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nom de l'événement *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Mariage de Jean et Marie"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date *</Text>
          <TouchableOpacity 
            style={styles.dateSelector} 
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialCommunityIcons name="calendar" size={24} color="#007AFF" />
            <Text style={styles.dateText}>{formatDate(date)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={isEditing ? undefined : new Date()}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Slogan (Teny fikasana)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Ny fitiavana no lehibe indrindra"
            value={slogan}
            onChangeText={setSlogan}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Détails supplémentaires..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <MaterialCommunityIcons name="check-circle" size={24} color="#FFF" />
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Enregistrer les modifications' : 'Enregistrer l\'événement'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 15,
    gap: 10,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 10,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
  },
});