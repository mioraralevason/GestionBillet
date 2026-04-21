import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ticket } from '../services/TicketService';
import { Colors } from '../constants/theme';

interface TicketCardProps {
  item: Ticket;
  isSelected?: boolean;
  selectionMode?: boolean;
  role?: string | null;
  onPress: (item: Ticket) => void;
  onLongPress: (id: number) => void;
  onResetVerification?: (item: Ticket) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  item,
  isSelected,
  selectionMode,
  role,
  onPress,
  onLongPress,
  onResetVerification
}) => {
  const colorScheme = useColorScheme() || 'light';
  const theme = {
    ...Colors[colorScheme],
    background: '#000000',
    card: '#111827',
    border: '#1E293B',
    text: '#FFFFFF',
    icon: '#94A3B8',
    tint: '#6366F1',
    success: '#10B981',
    danger: '#FF2E63'
  };
  
  const statusText = item.status_name || 'Inconnu';
  const isVerified = statusText.toLowerCase().includes('vérifié') || statusText.toLowerCase().includes('validé');
  const isSold = statusText.toLowerCase().includes('vendu');
  const totalPaid = item.total_paid || 0;

  const getStatusColor = () => {
    if (isVerified) return theme.success;
    if (isSold) return theme.tint;
    return theme.icon;
  };

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { backgroundColor: theme.card, borderColor: isSelected ? theme.tint : theme.border },
        isSelected && styles.selectedCard
      ]}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item.id!)}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        <View style={styles.row}>
          {selectionMode && (
            <MaterialCommunityIcons
              name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
              size={22}
              color={isSelected ? theme.tint : theme.icon}
              style={{ marginRight: 10 }}
            />
          )}
          <Text style={[styles.ticketNum, { color: theme.text }]}>{item.ticket_number}</Text>
          {isVerified && (
            <View style={[styles.verifiedBadge, { backgroundColor: theme.success + '20' }]}>
              <MaterialCommunityIcons name="check-decagram" size={14} color={theme.success} />
              <Text style={[styles.verifiedLabel, { color: theme.success }]}>Vérifié</Text>
              {(role === 'admin' || role === 'verificateur') && onResetVerification && (
                <TouchableOpacity
                  style={[styles.resetBtn, { borderColor: theme.tint }]}
                  onPress={() => onResetVerification(item)}
                >
                  <MaterialCommunityIcons name="refresh" size={12} color={theme.tint} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        {item.ticket_type_name && (
          <View style={styles.ticketTypeBadge}>
            <MaterialCommunityIcons name="tag" size={12} color={theme.tint} />
            <Text style={[styles.ticketTypeText, { color: theme.tint }]}>{item.ticket_type_name}</Text>
          </View>
        )}
        <Text style={[styles.buyerName, { color: theme.icon }]}>
          {item.buyer_name || 'Disponible'}
        </Text>
        {item.buyer_phone && (
          <Text style={[styles.buyerPhone, { color: theme.icon }]}>
            <MaterialCommunityIcons name="phone" size={12} /> {item.buyer_phone}
          </Text>
        )}
      </View>
      
      <View style={styles.rightContent}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{isVerified ? 'VÉRIFIÉ' : statusText.toUpperCase()}</Text>
        </View>
        <Text style={[styles.price, { color: theme.text }]}>{item.price.toLocaleString()} Ar</Text>
        {isSold && totalPaid < item.price && (
          <Text style={[styles.remaining, { color: theme.danger }]}>Reste: {item.price - totalPaid} Ar</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  selectedCard: { 
    borderWidth: 2,
  },
  leftContent: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  ticketNum: { fontSize: 17, fontWeight: '700' },
  ticketTypeBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  ticketTypeText: { fontSize: 12, fontWeight: '600' },
  verifiedBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginLeft: 8, 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 6 
  },
  verifiedLabel: { 
    fontSize: 10, 
    fontWeight: '800', 
    marginLeft: 4,
    textTransform: 'uppercase'
  },
  resetBtn: {
    marginLeft: 8,
    backgroundColor: 'transparent',
    padding: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  buyerName: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  buyerPhone: { fontSize: 12, marginTop: 2 },
  rightContent: { alignItems: 'flex-end' },
  statusBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8, 
    marginBottom: 6,
    minWidth: 70,
    alignItems: 'center'
  },
  statusText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  price: { fontSize: 16, fontWeight: '800' },
  remaining: { fontSize: 11, fontWeight: '600', marginTop: 3 },
});
