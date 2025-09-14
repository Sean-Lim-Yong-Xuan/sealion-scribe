/*
 Utility to extract plain text from uploaded documents (pdf, docx, txt, images fallback)
 Client-side parsing only. For large / complex documents consider server-side processing.
*/
import type { PDFDocumentProxy } from "pdfjs-dist";

// Lazy load heavy libs to keep initial bundle small
async function loadMammoth() {
  return await import("mammoth");
}

// Local worker setup for pdf.js to avoid external CDN dependency.
// Vite will transform the ?url import into a served asset path.
async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  try {
    // Dynamically import the worker asset URL (works in Vite)
    // @ts-ignore - virtual query suffix not in type defs
    const workerSrc: string = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    // @ts-ignore - GlobalWorkerOptions exists at runtime
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  } catch (e) {
    // Fallback: leave default which will inline a fake worker (slower) but avoids crash
    console.warn('[pdfjs] Failed to load dedicated worker, falling back to fake worker.', e);
  }
  return pdfjs;
}

export interface ParsedDocumentResult {
  text: string;
  meta: {
    fileName: string;
    fileSize: number; // bytes
    fileType: string;
    pages?: number;
    warnings?: string[];
  };
}

export async function parseDocument(file: File): Promise<ParsedDocumentResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const mime = file.type;
  const warnings: string[] = [];

  try {
    if (ext === 'docx' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = await loadMammoth();
      const arrayBuffer = await file.arrayBuffer();
      const { value, messages } = await mammoth.extractRawText({ arrayBuffer });
      if (messages?.length) {
        warnings.push(...messages.map(m => m.message));
      }
      return baseResult(file, value, warnings);
    }

    if (ext === 'pdf' || mime === 'application/pdf') {
      const pdfjs = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf: PDFDocumentProxy = await loadingTask.promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((it: any) => 'str' in it ? it.str : '').join(' ');
        text += pageText + '\n\n';
      }
      return baseResult(file, text.trim(), warnings, pdf.numPages);
    }

    if (ext === 'txt' || mime === 'text/plain') {
      const text = await file.text();
      return baseResult(file, text, warnings);
    }

    // Simple image OCR could be added later (Tesseract.js). For now, reject.
    if (['png','jpg','jpeg','webp'].includes(ext || '')) {
      warnings.push('Image to text (OCR) not yet implemented.');
      return baseResult(file, '', warnings);
    }

    // Fallback: try to read as text
    const fallback = await file.text().catch(() => '');
    if (!fallback) {
      throw new Error('Unsupported file type for client-side parsing.');
    }
    warnings.push('Used plain text fallback parser.');
    return baseResult(file, fallback, warnings);
  } catch (err: any) {
    throw new Error(`Failed to parse document: ${err.message || String(err)}`);
  }
}

function baseResult(file: File, text: string, warnings: string[], pages?: number): ParsedDocumentResult {
  return {
    text,
    meta: {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || file.name.split('.').pop() || 'unknown',
      pages,
      warnings: warnings.length ? warnings : undefined
    }
  };
}

export function truncateText(text: string, max = 50000) {
  if (text.length <= max) return text;
  return text.slice(0, max) + `\n\n[Truncated output to ${max} characters]`;
}
