import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';
export type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: string;
}

const variantConfig: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  success:  { bg: 'rgba(16, 185, 129, 0.15)',  text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
  danger:   { bg: 'rgba(239, 68, 68, 0.15)',   text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' },
  warning:  { bg: 'rgba(245, 158, 11, 0.15)',  text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
  info:     { bg: 'rgba(59, 130, 246, 0.15)',  text: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)' },
  neutral:  { bg: 'rgba(148, 163, 184, 0.15)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.3)' },
  primary:  { bg: 'rgba(99, 102, 241, 0.15)',  text: '#6366F1', border: 'rgba(99, 102, 241, 0.3)' },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  icon,
}) => {
  const config = variantConfig[variant];
  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: config.bg,
        borderColor: config.border,
        paddingHorizontal: isSmall ? 6 : 8,
        paddingVertical: isSmall ? 2 : 4,
      }
    ]}>
      {icon && (
        <MaterialCommunityIcons
          name={icon as any}
          size={isSmall ? 10 : 12}
          color={config.text}
          style={styles.icon}
        />
      )}
      <Text style={[
        styles.label,
        { color: config.text, fontSize: isSmall ? 9 : 11 }
      ]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 3,
  },
  label: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default Badge;
