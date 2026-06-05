import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Event } from '../services/EventService';

interface HistoryItemProps {
  event: Event & { stats?: any };
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions: boolean;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ event, onPress, onEdit, onDelete, showActions }) => {
  const accentColor = event.color || '#6366F1';
  const sold = event.stats?.sold ?? 0;
  const total = event.stats?.total ?? 0;
  const verified = event.stats?.validated ?? 0;
  const fillPercent = total > 0 ? Math.round((sold / total) * 100) : 0;

  const date = event.event_date ? new Date(event.event_date) : null;
  const day = date ? date.toLocaleDateString('fr-FR', { day: '2-digit' }) : '--';
  const month = date ? date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '').toUpperCase() : '---';
  const year = date ? date.getFullYear() : '';

  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.75}>
      {/* Left: image or empty */}
      <View style={styles.leftContainer}>
        {event.image ? (
          <Image source={{ uri: event.image }} style={styles.eventImage} />
        ) : null}
      </View>

      {/* Center: event info */}
      <View style={styles.itemContent}>
        <View style={styles.contentRow}>
          <View style={styles.contentLeft}>
            <Text style={styles.itemName} numberOfLines={1}>{event.name}</Text>
            {event.slogan ? (
              <Text style={styles.itemSlogan} numberOfLines={1}>{event.slogan}</Text>
            ) : null}
          </View>
          {date && (
            <View style={[styles.miniCalBadge, { borderColor: accentColor + '50' }]}>
              <View style={[styles.miniCalHeader, { backgroundColor: accentColor }]}>
                <Text style={styles.miniCalMonth}>{month}</Text>
              </View>
              <Text style={styles.miniCalDay}>{day}</Text>
              <Text style={styles.miniCalYear}>{year}</Text>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <MaterialCommunityIcons name="ticket-outline" size={11} color="#64748B" />
            <Text style={styles.statChipText}>{sold}/{total}</Text>
          </View>
          {verified > 0 && (
            <View style={styles.statChip}>
              <MaterialCommunityIcons name="check-decagram" size={11} color="#10B981" />
              <Text style={[styles.statChipText, { color: '#10B981' }]}>{verified}</Text>
            </View>
          )}
          <View style={[styles.fillBadge, { backgroundColor: accentColor + '18', borderColor: accentColor + '50' }]}>
            <Text style={[styles.fillText, { color: accentColor }]}>{fillPercent}%</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${fillPercent}%` as any, backgroundColor: accentColor }]} />
        </View>
      </View>

      {/* Right: actions or chevron */}
      <View style={styles.itemRight}>
        {showActions ? (
          <>
            {onEdit && (
              <TouchableOpacity style={styles.actionBtn} onPress={onEdit} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <MaterialCommunityIcons name="pencil" size={16} color="#6366F1" />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={styles.actionBtnDanger} onPress={onDelete} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <MaterialCommunityIcons name="chevron-right" size={20} color="#334155" />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    gap: 14,
  },
  leftContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  // Date badge
  dateBadge: {
    width: 44,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
  },
  dateBadgeTop: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dateDay: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  dateMonth: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingTop: 3,
  },
  dateYear: {
    color: '#4B5563',
    fontSize: 9,
    fontWeight: '500',
    paddingBottom: 4,
  },
  // Content layout
  itemContent: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  contentLeft: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  itemSlogan: {
    color: '#64748B',
    fontSize: 11,
    fontStyle: 'italic',
  },
  // Mini calendar badge (right side)
  miniCalBadge: {
    width: 48,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    flexShrink: 0,
  },
  miniCalHeader: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  miniCalMonth: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  miniCalDay: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 2,
  },
  miniCalYear: {
    color: '#6B7280',
    fontSize: 8,
    fontWeight: '600',
    paddingBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statChipText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  fillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  fillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Right actions
  itemRight: {
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(99,102,241,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnDanger: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HistoryItem;
