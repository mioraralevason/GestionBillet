import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type IconButtonVariant = 'tonal' | 'outlined' | 'standard' | 'filled';

interface IconButtonProps {
  icon: string;
  onPress: () => void;
  variant?: IconButtonVariant;
  color?: string;
  backgroundColor?: string;
  size?: number;
  style?: ViewStyle;
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant = 'standard',
  color = '#94A3B8',
  backgroundColor,
  size = 20,
  style,
  disabled = false,
}) => {
  const getBackground = () => {
    if (backgroundColor) return backgroundColor;
    switch (variant) {
      case 'tonal':    return 'rgba(99, 102, 241, 0.12)';
      case 'outlined': return 'transparent';
      case 'filled':   return '#6366F1';
      default:         return 'transparent';
    }
  };

  const getIconColor = () => {
    if (disabled) return '#4B5563';
    if (variant === 'filled') return '#FFFFFF';
    return color;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: disabled ? 'rgba(75,85,99,0.1)' : getBackground(),
          borderWidth: variant === 'outlined' ? 1 : 0,
          borderColor: variant === 'outlined' ? '#334155' : undefined,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <MaterialCommunityIcons name={icon as any} size={size} color={getIconColor()} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default IconButton;
