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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
}

const typeConfig = {
  danger: {
    icon: 'alert-circle-outline' as const,
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    buttonBg: '#EF4444',
  },
  primary: {
    icon: 'information-outline' as const,
    color: '#6366F1',
    bgColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    buttonBg: '#6366F1',
  },
  success: {
    icon: 'check-circle-outline' as const,
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    buttonBg: '#10B981',
  },
  warning: {
    icon: 'alert-outline' as const,
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    buttonBg: '#F59E0B',
  },
  info: {
    icon: 'information-outline' as const,
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    buttonBg: '#3B82F6',
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
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
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
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.75)' }]} />
        )}

        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Icon with colored background */}
          <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
            <View style={[styles.iconCircle, { borderColor: config.borderColor }]}>
              <MaterialCommunityIcons
                name={config.icon}
                size={40}
                color={config.color}
              />
            </View>
          </View>

          {/* Title and Message */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {showCancel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: config.buttonBg },
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
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
  },
  container: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 15,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: '#1E293B',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#334155',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButton: {
    shadowColor: '#000',
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ConfirmModal;
