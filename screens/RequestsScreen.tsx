import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/ThemeContext';
import { RootStackParamList } from '../navigation/types';
import { SignRequest } from '../lib/types';
import { EmptyState } from '../components/ui';
import { formatRelative } from '../lib/time';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  sent: { label: 'Sent', color: '#C77E1F', bg: '#F8ECD4', icon: 'paper-plane' },
  viewed: { label: 'Viewed', color: '#0E5F6B', bg: '#E2EFF1', icon: 'eye' },
  signed: { label: 'Signed', color: '#1E7F4F', bg: '#DCF0E4', icon: 'checkmark-circle' },
};

export default function RequestsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { state } = useStore();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const renderReq = ({ item }: { item: SignRequest }) => {
    const meta = STATUS_META[item.status] ?? STATUS_META.sent;
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('Editor', { docId: item.documentId })}
        style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon as any} size={20} color={meta.color} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>
            {item.documentTitle}
          </Text>
          <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 2 }}>
            {item.recipientName}  \u00b7  {item.recipientEmail}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <View style={{ backgroundColor: meta.bg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: meta.color }}>{meta.label.toUpperCase()}</Text>
            </View>
            <Text style={{ fontSize: 11, color: theme.faint }}>{formatRelative(item.sentAt, now)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.faint} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text, letterSpacing: -0.5 }}>
          Signature Requests
        </Text>
        <Text style={{ fontSize: 13, color: theme.subtext, marginTop: 2 }}>
          Track outgoing e-sign requests
        </Text>
      </View>

      <FlatList
        data={state.signRequests}
        keyExtractor={(r) => r.id}
        renderItem={renderReq}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 100 }}
        ListEmptyComponent={
          <EmptyState
            icon="paper-plane-outline"
            title="No requests yet"
            subtitle="Open a document and tap the send icon to request a signature."
            theme={theme}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
