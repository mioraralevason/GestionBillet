import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ImageBackground,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Event } from '../services/EventService';
import Badge from './ui/Badge';

const { width } = Dimensions.get('window');

interface EventCardProps {
  event: Event & { stats?: any };
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  onEdit,
  onDelete,
  showActions = false,
  compact = false,
}) => {
  const accentColor = event.color || '#6366F1';
  const sold = event.stats?.sold ?? 0;
  const total = event.stats?.total ?? 0;
  const fillPercent = total > 0 ? Math.round((sold / total) * 100) : 0;

  const formattedDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  if (compact) {
    return (
      <TouchableOpacity style={[styles.compactCard, { borderLeftColor: accentColor }]} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.compactDot, { backgroundColor: accentColor }]} />
        <View style={styles.compactContent}>
          <Text style={styles.compactName} numberOfLines={1}>{event.name}</Text>
          <Text style={styles.compactDate}>{formattedDate}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color="#4B5563" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: accentColor }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {event.image ? (
        <ImageBackground
          source={{ uri: event.image }}
          style={styles.imageBackground}
          imageStyle={styles.backgroundImage}
        >
          <View style={styles.imageOverlay}>
            {/* Accent stripe at top */}
            <View style={[styles.topAccent, { backgroundColor: accentColor + '22' }]}>
              <View style={styles.topAccentInner}>
                <MaterialCommunityIcons name="calendar-star" size={18} color={accentColor} />
                <Text style={[styles.accentDate, { color: accentColor }]}>{formattedDate}</Text>
              </View>
              {showActions && (
                <View style={styles.actionRow}>
                  {onEdit && (
                    <TouchableOpacity style={styles.actionBtn} onPress={onEdit} activeOpacity={0.7}>
                      <MaterialCommunityIcons name="pencil" size={17} color="#6366F1" />
                    </TouchableOpacity>
                  )}
                  {onDelete && (
                    <TouchableOpacity style={styles.actionBtnDanger} onPress={onDelete} activeOpacity={0.7}>
                      <MaterialCommunityIcons name="trash-can-outline" size={17} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Spacer */}
            <View style={{ flex: 1 }} />

            {/* Body at bottom */}
            <View style={[styles.body, styles.bodyOnImage]}>
              <Text style={styles.name} numberOfLines={2}>{event.name}</Text>
              {event.slogan ? (
                <Text style={styles.slogan} numberOfLines={1}>{event.slogan}</Text>
              ) : null}
            </View>

            {/* Footer stats */}
            <View style={[styles.footer, styles.footerOnImage]}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: accentColor }]}>{sold}</Text>
                  <Text style={styles.statLabel}>Vendus</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValueNeutral}>{total}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValueNeutral}>{fillPercent}%</Text>
                  <Text style={styles.statLabel}>Remplissage</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${fillPercent}%` as any, backgroundColor: accentColor }]} />
              </View>
            </View>
          </View>
        </ImageBackground>
      ) : (
        <>
          {/* Accent stripe at top */}
          <View style={[styles.topAccent, { backgroundColor: accentColor + '22' }]}>
            <View style={styles.topAccentInner}>
              <MaterialCommunityIcons name="calendar-star" size={18} color={accentColor} />
              <Text style={[styles.accentDate, { color: accentColor }]}>{formattedDate}</Text>
            </View>
            {showActions && (
              <View style={styles.actionRow}>
                {onEdit && (
                  <TouchableOpacity style={styles.actionBtn} onPress={onEdit} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="pencil" size={17} color="#6366F1" />
                  </TouchableOpacity>
                )}
                {onDelete && (
                  <TouchableOpacity style={styles.actionBtnDanger} onPress={onDelete} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="trash-can-outline" size={17} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Body */}
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={2}>{event.name}</Text>
            {event.slogan ? (
              <Text style={styles.slogan} numberOfLines={1}>{event.slogan}</Text>
            ) : null}
          </View>

          {/* Footer stats */}
          <View style={styles.footer}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: accentColor }]}>{sold}</Text>
                <Text style={styles.statLabel}>Vendus</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValueNeutral}>{total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValueNeutral}>{fillPercent}%</Text>
                <Text style={styles.statLabel}>Remplissage</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${fillPercent}%` as any, backgroundColor: accentColor }]} />
            </View>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    borderLeftWidth: 5,
    overflow: 'hidden',
    minHeight: 480,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  backgroundImage: {
    borderRadius: 16,
  },
  imageOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
  },
  bodyOnImage: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
  },
  footerOnImage: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderTopColor: 'rgba(30, 41, 59, 0.6)',
  },
  topAccent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  topAccentInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accentDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnDanger: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 24,
  },
  slogan: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statValueNeutral: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#1E293B',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Compact variant
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    borderLeftWidth: 4,
    gap: 12,
  },
  compactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactContent: {
    flex: 1,
  },
  compactName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  compactDate: {
    color: '#64748B',
    fontSize: 12,
  },
});

export default memo(EventCard);
