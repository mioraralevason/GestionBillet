/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 */

import { Platform } from 'react-native';

const tintColorLight = '#007AFF';
const tintColorDark = '#00E5FF'; // Cyan pour le style "électro"

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    card: '#F8F9FA',
    border: '#E9ECEF',
    header: '#FFFFFF',
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    danger: '#FF3B30',
    warning: '#FF9500',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0D1117', // Plus sombre pour le style moderne/électro
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    card: '#161B22',
    border: '#30363D',
    header: '#010409',
    primary: '#00E5FF',
    secondary: '#7000FF',
    success: '#00FF94',
    danger: '#FF2E63',
    warning: '#FFE600',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
