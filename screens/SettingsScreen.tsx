import React, { useState } from 'react';
import { formatDate } from '../lib/time';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore, FREE_EXPORT_LIMIT, FREE_SIGN_LIMIT, PERIOD_MS } from '../lib/store';
import { useTheme } from '../lib/ThemeContext';
import { RootStackParamList } from '../navigation/types';
import Paywall from '../components/Paywall';
import { Theme } from '../lib/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function Section({ title, theme, children }: { title: string; theme: Theme; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 22 }}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: theme.faint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>
        {title}
      </Text>
      <View style={{ backgroundColor: theme.card, borderRadius: 16, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

function Row({ theme, children, last }: { theme: Theme; children: React.ReactNode; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: theme.border }}>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { state, updateSettings, resetAll, saveSignature, deleteSignature, upgradeToPro } = useStore();
  const { settings, billing } = state;
  const [name, setName] = useState(settings.userName);
  const [email, setEmail] = useState(settings.userEmail);
  const [paywall, setPaywall] = useState(false);

  const isPro = billing.plan === 'pro';
  const periodEnds = billing.periodStart + PERIOD_MS;
  const exportsLeft = isPro ? Infinity : Math.max(0, FREE_EXPORT_LIMIT - billing.exportsUsed);
  const signsLeft = isPro ? Infinity : Math.max(0, FREE_SIGN_LIMIT - billing.signaturesUsed);

  const themeOptions: { key: typeof settings.theme; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
    { key: 'light', label: 'Light', icon: 'sunny-outline' },
    { key: 'dark', label: 'Dark', icon: 'moon-outline' },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text, letterSpacing: -0.5, marginTop: 8 }}>Settings</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: theme.card, borderRadius: 16, padding: 16 }}>
          <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '800' }}>
              {settings.userName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
            </Text>
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text }}>{settings.userName}</Text>
            <Text style={{ fontSize: 13, color: theme.subtext, marginTop: 2 }}>{settings.userEmail}</Text>
          </View>
        </View>

        <Section title="Profile" theme={theme}>
          <Row theme={theme}>
            <Text style={{ width: 70, fontSize: 14, fontWeight: '600', color: theme.subtext }}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              onEndEditing={() => updateSettings({ userName: name.trim() || settings.userName })}
              style={{ flex: 1, fontSize: 15, color: theme.text, textAlign: 'right' }}
              placeholder="Your name"
              placeholderTextColor={theme.faint}
              returnKeyType="done"
            />
          </Row>
          <Row theme={theme} last>
            <Text style={{ width: 70, fontSize: 14, fontWeight: '600', color: theme.subtext }}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              onEndEditing={() => updateSettings({ userEmail: email.trim() || settings.userEmail })}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ flex: 1, fontSize: 15, color: theme.text, textAlign: 'right' }}
              placeholder="you@company.com"
              placeholderTextColor={theme.faint}
              returnKeyType="done"
            />
          </Row>
        </Section>

        <Section title="Preferences" theme={theme}>
          <Row theme={theme}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>Auto-save versions</Text>
              <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 2 }}>Snapshot history as you edit</Text>
            </View>
            <Switch value={settings.autosave} onValueChange={(v) => updateSettings({ autosave: v })} trackColor={{ true: theme.primary }} />
          </Row>
          <Row theme={theme}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>Live activity</Text>
              <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 2 }}>Simulated collaborator updates</Text>
            </View>
            <Switch value={settings.liveActivity} onValueChange={(v) => updateSettings({ liveActivity: v })} trackColor={{ true: theme.primary }} />
          </Row>
          <Row theme={theme} last>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>Theme</Text>
              <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 2 }}>Appearance</Text>
            </View>
          </Row>
          <View style={{ flexDirection: 'row', gap: 8, padding: 12 }}>
            {themeOptions.map((o) => {
              const active = settings.theme === o.key;
              return (
                <TouchableOpacity
                  key={o.key}
                  onPress={() => updateSettings({ theme: o.key })}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: active ? theme.primary : theme.bgSoft,
                  }}
                >
                  <Ionicons name={o.icon} size={15} color={active ? '#FFFFFF' : theme.subtext} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#FFFFFF' : theme.subtext }}>{o.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        <Section title="Subscription" theme={theme}>
          <Row theme={theme}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>
                  {isPro ? 'SignFlow Pro' : 'Free plan'}
                </Text>
                {isPro && (
                  <View style={{ backgroundColor: theme.primarySoft, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: theme.primary }}>PRO</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 3 }}>
                {isPro
                  ? 'Unlimited exports & signatures'
                  : `${exportsLeft} exports · ${signsLeft} signatures left this week`}
              </Text>
            </View>
            {isPro ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                <Text style={{ fontSize: 13, color: theme.success, fontWeight: '700' }}>Active</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setPaywall(true)}
                style={{ backgroundColor: theme.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </Row>
          {!isPro && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.bgSoft, overflow: 'hidden' }}>
                <View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: theme.primary,
                    width: `${Math.min(100, (billing.exportsUsed / FREE_EXPORT_LIMIT) * 100)}%`,
                  }}
                />
              </View>
              <Text style={{ fontSize: 11, color: theme.faint, marginTop: 5 }}>
                Weekly limit resets {formatDate(periodEnds)}
              </Text>
            </View>
          )}
        </Section>

        <Section title="Broker Branding" theme={theme}>
          <Row theme={theme}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{state.broker.brokerage}</Text>
              <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 2 }}>{state.broker.license}</Text>
            </View>
            <Ionicons name="business-outline" size={18} color={theme.primary} />
          </Row>
          <Row theme={theme}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Agent</Text>
              <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 2 }}>{state.broker.agent}</Text>
            </View>
            <Text style={{ fontSize: 13, color: theme.subtext }}>{state.broker.phone}</Text>
          </Row>
          <Row theme={theme} last>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Email</Text>
              <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 2 }}>{state.broker.email}</Text>
            </View>
          </Row>
        </Section>

        <Section title="Workspace" theme={theme}>
          <TouchableOpacity onPress={() => navigation.navigate('SignatureManager')}>
            <Row theme={theme}>
              <Ionicons name="ribbon-outline" size={18} color={theme.primary} />
              <Text style={{ flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600', color: theme.text }}>My signatures</Text>
              <Text style={{ fontSize: 13, color: theme.faint }}>{state.signatures.length}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.faint} style={{ marginLeft: 4 }} />
            </Row>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('TemplateGallery')}>
            <Row theme={theme} last>
              <Ionicons name="grid-outline" size={18} color={theme.primary} />
              <Text style={{ flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600', color: theme.text }}>Template gallery</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.faint} style={{ marginLeft: 4 }} />
            </Row>
          </TouchableOpacity>
        </Section>

        <Section title="Danger zone" theme={theme}>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Reset workspace', 'This clears all documents, versions, and signatures, then restores the sample library.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: resetAll },
              ])
            }
          >
            <Row theme={theme} last>
              <Ionicons name="trash-outline" size={18} color={theme.danger} />
              <Text style={{ flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600', color: theme.danger }}>Reset workspace</Text>
            </Row>
          </TouchableOpacity>
        </Section>

        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="document-text" size={20} color={theme.primary} />
          </View>
          <Text style={{ marginTop: 8, fontSize: 14, fontWeight: '700', color: theme.text }}>SignFlow</Text>
          <Text style={{ fontSize: 12, color: theme.faint, marginTop: 2 }}>Version 1.0.0  \u00b7  PDF Editor & E-Sign</Text>
        </View>
      </ScrollView>

      <Paywall visible={paywall} reason="export" onClose={() => setPaywall(false)} />
    </SafeAreaView>
  );
}
