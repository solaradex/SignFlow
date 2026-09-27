import React from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/ThemeContext';
import { RootStackParamList } from '../navigation/types';
import { EmptyState, GhostButton } from '../components/ui';
import { formatDateTime, formatRelative } from '../lib/time';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type VersionsRoute = RouteProp<RootStackParamList, 'Versions'>;

export default function VersionsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<VersionsRoute>();
  const { docId } = route.params;
  const { state, restoreVersion, updateDocument } = useStore();

  const doc = state.documents.find((d) => d.id === docId);
  const versions = state.versions[docId] ?? [];

  if (!doc) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.text }}>Document not found</Text>
      </SafeAreaView>
    );
  }

  const handleRestore = (versionId: string) => {
    const v = versions.find((x) => x.id === versionId);
    if (!v) return;
    Alert.alert('Restore version', `Restore version ${v.version} ("${v.note}")? Current edits will be snapshotted first.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        onPress: () => {
          updateDocument({ ...doc, pages: v.pages, updatedAt: Date.now() }, `Restored version ${v.version}`);
          restoreVersion(doc.id, v);
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 4 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text }}>Version history</Text>
          <Text numberOfLines={1} style={{ fontSize: 12, color: theme.subtext }}>
            {doc.title}
          </Text>
        </View>
      </View>

      <FlatList
        data={versions}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item, index }) => (
          <View style={{ flexDirection: 'row', backgroundColor: theme.card, borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: theme.shadow, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 }}>
            <View style={{ alignItems: 'center', marginRight: 12 }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: index === 0 ? theme.primary : theme.bgSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: index === 0 ? '#FFFFFF' : theme.subtext }}>
                  v{item.version}
                </Text>
              </View>
              {index < versions.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: theme.border, marginTop: 4 }} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>{item.note}</Text>
              <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 3 }}>
                {formatDateTime(item.timestamp)}  \u00b7  {formatRelative(item.timestamp)}
              </Text>
              <Text style={{ fontSize: 12, color: theme.faint, marginTop: 2 }}>
                {item.annotationCount} annotation{item.annotationCount === 1 ? '' : 's'}
              </Text>
              {index > 0 && (
                <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                  <GhostButton small label="Restore" icon="refresh-outline" theme={theme} onPress={() => handleRestore(item.id)} />
                </View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState icon="git-branch-outline" title="No versions yet" subtitle="Versions are created automatically as you edit and save." theme={theme} />
        }
      />
    </SafeAreaView>
  );
}
