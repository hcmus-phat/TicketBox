/**
 * OfflineQueueScreen
 * - Display list of un-synced check-ins (3-5 mock items)
 * - Status: PENDING, SYNCED, FAILED
 * - "Sync ngay" button → delay 1s → change status to SYNCED
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../constants/theme';
import type { OfflineQueueItem, SyncStatus } from '../types';

const MOCK_QUEUE: OfflineQueueItem[] = [
  {
    id: 'q-001',
    ticketId: 'ticket-101',
    ticketCode: 'TKB-2026-VIP-101',
    qrCodeData: 'qr-data-101',
    concertId: 'concert-001',
    staffId: 'staff-001',
    sourceDeviceId: 'device-A',
    checkedAt: '2026-06-07T19:30:00.000Z',
    syncStatus: 'PENDING',
    syncAttempts: 0,
    lastSyncError: null,
    serverCheckinId: null,
    createdAt: '2026-06-07T19:30:00.000Z',
  },
  {
    id: 'q-002',
    ticketId: 'ticket-102',
    ticketCode: 'TKB-2026-SVIP-102',
    qrCodeData: 'qr-data-102',
    concertId: 'concert-001',
    staffId: 'staff-001',
    sourceDeviceId: 'device-A',
    checkedAt: '2026-06-07T19:32:00.000Z',
    syncStatus: 'SYNCED',
    syncAttempts: 1,
    lastSyncError: null,
    serverCheckinId: 'server-checkin-201',
    createdAt: '2026-06-07T19:32:00.000Z',
  },
  {
    id: 'q-003',
    ticketId: 'ticket-103',
    ticketCode: 'TKB-2026-GA-103',
    qrCodeData: 'qr-data-103',
    concertId: 'concert-001',
    staffId: 'staff-001',
    sourceDeviceId: 'device-A',
    checkedAt: '2026-06-07T19:35:00.000Z',
    syncStatus: 'FAILED',
    syncAttempts: 3,
    lastSyncError: 'Network timeout',
    serverCheckinId: null,
    createdAt: '2026-06-07T19:35:00.000Z',
  },
  {
    id: 'q-004',
    ticketId: 'ticket-104',
    ticketCode: 'TKB-2026-VIP-104',
    qrCodeData: 'qr-data-104',
    concertId: 'concert-001',
    staffId: 'staff-001',
    sourceDeviceId: 'device-A',
    checkedAt: '2026-06-07T19:38:00.000Z',
    syncStatus: 'PENDING',
    syncAttempts: 0,
    lastSyncError: null,
    serverCheckinId: null,
    createdAt: '2026-06-07T19:38:00.000Z',
  },
  {
    id: 'q-005',
    ticketId: 'ticket-105',
    ticketCode: 'TKB-2026-SVIP-105',
    qrCodeData: 'qr-data-105',
    concertId: 'concert-001',
    staffId: 'staff-001',
    sourceDeviceId: 'device-A',
    checkedAt: '2026-06-07T19:40:00.000Z',
    syncStatus: 'PENDING',
    syncAttempts: 1,
    lastSyncError: 'Server error',
    serverCheckinId: null,
    createdAt: '2026-06-07T19:40:00.000Z',
  },
];

const STATUS_ICON: Record<SyncStatus, { code: string; color: string; label: string }> = {
  PENDING: { code: 'WAIT', color: COLORS.warning, label: 'Chờ sync' },
  SYNCED: { code: 'OK', color: COLORS.success, label: 'Đã sync' },
  FAILED: { code: 'FAIL', color: COLORS.error, label: 'Thất bại' },
};

export default function OfflineQueueScreen() {
  const [queue, setQueue] = useState<OfflineQueueItem[]>(MOCK_QUEUE);
  const [syncing, setSyncing] = useState(false);

  const pendingCount = queue.filter((i) => i.syncStatus === 'PENDING').length;
  const failedCount = queue.filter((i) => i.syncStatus === 'FAILED').length;

  const handleSyncNow = async () => {
    setSyncing(true);
    // Simulate sync delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setQueue((prev) =>
      prev.map((item) =>
        item.syncStatus === 'PENDING' || item.syncStatus === 'FAILED'
          ? {
              ...item,
              syncStatus: 'SYNCED' as SyncStatus,
              syncAttempts: item.syncAttempts + 1,
              lastSyncError: null,
              serverCheckinId: `server-${item.id}`,
            }
          : item,
      ),
    );
    setSyncing(false);
  };

  const renderItem = ({ item }: { item: OfflineQueueItem }) => {
    const statusCfg = STATUS_ICON[item.syncStatus];
    const time = new Date(item.checkedAt).toLocaleTimeString('vi-VN');

    return (
      <View style={styles.queueItem}>
        <View style={styles.queueItemLeft}>
          <View style={[styles.queueCode, { backgroundColor: statusCfg.color + '20' }]}>
            <Text style={[styles.queueCodeText, { color: statusCfg.color }]}>
              {statusCfg.code}
            </Text>
          </View>
        </View>
        <View style={styles.queueItemCenter}>
          <Text style={styles.ticketCode}>{item.ticketCode}</Text>
          <Text style={styles.ticketTime}>{time}</Text>
          {item.lastSyncError && (
            <Text style={styles.errorText}>Lỗi: {item.lastSyncError}</Text>
          )}
        </View>
        <View style={styles.queueItemRight}>
          <Text style={[styles.statusBadge, { color: statusCfg.color }]}>
            {statusCfg.label}
          </Text>
          <Text style={styles.attemptText}>
            {item.syncAttempts} lần thử
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: COLORS.warning }]}>
            {pendingCount}
          </Text>
          <Text style={styles.summaryLabel}>Chờ sync</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: COLORS.error }]}>
            {failedCount}
          </Text>
          <Text style={styles.summaryLabel}>Thất bại</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: COLORS.success }]}>
            {queue.filter((i) => i.syncStatus === 'SYNCED').length}
          </Text>
          <Text style={styles.summaryLabel}>Đã sync</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
        onPress={handleSyncNow}
        disabled={syncing}
        activeOpacity={0.8}
      >
        {syncing ? (
          <>
            <ActivityIndicator color={COLORS.text} size="small" />
            <Text style={styles.syncButtonText}> Đang sync...</Text>
          </>
        ) : (
          <Text style={styles.syncButtonText}>Đồng bộ lại ngay</Text>
        )}
      </TouchableOpacity>

      <FlatList
        data={queue}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderBottomWidth: 1,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryCount: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  syncButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.xl,
    marginVertical: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.7,
  },
  syncButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    minHeight: 88,
  },
  queueItemLeft: {
    marginRight: SPACING.md,
  },
  queueCode: {
    width: 54,
    height: 38,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueCodeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '900',
  },
  queueItemCenter: {
    flex: 1,
  },
  ticketCode: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  ticketTime: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  errorText: {
    color: COLORS.errorLight,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  queueItemRight: {
    alignItems: 'flex-end',
    maxWidth: 86,
  },
  statusBadge: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  attemptText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
});
