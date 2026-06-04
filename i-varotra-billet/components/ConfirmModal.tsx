import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Keyboard,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export type ConfirmModalType = 'danger' | 'primary' | 'success' | 'warning' | 'info';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  subtitle?: string;
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
    glowColor: 'rgba(239, 68, 68, 0.25)',
  },
  primary: {
    icon: 'information-outline' as const,
    color: '#3B82F6',
    gradient: ['#60A5FA', '#3B82F6'] as [string, string],
    glowColor: 'rgba(59, 130, 246, 0.25)',
  },
  success: {
    icon: 'check-circle-outline' as const,
    color: '#10B981',
    gradient: ['#34D399', '#10B981'] as [string, string],
    glowColor: 'rgba(16, 185, 129, 0.25)',
  },
  warning: {
    icon: 'alert-outline' as const,
    color: '#F59E0B',
    gradient: ['#FBBF24', '#F59E0B'] as [string, string],
    glowColor: 'rgba(245, 158, 11, 0.25)',
  },
  info: {
    icon: 'information-outline' as const,
    color: '#3B82F6',
    gradient: ['#60A5FA', '#3B82F6'] as [string, string],
    glowColor: 'rgba(59, 130, 246, 0.25)',
  },
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  subtitle,
  onConfirm,
  onCancel,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'primary',
  showCancel = true,
  dismissKeyboardOnOpen = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (visible) {
      if (dismissKeyboardOnOpen) Keyboard.dismiss();

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 9,
          delay: 60,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);
      iconScaleAnim.setValue(0.6);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.88,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 160,
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
        <BlurView
          intensity={Platform.OS === 'ios' ? 40 : 20}
          style={StyleSheet.absoluteFill}
          tint="dark"
        />

        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Subtle glow spot */}
          <View style={[styles.iconGlow, { backgroundColor: config.glowColor }]} />

          {/* Icon */}
          <Animated.View style={[styles.iconWrapper, { transform: [{ scale: iconScaleAnim }] }]}>
            <LinearGradient
              colors={config.gradient}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name={config.icon} size={28} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>

          {/* Text */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message} numberOfLines={5}>{message}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <View style={styles.divider} />

          {/* Buttons */}
          <View style={styles.buttonRow}>
            {showCancel && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleClose}
                activeOpacity={0.6}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={16} color="#64748B" style={{ marginRight: 5 }} />
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.confirmBtn, !showCancel && styles.confirmBtnFull]}
              onPress={onConfirm}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <LinearGradient
                colors={config.gradient}
                style={styles.confirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.confirmText}>{confirmText}</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 5 }} />
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
    paddingHorizontal: 24,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#161B27',
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 18,
  },
  iconGlow: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    opacity: 0.4,
  },
  iconWrapper: {
    alignSelf: 'center',
    marginBottom: 18,
  },
  iconGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 46,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cancelText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1.5,
    borderRadius: 13,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnFull: {
    flex: 1,
  },
  confirmGradient: {
    flexDirection: 'row',
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default ConfirmModal;
