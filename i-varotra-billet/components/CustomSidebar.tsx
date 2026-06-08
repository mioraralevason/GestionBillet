import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  TouchableWithoutFeedback,
  ScrollView,
  PanResponder
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  role: string | null;
}

export const CustomSidebar: React.FC<SidebarProps> = ({ isOpen, onClose, role }) => {
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(isOpen);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [isOpen]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 20,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) onClose();
      },
    })
  ).current;

  const navigateTo = (path: string) => {
    onClose();
    setTimeout(() => {
      router.push(path as any);
    }, 200);
  };

  if (!shouldRender && !isOpen) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'auto' : 'none'}>
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>
      
      {/* Sidebar */}
      <Animated.View 
        {...panResponder.panHandlers}
        style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{role?.charAt(0).toUpperCase() || 'A'}</Text>
          </View>
          <Text style={styles.agentName}>Agent iBillet</Text>
          <Text style={styles.soldeText}>Rôle : {role === 'admin' ? 'Administrateur' : 'Vérificateur'}</Text>
        </View>

        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('profile')}>
            <MaterialCommunityIcons name="account-outline" size={24} color="#60A5FA" style={styles.menuIcon} />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuLabel}>Mon Profil</Text>
              <Text style={styles.menuSubtitle}>Gérer mes infos</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('(tabs)/events')}>
            <MaterialCommunityIcons name="format-list-bulleted" size={24} color="#F59E0B" style={styles.menuIcon} />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuLabel}>Événements</Text>
              <Text style={styles.menuSubtitle}>Consulter la liste</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('(tabs)/calendar')}>
            <MaterialCommunityIcons name="calendar-month-outline" size={24} color="#10B981" style={styles.menuIcon} />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuLabel}>Calendrier</Text>
              <Text style={styles.menuSubtitle}>Gérer les dates</Text>
            </View>
          </TouchableOpacity>

          {role !== 'verificateur' && (
            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('(tabs)/buyers')}>
              <MaterialCommunityIcons name="account-group-outline" size={24} color="#8B5CF6" style={styles.menuIcon} />
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>Acheteurs</Text>
                <Text style={styles.menuSubtitle}>Liste des clients</Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          <TouchableOpacity style={styles.simpleMenuItem} onPress={() => navigateTo('about')}>
            <MaterialCommunityIcons name="help-circle-outline" size={24} color="#94A3B8" style={styles.menuIcon} />
            <Text style={styles.simpleMenuLabel}>À propos</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.logoutBtn} 
            onPress={async () => {
              onClose();
              await AsyncStorage.removeItem('userRole');
              router.replace('/');
            }}
          >
            <MaterialCommunityIcons name="power" size={24} color="#EF4444" />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  sidebar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: '#000000', elevation: 10, shadowColor: '#000', shadowOffset: { width: 5, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10 },
  header: { backgroundColor: '#818CF8', padding: 25, paddingTop: 50 },
  closeBtn: { position: 'absolute', top: 40, right: 20, zIndex: 10 },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { color: '#818CF8', fontSize: 28, fontWeight: 'bold' },
  agentName: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  soldeText: { color: '#E0E7FF', fontSize: 14, marginTop: 5 },
  menuList: { flex: 1, paddingTop: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingVertical: 15 },
  menuIcon: { marginRight: 20 },
  menuTextContainer: { flex: 1 },
  menuLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  menuSubtitle: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  simpleMenuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingVertical: 15 },
  simpleMenuLabel: { color: '#FFFFFF', fontSize: 16 },
  divider: { height: 1, backgroundColor: '#1E293B', marginVertical: 10 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#1E293B' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' }
});