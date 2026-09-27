import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Pt } from '../lib/types';
import { Theme } from '../lib/theme';
import { pointsToPath } from './PdfPageView';

interface Props {
  theme: Theme;
  color: string;
  initialPoints?: Pt[];
  onSave: (points: Pt[]) => void;
  onCancel: () => void;
  height?: number;
}

export default function SignaturePad({ theme, color, initialPoints, onSave, onCancel, height = 200 }: Props) {
  const [points, setPoints] = useState<Pt[]>(initialPoints ?? []);
  const ptsRef = useRef<Pt[]>(initialPoints ?? []);
  const widthRef = useRef(1);
  const heightRef = useRef(1);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const p = { x: locationX / widthRef.current, y: locationY / heightRef.current };
          ptsRef.current = [p];
          setPoints([p]);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const p = { x: locationX / widthRef.current, y: locationY / heightRef.current };
          const last = ptsRef.current[ptsRef.current.length - 1];
          if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 0.008) {
            ptsRef.current.push(p);
            setPoints([...ptsRef.current]);
          }
        },
      }),
    []
  );

  const path = pointsToPath(points.map((p) => ({ x: p.x * widthRef.current, y: p.y * heightRef.current })));

  return (
    <View>
      <View
        style={{
          height,
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: theme.border,
          borderStyle: 'dashed',
          overflow: 'hidden',
        }}
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
          heightRef.current = e.nativeEvent.layout.height;
        }}
        {...panResponder.panHandlers}
      >
        {/* baseline guides */}
        <View style={{ position: 'absolute', left: 12, right: 12, top: height * 0.72, height: 1, backgroundColor: '#E5E7EB' }} />
        <View style={{ position: 'absolute', left: 12, right: 12, top: height * 0.86, height: 1, backgroundColor: '#F3F4F6' }} />
        {points.length > 1 && (
          <Svg style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} pointerEvents="none">
            <Path d={path} stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        )}
        {points.length === 0 && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
            <Ionicons name="create-outline" size={28} color="#9CA3AF" />
            <Text style={{ marginTop: 6, color: '#9CA3AF', fontSize: 13 }}>Sign here with your finger</Text>
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <TouchableOpacity
          onPress={() => {
            ptsRef.current = [];
            setPoints([]);
          }}
          style={[styles.btn, { backgroundColor: theme.bgSoft }]}
        >
          <Ionicons name="trash-outline" size={16} color={theme.text} />
          <Text style={[styles.btnText, { color: theme.text }]}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCancel}
          style={[styles.btn, { backgroundColor: theme.bgSoft }]}
        >
          <Text style={[styles.btnText, { color: theme.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => points.length > 2 && onSave(points)}
          style={[styles.btn, { backgroundColor: points.length > 2 ? theme.primary : theme.border, flex: 1 }]}
        >
          <Ionicons name="checkmark" size={16} color={points.length > 2 ? '#FFFFFF' : theme.faint} />
          <Text style={[styles.btnText, { color: points.length > 2 ? '#FFFFFF' : theme.faint }]}>Save signature</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  btnText: { fontSize: 14, fontWeight: '600' },
});
