import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface MonthYearPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  value: Date | null;
  title?: string;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  visible,
  onClose,
  onSelect,
  value,
  title = 'Choisir une période',
}) => {
  const [selectedYear, setSelectedYear] = useState(
    value?.getFullYear() ?? new Date().getFullYear()
  );

  const handleMonthPress = (index: number) => {
    onSelect(new Date(selectedYear, index, 1));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.yearRow}>
            <TouchableOpacity
              onPress={() => setSelectedYear(y => y - 1)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="chevron-left" size={30} color="#6366F1" />
            </TouchableOpacity>
            <Text style={styles.yearText}>{selectedYear}</Text>
            <TouchableOpacity
              onPress={() => setSelectedYear(y => y + 1)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="chevron-right" size={30} color="#6366F1" />
            </TouchableOpacity>
          </View>

          <View style={styles.monthsGrid}>
            {MONTHS.map((month, index) => {
              const active =
                value != null &&
                value.getMonth() === index &&
                value.getFullYear() === selectedYear;
              return (
                <TouchableOpacity
                  key={month}
                  style={[styles.monthItem, active && styles.monthItemActive]}
                  onPress={() => handleMonthPress(index)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.monthText, active && styles.monthTextActive]}>
                    {month.substring(0, 4)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#111827',
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  yearRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
    marginBottom: 24,
  },
  yearText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    minWidth: 60,
    textAlign: 'center',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  monthItem: {
    width: '30%',
    backgroundColor: '#1E293B',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  monthItemActive: {
    backgroundColor: '#6366F1',
    borderColor: '#818CF8',
  },
  monthText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 13,
  },
  monthTextActive: {
    color: '#FFFFFF',
  },
  closeBtn: {
    marginTop: 12,
    padding: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default MonthYearPicker;
