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
  Animated,
  Modal,
  StatusBar,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ColorPicker from 'react-native-wheel-color-picker';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { EventService } from '../services/EventService';
import { TicketService } from '../services/TicketService';
import db from '../database/database';
import Toast from 'react-native-toast-message';

// ... (existing imports)

export default function AddEventCarousel() {
  // ...

  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = id ? parseInt(id as string) : null;
  const isEditing = !!eventId;

  const [step, setStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(3);

  // Step 1: Info
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');

  // Step 2: Design
  const [slogan, setSlogan] = useState('');
  const [color, setColor] = useState('#6366F1');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [image, setImage] = useState<string | null>(null);

  // Step 3: Billets (Refactored for Multiple Types)
  const [ticketTypes, setTicketTypes] = useState<TicketTypeInput[]>([
    { name: 'Standard', price: '20000', count: '50' }
  ]);

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

        // Fetch existing ticket types if editing
        const types = EventService.getTicketTypes(eventId);
        if (types.length > 0) {
          setTicketTypes(types.map(t => ({
            id: t.id,
            name: t.name,
            price: t.price.toString(),
            count: '0' // During edit, we don't necessarily want to generate more tickets here
          })));
        }
        
        // Skip billetterie step (step 3) when editing - only show steps 1 and 2
        setTotalSteps(2);
      }
    }
  }, [eventId, isEditing]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Permission requise', text2: 'Accès à la galerie nécessaire' });
      return;
    }

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

  const generateTemplateImage = async (templateNum: number, baseColor: string) => {
    try {
      // Dimensions du billet (même taille que ticketPreview)
      const width = 250;
      const height = 350;
      
      const uri = `data:image/svg+xml;base64,${btoa(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            ${templateNum === 1 ? `
              <radialGradient id="grad1" cx="50%" cy="30%" r="70%">
                <stop offset="0%" style="stop-color:${baseColor};stop-opacity:1" />
                <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
              </radialGradient>
            ` : templateNum === 2 ? `
              <pattern id="hexPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <polygon points="20,0 40,10 40,30 20,40 0,30 0,10" fill="none" stroke="${baseColor}" stroke-width="1.5" opacity="0.3"/>
              </pattern>
            ` : `
              <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:${baseColor};stop-opacity:1" />
                <stop offset="100%" style="stop-color:#000033;stop-opacity:1" />
              </linearGradient>
            `}
          </defs>
          <rect width="${width}" height="${height}" fill="${templateNum === 1 ? 'url(#grad1)' : templateNum === 2 ? '#000033' : 'url(#waveGrad)'}" />
          ${templateNum === 2 ? '<rect width="250" height="350" fill="url(#hexPattern)" />' : ''}
          ${templateNum === 3 ? `
            <path d="M0,120 Q62.5,80 125,120 T250,120 L250,350 L0,350 Z" fill="${baseColor}" opacity="0.3"/>
            <path d="M0,160 Q62.5,120 125,160 T250,160 L250,350 L0,350 Z" fill="${baseColor}" opacity="0.2"/>
          ` : ''}
          ${templateNum === 1 ? `
            <circle cx="50" cy="60" r="2" fill="white" opacity="0.8"/>
            <circle cx="100" cy="100" r="1.5" fill="white" opacity="0.6"/>
            <circle cx="175" cy="40" r="2.5" fill="white" opacity="0.9"/>
            <circle cx="210" cy="120" r="1.5" fill="white" opacity="0.7"/>
            <circle cx="75" cy="180" r="2" fill="white" opacity="0.8"/>
            <circle cx="150" cy="140" r="1.5" fill="white" opacity="0.6"/>
            <circle cx="200" cy="200" r="2" fill="white" opacity="0.7"/>
            <circle cx="30" cy="150" r="1.5" fill="white" opacity="0.5"/>
          ` : ''}
        </svg>
      `)}`;
      
      setImage(uri);
    } catch (error) {
      console.error('Error generating template:', error);
    }
  };

  const handleAddType = () => {
    setTicketTypes([...ticketTypes, { name: '', price: '0', count: '0' }]);
  };

  const handleRemoveType = (index: number) => {
    if (ticketTypes.length > 1) {
      const newTypes = [...ticketTypes];
      newTypes.splice(index, 1);
      setTicketTypes(newTypes);
    }
  };

  const updateType = (index: number, field: keyof TicketTypeInput, value: string) => {
    const newTypes = [...ticketTypes];
    newTypes[index][field] = value;
    setTicketTypes(newTypes);
  };

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      Toast.show({
        type: 'info',
        text1: 'Attention',
        text2: 'Veuillez donner un nom à votre événement.'
      });
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
    // Validation for Step 3
    for (const type of ticketTypes) {
      if (!type.name.trim()) {
        Toast.show({
          type: 'info',
          text1: 'Attention',
          text2: 'Veuillez nommer tous les types de billets.'
        });
        return;
      }
      if (isNaN(parseFloat(type.price)) || parseFloat(type.price) < 0) {
        Toast.show({
          type: 'info',
          text1: 'Attention',
          text2: 'Prix invalide pour ' + type.name
        });
        return;
      }
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

    let resultId = eventId;
    let success = false;

    if (isEditing) {
      success = EventService.updateEvent(eventData);
      if (success) {
        // Get existing ticket types
        const existingTypes = EventService.getTicketTypes(eventId);
        
        // Update or create ticket types
        for (const type of ticketTypes) {
          const existingType = existingTypes.find(t => t.id === type.id);
          
          if (existingType) {
            // Update existing type
            EventService.updateTicketType({
              id: type.id,
              event_id: eventId,
              name: type.name.trim(),
              price: parseFloat(type.price)
            });
            
            // Update ticket prices for this type
            db.runSync(
              `UPDATE tickets SET price = ? WHERE event_id = ? AND ticket_type_id = ?`,
              parseFloat(type.price),
              eventId,
              type.id
            );
          } else {
            // Create new type
            const typeId = EventService.addTicketType({
              event_id: eventId,
              name: type.name.trim(),
              price: parseFloat(type.price)
            });
            
            // Generate tickets for new types if count > 0
            if (typeId) {
              const count = parseInt(type.count);
              if (!isNaN(count) && count > 0) {
                TicketService.generateTickets(eventId, count, parseFloat(type.price), typeId);
              }
            }
          }
        }
        
        // Delete ticket types that no longer exist in the form
        for (const existingType of existingTypes) {
          const stillExists = ticketTypes.find(t => t.id === existingType.id);
          if (!stillExists) {
            // Check if there are tickets associated with this type
            const ticketsForType = db.getAllSync(
              `SELECT COUNT(*) as count FROM tickets WHERE event_id = ? AND ticket_type_id = ?`,
              eventId,
              existingType.id
            );
            
            // Only delete if no tickets are associated
            if (!ticketsForType[0] || ticketsForType[0].count === 0) {
              EventService.deleteTicketType(existingType.id);
            }
          }
        }
      }
    } else {
      resultId = EventService.addEvent(eventData);
      success = !!resultId;
      
      if (success && resultId) {
        // Save ticket types and generate tickets
        for (const type of ticketTypes) {
          const typeId = EventService.addTicketType({
            event_id: resultId,
            name: type.name.trim(),
            price: parseFloat(type.price)
          });

          if (typeId) {
            const count = parseInt(type.count);
            if (!isNaN(count) && count > 0) {
              TicketService.generateTickets(resultId, count, parseFloat(type.price), typeId);
            }
          }
        }
      }
    }

    if (success) {
      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: isEditing ? 'Événement et types de billets mis à jour !' : 'Événement et billets créés !'
      });
      router.replace('/(tabs)/home');
    } else {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: "Impossible d'enregistrer."
      });
    }
  };

  const StepIndicator = () => (
    <View style={styles.indicatorContainer}>
      {[...Array(totalSteps)].map((_, i) => (
        <View key={i} style={styles.indicatorWrapper}>
          <View style={[
            styles.dot,
            step >= i + 1 ? { backgroundColor: color } : { backgroundColor: '#1E293B' }
          ]} />
          {i < totalSteps - 1 && <View style={[
            styles.line,
            step > i + 1 ? { backgroundColor: color } : { backgroundColor: '#1E293B' }
          ]} />}
        </View>
      ))}
    </View>
  );

  const calculateTotalCA = () => {
    return ticketTypes.reduce((acc, curr) => {
      const c = parseInt(curr.count) || 0;
      const p = parseFloat(curr.price) || 0;
      return acc + (c * p);
    }, 0);
  };

  const calculateTotalTickets = () => {
    return ticketTypes.reduce((acc, curr) => acc + (parseInt(curr.count) || 0), 0);
  };

  const getContrastColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
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
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Informations générales</Text>
              <Text style={styles.stepSub}>Dites-nous en plus sur l'événement.</Text>

              {/* Event Name Card */}
              <View style={styles.inputCard}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="information-outline" size={20} color={color} />
                  <Text style={[styles.cardTitle, { color: '#FFF' }]}>Nom de l'événement</Text>
                </View>
                <TextInput
                  style={styles.cardInput}
                  placeholder="Ex: Soirée de Gala 2026"
                  placeholderTextColor="#64748B"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Date Picker Card */}
              <View style={styles.inputCard}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="calendar-star" size={20} color={color} />
                  <Text style={[styles.cardTitle, { color: '#FFF' }]}>Date de l'événement</Text>
                </View>
                <TouchableOpacity
                  style={styles.datePickerCard}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View style={styles.dateContent}>
                    <MaterialCommunityIcons name="calendar-blank" size={28} color={color} />
                    <View style={styles.dateTextContainer}>
                      <Text style={styles.dateLabel}>Sélectionner une date</Text>
                      <Text style={styles.dateValue}>
                        {date.toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#64748B" />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    onChange={(e, d) => { setShowDatePicker(false); if(d) setDate(d); }}
                  />
                )}
              </View>

              {/* Description Card */}
              <View style={styles.inputCard}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="text-box-outline" size={20} color={color} />
                  <Text style={[styles.cardTitle, { color: '#FFF' }]}>Description</Text>
                </View>
                <TextInput
                  style={[styles.cardInput, styles.cardTextArea]}
                  placeholder="Précisez les détails..."
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Design & Visuel</Text>
              <Text style={styles.stepSub}>Personnalisez l'apparence de vos billets.</Text>

              {/* Slogan Card */}
              <View style={styles.inputCard}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="format-quote-open" size={20} color={color} />
                  <Text style={[styles.cardTitle, { color: '#FFF' }]}>Slogan</Text>
                </View>
                <TextInput
                  style={styles.cardInput}
                  placeholder="Ex: Une nuit inoubliable"
                  placeholderTextColor="#64748B"
                  value={slogan}
                  onChangeText={setSlogan}
                />
              </View>

              {/* Color Picker Card */}
              <View style={styles.inputCard}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="palette" size={20} color={color} />
                  <Text style={[styles.cardTitle, { color: '#FFF' }]}>Couleur du thème</Text>
                </View>
                
                <View style={styles.colorPickerContent}>
                  {/* Color Preview & Button */}
                  <TouchableOpacity 
                    style={[styles.colorPreviewCard, { backgroundColor: color }]}
                    onPress={() => setShowColorPicker(true)}
                  >
                    <View style={styles.colorPreviewContent}>
                      <MaterialCommunityIcons name="eyedropper-variant" size={32} color={getContrastColor(color)} />
                      <Text style={[styles.colorPreviewText, { color: getContrastColor(color) }]}>
                        {color}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={28} color={getContrastColor(color)} opacity={0.7} />
                  </TouchableOpacity>
                  
                  {/* Quick Colors */}
                  <View style={styles.quickColors}>
                    {['#6366F1', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#00E5FF'].map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.quickColorCircle, 
                          { backgroundColor: c },
                          color === c && { borderColor: '#FFF', borderWidth: 2 }
                        ]}
                        onPress={() => setColor(c)}
                      />
                    ))}
                  </View>
                  
                  <Text style={styles.colorHint}>Appuyez pour choisir une couleur personnalisée</Text>
                </View>
              </View>

              {/* Image Upload Card */}
              <View style={styles.inputCard}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="image-outline" size={20} color={color} />
                  <Text style={[styles.cardTitle, { color: '#FFF' }]}>Image de fond</Text>
                </View>
                
                <View style={styles.imageUploadContent}>
                  {/* Template Selection */}
                  <Text style={styles.templateLabel}>Ou choisir un modèle prédéfini</Text>
                  
                  <View style={styles.templatesGrid}>
                    {/* Template 1 - Gradient */}
                    <TouchableOpacity
                      style={[
                        styles.templateCard,
                        { backgroundColor: color },
                        selectedTemplate === 1 && { borderColor: '#FFF', borderWidth: 3 }
                      ]}
                      onPress={() => {
                        setSelectedTemplate(1);
                        generateTemplateImage(1, color);
                      }}
                    >
                      <View style={[styles.templatePreview, styles.template1Preview]}>
                        <View style={styles.template1Stars}>
                          <MaterialCommunityIcons name="star" size={16} color="#FFF" opacity={0.8} />
                          <MaterialCommunityIcons name="star" size={12} color="#FFF" opacity={0.6} />
                          <MaterialCommunityIcons name="star" size={20} color="#FFF" opacity={0.9} />
                          <MaterialCommunityIcons name="star" size={14} color="#FFF" opacity={0.7} />
                        </View>
                        <MaterialCommunityIcons name="star" size={32} color="#FFF" />
                      </View>
                      <Text style={styles.templateName}>Étoilé</Text>
                    </TouchableOpacity>

                    {/* Template 2 - Geometric */}
                    <TouchableOpacity
                      style={[
                        styles.templateCard,
                        { backgroundColor: color },
                        selectedTemplate === 2 && { borderColor: '#FFF', borderWidth: 3 }
                      ]}
                      onPress={() => {
                        setSelectedTemplate(2);
                        generateTemplateImage(2, color);
                      }}
                    >
                      <View style={[styles.templatePreview, styles.template2Preview]}>
                        <MaterialCommunityIcons name="hexagon-outline" size={24} color="#FFF" opacity={0.5} />
                        <MaterialCommunityIcons name="hexagon" size={32} color="#FFF" />
                        <MaterialCommunityIcons name="hexagon-outline" size={20} color="#FFF" opacity={0.5} />
                      </View>
                      <Text style={styles.templateName}>Géométrique</Text>
                    </TouchableOpacity>

                    {/* Template 3 - Waves */}
                    <TouchableOpacity
                      style={[
                        styles.templateCard,
                        { backgroundColor: color },
                        selectedTemplate === 3 && { borderColor: '#FFF', borderWidth: 3 }
                      ]}
                      onPress={() => {
                        setSelectedTemplate(3);
                        generateTemplateImage(3, color);
                      }}
                    >
                      <View style={[styles.templatePreview, styles.template3Preview]}>
                        <MaterialCommunityIcons name="waves" size={36} color="#FFF" />
                      </View>
                      <Text style={styles.templateName}>Vagues</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OU</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Custom Image Upload */}
                  <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                    {selectedTemplate ? (
                      <View style={[styles.templateSelected, { backgroundColor: color }]}>
                        <MaterialCommunityIcons name="check-circle" size={48} color="#FFF" />
                        <Text style={styles.templateSelectedText}>
                          Modèle {selectedTemplate} sélectionné
                        </Text>
                        <TouchableOpacity
                          style={styles.changeTemplateBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            setSelectedTemplate(null);
                          }}
                        >
                          <Text style={styles.changeTemplateText}>Changer</Text>
                        </TouchableOpacity>
                      </View>
                    ) : image ? (
                      <Image source={{ uri: image }} style={styles.previewImage} />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <MaterialCommunityIcons name="cloud-upload-outline" size={40} color="#64748B" />
                        <Text style={styles.imagePlaceholderText}>Importer votre image</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Billetterie</Text>
              <Text style={styles.stepSub}>Configurez vos types de billets.</Text>

              {ticketTypes.map((type, index) => (
                <View key={index} style={styles.typeCard}>
                  <View style={styles.typeHeader}>
                    <View style={styles.typeHeaderLeft}>
                      <MaterialCommunityIcons name="ticket-outline" size={20} color={color} />
                      <Text style={[styles.typeTitle, { color: color }]}>Type #{index + 1}</Text>
                    </View>
                    {ticketTypes.length > 1 && (
                      <TouchableOpacity onPress={() => handleRemoveType(index)}>
                        <MaterialCommunityIcons name="trash-can-outline" size={24} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.ticketTypeField}>
                    <Text style={styles.ticketTypeLabel}>LIBELLÉ</Text>
                    <TextInput
                      style={styles.ticketTypeInput}
                      placeholder="Ex: VIP, Standard, Early Bird..."
                      placeholderTextColor="#64748B"
                      value={type.name}
                      onChangeText={(v) => updateType(index, 'name', v)}
                    />
                  </View>

                  <View style={styles.ticketTypeRow}>
                    <View style={styles.ticketTypeField}>
                      <Text style={styles.ticketTypeLabel}>PRIX (Ar)</Text>
                      <TextInput
                        style={styles.ticketTypeInput}
                        keyboardType="numeric"
                        value={type.price}
                        onChangeText={(v) => updateType(index, 'price', v)}
                      />
                    </View>
                    <View style={styles.ticketTypeField}>
                      <Text style={styles.ticketTypeLabel}>QUANTITÉ</Text>
                      <TextInput
                        style={styles.ticketTypeInput}
                        keyboardType="numeric"
                        value={type.count}
                        onChangeText={(v) => updateType(index, 'count', v)}
                      />
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addTypeBtn} onPress={handleAddType}>
                <MaterialCommunityIcons name="plus-circle-outline" size={24} color={color} />
                <Text style={[styles.addTypeBtnText, { color: color }]}>Ajouter un type de billet</Text>
              </TouchableOpacity>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Récapitulatif Global</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total billets :</Text>
                  <Text style={styles.summaryValue}>{calculateTotalTickets()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Chiffre d'affaires prévu :</Text>
                  <Text style={[styles.summaryValue, { color: color }]}>
                    {calculateTotalCA().toLocaleString()} Ar
                  </Text>
                </View>
              </View>
            </View>
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
            {step === totalSteps ? 'Enregistrer' : 'Suivant'}
          </Text>
          <MaterialCommunityIcons
            name={step === totalSteps ? "check-circle" : "arrow-right"}
            size={20} 
            color="#000" 
          />
        </TouchableOpacity>
      </View>

      {/* Color Picker Modal */}
      <Modal visible={showColorPicker} transparent animationType="fade">
        <ScrollView style={styles.modalOverlay} contentContainerStyle={styles.modalScrollContent}>
          <View style={[styles.modalContent, { backgroundColor: '#111827' }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <MaterialCommunityIcons name="palette" size={28} color={color} />
                <Text style={[styles.modalTitle, { color: '#FFF' }]}>Couleur du thème</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowColorPicker(false)}
              >
                <MaterialCommunityIcons name="close-circle" size={36} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Color Preview Card */}
            <View style={[styles.previewCard, { backgroundColor: color }]}>
              <MaterialCommunityIcons name="palette-outline" size={56} color={getContrastColor(color)} />
              <Text style={[styles.previewText, { color: getContrastColor(color) }]}>{color}</Text>
              <Text style={[styles.previewSubtext, { color: getContrastColor(color) }]}>
                Couleur sélectionnée
              </Text>
            </View>

            {/* Color Wheel */}
            <View style={styles.pickerCard}>
              <ColorPicker
                color={color}
                onColorChange={(newColor) => setColor(newColor)}
                thumbSize={35}
                sliderSize={35}
                noSnap={true}
                row={true}
              />
            </View>

            {/* Validate Button */}
            <TouchableOpacity
              style={[styles.validateButton, { backgroundColor: color }]}
              onPress={() => setShowColorPicker(false)}
            >
              <MaterialCommunityIcons name="check-circle" size={28} color={getContrastColor(color)} />
              <Text style={[styles.validateButtonText, { color: getContrastColor(color) }]}>
                Valider cette couleur
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  backBtn: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  indicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  line: {
    width: 30,
    height: 2,
    marginHorizontal: 4,
  },
  scrollContent: { padding: 20 },
  stepContent: { flex: 1, paddingBottom: 20 },
  stepTitle: { color: '#FFF', fontSize: 26, fontWeight: '900', marginBottom: 8 },
  stepSub: { color: '#94A3B8', fontSize: 15, marginBottom: 24 },
  inputCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 0,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    gap: 10,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  cardInput: {
    backgroundColor: '#0F172A',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  datePickerCard: {
    backgroundColor: '#0F172A',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  dateTextContainer: { flex: 1 },
  dateLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  dateValue: { fontSize: 16, color: '#FFF', fontWeight: '600' },
  colorPickerContent: { padding: 16 },
  colorPreviewCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  colorPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  colorPreviewText: { fontSize: 22, fontWeight: 'bold', textTransform: 'uppercase' },
  quickColors: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  quickColorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  colorHint: { color: '#64748B', fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginTop: 4 },
  imageUploadContent: { padding: 16 },
  templateLabel: { fontSize: 12, color: '#A5B4FC', fontWeight: '700', marginBottom: 12, textAlign: 'center', letterSpacing: 0.5 },
  templatesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  templateCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1E293B',
    alignItems: 'center',
    paddingBottom: 12,
  },
  templatePreview: {
    width: '100%',
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  template1Stars: {
    position: 'absolute',
    top: 4,
    flexDirection: 'row',
    gap: 4,
  },
  template1Preview: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  template2Preview: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  template3Preview: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  templateName: { fontSize: 11, fontWeight: '700', color: '#FFF', marginTop: 8, textTransform: 'uppercase' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
  dividerText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  templateSelected: {
    flex: 1,
    height: 180,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  templateSelectedText: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  changeTemplateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 8,
  },
  changeTemplateText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  imagePicker: {
    height: 180,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#1E293B',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderText: { color: '#4B5563', marginTop: 8, fontWeight: '600' },
  typeCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  typeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  ticketTypeField: { marginBottom: 12 },
  ticketTypeLabel: { fontSize: 10, fontWeight: '800', marginBottom: 6, letterSpacing: 1, color: '#A5B4FC' },
  ticketTypeInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    color: '#FFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  ticketTypeRow: { flexDirection: 'row', gap: 12 },
  
  addTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#1E293B',
    marginBottom: 20,
    gap: 10,
  },
  addTypeBtnText: { fontSize: 14, fontWeight: 'bold' },

  summaryCard: {
    backgroundColor: '#0F172A',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginTop: 10,
  },
  summaryTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', marginBottom: 15, letterSpacing: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: '#94A3B8', fontSize: 13 },
  summaryValue: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  
  footer: {
    flexDirection: 'row',
    padding: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    gap: 12,
    backgroundColor: '#000',
  },
  prevBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  prevBtnText: { color: '#94A3B8', fontSize: 15, fontWeight: 'bold' },
  nextBtn: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: { color: '#000', fontSize: 15, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#111827',
    width: '100%',
    maxWidth: 450,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  closeButton: { padding: 4 },
  previewCard: {
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 24,
  },
  previewText: { fontSize: 32, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 12 },
  previewSubtext: { fontSize: 14, fontWeight: '500', marginTop: 6, opacity: 0.8 },
  pickerCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    minHeight: 180,
  },
  validateButton: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  validateButtonText: { fontSize: 18, fontWeight: 'bold' },
});
