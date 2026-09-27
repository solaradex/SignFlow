import { Annotation, Block, DocPage, Pt } from './types';
import { escapePdfText, hexToRgb, mixWithWhite, toLatin1 } from './utils';

export const PAGE_W = 612;
export const PAGE_H = 792;
const MARGIN = 56;

export interface TextOp {
  text: string;
  x: number;
  y: number; // from top
  size: number;
  bold?: boolean;
  color?: string;
}

export interface RectOp {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  opacity: number;
}

export interface PathOp {
  points: Pt[];
  color: string;
  width: number;
}

export interface PageOps {
  texts: TextOp[];
  rects: RectOp[];
  paths: PathOp[];
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Deterministically lay out a page's blocks into PDF ops (mirrors on-screen rendering). */
export function layoutPage(page: DocPage): PageOps {
  const ops: PageOps = { texts: [], rects: [], paths: [] };
  let y = MARGIN;
  const contentW = PAGE_W - MARGIN * 2;

  const pushText = (text: string, size: number, opts: { bold?: boolean; color?: string; x?: number; indent?: number } = {}) => {
    const maxChars = Math.max(20, Math.floor(((opts.x !== undefined ? PAGE_W - MARGIN - opts.x : contentW) - (opts.indent || 0)) / (size * 0.5)));
    const lines = wrapText(text, maxChars);
    lines.forEach((line, i) => {
      ops.texts.push({
        text: line,
        x: (opts.x ?? MARGIN) + (opts.indent || 0),
        y: y + i * (size * 1.35),
        size,
        bold: opts.bold,
        color: opts.color,
      });
    });
    y += lines.length * size * 1.35;
  };

  for (const block of page.blocks) {
    switch (block.type) {
      case 'title':
        pushText(block.text, 21, { bold: true });
        y += 8;
        break;
      case 'subtitle':
        pushText(block.text, 12, { color: '#6B7280' });
        y += 6;
        break;
      case 'meta':
        for (const [k, v] of block.rows) {
          ops.texts.push({ text: k, x: MARGIN, y, size: 10, bold: true, color: '#6B7280' });
          ops.texts.push({ text: v, x: MARGIN + 150, y, size: 10.5 });
          y += 16;
        }
        y += 6;
        break;
      case 'heading':
        y += 6;
        pushText(block.text, 13, { bold: true });
        y += 4;
        break;
      case 'paragraph':
        pushText(block.text, 10.5);
        y += 6;
        break;
      case 'list':
        for (const item of block.items) {
          ops.texts.push({ text: '\u2022', x: MARGIN, y, size: 10.5 });
          pushText(item, 10.5, { indent: 14 });
          y += 3;
        }
        y += 4;
        break;
      case 'table': {
        const cols = block.columns.length;
        const colW = contentW / cols;
        const headerY = y;
        ops.rects.push({ x: MARGIN, y: headerY - 12, w: contentW, h: 20, color: '#F3F4F6', opacity: 1 });
        block.columns.forEach((c, i) => {
          ops.texts.push({ text: c, x: MARGIN + i * colW + 6, y: headerY + 2, size: 9.5, bold: true });
        });
        y += 22;
        for (const row of block.rows) {
          row.forEach((cell, i) => {
            ops.texts.push({ text: cell, x: MARGIN + i * colW + 6, y, size: 9.5 });
          });
          y += 17;
        }
        y += 8;
        break;
      }
      case 'sigline':
        y += 26;
        ops.rects.push({ x: MARGIN, y: y - 1, w: contentW, h: 1, color: '#9CA3AF', opacity: 1 });
        ops.texts.push({ text: block.label, x: MARGIN, y: y + 12, size: 9, color: '#6B7280' });
        if (block.signed) {
          ops.texts.push({ text: 'Signed electronically', x: MARGIN + contentW - 130, y: y - 26, size: 9, color: '#16A34A' });
        }
        y += 26;
        break;
      case 'gap':
        y += block.h;
        break;
      case 'divider':
        y += 6;
        ops.rects.push({ x: MARGIN, y, w: contentW, h: 1, color: '#E5E7EB', opacity: 1 });
        y += 10;
        break;
    }
  }
  return ops;
}

export function annotationsToOps(annotations: Annotation[]): PageOps {
  const ops: PageOps = { texts: [], rects: [], paths: [] };
  for (const a of annotations) {
    if (a.type === 'highlight') {
      ops.rects.push({ x: a.x, y: a.y, w: a.w, h: a.h, color: a.color, opacity: 0.35 });
    } else if (a.type === 'text') {
      ops.rects.push({ x: a.x, y: a.y - 12, w: a.w, h: a.h, color: '#FEF3C7', opacity: 1 });
      const lines = wrapText(a.text || 'Note', Math.max(10, Math.floor(a.w / 5)));
      lines.slice(0, 6).forEach((line, i) => {
        ops.texts.push({ text: line, x: a.x + 3, y: a.y + i * 11, size: 9, color: '#92400E' });
      });
    } else if ((a.type === 'draw' || a.type === 'signature') && a.points && a.points.length > 1) {
      ops.paths.push({
        points: a.points,
        color: a.color,
        width: a.type === 'signature' ? 2.4 : 2,
      });
    }
  }
  return ops;
}

function rgb(hex: string): [number, number, number] {
  return hexToRgb(hex);
}

function buildContentStream(ops: PageOps, footer?: string): string {
  let s = '';
  for (const r of ops.rects) {
    const [cr, cg, cb] = rgb(r.color);
    const f = r.opacity >= 1 ? [cr, cg, cb] : mixWithWhite(r.color, r.opacity);
    s += `${f[0] / 255} ${f[1] / 255} ${f[2] / 255} rg ${r.x.toFixed(1)} ${(PAGE_H - r.y - r.h).toFixed(1)} ${r.w.toFixed(1)} ${r.h.toFixed(1)} re f\n`;
  }
  for (const p of ops.paths) {
    const [r, g, b] = rgb(p.color);
    s += `${r / 255} ${g / 255} ${b / 255} RG ${p.width} w\n`;
    p.points.forEach((pt, i) => {
      s += `${pt.x.toFixed(1)} ${(PAGE_H - pt.y).toFixed(1)} ${i === 0 ? 'm' : 'l'}\n`;
    });
    s += 'S\n';
  }
  for (const t of ops.texts) {
    const [r, g, b] = rgb(t.color || '#1F2937');
    s += `BT /${t.bold ? 'F2' : 'F1'} ${t.size} Tf ${r / 255} ${g / 255} ${b / 255} rg 1 0 0 1 ${t.x.toFixed(1)} ${(PAGE_H - t.y).toFixed(1)} Tm (${escapePdfText(toLatin1(t.text))}) Tj ET\n`;
  }
  if (footer) {
    s += `BT /F1 8 Tf 0.42 0.5 0.52 rg 1 0 0 1 ${MARGIN} 30 Tm (${escapePdfText(toLatin1(footer))}) Tj ET\n`;
  }
  return s;
}

export interface PdfExportPage {
  ops: PageOps;
}

/** Builds a valid single/multi-page PDF document string. */
export function generatePdf(pages: PdfExportPage[], footer?: string): string {
  const objects: string[] = [];
  const pageCount = pages.length;
  const fontObj = 3 + pageCount * 2;
  const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ');

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`;

  pages.forEach((p, i) => {
    const pageNum = 3 + i * 2;
    const contentNum = pageNum + 1;
    objects[pageNum] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /F1 ${fontObj} 0 R /F2 ${fontObj + 1} 0 R >> >> /Contents ${contentNum} 0 R >>`;
    const stream = buildContentStream(p.ops, footer);
    objects[contentNum] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  objects[fontObj] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[fontObj + 1] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) {
    pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
}
