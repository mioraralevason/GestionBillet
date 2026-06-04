import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SuggestionItem {
  type: string;
  value: string;
  icon?: string;
}

interface SuggestionListProps {
  visible: boolean;
  items: SuggestionItem[];
  onSelect: (value: string) => void;
  maxHeight?: number;
}

export const SuggestionList: React.FC<SuggestionListProps> = ({
  visible,
  items,
  onSelect,
  maxHeight = 250,
}) => {
  const slideAnim = useRef(new Animated.Value(-10)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && items.length > 0) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 9,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -10, duration: 120, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, items.length]);

  if (!visible || items.length === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { maxHeight, transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.item, index < items.length - 1 && styles.itemBorder]}
          onPress={() => onSelect(item.value)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={(item.icon ?? (item.type === 'name' ? 'account' : 'ticket-outline')) as any}
            size={16}
            color="#64748B"
          />
          <Text style={styles.value} numberOfLines={1}>{item.value}</Text>
          <MaterialCommunityIcons name="arrow-top-left" size={14} color="#4B5563" />
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    zIndex: 2000,
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  value: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 14,
  },
});

export default SuggestionList;
