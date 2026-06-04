import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ticket, TicketService } from '../services/TicketService';

const STATUS_COLORS = {
  verified: '#10B981',
  sold: '#6366F1',
  available: '#334155',
};

interface TicketCardProps {
  item: Ticket;
  isSelected?: boolean;
  selectionMode?: boolean;
  role?: string | null;
  eventImage?: string;
  onPress: (item: Ticket) => void;
  onLongPress: (id: number) => void;
  onResetVerification?: (item: Ticket) => void;
}

export const TicketCard: React.FC<TicketCardProps> = memo(({
  item,
  isSelected = false,
  selectionMode = false,
  role,
  eventImage,
  onPress,
  onLongPress,
  onResetVerification,
}) => {
  const statusText = item.status_name || 'Inconnu';
  const isVerified = item.status_id === TicketService.STATUS_VALIDE;
  const isSold = item.status_id === TicketService.STATUS_VENDU;
  const isAvailable = !isVerified && !isSold;
  const totalPaid = item.total_paid || 0;
  const remaining = item.price - totalPaid;
  const canReset = (role === 'admin' || role === 'verificateur') && onResetVerification;

  const accentColor = isVerified
    ? STATUS_COLORS.verified
    : isSold
    ? STATUS_COLORS.sold
    : STATUS_COLORS.available;

  const cardContent = (
    <>
      {/* Selection checkbox */}
      {selectionMode && (
        <View style={styles.checkboxWrapper}>
          <MaterialCommunityIcons
            name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            size={20}
            color={isSelected ? '#6366F1' : '#334155'}
          />
        </View>
      )}

      {/* Main content */}
      <View style={[styles.body, eventImage && styles.bodyOnImage]}>
        {/* Row 1: ticket number + status badge */}
        <View style={styles.topRow}>
          <Text style={styles.ticketNum} numberOfLines={1}>{item.ticket_number}</Text>
          <View style={[styles.statusPill, { backgroundColor: accentColor + '20', borderColor: accentColor + '60' }]}>
            {isVerified && <MaterialCommunityIcons name="check-decagram" size={11} color={accentColor} />}
            <Text style={[styles.statusPillText, { color: accentColor }]}>
              {isVerified ? 'VÉRIFIÉ' : isSold ? 'VENDU' : 'DISPONIBLE'}
            </Text>
          </View>
        </View>

        {/* Row 2: ticket type tag */}
        {item.ticket_type_name && (
          <View style={styles.typeRow}>
            <MaterialCommunityIcons name="tag-outline" size={11} color="#6366F1" />
            <Text style={styles.typeText}>{item.ticket_type_name}</Text>
          </View>
        )}

        {/* Row 3: buyer */}
        <Text style={[styles.buyerName, !item.buyer_name && styles.buyerAvailable]}>
          {item.buyer_name || 'Non assigné'}
        </Text>

        {/* Row 4: phone */}
        {item.buyer_phone ? (
          <View style={styles.phoneRow}>
            <MaterialCommunityIcons name="phone-outline" size={11} color="#4B5563" />
            <Text style={styles.phoneText}>{item.buyer_phone}</Text>
          </View>
        ) : null}
      </View>

      {/* Right: price & payment */}
      <View style={[styles.right, eventImage && styles.rightOnImage]}>
        <Text style={styles.price}>{item.price.toLocaleString()} Ar</Text>
        {isSold && remaining > 0 && (
          <Text style={styles.remaining}>-{remaining.toLocaleString()} Ar</Text>
        )}
        {isVerified && canReset && (
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => onResetVerification!(item)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <MaterialCommunityIcons name="refresh" size={13} color="#6366F1" />
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
        { borderLeftColor: accentColor },
      ]}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item.id!)}
      activeOpacity={0.7}
    >
      {eventImage ? (
        <ImageBackground
          source={{ uri: eventImage }}
          style={styles.imageBackground}
          imageStyle={styles.backgroundImage}
        >
          <View style={styles.imageOverlay}>
            {cardContent}
          </View>
        </ImageBackground>
      ) : (
        cardContent
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: '#6366F1',
    borderWidth: 1,
    borderLeftWidth: 4,
    backgroundColor: 'rgba(99,102,241,0.06)',
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
  },
  backgroundImage: {
    borderRadius: 14,
  },
  imageOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 14,
  },
  checkboxWrapper: {
    paddingLeft: 12,
  },
  body: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 4,
  },
  bodyOnImage: {
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ticketNum: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  typeText: {
    color: '#6366F1',
    fontSize: 11,
    fontWeight: '600',
  },
  buyerName: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  buyerAvailable: {
    color: '#334155',
    fontStyle: 'italic',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    color: '#4B5563',
    fontSize: 11,
  },
  right: {
    alignItems: 'flex-end',
    paddingRight: 12,
    paddingVertical: 12,
    minWidth: 80,
  },
  rightOnImage: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  price: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  remaining: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
  },
  resetBtn: {
    marginTop: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(99,102,241,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
