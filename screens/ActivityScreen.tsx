import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/ThemeContext';
import { ActivityEvent, ActivityType } from '../lib/types';
import { dayLabel, formatRelative, formatTime } from '../lib/time';
import { EmptyState } from '../components/ui';

const TYPE_META: Record<ActivityType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  created: { icon: 'document-outline', color: '#4F46E5' },
  edited: { icon: 'create-outline', color: '#0E7490' },
  signed: { icon: 'ribbon-outline', color: '#16A34A' },
  viewed: { icon: 'eye-outline', color: '#64748B' },
  commented: { icon: 'chatbubble-outline', color: '#D97706' },
  shared: { icon: 'share-social-outline', color: '#7C3AED' },
  version: { icon: 'git-branch-outline', color: '#0E7490' },
  imported: { icon: 'cloud-download-outline', color: '#475569' },
  exported: { icon: 'cloud-upload-outline', color: '#15803D' },
  status: { icon: 'swap-horizontal-outline', color: '#B45309' },
  requested: { icon: 'paper-plane-outline', color: '#0E5F6B' },
};

type Row = { kind: 'header'; id: string; label: string } | { kind: 'event'; id: string; event: ActivityEvent };

export default function ActivityScreen() {
  const theme = useTheme();
  const { state } = useStore();
  const [now, setNow] = React.useState(Date.now());
  const pulse = useSharedValue(1);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 20000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    pulse.value = 1;
    pulse.value = withRepeat(withTiming(0.3, { duration: 900 }), -1, true);
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let lastDay = '';
    for (const ev of state.activity) {
      const day = dayLabel(ev.timestamp, now);
      if (day !== lastDay) {
        out.push({ kind: 'header', id: `h-${day}`, label: day });
        lastDay = day;
      }
      out.push({ kind: 'event', id: ev.id, event: ev });
    }
    return out;
  }, [state.activity, now]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text, letterSpacing: -0.5 }}>Activity</Text>
          <Text style={{ fontSize: 13, color: theme.subtext, marginTop: 2 }}>Real-time updates across your documents</Text>
        </View>
        {state.settings.liveActivity && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.successSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 }}>
            <Animated.View style={[{ width: 7, height: 7, borderRadius: 4, backgroundColor: theme.success }, pulseStyle]} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.success }}>LIVE</Text>
          </View>
        )}
      </View>

      <Animated.FlatList
        entering={FadeInDown.duration(300)}
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 100 }}
        renderItem={({ item }) => {
          if (item.kind === 'header') {
            return (
              <Text style={{ fontSize: 12, fontWeight: '800', color: theme.faint, textTransform: 'uppercase', letterSpacing: 1, marginTop: 14, marginBottom: 8 }}>
                {item.label}
              </Text>
            );
          }
          const ev = item.event;
          const meta = TYPE_META[ev.type];
          return (
            <View style={{ flexDirection: 'row', backgroundColor: theme.card, borderRadius: 14, padding: 12, marginBottom: 8, shadowColor: theme.shadow, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={meta.icon} size={18} color={meta.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontSize: 14, color: theme.text, fontWeight: '600' }}>
                  {ev.actor} <Text style={{ fontWeight: '400', color: theme.subtext }}>{ev.message}</Text>
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 12, color: theme.faint, marginTop: 3 }}>
                  {ev.documentTitle}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, color: theme.faint }}>{formatTime(ev.timestamp)}</Text>
                <Text style={{ fontSize: 11, color: theme.faint }}>{formatRelative(ev.timestamp, Date.now())}</Text>
                {ev.remote && (
                  <View style={{ backgroundColor: theme.bgSoft, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: theme.subtext }}>REMOTE</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon="pulse-outline" title="No activity yet" subtitle="Actions on your documents will appear here in real time." theme={theme} />
        }
      />
    </SafeAreaView>
  );
}
