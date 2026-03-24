import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { EventService } from '../services/EventService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

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
  const [color, setColor] = useState('#007AFF');
  const [image, setImage] = useState<string | null>(null);

  const colorPresets = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6', '#000000'];

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
        setColor(event.color || '#007AFF');
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
      base64: true, // On utilise le base64 pour faciliter l'export PDF plus tard
    });

    if (!result.canceled) {
      // On stocke le base64 si disponible, sinon l'URI
      const imageAsset = result.assets[0];
      if (imageAsset.base64) {
        setImage(`data:image/jpeg;base64,${imageAsset.base64}`);
      } else {
        setImage(imageAsset.uri);
      }
    }
  };

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
      event_date: date.toISOString().split('T')[0],
      slogan: slogan.trim(),
      description: description.trim(),
      color: color,
      image: image || '',
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
          <Text style={styles.label}>Image ou Visuel (Optionnel)</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="image-plus" size={40} color="#999" />
                <Text style={styles.imagePlaceholderText}>Choisir une image</Text>
              </View>
            )}
          </TouchableOpacity>
          {image && (
            <TouchableOpacity onPress={() => setImage(null)} style={styles.removeImageBtn}>
              <Text style={styles.removeImageText}>Supprimer l'image</Text>
            </TouchableOpacity>
          )}
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

        <View style={styles.formGroup}>
          <Text style={styles.label}>Couleur thématique</Text>
          <View style={styles.colorGrid}>
            {colorPresets.map(c => (
              <TouchableOpacity 
                key={c} 
                style={[
                  styles.colorCircle, 
                  { backgroundColor: c },
                  color === c && styles.colorCircleSelected
                ]} 
                onPress={() => setColor(c)}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: color }]} onPress={handleSave}>
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 5,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderColor: '#CCC',
    transform: [{ scale: 1.1 }],
  },
  imagePicker: {
    height: 180,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#999',
    marginTop: 10,
    fontSize: 14,
  },
  removeImageBtn: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  removeImageText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
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