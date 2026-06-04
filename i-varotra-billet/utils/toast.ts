import Toast from 'react-native-toast-message';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  title: string;
  message?: string;
  type: ToastType;
  position?: 'top' | 'bottom';
}

const DURATIONS: Record<ToastType, number> = {
  success: 2500,
  info: 3000,
  warning: 3500,
  error: 4000,
};

export const showToast = ({ title, message, type, position = 'bottom' }: ToastConfig) => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position,
    bottomOffset: 100,
    topOffset: 100,
    visibilityTime: DURATIONS[type],
    autoHide: true,
  });
};

export const showSuccess = (title: string, message?: string) => {
  showToast({ title, message, type: 'success' });
};

export const showError = (title: string, message?: string) => {
  showToast({ title, message, type: 'error' });
};

export const showWarning = (title: string, message?: string) => {
  showToast({ title, message, type: 'warning' });
};

export const showInfo = (title: string, message?: string) => {
  showToast({ title, message, type: 'info' });
};
