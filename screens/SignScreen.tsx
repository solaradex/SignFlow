import React, { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/ThemeContext';
import { RootStackParamList } from '../navigation/types';
import { Annotation, Pt, SignatureData } from '../lib/types';
import { PrimaryButton } from '../components/ui';
import PdfPageView, { pointsToPath } from '../components/PdfPageView';
import Paywall from '../components/Paywall';
import { uid } from '../lib/utils';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SignRoute = RouteProp<RootStackParamList, 'Sign'>;

const SCREEN_W = Dimensions.get('window').width;
const PAGE_W = SCREEN_W - 32;

interface Placement {
  id: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  points: Pt[];
  color: string;
}

export default function SignScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<SignRoute>();
  const { docId } = route.params;
  const { state, updateDocument, signDocument, logActivity, canSign, consumeSignature } = useStore();

  const doc = state.documents.find((d) => d.id === docId);
  const [selectedSig, setSelectedSig] = useState<SignatureData | null>(state.signatures[0] ?? null);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [consent, setConsent] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [paywall, setPaywall] = useState(false);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const x = locationX / (PAGE_W / 612);
          const y = locationY / (PAGE_W / 612);
          const hit = placements.find(
            (p) => p.page === pageIndex && x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h
          );
          if (hit) {
            dragRef.current = { id: hit.id, dx: x - hit.x, dy: y - hit.y };
          } else if (selectedSig) {
            const w = 170;
            const h = 68;
            const placement: Placement = {
              id: uid(),
              page: pageIndex,
              x: Math.max(0, Math.min(x - w / 2, 612 - w)),
              y: Math.max(0, Math.min(y - h / 2, 792 - h)),
              w,
              h,
              points: selectedSig.points.map((p) => ({ x: p.x * w, y: p.y * h })),
              color: selectedSig.color,
            };
            setPlacements((prev) => [...prev, placement]);
          }
        },
        onPanResponderMove: (evt) => {
          if (!dragRef.current) return;
          const { locationX, locationY } = evt.nativeEvent;
          const x = locationX / (PAGE_W / 612);
          const y = locationY / (PAGE_W / 612);
          setPlacements((prev) =>
            prev.map((p) =>
              p.id === dragRef.current!.id
                ? {
                    ...p,
                    x: Math.max(0, Math.min(x - dragRef.current!.dx, 612 - p.w)),
                    y: Math.max(0, Math.min(y - dragRef.current!.dy, 792 - p.h)),
                  }
                : p
            )
          );
        },
        onPanResponderRelease: () => {
          dragRef.current = null;
        },
      }),
    [placements, selectedSig, pageIndex]
  );

  if (!doc) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.text }}>Document not found</Text>
      </SafeAreaView>
    );
  }

  const scale = PAGE_W / 612;

  const handleSign = () => {
    if (!selectedSig || placements.length === 0 || !consent) return;
    if (!canSign()) {
      setPaywall(true);
      return;
    }
    consumeSignature();
    const annotations: Annotation[] = placements.map((p) => ({
      id: uid(),
      type: 'signature',
      page: p.page,
      x: p.x,
      y: p.y,
      w: p.w,
      h: p.h,
      color: p.color,
      points: p.points,
      author: state.settings.userName,
      createdAt: Date.now(),
      locked: true,
    }));
    const pages = doc.pages.map((pg, i) => ({
      ...pg,
      annotations: [...pg.annotations, ...annotations.filter((a) => a.page === i)],
    }));
    updateDocument({ ...doc, pages, updatedAt: Date.now() }, 'Signed document');
    signDocument(doc.id, state.settings.userName);
    logActivity({
      documentId: doc.id,
      documentTitle: doc.title,
      type: 'signed',
      actor: state.settings.userName,
      message: 'signed the document electronically',
    });
    navigation.replace('Certificate', { docId: doc.id });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.bgSoft }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.headerBg }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="close" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 6 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Sign document</Text>
          <Text numberOfLines={1} style={{ fontSize: 12, color: theme.subtext }}>
            {doc.title}
          </Text>
        </View>
      </View>

      {/* Signature selector */}
      <View style={{ backgroundColor: theme.headerBg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 10, gap: 8 }}>
          {state.signatures.map((sig) => {
            const active = selectedSig?.id === sig.id;
            return (
              <TouchableOpacity
                key={sig.id}
                onPress={() => setSelectedSig(sig)}
                style={{
                  width: 130,
                  height: 56,
                  borderRadius: 10,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 2,
                  borderColor: active ? theme.primary : theme.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SvgPreview points={sig.points} color={sig.color} width={100} height={36} />
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            onPress={() => navigation.navigate('SignatureManager')}
            style={{
              width: 90,
              height: 56,
              borderRadius: 10,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: theme.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={20} color={theme.subtext} />
            <Text style={{ fontSize: 11, color: theme.subtext, fontWeight: '600' }}>New</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Pages */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={doc.pages}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setPageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))}
          renderItem={({ item, index }) => (
            <View style={{ width: SCREEN_W, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}>
              <View {...panResponder.panHandlers}>
                <View style={{ position: 'relative' }}>
                  <PdfPageView
                    page={item}
                    pageIndex={index}
                    width={PAGE_W}
                    theme={theme}
                    tool="select"
                    annotateColor="#FACC15"
                    readOnly
                    onAddAnnotation={() => {}}
                    onDeleteAnnotation={() => {}}
                    onRequestText={() => {}}
                    onRequestSignature={() => {}}
                  />
                  {placements
                    .filter((p) => p.page === index)
                    .map((p) => (
                      <View
                        key={p.id}
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          left: p.x * scale,
                          top: p.y * scale,
                          width: p.w * scale,
                          height: p.h * scale,
                          borderWidth: 1,
                          borderColor: theme.primary,
                          borderStyle: 'dashed',
                          borderRadius: 6,
                        }}
                      >
                        <Svg width={p.w * scale} height={p.h * scale}>
                          <Path
                            d={pointsToPath(p.points.map((pt) => ({ x: pt.x * scale, y: pt.y * scale })))}
                            stroke={p.color}
                            strokeWidth={2.4 * scale}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </Svg>
                      </View>
                    ))}
                </View>
              </View>
            </View>
          )}
        />
      </View>

      {/* Footer */}
      <View style={{ backgroundColor: theme.headerBg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: theme.subtext }}>
            {placements.length} signature{placements.length === 1 ? '' : 's'} placed
          </Text>
          <TouchableOpacity onPress={() => setPlacements([])}>
            <Text style={{ fontSize: 13, color: theme.danger, fontWeight: '600' }}>Clear all</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => setConsent(!consent)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
          <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: consent ? theme.primary : theme.border, backgroundColor: consent ? theme.primary : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
            {consent && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </View>
          <Text style={{ flex: 1, fontSize: 12, color: theme.subtext, lineHeight: 17 }}>
            I agree to sign this document electronically. My signature is legally binding under e-signature laws (ESIGN / eIDAS).
          </Text>
        </TouchableOpacity>
        <PrimaryButton
          label={`Sign document (${placements.length} placement${placements.length === 1 ? '' : 's'})`}
          icon="ribbon"
          theme={theme}
          disabled={!consent || placements.length === 0 || !selectedSig}
          onPress={handleSign}
        />
      </View>

      <Paywall visible={paywall} reason="sign" onClose={() => setPaywall(false)} />
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
