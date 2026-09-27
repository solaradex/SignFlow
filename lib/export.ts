import { Platform } from 'react-native';
import { PdfDocument } from './types';
import { annotationsToOps, generatePdf, layoutPage } from './pdf';

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9\-_ ]/g, '').trim().replace(/\s+/g, '-') || 'document';
}

export interface ExportResult {
  ok: boolean;
  message: string;
}

/** Exports a document as a real PDF file. Downloads on web, saves/shares on native. */
export async function exportDocumentPdf(doc: PdfDocument, brokerFooter?: string): Promise<ExportResult> {
  const pages = doc.pages.map((p) => {
    const layout = layoutPage(p);
    const ann = annotationsToOps(p.annotations);
    return {
      ops: {
        texts: [...layout.texts, ...ann.texts],
        rects: [...layout.rects, ...ann.rects],
        paths: [...layout.paths, ...ann.paths],
      },
    };
  });
  const pdfString = generatePdf(pages, brokerFooter);
  const fileName = `${safeName(doc.title)}.pdf`;

  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([pdfString], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return { ok: true, message: 'PDF downloaded' };
    } catch {
      return { ok: false, message: 'Download failed in this browser' };
    }
  }

  try {
    const FileSystem = await import('expo-file-system/legacy');
    const base64 = btoa(unescape(encodeURIComponent(pdfString)));
    const path = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 });
    try {
      const Sharing = await import('expo-sharing');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'application/pdf', dialogTitle: doc.title });
        return { ok: true, message: 'PDF shared' };
      }
    } catch {
      // sharing unavailable, fall through to saved message
    }
    return { ok: true, message: `Saved to ${path}` };
  } catch (e) {
    return { ok: false, message: 'Export failed' };
  }
}
