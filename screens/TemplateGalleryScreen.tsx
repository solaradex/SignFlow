import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
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
import { TemplateItem, TemplatePack } from '../lib/types';
import Paywall from '../components/Paywall';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TemplateGalleryScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { state, templatePacks, createFromTemplate } = useStore();
  const [paywall, setPaywall] = useState(false);
  const isPro = state.billing.plan === 'pro';

  const handleUse = (tpl: TemplateItem) => {
    if (tpl.pro && !isPro) {
      setPaywall(true);
      return;
    }
    const doc = createFromTemplate(tpl);
    navigation.goBack();
    setTimeout(() => navigation.navigate('Editor', { docId: doc.id }), 100);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 4 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text }}>Template Gallery</Text>
          <Text style={{ fontSize: 12, color: theme.subtext }}>Florida real estate forms</Text>
        </View>
        {!isPro && (
          <TouchableOpacity
            onPress={() => setPaywall(true)}
            style={{ backgroundColor: theme.coral, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5 }}
          >
            <Ionicons name="diamond" size={13} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>PRO</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {templatePacks.map((pack: TemplatePack) => (
          <View key={pack.id} style={{ marginBottom: 22 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>{pack.name}</Text>
                <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 1 }}>{pack.description}</Text>
              </View>
              {pack.pro && (
                <View style={{ backgroundColor: theme.coralSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="diamond" size={10} color={theme.coral} />
                  <Text style={{ fontSize: 10, fontWeight: '800', color: theme.coral }}>PRO</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {pack.templates.map((tpl) => (
                <TouchableOpacity
                  key={tpl.id}
                  activeOpacity={0.9}
                  onPress={() => handleUse(tpl)}
                  style={[styles.tplCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
                >
                  <View style={[styles.tplIcon, { backgroundColor: tpl.pro ? theme.coralSoft : theme.primarySoft }]}>
                    <Ionicons name={tpl.icon as any} size={22} color={tpl.pro ? theme.coral : theme.primary} />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginTop: 10 }}>
                    {tpl.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 2 }} numberOfLines={2}>
                    {tpl.description}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 }}>
                    {tpl.pro ? (
                      <>
                        <Ionicons name="lock-closed" size={11} color={theme.coral} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.coral }}>Pro</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={11} color={theme.success} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.success }}>Free</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <Paywall visible={paywall} reason="export" onClose={() => setPaywall(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tplCard: {
    width: '47%',
    borderRadius: 16,
    padding: 14,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  tplIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
