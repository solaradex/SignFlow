import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/ThemeContext';
import { SignatureData } from '../lib/types';
import { SIGNATURE_COLORS } from '../lib/theme';
import { EmptyState } from '../components/ui';
import SignaturePad from '../components/SignaturePad';
import { uid } from '../lib/utils';

export default function SignatureManagerScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { state, saveSignature, deleteSignature } = useStore();
  const [creating, setCreating] = useState(false);
  const [color, setColor] = useState(SIGNATURE_COLORS[0]);

  const handleSave = (points: { x: number; y: number }[]) => {
    const sig: SignatureData = {
      id: uid(),
      name: `Signature ${state.signatures.length + 1}`,
      points,
      color,
      createdAt: Date.now(),
    };
    saveSignature(sig);
    setCreating(false);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text, marginLeft: 4 }}>My signatures</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => setCreating(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={state.signatures}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: theme.shadow, shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 }}>
            <View style={{ width: 130, height: 56, backgroundColor: '#FFFFFF', borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
              <SigPath points={item.points} color={item.color} width={110} height={40} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{item.name}</Text>
              <Text style={{ fontSize: 12, color: theme.faint, marginTop: 2 }}>
                {item.color === '#1E3A8A' ? 'Blue' : item.color === '#0F172A' ? 'Black' : item.color === '#1E40AF' ? 'Navy' : 'Brown'} ink
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                Alert.alert('Delete signature', 'Remove this saved signature?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteSignature(item.id) },
                ])
              }
              style={{ padding: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color={theme.danger} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState icon="ribbon-outline" title="No signatures" subtitle="Create your first signature to start signing documents." theme={theme} />
        }
      />

      <Modal visible={creating} animationType="slide" transparent onRequestClose={() => setCreating(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text, marginBottom: 4 }}>New signature</Text>
            <Text style={{ fontSize: 13, color: theme.subtext, marginBottom: 14 }}>Draw your signature below.</Text>
            <SignaturePad theme={theme} color={color} onSave={handleSave} onCancel={() => setCreating(false)} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {SIGNATURE_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: c,
                    borderWidth: color === c ? 3 : 0,
                    borderColor: theme.primary,
                  }}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SigPath({ points, color, width, height }: { points: { x: number; y: number }[]; color: string; width: number; height: number }) {
  if (!points || points.length < 2) return null;
  let d = `M ${(points[0].x * width).toFixed(1)} ${(points[0].y * height).toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i - 1];
    const p2 = points[i];
    const p3 = points[Math.min(points.length - 1, i + 1)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${(c1x * width).toFixed(1)} ${(c1y * height).toFixed(1)}, ${(c2x * width).toFixed(1)} ${(c2y * height).toFixed(1)}, ${(p2.x * width).toFixed(1)} ${(p2.y * height).toFixed(1)}`;
  }
  return (
    <Svg width={width} height={height}>
      <Path d={d} stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}
