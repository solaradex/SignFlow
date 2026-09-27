import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/ThemeContext';
import { RootStackParamList } from '../navigation/types';
import { DocStatus, PdfDocument } from '../lib/types';
import { DOC_TYPE_META, STATUS_META } from '../lib/theme';
import { Badge, EmptyState } from '../components/ui';
import PdfPageView from '../components/PdfPageView';
import { formatRelative } from '../lib/time';
import { buildImportedDocument } from '../lib/import';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FILTERS: { key: 'all' | DocStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Drafts' },
  { key: 'pending', label: 'Pending' },
  { key: 'signed', label: 'Signed' },
];

export default function DocumentsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { state, addDocument, deleteDocument, logActivity } = useStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | DocStatus>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const docs = useMemo(() => {
    let list = [...state.documents].sort((a, b) => b.updatedAt - a.updatedAt);
    if (filter !== 'all') list = list.filter((d) => d.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (d) => d.title.toLowerCase().includes(q) || d.parties.some((p) => p.toLowerCase().includes(q))
      );
    }
    return list;
  }, [state.documents, filter, query]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      logActivity({
        documentId: 'library',
        documentTitle: 'Document library',
        type: 'status',
        actor: 'You',
        message: 'synced the library with the server',
      });
      setRefreshing(false);
      setNow(Date.now());
    }, 900);
  };

  const handleImport = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
      if (res.canceled) return;
      const asset = res.assets[0];
      let text: string | undefined;
      if (asset.name?.toLowerCase().endsWith('.txt') || asset.mimeType === 'text/plain') {
        try {
          text = await (await fetch(asset.uri)).text();
        } catch {
          text = undefined;
        }
      }
      const doc = buildImportedDocument(asset.name ?? 'Imported document', asset.size ?? 0, text);
      addDocument(doc, `imported "${asset.name}"`);
      navigation.navigate('Editor', { docId: doc.id });
    } catch {
      Alert.alert('Import failed', 'This file could not be imported.');
    }
  };

  const handleLongPress = (doc: PdfDocument) => {
    Alert.alert(doc.title, undefined, [
      {
        text: 'Export PDF',
        onPress: () => navigation.navigate('Editor', { docId: doc.id }),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete document', 'This will permanently remove the document and its versions.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteDocument(doc.id) },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderDoc = ({ item }: { item: PdfDocument }) => {
    const typeMeta = DOC_TYPE_META[item.type] ?? DOC_TYPE_META.imported;
    const statusMeta = STATUS_META[item.status];
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('Editor', { docId: item.id })}
        onLongPress={() => handleLongPress(item)}
        style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
      >
        <View style={[styles.thumbWrap, { backgroundColor: theme.bgSoft }]}>
          <PdfPageView
            page={item.pages[0]}
            pageIndex={0}
            width={96}
            theme={theme}
            tool="select"
            annotateColor="#FACC15"
            readOnly
            onAddAnnotation={() => {}}
            onDeleteAnnotation={() => {}}
            onRequestText={() => {}}
            onRequestSignature={() => {}}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text numberOfLines={2} style={[styles.cardTitle, { color: theme.text }]}>
            {item.title}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Badge label={typeMeta.label} color={typeMeta.color} bg={theme.primarySoft} />
            <Badge label={statusMeta.label} color={statusMeta.color} bg={statusMeta.bg} />
          </View>
          <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 8 }}>
            {item.pages.length} page{item.pages.length === 1 ? '' : 's'}  \u00b7  {item.fileSize}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 5 }}>
            <Ionicons name="time-outline" size={12} color={theme.faint} />
            <Text style={{ fontSize: 12, color: theme.faint }}>{formatRelative(item.updatedAt, now)}</Text>
            {item.status === 'signed' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 8 }}>
                <Ionicons name="checkmark-circle" size={12} color={theme.success} />
                <Text style={{ fontSize: 12, color: theme.success, fontWeight: '600' }}>Signed</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.faint} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Broker branding header */}
      <View style={[styles.brandHeader, { backgroundColor: theme.primary }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="business" size={14} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>
              {state.broker.brokerage}
            </Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 }}>
            {state.broker.license}  \u00b7  {state.broker.agent}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('TemplateGallery')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
        >
          <Ionicons name="grid-outline" size={15} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Templates</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Documents</Text>
          <Text style={{ fontSize: 13, color: theme.subtext, marginTop: 2 }}>
            {state.documents.length} files  \u00b7  auto-sync on
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleImport}
          style={[styles.importBtn, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
        >
          <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Import</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search" size={16} color={theme.faint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search documents or parties..."
          placeholderTextColor={theme.faint}
          style={[styles.searchInput, { color: theme.text }]}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={16} color={theme.faint} />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 4 }}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.primary : theme.card,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#FFFFFF' : theme.subtext }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={docs}
        keyExtractor={(d) => d.id}
        renderItem={renderDoc}
        contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="documents-outline"
            title={query || filter !== 'all' ? 'No matches' : 'No documents yet'}
            subtitle={
              query || filter !== 'all'
                ? 'Try a different search or filter.'
                : 'Import a PDF or text file to get started with editing and e-signatures.'
            }
            theme={theme}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  thumbWrap: {
    borderRadius: 8,
    overflow: 'hidden',
    width: 96,
  },
  cardTitle: { fontSize: 15, fontWeight: '700' },
});
