import { Block, DocPage, PdfDocument } from './types';
import { uid, formatBytes } from './utils';

export function buildImportedDocument(name: string, size: number, text?: string): PdfDocument {
  const pages: DocPage[] = [];
  const cleanName = name.replace(/\.[^.]+$/, '');

  if (text && text.trim()) {
    const paragraphs: string[] = [];
    let cur = '';
    for (const w of text.trim().split(/\s+/)) {
      if ((cur + ' ' + w).length > 620) {
        paragraphs.push(cur.trim());
        cur = w;
      } else {
        cur = cur ? cur + ' ' + w : w;
      }
    }
    if (cur.trim()) paragraphs.push(cur.trim());

    const maxPages = 5;
    const perPage = Math.max(1, Math.ceil(paragraphs.length / maxPages));
    for (let i = 0; i < paragraphs.length && i < maxPages * perPage; i += perPage) {
      const group = paragraphs.slice(i, i + perPage);
      const blocks: Block[] = [
        { type: 'title', text: cleanName },
        { type: 'subtitle', text: 'Imported text document' },
        { type: 'gap', h: 10 },
        ...group.map<Block>((p) => ({ type: 'paragraph', text: p })),
      ];
      pages.push({ blocks, annotations: [] });
    }
  } else {
    pages.push({
      blocks: [
        { type: 'title', text: cleanName },
        { type: 'subtitle', text: 'Imported document' },
        { type: 'gap', h: 12 },
        {
          type: 'meta',
          rows: [
            ['File name', name],
            ['File size', formatBytes(size)],
            ['Imported', new Date().toLocaleDateString()],
          ],
        },
        { type: 'gap', h: 12 },
        {
          type: 'paragraph',
          text: 'This document was imported into your library and a preview has been generated automatically. Use the annotation tools to review, highlight, add notes, and sign this document.',
        },
        { type: 'gap', h: 24 },
        { type: 'sigline', label: 'Reviewer signature' },
      ],
      annotations: [],
    });
  }

  return {
    id: uid(),
    title: cleanName,
    type: 'imported',
    status: 'draft',
    pages,
    parties: ['Imported file'],
    author: 'You',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    fileSize: formatBytes(size),
    source: 'imported',
  };
}
