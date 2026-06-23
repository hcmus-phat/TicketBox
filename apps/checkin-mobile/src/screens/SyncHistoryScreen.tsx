import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Wifi, UploadCloud } from 'lucide-react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../constants/theme';
import type { SyncHistoryRecord } from '../types';

const MOCK_HISTORY: SyncHistoryRecord[] = [
  { id: 'sync-001', syncedAt: '2026-06-07T20:05:00.000Z', recordCount: 3, status: 'SUCCESS' },
  { id: 'sync-002', syncedAt: '2026-06-07T19:50:00.000Z', recordCount: 5, status: 'SUCCESS' },
  { id: 'sync-003', syncedAt: '2026-06-07T19:30:00.000Z', recordCount: 2, status: 'FAILED', errorMessage: 'Server timeout' },
  { id: 'sync-004', syncedAt: '2026-06-07T19:15:00.000Z', recordCount: 8, status: 'PARTIAL', errorMessage: '1 conflict' },
  { id: 'sync-005', syncedAt: '2026-06-07T19:00:00.000Z', recordCount: 12, status: 'SUCCESS' },
];

const syncStatusConfig: Record<string, { color: string; bg: string; label: string }> = {
  SUCCESS: { color: COLORS.success, bg: COLORS.success + '1A', label: 'Synced' },
  FAILED: { color: COLORS.error, bg: COLORS.error + '1A', label: 'Failed' },
  PARTIAL: { color: COLORS.warning, bg: COLORS.warning + '1A', label: 'Partial' },
};

export default function SyncHistoryScreen() {
  const navigation = useNavigation();
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const unsynced = 5; // Mock pending
  const total = 1240;

  const handleSync = () => {
    setSyncing(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setSyncing(false);
          return 100;
        }
        return p + 10;
      });
    }, 150);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color={COLORS.textMuted} size={20} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.subtitle}>DATA SYNC</Text>
        <Text style={styles.title}>Synchronisation</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status card */}
        <View style={styles.statusCard}>
          <View style={styles.statusCardHeader}>
            <View style={styles.networkInfo}>
              <View style={styles.networkIconBox}>
                <Wifi color={COLORS.primary} size={16} />
              </View>
              <View>
                <Text style={styles.networkStatusText}>Connected</Text>
                <Text style={styles.networkDetailsText}>staff-net-5G · 42ms</Text>
              </View>
            </View>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          
          <View style={styles.statusCardStats}>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: COLORS.warning }]}>{unsynced}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxBorder]}>
              <Text style={[styles.statVal, { color: COLORS.primary }]}>{total - unsynced}</Text>
              <Text style={styles.statLabel}>Synced</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxBorder]}>
              <Text style={[styles.statVal, { color: COLORS.text }]}>{total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Sync button / Progress */}
        <View style={styles.syncContainer}>
          {syncing ? (
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Uploading scans...</Text>
                <Text style={styles.progressPct}>{Math.min(progress, 100)}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressDetails}>
                {Math.floor(progress * unsynced / 100)}/{unsynced} records uploaded
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.syncBtn} onPress={handleSync} activeOpacity={0.8}>
              <UploadCloud color="#000" size={20} style={{ marginRight: 8 }} />
              <Text style={styles.syncBtnText}>Sync Now {unsynced > 0 && `(${unsynced} pending)`}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sync history */}
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Sync History</Text>
          <Text style={styles.historySubtitle}>TODAY</Text>
        </View>

        <View style={styles.historyList}>
          {MOCK_HISTORY.map((ev, i) => {
            const cfg = syncStatusConfig[ev.status];
            const time = new Date(ev.syncedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            
            return (
              <View key={ev.id} style={styles.historyItem}>
                <View style={[styles.historyDot, { backgroundColor: cfg.color }]} />
                <View style={styles.historyContent}>
                  <View style={styles.historyTitleRow}>
                    <Text style={styles.historyTickets}>{ev.recordCount} tickets</Text>
                    <Text style={[styles.historyStatusText, { color: cfg.color }]}>· {cfg.label}</Text>
                  </View>
                  {ev.status !== 'FAILED' && (
                    <Text style={styles.historyDuration}>Duration: 1.2s</Text>
                  )}
                  {ev.errorMessage && (
                    <Text style={[styles.historyDuration, { color: COLORS.error }]}>{ev.errorMessage}</Text>
                  )}
                </View>
                <Text style={styles.historyTime}>{time}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  titleContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  statusCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '1A',
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  networkStatusText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  networkDetailsText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '1A',
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  liveText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  statusCardStats: {
    flexDirection: 'row',
  },
  statBox: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statBoxBorder: {
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  syncContainer: {
    marginBottom: SPACING.xl,
  },
  syncBtn: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  syncBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: 'bold',
  },
  progressCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  progressPct: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressDetails: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: 4,
  },
  historyTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  historySubtitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  historyTickets: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  historyDuration: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  historyTime: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
