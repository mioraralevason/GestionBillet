import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/*
  Custom toast configuration with improved design
  - Auto-hides after configured duration
  - Modern dark theme matching the app design
  - Icons and color-coded by type
*/

const toastBaseConfig = {
  style: {
    borderLeftWidth: 4,
    minHeight: 70,
  },
  contentContainerStyle: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  text1Style: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  text2Style: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 18,
  },
};

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={[
        toastBaseConfig.style,
        {
          borderLeftColor: '#10B981',
          backgroundColor: '#1E293B',
          shadowColor: '#10B981',
          shadowOpacity: 0.3,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 6,
        },
      ]}
      contentContainerStyle={toastBaseConfig.contentContainerStyle}
      text1Style={toastBaseConfig.text1Style}
      text2Style={toastBaseConfig.text2Style}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="trophy-variant" size={28} color="#10B981" />
        </View>
      )}
    />
  ),

  error: (props: any) => (
    <ErrorToast
      {...props}
      style={[
        toastBaseConfig.style,
        {
          borderLeftColor: '#EF4444',
          backgroundColor: '#1E293B',
          shadowColor: '#EF4444',
          shadowOpacity: 0.3,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 6,
        },
      ]}
      contentContainerStyle={toastBaseConfig.contentContainerStyle}
      text1Style={toastBaseConfig.text1Style}
      text2Style={toastBaseConfig.text2Style}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="close-circle" size={28} color="#EF4444" />
        </View>
      )}
    />
  ),

  warning: (props: any) => (
    <BaseToast
      {...props}
      style={[
        toastBaseConfig.style,
        {
          borderLeftColor: '#F59E0B',
          backgroundColor: '#1E293B',
          shadowColor: '#F59E0B',
          shadowOpacity: 0.3,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 6,
        },
      ]}
      contentContainerStyle={toastBaseConfig.contentContainerStyle}
      text1Style={toastBaseConfig.text1Style}
      text2Style={toastBaseConfig.text2Style}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="alert" size={28} color="#F59E0B" />
        </View>
      )}
    />
  ),

  info: (props: any) => (
    <InfoToast
      {...props}
      style={[
        toastBaseConfig.style,
        {
          borderLeftColor: '#3B82F6',
          backgroundColor: '#1E293B',
          shadowColor: '#3B82F6',
          shadowOpacity: 0.3,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 6,
        },
      ]}
      contentContainerStyle={toastBaseConfig.contentContainerStyle}
      text1Style={toastBaseConfig.text1Style}
      text2Style={toastBaseConfig.text2Style}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="information" size={28} color="#3B82F6" />
        </View>
      )}
    />
  ),
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 25,
    marginRight: 10,
  },
});
