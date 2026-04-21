import Toast from 'react-native-toast-message';
import { Alert } from 'react-native';

/**
 * Helper utility to show professional toast messages
 * Uses react-native-toast-message for auto-dismissing notifications
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  title: string;
  message?: string;
  type: ToastType;
}

/**
 * Shows a professional toast message that auto-dismisses
 */
export const showToast = (config: ToastConfig) => {
  const toastType = config.type === 'warning' ? 'error' : config.type;

  Toast.show({
    type: toastType,
    text1: config.title,
    text2: config.message,
    position: 'top',
    topOffset: 100,
    visibilityTime: 3000,
    autoHide: true,
  });
};

/**
 * Shows a success toast
 */
export const showSuccess = (title: string, message?: string) => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    position: 'top',
    topOffset: 100,
    visibilityTime: 3000,
    autoHide: true,
  });
};

/**
 * Shows an error toast
 */
export const showError = (title: string, message?: string) => {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position: 'top',
    topOffset: 100,
    visibilityTime: 4000,
    autoHide: true,
  });
};

/**
 * Shows a warning toast
 */
export const showWarning = (title: string, message?: string) => {
  Toast.show({
    type: 'warning',
    text1: title,
    text2: message,
    position: 'top',
    topOffset: 100,
    visibilityTime: 3500,
    autoHide: true,
  });
};

/**
 * Shows an info toast
 */
export const showInfo = (title: string, message?: string) => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'top',
    topOffset: 100,
    visibilityTime: 3000,
    autoHide: true,
  });
};

/**
 * Shows a confirmation dialog
 * Returns a Promise<boolean>
 */
export const showConfirm = (
  title: string,
  message: string,
  confirmText: string = 'Confirmer',
  cancelText: string = 'Annuler'
): Promise<boolean> => {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelText,
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: confirmText,
          onPress: () => resolve(true),
        },
      ],
      { cancelable: false }
    );
  });
};
