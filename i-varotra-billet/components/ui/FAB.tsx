import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export type FABSize = 'sm' | 'md' | 'lg';

interface FABProps {
  icon: string;
  onPress: () => void;
  color?: string;
  backgroundColor?: string;
  size?: FABSize;
  style?: ViewStyle;
}

const sizeConfig = {
  sm: { container: 48, icon: 22 },
  md: { container: 60, icon: 28 },
  lg: { container: 72, icon: 34 },
};

export const FAB: React.FC<FABProps> = ({
  icon,
  onPress,
  color = '#000000',
  backgroundColor = '#A5B4FC',
  size = 'md',
  style,
}) => {
  const { container, icon: iconSize } = sizeConfig[size];

  const containerStyle: ViewStyle = {
    width: container,
    height: container,
    borderRadius: container / 2,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: backgroundColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  };

  if (Platform.OS === 'ios') {
    return (
      <TouchableOpacity
        style={[containerStyle, style]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <BlurView intensity={0} style={[StyleSheet.absoluteFill, { backgroundColor }]} />
        <MaterialCommunityIcons name={icon as any} size={iconSize} color={color} style={styles.icon} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[containerStyle, { backgroundColor, justifyContent: 'center', alignItems: 'center' }, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <MaterialCommunityIcons name={icon as any} size={iconSize} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  icon: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -14,
  },
});

export default FAB;
