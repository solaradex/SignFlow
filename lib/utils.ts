export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  ).toLowerCase();
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mixWithWhite(hex: string, opacity: number): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  const t = 1 - opacity;
  return [
    Math.round(r * opacity + 255 * t),
    Math.round(g * opacity + 255 * t),
    Math.round(b * opacity + 255 * t),
  ];
}

export function escapePdfText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function toLatin1(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[^\x00-\xFF]/g, '?');
}

/** FNV-1a style hash -> 64 hex char fingerprint (for signing certificates) */
export function fingerprint(input: string): string {
  let out = '';
  let seed = 0x811c9dc5;
  for (let round = 0; round < 16; round++) {
    let h = seed ^ round;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i) + round * 31;
      h = Math.imul(h, 0x01000193);
    }
    seed = h >>> 0;
    out += (h >>> 0).toString(16).padStart(8, '0');
  }
  return out.slice(0, 64);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const AVATAR_COLORS = ['#4F46E5', '#0E7490', '#B45309', '#BE185D', '#15803D', '#7C3AED', '#C2410C'];

export function colorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
