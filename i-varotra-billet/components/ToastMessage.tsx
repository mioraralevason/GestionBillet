import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessageProps {
  visible: boolean;
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

const typeConfig = {
  success: {
    icon: 'check-circle',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  error: {
    icon: 'close-circle',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  warning: {
    icon: 'alert',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  info: {
    icon: 'information',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
};

const ToastMessage: React.FC<ToastMessageProps> = ({
  visible,
  title,
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
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
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="close" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
            <MaterialCommunityIcons
              name={config.icon}
              size={28}
              color={config.color}
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            {message && <Text style={styles.message}>{message}</Text>}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
});

export default ToastMessage;
