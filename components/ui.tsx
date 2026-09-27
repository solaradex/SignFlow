import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Theme } from '../lib/theme';

export function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  theme,
  icon,
  disabled,
  small,
}: {
  label: string;
  onPress: () => void;
  theme: Theme;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        styles.primaryBtn,
        small && { paddingVertical: 8, paddingHorizontal: 12 },
        { backgroundColor: disabled ? theme.border : theme.primary },
      ]}
    >
      {icon && <Ionicons name={icon} size={small ? 15 : 17} color={disabled ? theme.faint : theme.primaryText} />}
      <Text style={[styles.primaryBtnText, small && { fontSize: 13 }, { color: disabled ? theme.faint : theme.primaryText }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function GhostButton({
  label,
  onPress,
  theme,
  icon,
  danger,
  small,
}: {
  label: string;
  onPress: () => void;
  theme: Theme;
  icon?: keyof typeof Ionicons.glyphMap;
  danger?: boolean;
  small?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.ghostBtn,
        small && { paddingVertical: 8, paddingHorizontal: 12 },
        { borderColor: danger ? theme.danger : theme.border, backgroundColor: theme.card },
      ]}
    >
      {icon && <Ionicons name={icon} size={small ? 15 : 17} color={danger ? theme.danger : theme.text} />}
      <Text style={[styles.ghostBtnText, small && { fontSize: 13 }, { color: danger ? theme.danger : theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  theme: Theme;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 }}>
      <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={32} color={theme.primary} />
      </View>
      <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text, marginTop: 16 }}>{title}</Text>
      <Text style={{ fontSize: 14, color: theme.subtext, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>{subtitle}</Text>
    </View>
  );
}

export function SyncIndicator({ status, theme }: { status: 'idle' | 'saving' | 'saved'; theme: { primary: string; success: string; subtext: string } }) {
  if (status === 'saving') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <PulsingDot color={theme.primary} />
        <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '600' }}>Saving...</Text>
      </View>
    );
  }
  if (status === 'saved') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Ionicons name="cloud-done" size={14} color={theme.success} />
        <Text style={{ fontSize: 12, color: theme.success, fontWeight: '600' }}>Synced</Text>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Ionicons name="cloud-offline" size={14} color={theme.subtext} />
      <Text style={{ fontSize: 12, color: theme.subtext, fontWeight: '600' }}>Offline</Text>
    </View>
  );
}

function PulsingDot({ color }: { color: string }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = 1;
    opacity.value = withRepeat(withTiming(0.25, { duration: 700 }), -1, true);
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700' },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
  },
  ghostBtnText: { fontSize: 15, fontWeight: '600' },
});
