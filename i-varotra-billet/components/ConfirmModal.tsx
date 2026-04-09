import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export type ConfirmModalType = 'danger' | 'primary' | 'success' | 'warning' | 'info';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmModalType;
  showCancel?: boolean;
  dismissKeyboardOnOpen?: boolean;
}

const typeConfig = {
  danger: {
    icon: 'alert-circle-outline' as const,
    color: '#EF4444',
    gradient: ['#EF4444', '#DC2626'] as [string, string],
    bgColor: 'rgba(239, 68, 68, 0.12)',
    glowColor: 'rgba(239, 68, 68, 0.4)',
  },
  primary: {
    icon: 'information-outline' as const,
    color: '#6366F1',
    gradient: ['#818CF8', '#6366F1'] as [string, string],
    bgColor: 'rgba(99, 102, 241, 0.12)',
    glowColor: 'rgba(99, 102, 241, 0.4)',
  },
  success: {
    icon: 'check-circle-outline' as const,
    color: '#10B981',
    gradient: ['#34D399', '#10B981'] as [string, string],
    bgColor: 'rgba(16, 185, 129, 0.12)',
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },
  warning: {
    icon: 'alert-outline' as const,
    color: '#F59E0B',
    gradient: ['#FBBF24', '#F59E0B'] as [string, string],
    bgColor: 'rgba(245, 158, 11, 0.12)',
    glowColor: 'rgba(245, 158, 11, 0.4)',
  },
  info: {
    icon: 'information-outline' as const,
    color: '#3B82F6',
    gradient: ['#60A5FA', '#3B82F6'] as [string, string],
    bgColor: 'rgba(59, 130, 246, 0.12)',
    glowColor: 'rgba(59, 130, 246, 0.4)',
  },
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'primary',
  showCancel = true,
  dismissKeyboardOnOpen = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      if (dismissKeyboardOnOpen) {
        Keyboard.dismiss();
      }
      
      // Main modal animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 9,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 70,
          friction: 8,
          delay: 80,
        }),
      ]).start();

      // Subtle pulse animation for the icon
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.08,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      iconScaleAnim.setValue(0.5);
      pulseAnim.setValue(1);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onCancel?.();
    });
  };

  const config = typeConfig[type];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop with blur */}
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} style={StyleSheet.absoluteFill} tint="dark" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)' }]} />
        )}

        {/* Modal container */}
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Gradient glow behind icon */}
          <View style={[styles.iconGlow, { backgroundColor: config.glowColor }]} />
          
          {/* Icon with gradient background */}
          <Animated.View 
            style={[
              styles.iconWrapper,
              {
                transform: [{ scale: iconScaleAnim }],
              }
            ]}
          >
            <LinearGradient
              colors={config.gradient}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <MaterialCommunityIcons
                  name={config.icon}
                  size={36}
                  color="#FFFFFF"
                />
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          {/* Title and Message */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message} numberOfLines={4}>{message}</Text>

          {/* Divider line */}
          <View style={styles.divider} />

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {showCancel && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={18} color="#94A3B8" style={styles.cancelIcon} />
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.confirmButton,
                !showCancel && styles.confirmButtonFullWidth,
              ]}
              onPress={onConfirm}
              activeOpacity={0.85}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <LinearGradient
                colors={config.gradient}
                style={styles.confirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.confirmIcon} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1A1F2E',
    borderRadius: 28,
    paddingTop: 32,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  iconGlow: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -35,
    width: 70,
    height: 70,
    borderRadius: 35,
    opacity: 0.3,
  },
  iconWrapper: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 0,
    marginVertical: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelIcon: {
    marginRight: 6,
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  confirmButton: {
    flex: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmButtonFullWidth: {
    flex: 1,
  },
  confirmGradient: {
    flexDirection: 'row',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  confirmIcon: {
    marginLeft: 6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default ConfirmModal;
