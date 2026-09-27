import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Annotation, Block, DocPage, Pt, Tool } from '../lib/types';
import { Theme } from '../lib/theme';

export const PAGE_W = 612;
export const PAGE_H = 792;

export function pointsToPath(points: Pt[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function BlockView({ block, scale, theme }: { block: Block; scale: number; theme: Theme }) {
  switch (block.type) {
    case 'title':
      return (
        <Text style={{ fontSize: 21 * scale, fontWeight: '800', color: theme.paperText, letterSpacing: 0.3, marginBottom: 4 * scale }}>
          {block.text}
        </Text>
      );
    case 'subtitle':
      return (
        <Text style={{ fontSize: 12 * scale, color: '#6B7280', marginBottom: 6 * scale }}>{block.text}</Text>
      );
    case 'meta':
      return (
        <View style={{ marginBottom: 6 * scale }}>
          {block.rows.map(([k, v], i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 3 * scale }}>
              <Text style={{ width: 150 * scale, fontSize: 10 * scale, fontWeight: '700', color: '#6B7280' }}>{k}</Text>
              <Text style={{ flex: 1, fontSize: 10.5 * scale, color: theme.paperText }}>{v}</Text>
            </View>
          ))}
        </View>
      );
    case 'heading':
      return (
        <Text style={{ fontSize: 13 * scale, fontWeight: '800', color: theme.paperText, marginTop: 6 * scale, marginBottom: 4 * scale }}>
          {block.text}
        </Text>
      );
    case 'paragraph':
      return (
        <Text style={{ fontSize: 10.5 * scale, lineHeight: 14.5 * scale, color: '#374151', marginBottom: 6 * scale }}>
          {block.text}
        </Text>
      );
    case 'list':
      return (
        <View style={{ marginBottom: 6 * scale }}>
          {block.items.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 3 * scale }}>
              <Text style={{ width: 14 * scale, fontSize: 10.5 * scale, color: theme.paperText }}>{'\u2022'}</Text>
              <Text style={{ flex: 1, fontSize: 10.5 * scale, lineHeight: 14.5 * scale, color: '#374151' }}>{item}</Text>
            </View>
          ))}
        </View>
      );
    case 'table': {
      const colW = (612 - 112) / block.columns.length;
      return (
        <View style={{ marginBottom: 8 * scale }}>
          <View style={{ flexDirection: 'row', backgroundColor: '#F3F4F6', paddingVertical: 4 * scale }}>
            {block.columns.map((c, i) => (
              <Text key={i} style={{ width: colW * scale, paddingHorizontal: 6 * scale, fontSize: 9.5 * scale, fontWeight: '800', color: '#374151' }}>
                {c}
              </Text>
            ))}
          </View>
          {block.rows.map((row, ri) => (
            <View
              key={ri}
              style={{
                flexDirection: 'row',
                paddingVertical: 4 * scale,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: '#E5E7EB',
              }}
            >
              {row.map((cell, ci) => (
                <Text key={ci} style={{ width: colW * scale, paddingHorizontal: 6 * scale, fontSize: 9.5 * scale, color: '#374151' }}>
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      );
    }
    case 'sigline':
      return (
        <View style={{ marginTop: 26 * scale, marginBottom: 26 * scale }}>
          <View style={{ height: 1, backgroundColor: '#9CA3AF', marginBottom: 4 * scale }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 9 * scale, color: '#6B7280' }}>{block.label}</Text>
            {block.signed ? (
              <Text style={{ fontSize: 9 * scale, color: '#16A34A', fontWeight: '700' }}>Signed electronically</Text>
            ) : null}
          </View>
        </View>
      );
    case 'gap':
      return <View style={{ height: block.h * scale }} />;
    case 'divider':
      return (
        <View style={{ marginVertical: 6 * scale }}>
          <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
        </View>
      );
    default:
      return null;
  }
}

export interface PdfPageViewProps {
  page: DocPage;
  pageIndex: number;
  width: number;
  theme: Theme;
  tool: Tool;
  annotateColor: string;
  readOnly?: boolean;
  onAddAnnotation: (a: Annotation) => void;
  onDeleteAnnotation: (id: string) => void;
  onRequestText: (x: number, y: number) => void;
  onRequestSignature: (x: number, y: number) => void;
  placingSignature?: { points: { x: number; y: number }[]; color: string } | null;
  onPlaceSignatureCancel?: () => void;
}

export default function PdfPageView({
  page,
  pageIndex,
  width,
  theme,
  tool,
  annotateColor,
  readOnly,
  onAddAnnotation,
  onDeleteAnnotation,
  onRequestText,
  onRequestSignature,
  placingSignature,
  onPlaceSignatureCancel,
}: PdfPageViewProps) {
  const scale = width / PAGE_W;
  const height = PAGE_H * scale;
  const [tempRect, setTempRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [tempPoints, setTempPoints] = useState<Pt[]>([]);
  const gestureRef = useRef<{ startX: number; startY: number; points: Pt[]; moved: boolean }>({
    startX: 0,
    startY: 0,
    points: [],
    moved: false,
  });

  const active = !readOnly && tool !== 'select';

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => active,
        onMoveShouldSetPanResponder: () => active,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const x = locationX / scale;
          const y = locationY / scale;
          gestureRef.current = { startX: x, startY: y, points: [{ x, y }], moved: false };
          if (tool === 'highlight') setTempRect({ x, y, w: 0, h: 0 });
          if (tool === 'draw') setTempPoints([{ x, y }]);
        },
        onPanResponderMove: (evt) => {
          const g = gestureRef.current;
          const x = evt.nativeEvent.locationX / scale;
          const y = evt.nativeEvent.locationY / scale;
          if (Math.abs(x - g.startX) > 3 / scale || Math.abs(y - g.startY) > 3 / scale) g.moved = true;
          if (tool === 'highlight') {
            setTempRect({
              x: Math.min(g.startX, x),
              y: Math.min(g.startY, y),
              w: Math.abs(x - g.startX),
              h: Math.abs(y - g.startY),
            });
          } else if (tool === 'draw') {
            const last = g.points[g.points.length - 1];
            if (!last || Math.hypot(x - last.x, y - last.y) > 2) {
              g.points.push({ x, y });
              setTempPoints([...g.points]);
            }
          }
        },
        onPanResponderRelease: () => {
          const g = gestureRef.current;
          if (tool === 'highlight' && tempRect && tempRect.w > 8 && tempRect.h > 8) {
            onAddAnnotation({
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: 'highlight',
              page: pageIndex,
              x: tempRect.x,
              y: tempRect.y,
              w: tempRect.w,
              h: tempRect.h,
              color: annotateColor,
              author: 'You',
              createdAt: Date.now(),
            });
          } else if (tool === 'draw' && g.points.length > 2) {
            const xs = g.points.map((p) => p.x);
            const ys = g.points.map((p) => p.y);
            onAddAnnotation({
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: 'draw',
              page: pageIndex,
              x: Math.min(...xs),
              y: Math.min(...ys),
              w: Math.max(...xs) - Math.min(...xs),
              h: Math.max(...ys) - Math.min(...ys),
              color: annotateColor,
              points: [...g.points],
              author: 'You',
              createdAt: Date.now(),
            });
          } else if ((tool === 'text' || tool === 'signature') && !g.moved) {
            if (tool === 'text') onRequestText(g.startX, g.startY);
            else onRequestSignature(g.startX, g.startY);
          } else if (tool === 'erase' && !g.moved) {
            // hit test topmost annotation
            const hit = [...page.annotations].reverse().find((a) => {
              if (a.points && a.points.length) {
                const xs = a.points.map((p) => p.x);
                const ys = a.points.map((p) => p.y);
                const minX = Math.min(...xs) - 6;
                const maxX = Math.max(...xs) + 6;
                const minY = Math.min(...ys) - 6;
                const maxY = Math.max(...ys) + 6;
                return g.startX >= minX && g.startX <= maxX && g.startY >= minY && g.startY <= maxY;
              }
              return (
                g.startX >= a.x - 4 &&
                g.startX <= a.x + a.w + 4 &&
                g.startY >= a.y - 4 &&
                g.startY <= a.y + a.h + 4
              );
            });
            if (hit && !hit.locked) onDeleteAnnotation(hit.id);
          }
          setTempRect(null);
          setTempPoints([]);
          gestureRef.current = { startX: 0, startY: 0, points: [], moved: false };
        },
      }),
    [active, tool, pageIndex, annotateColor, page.annotations, tempRect, scale, readOnly, onAddAnnotation, onDeleteAnnotation, onRequestText, onRequestSignature]
  );

  const renderAnnotation = (a: Annotation) => {
    const key = a.id;
    if (a.type === 'highlight') {
      return (
        <View
          key={key}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: a.x * scale,
            top: a.y * scale,
            width: a.w * scale,
            height: a.h * scale,
            backgroundColor: a.color,
            opacity: 0.35,
            borderRadius: 2,
          }}
        />
      );
    }
    if (a.type === 'text') {
      return (
        <View
          key={key}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: a.x * scale,
            top: a.y * scale,
            width: Math.max(a.w, 40) * scale,
            backgroundColor: '#FEF3C7',
            borderLeftWidth: 3,
            borderLeftColor: '#D97706',
            borderRadius: 4,
            padding: 5 * scale,
          }}
        >
          <Text style={{ fontSize: 9 * scale, color: '#92400E', lineHeight: 12 * scale }}>{a.text}</Text>
        </View>
      );
    }
    if ((a.type === 'draw' || a.type === 'signature') && a.points && a.points.length > 1) {
      return (
        <Svg
          key={key}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: PAGE_W * scale,
            height: PAGE_H * scale,
          }}
        >
          <Path
            d={pointsToPath(a.points)}
            stroke={a.color}
            strokeWidth={(a.type === 'signature' ? 2.4 : 2) * scale}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      );
    }
    return null;
  };

  return (
    <View
      style={{
        width: PAGE_W * scale,
        height: PAGE_H * scale,
        backgroundColor: theme.paper,
        borderRadius: 4,
        overflow: 'hidden',
        shadowColor: theme.shadow,
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      }}
      {...(active ? panResponder.panHandlers : {})}
    >
      {/* page content */}
      <View style={{ position: 'absolute', left: 56 * scale, right: 56 * scale, top: 56 * scale }} pointerEvents="none">
        {page.blocks.map((b, i) => (
          <BlockView key={i} block={b} scale={scale} theme={theme} />
        ))}
      </View>

      {/* annotations */}
      {page.annotations.map(renderAnnotation)}

      {/* in-progress highlight */}
      {tempRect && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: tempRect.x * scale,
            top: tempRect.y * scale,
            width: tempRect.w * scale,
            height: tempRect.h * scale,
            backgroundColor: annotateColor,
            opacity: 0.35,
            borderRadius: 2,
          }}
        />
      )}

      {/* in-progress drawing */}
      {tempPoints.length > 1 && (
        <Svg pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: PAGE_W * scale, height: PAGE_H * scale }}>
          <Path
            d={pointsToPath(tempPoints)}
            stroke={annotateColor}
            strokeWidth={2 * scale}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      )}

      {/* page footer */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 18 * scale,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 8 * scale, color: '#9CA3AF' }}>
          Page {pageIndex + 1}  |  Northwind Labs
        </Text>
      </View>
    </View>
  );
}
