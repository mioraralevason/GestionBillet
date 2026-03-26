import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function About() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>À propos de iBillet</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
             <MaterialCommunityIcons name="ticket-confirmation" size={60} color="#A5B4FC" />
          </View>
          <Text style={styles.appName}>iBillet</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notre Mission</Text>
          <Text style={styles.description}>
            iBillet est une solution moderne de gestion de billetterie conçue pour simplifier 
            l'organisation de vos événements. De la création des billets au scan à l'entrée, 
            nous vous offrons une expérience fluide et sécurisée.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fonctionnalités</Text>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#34C759" />
            <Text style={styles.featureText}>Gestion d'événements multi-tarifs</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#34C759" />
            <Text style={styles.featureText}>Scan QR Code ultra-rapide</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#34C759" />
            <Text style={styles.featureText}>Dashboard analytique en temps réel</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#34C759" />
            <Text style={styles.featureText}>Export PDF prêt à l'impression</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.copyright}>© 2026 iBillet. Tous droits réservés.</Text>
          <TouchableOpacity onPress={() => Linking.openURL('tel:0337691314')}>
            <Text style={styles.link}>📞 033 76 913 14</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  backBtn: { marginRight: 15, padding: 5 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 30 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: '#1E293B', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#A5B4FC'
  },
  appName: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
  version: { color: '#94A3B8', fontSize: 14, marginTop: 5 },
  section: { marginBottom: 30 },
  sectionTitle: { color: '#A5B4FC', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  description: { color: '#E2E8F0', lineHeight: 22, fontSize: 15 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  featureText: { color: '#E2E8F0', fontSize: 15 },
  footer: { marginTop: 40, alignItems: 'center' },
  copyright: { color: '#64748B', fontSize: 12 },
  link: { color: '#6366F1', fontSize: 14, fontWeight: 'bold', marginTop: 10 }
});
