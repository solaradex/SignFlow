import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../lib/store';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../lib/ThemeContext';
import { RootStackParamList } from '../navigation/types';
import { Annotation, DocPage, SignatureData, Tool } from '../lib/types';
import { ANNOTATION_COLORS, STATUS_META } from '../lib/theme';
import { Badge, GhostButton, PrimaryButton, SyncIndicator } from '../components/ui';
import PdfPageView from '../components/PdfPageView';
import { uid } from '../lib/utils';
import { exportDocumentPdf } from '../lib/export';
import Paywall from '../components/Paywall';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type EditorRoute = RouteProp<RootStackParamList, 'Editor'>;

const SCREEN_W = Dimensions.get('window').width;
const BASE_PAGE_W = SCREEN_W - 32;

const TOOLS: { key: Tool; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'select', label: 'Select', icon: 'scan-outline' },
  { key: 'highlight', label: 'Highlight', icon: 'color-fill-outline' },
  { key: 'draw', label: 'Draw', icon: 'pencil-outline' },
  { key: 'text', label: 'Note', icon: 'text-outline' },
  { key: 'signature', label: 'Sign', icon: 'ribbon-outline' },
  { key: 'erase', label: 'Erase', icon: 'backspace-outline' },
];

export default function EditorScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<EditorRoute>();
  const { docId } = route.params;
  const { state, getDocument, updateDocument, logActivity, dismissRemoteUpdate, canExport, consumeExport, requestSignature } = useStore();

  const doc = state.documents.find((d) => d.id === docId);
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState(ANNOTATION_COLORS[0]);
  const [zoom, setZoom] = useState(1);
  const [pageIndex, setPageIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [textModal, setTextModal] = useState<{ x: number; y: number } | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [sigPicker, setSigPicker] = useState<{ x: number; y: number } | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const historyRef = useRef<DocPage[][]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<FlatList<DocPage>>(null);

  const pageWidth = BASE_PAGE_W * zoom;
  const statusMeta = doc ? STATUS_META[doc.status] : STATUS_META.draft;
  const remote = state.remoteUpdate?.docId === docId ? state.remoteUpdate : null;

  const mutate = useCallback(
    (pages: DocPage[], note: string) => {
      if (!doc) return;
      historyRef.current.push(doc.pages);
      if (historyRef.current.length > 50) historyRef.current.shift();
      if (!state.settings.autosave) {
        updateDocument({ ...doc, pages, updatedAt: Date.now() }, note);
        setSaveStatus('saved');
        return;
      }
      setSaveStatus('saving');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const fresh = getDocument(docId);
        if (fresh) updateDocument({ ...fresh, pages, updatedAt: Date.now() }, note);
        setSaveStatus('saved');
      }, 800);
    },
    [doc, docId, getDocument, state.settings.autosave, updateDocument]
  );

  const addAnnotation = useCallback(
    (a: Annotation) => {
      if (!doc) return;
      const pages = doc.pages.map((p, i) =>
        i === a.page ? { ...p, annotations: [...p.annotations, a] } : p
      );
      const notes: Record<string, string> = {
        highlight: 'Added a highlight',
        draw: ' Drew an annotation',
        text: 'Added a text note',
        signature: 'Placed a signature',
      };
      mutate(pages, `${notes[a.type] ?? 'Edited'} on page ${a.page + 1}`);
      logActivity({ documentId: doc.id, documentTitle: doc.title, type: 'edited', actor: 'You', message: notes[a.type]?.toLowerCase() ?? 'edited the document' });
    },
    [doc, mutate, logActivity]
  );

  const deleteAnnotation = useCallback(
    (id: string) => {
      if (!doc) return;
      const pages = doc.pages.map((p) => ({
        ...p,
        annotations: p.annotations.filter((a) => a.id !== id),
      }));
      mutate(pages, 'Removed an annotation');
    },
    [doc, mutate]
  );

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev || !doc) return;
    updateDocument({ ...doc, pages: prev, updatedAt: Date.now() }, 'Undo');
    setSaveStatus('saved');
  }, [doc, updateDocument]);

  const handleExport = async () => {
    if (!doc) return;
    if (!canExport()) {
      setPaywall(true);
      return;
    }
    consumeExport();
    const footer = `${state.broker.brokerage}  \u00b7  ${state.broker.license}  \u00b7  ${state.broker.phone}`;
    const res = await exportDocumentPdf(doc, footer);
    logActivity({
      documentId: doc.id,
      documentTitle: doc.title,
      type: 'exported',
      actor: 'You',
      message: 'exported the document as PDF',
    });
    Alert.alert(res.ok ? 'Export complete' : 'Export failed', res.message);
  };

  const commitTextNote = () => {
    if (!textModal || !noteDraft.trim() || !doc) return;
    const a: Annotation = {
      id: uid(),
      type: 'text',
      page: pageIndex,
      x: Math.min(textModal.x, 612 - 130),
      y: Math.min(textModal.y, 792 - 60),
      w: 120,
      h: 26 + Math.ceil(noteDraft.trim().length / 18) * 12,
      color: '#FACC15',
      text: noteDraft.trim(),
      author: 'You',
      createdAt: Date.now(),
    };
    addAnnotation(a);
    setTextModal(null);
    setNoteDraft('');
  };

  const placeSignature = (sig: SignatureData) => {
    if (!sigPicker) return;
    const w = 170;
    const h = 68;
    const a: Annotation = {
      id: uid(),
      type: 'signature',
      page: pageIndex,
      x: Math.min(sigPicker.x - w / 2, 612 - w),
      y: Math.min(sigPicker.y - h / 2, 792 - h),
      w,
      h,
      color: sig.color,
      points: sig.points.map((p) => ({ x: p.x * w, y: p.y * h })),
      author: 'You',
      createdAt: Date.now(),
    };
    addAnnotation(a);
    setSigPicker(null);
  };

  if (!doc) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.text, fontSize: 16 }}>Document not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.bgSoft }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.headerBg }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 6 }}>
          <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>
            {doc.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Badge label={statusMeta.label} color={statusMeta.color} bg={statusMeta.bg} />
            <Text style={{ fontSize: 11, color: theme.faint }}>v{state.versions[doc.id]?.length ? state.versions[doc.id][0].version : 1}</Text>
          </View>
        </View>
        <SyncIndicator status={saveStatus} theme={theme} />
        <TouchableOpacity onPress={() => navigation.navigate('Versions', { docId: doc.id })} style={{ padding: 8 }}>
          <Ionicons name="time-outline" size={20} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleExport} style={{ padding: 8 }}>
          <Ionicons name="share-outline" size={20} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            doc.status === 'signed'
              ? navigation.navigate('Certificate', { docId: doc.id })
              : navigation.navigate('Sign', { docId: doc.id })
          }
          style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
        >
          <Ionicons name="pencil" size={14} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
            {doc.status === 'signed' ? 'Certificate' : 'Sign'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Remote update banner */}
      {remote && (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.warningSoft, paddingHorizontal: 14, paddingVertical: 8 }}>
          <Ionicons name="cloud-download-outline" size={15} color={theme.warning} />
          <Text style={{ flex: 1, marginLeft: 8, fontSize: 12, color: theme.warning, fontWeight: '600' }}>
            {remote.message}
          </Text>
          <TouchableOpacity onPress={dismissRemoteUpdate}>
            <Ionicons name="close" size={16} color={theme.warning} />
          </TouchableOpacity>
        </View>
      )}

      {/* Pages */}
      <View style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={doc.pages}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setPageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))}
          renderItem={({ item, index }) => (
            <View style={{ width: SCREEN_W, alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                <PdfPageView
                  page={item}
                  pageIndex={index}
                  width={pageWidth}
                  theme={theme}
                  tool={tool}
                  annotateColor={color}
                  onAddAnnotation={addAnnotation}
                  onDeleteAnnotation={deleteAnnotation}
                  onRequestText={(x, y) => setTextModal({ x, y })}
                  onRequestSignature={(x, y) => setSigPicker({ x, y })}
                />
              </ScrollView>
            </View>
          )}
        />
      </View>

      {/* Page indicator + zoom */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 6 }}>
        <TouchableOpacity onPress={() => setZoom((z) => Math.max(1, z - 0.25))} style={{ padding: 6 }}>
          <Ionicons name="remove-circle-outline" size={22} color={zoom > 1 ? theme.primary : theme.faint} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
          {doc.pages.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === pageIndex ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === pageIndex ? theme.primary : theme.border,
              }}
            />
          ))}
        </View>
        <Text style={{ fontSize: 12, color: theme.subtext, fontWeight: '600' }}>
          {pageIndex + 1} / {doc.pages.length}
        </Text>
        <TouchableOpacity onPress={() => setZoom((z) => Math.min(2, z + 0.25))} style={{ padding: 6 }}>
          <Ionicons name="add-circle-outline" size={22} color={zoom < 2 ? theme.primary : theme.faint} />
        </TouchableOpacity>
      </View>

      {/* Toolbar */}
      <View style={{ backgroundColor: theme.headerBg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8, alignItems: 'center' }}>
          {TOOLS.map((t) => {
            const active = tool === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTool(t.key)}
                style={{
                  alignItems: 'center',
                  paddingVertical: 7,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: active ? theme.primary : theme.bgSoft,
                  minWidth: 64,
                }}
              >
                <Ionicons name={t.icon} size={19} color={active ? '#FFFFFF' : theme.subtext} />
                <Text style={{ fontSize: 10, fontWeight: '700', marginTop: 3, color: active ? '#FFFFFF' : theme.subtext }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <View style={{ width: 1, height: 36, backgroundColor: theme.border, marginHorizontal: 4 }} />
          {ANNOTATION_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setColor(c)}
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: c,
                borderWidth: color === c ? 3 : 0,
                borderColor: theme.text,
              }}
            />
          ))}
          <View style={{ width: 1, height: 36, backgroundColor: theme.border, marginHorizontal: 4 }} />
          <TouchableOpacity onPress={undo} disabled={historyRef.current.length === 0} style={{ padding: 8 }}>
            <Ionicons name="arrow-undo-outline" size={21} color={historyRef.current.length ? theme.primary : theme.faint} />
          </TouchableOpacity>
          <View style={{ width: 1, height: 36, backgroundColor: theme.border, marginHorizontal: 4 }} />
          <TouchableOpacity onPress={() => setRequestModal(true)} style={{ padding: 8 }}>
            <Ionicons name="paper-plane-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Text note modal */}
      <Modal visible={!!textModal} transparent animationType="fade" onRequestClose={() => setTextModal(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 16, width: '100%' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 10 }}>Add note</Text>
            <TextInput
              autoFocus
              multiline
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder="Type your note..."
              placeholderTextColor={theme.faint}
              style={{ minHeight: 80, fontSize: 15, color: theme.text, backgroundColor: theme.bgSoft, borderRadius: 10, padding: 12, textAlignVertical: 'top' }}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <View style={{ flex: 1 }}>
                <GhostButton label="Cancel" onPress={() => { setTextModal(null); setNoteDraft(''); }} theme={theme} />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Place note" onPress={commitTextNote} theme={theme} disabled={!noteDraft.trim()} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Request signature modal */}
      <Modal visible={requestModal} transparent animationType="fade" onRequestClose={() => setRequestModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 16, width: '100%' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 4 }}>Request signature</Text>
            <Text style={{ fontSize: 12, color: theme.subtext, marginBottom: 12 }}>
              Send {doc.title} to a recipient for e-signature.
            </Text>
            <TextInput
              value={reqName}
              onChangeText={setReqName}
              placeholder="Recipient name"
              placeholderTextColor={theme.faint}
              style={{ fontSize: 15, color: theme.text, backgroundColor: theme.bgSoft, borderRadius: 10, padding: 12, marginBottom: 8 }}
            />
            <TextInput
              value={reqEmail}
              onChangeText={setReqEmail}
              placeholder="Recipient email"
              placeholderTextColor={theme.faint}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ fontSize: 15, color: theme.text, backgroundColor: theme.bgSoft, borderRadius: 10, padding: 12, marginBottom: 14 }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <GhostButton label="Cancel" onPress={() => setRequestModal(false)} theme={theme} />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label="Send request"
                  icon="paper-plane"
                  theme={theme}
                  disabled={!reqName.trim() || !reqEmail.trim()}
                  onPress={() => {
                    requestSignature(doc.id, reqName.trim(), reqEmail.trim());
                    setRequestModal(false);
                    setReqName('');
                    setReqEmail('');
                    Alert.alert('Request sent', `Signature request sent to ${reqEmail}.`);
                  }}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Signature picker modal */}
      <Modal visible={!!sigPicker} transparent animationType="slide" onRequestClose={() => setSigPicker(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text, marginBottom: 4 }}>Choose signature</Text>
            <Text style={{ fontSize: 13, color: theme.subtext, marginBottom: 14 }}>Tap where you placed the marker to stamp your signature.</Text>
            {state.signatures.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ color: theme.subtext, marginBottom: 14 }}>No saved signatures yet.</Text>
                <PrimaryButton
                  label="Create signature"
                  icon="add"
                  theme={theme}
                  onPress={() => {
                    setSigPicker(null);
                    navigation.navigate('SignatureManager');
                  }}
                />
              </View>
            ) : (
              state.signatures.map((sig) => (
                <TouchableOpacity
                  key={sig.id}
                  onPress={() => placeSignature(sig)}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bgSoft, borderRadius: 12, padding: 12, marginBottom: 8 }}
                >
                  <View style={{ width: 120, height: 48, backgroundColor: '#FFFFFF', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                    <SvgPreview points={sig.points} color={sig.color} width={100} height={38} />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>{sig.name}</Text>
                    <Text style={{ fontSize: 12, color: theme.faint }}>Saved signature</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                </TouchableOpacity>
              ))
            )}
            <View style={{ marginTop: 8 }}>
              <GhostButton label="Cancel" onPress={() => setSigPicker(null)} theme={theme} />
            </View>
          </View>
        </View>
      </Modal>

      <Paywall visible={paywall} reason="export" onClose={() => setPaywall(false)} />
    </SafeAreaView>
  );
}

function SvgPreview({ points, color, width, height }: { points: { x: number; y: number }[]; color: string; width: number; height: number }) {
  if (!points || points.length < 2) return null;
  let d = `M ${(points[0].x * width).toFixed(1)} ${(points[0].y * height).toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${(points[i].x * width).toFixed(1)} ${(points[i].y * height).toFixed(1)}`;
  }
  return (
    <Svg width={width} height={height}>
      <Path d={d} stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

