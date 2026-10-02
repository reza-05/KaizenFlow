'use client';

import { StudyNote } from '@/types';

// Merge chunks into a single Blob safely compatible with all TypeScript versions
function chunksToBlob(chunks: Uint8Array[]): Blob {
  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const merged = new Uint8Array(totalLength);
  let pos = 0;
  for (const c of chunks) {
    merged.set(c, pos);
    pos += c.length;
  }
  return new Blob([merged], { type: 'application/pdf' });
}

// Helper to sanitize filenames for downloads
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 50);
}

// Helper to escape PDF text syntax
function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    // Convert non-ASCII to closest safe character representation
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ');
}

// Word-wrap utility for PDF text rendering
function wrapText(text: string, maxCharsPerLine: number = 75): string[] {
  const lines: string[] = [];
  const rawParagraphs = text.split('\n');

  for (const para of rawParagraphs) {
    if (!para.trim()) {
      lines.push('');
      continue;
    }
    const words = para.split(' ');
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + (currentLine ? ' ' : '') + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        // If single word exceeds line length, split it
        if (word.length > maxCharsPerLine) {
          let remainder = word;
          while (remainder.length > maxCharsPerLine) {
            lines.push(remainder.slice(0, maxCharsPerLine));
            remainder = remainder.slice(maxCharsPerLine);
          }
          currentLine = remainder;
        } else {
          currentLine = word;
        }
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  return lines;
}

interface ExportNotesOptions {
  courseTitle: string;
  videoTitle: string;
  notes: StudyNote[];
}

/**
 * Generates a clean, multi-page vector PDF containing all study notes for a lesson.
 * Built with pure client-side PDF 1.4 binary synthesis.
 */
export function exportNotesToPDF({ courseTitle, videoTitle, notes }: ExportNotesOptions): void {
  if (notes.length === 0) return;

  const pageWidth = 595.28; // A4 Portrait
  const pageHeight = 841.89;
  const margin = 50;
  const usableWidth = pageWidth - margin * 2;

  // Break notes into printable lines
  interface FormattedNoteBlock {
    timestamp: string;
    date: string;
    contentLines: string[];
  }

  const blocks: FormattedNoteBlock[] = notes.map(n => ({
    timestamp: n.timestampFormatted,
    date: new Date(n.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    contentLines: wrapText(n.content, 78),
  }));

  // Distribute blocks across pages (approx 720pt usable vertical height)
  interface PageContent {
    commands: string[];
  }

  const pages: PageContent[] = [];
  let currentPageCommands: string[] = [];
  let currentY = pageHeight - margin - 85; // Leave top room for header

  const startNewPage = () => {
    if (currentPageCommands.length > 0) {
      pages.push({ commands: currentPageCommands });
    }
    currentPageCommands = [];
    currentY = pageHeight - margin - 40;
  };

  // Add notes to pages
  blocks.forEach((block, index) => {
    // Height required for this block:
    // Header (24pt) + lines * 14pt + spacing & divider (20pt)
    const blockHeight = 24 + block.contentLines.length * 14 + 20;

    if (currentY - blockHeight < margin + 40 && currentY < pageHeight - margin - 90) {
      startNewPage();
    }

    // Timestamp & Index badge line
    currentPageCommands.push(
      `0.1 0.1 0.1 rg\n` +
      `BT /F2 10 Tf ${margin} ${currentY.toFixed(2)} Td (NOTE #${index + 1}  •  [${escapePdfText(block.timestamp)}]) Tj ET\n` +
      `0.5 0.5 0.5 rg\n` +
      `BT /F1 9 Tf ${margin + 160} ${currentY.toFixed(2)} Td (${escapePdfText(block.date)}) Tj ET`
    );
    currentY -= 16;

    // Content lines
    currentPageCommands.push(`0.15 0.15 0.15 rg\nBT /F1 10 Tf`);
    let firstLine = true;
    for (const line of block.contentLines) {
      if (firstLine) {
        currentPageCommands.push(`${margin} ${currentY.toFixed(2)} Td (${escapePdfText(line)}) Tj`);
        firstLine = false;
      } else {
        currentPageCommands.push(`0 -14 Td (${escapePdfText(line)}) Tj`);
      }
      currentY -= 14;
    }
    currentPageCommands.push(`ET`);

    // Divider line
    currentY -= 10;
    currentPageCommands.push(
      `0.85 0.85 0.85 RG 0.5 w ${margin} ${currentY.toFixed(2)} m ${pageWidth - margin} ${currentY.toFixed(2)} l S`
    );
    currentY -= 16;
  });

  if (currentPageCommands.length > 0) {
    pages.push({ commands: currentPageCommands });
  }

  const totalPages = pages.length;

  // Build PDF structure
  // Objects:
  // 1: Catalog
  // 2: Pages
  // 3: Font Helvetica
  // 4: Font Helvetica-Bold
  // For each page:
  //   Page obj (5 + 2*i)
  //   Contents obj (6 + 2*i)
  const baseObjCount = 4;
  const pageObjIds: number[] = [];

  for (let i = 0; i < totalPages; i++) {
    pageObjIds.push(baseObjCount + 1 + i * 2);
  }

  const pdfChunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let currentOffset = 0;

  const addChunk = (str: string | Uint8Array) => {
    const bytes = typeof str === 'string' ? new TextEncoder().encode(str) : str;
    pdfChunks.push(bytes);
    currentOffset += bytes.length;
  };

  // Header
  const headerStr = `%PDF-1.4\n%\xE2\xE3\xCF\xD3\n`;
  addChunk(headerStr);

  // 1: Catalog
  offsets[1] = currentOffset;
  addChunk(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

  // 2: Pages
  offsets[2] = currentOffset;
  const kidsStr = pageObjIds.map(id => `${id} 0 R`).join(' ');
  addChunk(`2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${totalPages} >>\nendobj\n`);

  // 3: Font F1 (Helvetica)
  offsets[3] = currentOffset;
  addChunk(`3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);

  // 4: Font F2 (Helvetica-Bold)
  offsets[4] = currentOffset;
  addChunk(`4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`);

  // Pages & Contents
  for (let i = 0; i < totalPages; i++) {
    const pageId = pageObjIds[i];
    const contentsId = pageId + 1;

    // Header & Footer commands for every page
    const pageHeaderFooter: string[] = [];

    // Header on Page 1: Big Title & metadata
    if (i === 0) {
      pageHeaderFooter.push(
        // Main branding
        `0.05 0.05 0.05 rg\nBT /F2 16 Tf ${margin} ${pageHeight - margin} Td (KAIZENFLOW  |  STUDY TRANSCRIPT) Tj ET\n` +
        // Course & video info
        `0.3 0.3 0.3 rg\nBT /F2 10 Tf ${margin} ${pageHeight - margin - 20} Td (Course: ${escapePdfText(courseTitle)}) Tj ET\n` +
        `0.4 0.4 0.4 rg\nBT /F1 10 Tf ${margin} ${pageHeight - margin - 35} Td (Lesson: ${escapePdfText(videoTitle)}) Tj ET\n` +
        `0.5 0.5 0.5 rg\nBT /F1 9 Tf ${margin} ${pageHeight - margin - 50} Td (Exported: ${new Date().toLocaleDateString()}  •  ${notes.length} Timestamped Notes) Tj ET\n` +
        // Header separator rule
        `0.7 0.7 0.7 RG 1 w ${margin} ${pageHeight - margin - 62} m ${pageWidth - margin} ${pageHeight - margin - 62} l S`
      );
    } else {
      // Compact header on later pages
      pageHeaderFooter.push(
        `0.4 0.4 0.4 rg\nBT /F1 8 Tf ${margin} ${pageHeight - margin + 10} Td (KaizenFlow: ${escapePdfText(courseTitle)} - Notes) Tj ET\n` +
        `0.85 0.85 0.85 RG 0.5 w ${margin} ${pageHeight - margin + 4} m ${pageWidth - margin} ${pageHeight - margin + 4} l S`
      );
    }

    // Footer on all pages
    pageHeaderFooter.push(
      `0.85 0.85 0.85 RG 0.5 w ${margin} ${margin + 18} m ${pageWidth - margin} ${margin + 18} l S\n` +
      `0.5 0.5 0.5 rg\nBT /F1 8 Tf ${margin} ${margin + 5} Td (KaizenFlow Focus Environment  •  Study Verified) Tj ET\n` +
      `BT /F1 8 Tf ${pageWidth - margin - 50} ${margin + 5} Td (Page ${i + 1} of ${totalPages}) Tj ET`
    );

    const streamBody = [...pageHeaderFooter, ...pages[i].commands].join('\n') + '\n';
    const streamBytes = new TextEncoder().encode(streamBody);

    // Page object
    offsets[pageId] = currentOffset;
    addChunk(
      `${pageId} 0 obj\n` +
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentsId} 0 R >>\n` +
      `endobj\n`
    );

    // Contents object
    offsets[contentsId] = currentOffset;
    addChunk(`${contentsId} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`);
    addChunk(streamBytes);
    addChunk(`endstream\nendobj\n`);
  }

  // Cross-reference table
  const totalObjects = baseObjCount + totalPages * 2;
  const startXref = currentOffset;

  let xrefStr = `xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= totalObjects; i++) {
    xrefStr += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }

  const trailerStr = `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
  addChunk(xrefStr);
  addChunk(trailerStr);

  // Trigger download
  const blob = chunksToBlob(pdfChunks);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `KaizenFlow_Notes_${sanitizeFilename(videoTitle || courseTitle)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a canvas element as high-resolution PNG.
 */
export function exportBadgeToPNG(canvas: HTMLCanvasElement, courseTitle: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KaizenFlow_${sanitizeFilename(courseTitle)}_Badge.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

/**
 * Encapsulates the badge canvas into a landscape A4 PDF Certificate.
 */
export function exportBadgeToPDF(canvas: HTMLCanvasElement, courseTitle: string): void {
  // Convert canvas to JPEG blob to embed natively via DCTDecode
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const base64Data = dataUrl.split(',')[1];
  const binaryString = atob(base64Data);
  const jpegBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    jpegBytes[i] = binaryString.charCodeAt(i);
  }

  const pdfWidth = 841.89; // Landscape A4
  const pdfHeight = 595.28;

  const imgW = canvas.width;
  const imgH = canvas.height;
  const imgAspect = imgW / imgH;

  // Fit image into page leaving 30pt border
  let renderW = pdfWidth - 60;
  let renderH = renderW / imgAspect;
  if (renderH > pdfHeight - 60) {
    renderH = pdfHeight - 60;
    renderW = renderH * imgAspect;
  }
  const x = (pdfWidth - renderW) / 2;
  const y = (pdfHeight - renderH) / 2;

  const streamContent = `q\n${renderW.toFixed(2)} 0 0 ${renderH.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im1 Do\nQ\n`;
  const streamBytes = new TextEncoder().encode(streamContent);

  const pdfChunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let currentOffset = 0;

  const addChunk = (str: string | Uint8Array) => {
    const bytes = typeof str === 'string' ? new TextEncoder().encode(str) : str;
    pdfChunks.push(bytes);
    currentOffset += bytes.length;
  };

  // Header
  addChunk(`%PDF-1.4\n%\xE2\xE3\xCF\xD3\n`);

  // 1: Catalog
  offsets[1] = currentOffset;
  addChunk(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

  // 2: Pages
  offsets[2] = currentOffset;
  addChunk(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`);

  // 3: Page
  offsets[3] = currentOffset;
  addChunk(
    `3 0 obj\n` +
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidth} ${pdfHeight}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\n` +
    `endobj\n`
  );

  // 4: Image XObject
  offsets[4] = currentOffset;
  addChunk(
    `4 0 obj\n` +
    `<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\n` +
    `stream\n`
  );
  addChunk(jpegBytes);
  addChunk(`\nendstream\nendobj\n`);

  // 5: Contents
  offsets[5] = currentOffset;
  addChunk(`5 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`);
  addChunk(streamBytes);
  addChunk(`endstream\nendobj\n`);

  // Xref
  const startXref = currentOffset;
  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) {
    xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
  addChunk(xref);
  addChunk(trailer);

  const blob = chunksToBlob(pdfChunks);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `KaizenFlow_${sanitizeFilename(courseTitle)}_Certificate.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
