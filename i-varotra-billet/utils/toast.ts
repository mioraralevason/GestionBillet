import { Alert } from 'react-native';

/**
 * Helper utility to show professional toast messages
 * This can be used as a drop-in replacement for Alert.alert()
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  title: string;
  message?: string;
  type: ToastType;
}

/**
 * Shows a professional toast message
 * Note: This is a placeholder until full migration is complete
 * For new implementations, use the ToastMessage component directly
 */
export const showToast = (config: ToastConfig) => {
  // For now, fall back to Alert.alert
  // TODO: Replace with ToastMessage component in each file
  Alert.alert(config.title, config.message || '');
};

/**
 * Shows a success toast
 */
export const showSuccess = (title: string, message?: string) => {
  showToast({ title, message, type: 'success' });
};

/**
 * Shows an error toast
 */
export const showError = (title: string, message?: string) => {
  showToast({ title, message, type: 'error' });
};

/**
 * Shows a warning toast
 */
export const showWarning = (title: string, message?: string) => {
  showToast({ title, message, type: 'warning' });
};

/**
 * Shows an info toast
 */
export const showInfo = (title: string, message?: string) => {
  showToast({ title, message, type: 'info' });
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
