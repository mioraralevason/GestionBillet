import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ViewStyle } from 'react-native';

export type CardVariant = 'elevated' | 'filled' | 'outlined';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: number;
  borderRadius?: number;
  onPress?: () => void;
  style?: ViewStyle;
  borderColor?: string;
  backgroundColor?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'filled',
  padding = 16,
  borderRadius = 16,
  onPress,
  style,
  borderColor,
  backgroundColor,
}) => {
  const cardStyle: ViewStyle = {
    padding,
    borderRadius,
    backgroundColor: backgroundColor ?? (variant === 'outlined' ? 'transparent' : '#111827'),
    borderWidth: variant === 'outlined' ? 1 : 0,
    borderColor: borderColor ?? (variant === 'outlined' ? '#1E293B' : undefined),
    ...Platform.select({
      ios: variant === 'elevated' ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      } : {},
      android: variant === 'elevated' ? { elevation: 4 } : {},
    }),
  };

  if (onPress) {
    return (
      <TouchableOpacity style={[cardStyle, style]} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
};

export default Card;
