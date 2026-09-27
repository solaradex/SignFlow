import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/ThemeContext';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton, GhostButton } from '../components/ui';
import { formatDateTime } from '../lib/time';
import { exportDocumentPdf } from '../lib/export';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type CertRoute = RouteProp<RootStackParamList, 'Certificate'>;

export default function CertificateScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<CertRoute>();
  const { docId } = route.params;
  const { state, logActivity } = useStore();
  const doc = state.documents.find((d) => d.id === docId);

  if (!doc) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.text }}>Document not found</Text>
      </SafeAreaView>
    );
  }

  const handleExport = async () => {
    const res = await exportDocumentPdf(doc);
    logActivity({
      documentId: doc.id,
      documentTitle: doc.title,
      type: 'exported',
      actor: 'You',
      message: 'exported the signed document as PDF',
    });
    Alert.alert(res.ok ? 'Export complete' : 'Export failed', res.message);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text, marginLeft: 4 }}>Signing certificate</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: theme.shadow, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.successSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="ribbon" size={34} color={theme.success} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text, marginTop: 14 }}>Document signed</Text>
          <Text style={{ fontSize: 13, color: theme.subtext, marginTop: 4, textAlign: 'center' }}>
            This document was signed electronically and is legally binding.
          </Text>

          <View style={{ alignSelf: 'stretch', marginTop: 20, backgroundColor: theme.bgSoft, borderRadius: 14, padding: 14 }}>
            <CertRow label="Document" value={doc.title} theme={theme} />
            <CertRow label="Signed by" value={doc.signedBy ?? 'Unknown'} theme={theme} />
            <CertRow label="Signed at" value={doc.signedAt ? formatDateTime(doc.signedAt) : 'Unknown'} theme={theme} />
            <CertRow label="Status" value="Completed" theme={theme} valueColor={theme.success} />
          </View>

          <View style={{ alignSelf: 'stretch', marginTop: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: theme.faint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Document hash (tamper-evident fingerprint)
            </Text>
            <View style={{ backgroundColor: theme.bgSoft, borderRadius: 10, padding: 12 }}>
              <Text style={{ fontFamily: 'monospace', fontSize: 11, color: theme.subtext, lineHeight: 16 }}>
                {doc.certificateHash ?? 'N/A'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 }}>
            <Ionicons name="shield-checkmark" size={15} color={theme.success} />
            <Text style={{ fontSize: 12, color: theme.success, fontWeight: '600' }}>
              Tamper-evident  \u00b7  ESIGN & eIDAS compliant
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
          <View style={{ flex: 1 }}>
            <GhostButton label="Back to library" onPress={() => navigation.popToTop()} theme={theme} />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton label="Export signed PDF" icon="share-outline" theme={theme} onPress={handleExport} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CertRow({ label, value, theme, valueColor }: { label: string; value: string; theme: any; valueColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ fontSize: 13, color: theme.subtext }}>{label}</Text>
      <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: valueColor ?? theme.text, maxWidth: '65%' }}>
        {value}
      </Text>
    </View>
  );
}
