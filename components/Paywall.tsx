import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore, FREE_EXPORT_LIMIT, FREE_SIGN_LIMIT } from '../lib/store';
import { useTheme } from '../lib/ThemeContext';

interface Props {
  visible: boolean;
  reason: 'export' | 'sign';
  onClose: () => void;
}

const PRO_FEATURES = [
  'Unlimited PDF exports',
  'Unlimited e-signatures',
  'No watermark on exports',
  'Priority cloud sync',
  'Advanced annotation tools',
];

export default function Paywall({ visible, reason, onClose }: Props) {
  const theme = useTheme();
  const { upgradeToPro } = useStore();

  const handleUpgrade = () => {
    upgradeToPro();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.card }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={theme.subtext} />
          </TouchableOpacity>

          <View style={[styles.crownWrap, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="diamond" size={34} color={theme.primary} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>SignFlow Pro</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            {reason === 'export'
              ? `You've used all ${FREE_EXPORT_LIMIT} free exports this week.`
              : `You've used all ${FREE_SIGN_LIMIT} free signatures this week.`}
            Upgrade to keep working without limits.
          </Text>

          <View style={[styles.planCard, { borderColor: theme.primary }]}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={[styles.price, { color: theme.text }]}>$7.99</Text>
              <Text style={{ fontSize: 14, color: theme.subtext }}>/ week</Text>
            </View>
            <Text style={{ fontSize: 12, color: theme.faint, marginTop: 2 }}>
              7-day rolling period · cancel anytime
            </Text>
          </View>

          <View style={{ alignSelf: 'stretch', marginTop: 16 }}>
            {PRO_FEATURES.map((f) => (
              <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: theme.successSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={13} color={theme.success} />
                </View>
                <Text style={{ fontSize: 14, color: theme.text, flex: 1 }}>{f}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleUpgrade}
            activeOpacity={0.85}
            style={[styles.upgradeBtn, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="diamond" size={16} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>Upgrade to Pro</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={{ padding: 10 }}>
            <Text style={{ fontSize: 14, color: theme.subtext, fontWeight: '600' }}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    zIndex: 1,
  },
  crownWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  planCard: {
    alignSelf: 'stretch',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
    alignItems: 'center',
  },
  price: { fontSize: 30, fontWeight: '800' },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 20,
  },
});
