'use client';

import { StudyNote } from '@/types';

interface ExportNotesOptions {
  courseTitle: string;
  videoTitle: string;
  notes: StudyNote[];
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeFilename(name: string): string {
  return (name || 'study_notes').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 50);
}

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

function formatScientificToHtml(text: string): string {
  if (!text) return '';
  let s = text;

  // 1. Math symbols & LaTeX macros
  s = s.replace(/\\times/g, '×')
       .replace(/\\div/g, '÷')
       .replace(/\\pm/g, '±')
       .replace(/\\approx/g, '≈')
       .replace(/\\neq/g, '≠')
       .replace(/\\leq?/g, '≤')
       .replace(/\\geq?/g, '≥')
       .replace(/\\(?:rightarrow|to)/g, '→')
       .replace(/\\(?:leftarrow)/g, '←')
       .replace(/\\(?:leftrightarrow|iff)/g, '↔')
       .replace(/\\(?:Rightarrow|implies)/g, '⇒')
       .replace(/\\alpha/g, 'α')
       .replace(/\\beta/g, 'β')
       .replace(/\\gamma/g, 'γ')
       .replace(/\\Delta/g, 'Δ')
       .replace(/\\delta/g, 'δ')
       .replace(/\\lambda/g, 'λ')
       .replace(/\\pi/g, 'π')
       .replace(/\\sigma/g, 'σ')
       .replace(/\\mu/g, 'μ')
       .replace(/\\theta/g, 'θ')
       .replace(/\\infty/g, '∞')
       .replace(/\\degree/g, '°');

  // Strip math delimiters: $...$, \(...\), \[...\]
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, '$1')
       .replace(/\\\(([\s\S]*?)\\\)/g, '$1')
       .replace(/\$([^\$]+)\$/g, '$1');

  const parseSuper = (str: string): string => {
    let res = str.replace(/\^{([^}]+)}/g, '<sup>$1</sup>');
    res = res.replace(/\^([+-]?[0-9]+|[a-zA-Z]+)/g, '<sup>$1</sup>');
    return res;
  };

  // 2. Subscript with braces: _{...} (supports nested superscripts e.g. d_{x^2-y^2})
  s = s.replace(/_\{([^}]+)\}/g, (_, inner) => '<sub>' + parseSuper(inner) + '</sub>');

  // 3. Superscript with braces: ^{...}
  s = s.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');

  // 4. Subscript without braces: _([0-9]+|[a-z]+) e.g. d_xy, H_2O, v_0
  s = s.replace(/_([0-9]+|[a-z]+)/g, '<sub>$1</sub>');

  // 5. Superscript without braces: ^([+-]?[0-9]+|[a-zA-Z]+) e.g. x^2, z^2
  s = s.replace(/\^([+-]?[0-9]+|[a-zA-Z]+)/g, '<sup>$1</sup>');

  // 6. Common chemical molecules without underscores: e.g. H2O, CO2, CaCO3, H2SO4
  s = s.replace(/([A-Z][a-z]?)([0-9]+)(?=[A-Z\s,()+\-।|]|$)/g, (m, el, num) => {
    const skip = ['UTF', 'MP', 'SHA', 'RGB', 'IP'];
    if (skip.includes(el)) return m;
    return el + '<sub>' + num + '</sub>';
  });

  return s;
}

function formatMarkdownToHtml(content: string): string {
  if (!content) return '';

  // Unescape literal \n, \r, \t
  let clean = content
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, '  ');

  // Handle code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)[^\n]*\r?\n([\s\S]*?)(?:```|$)/g;
  clean = clean.replace(codeBlockRegex, (_, lang, code) => {
    return `<div class="code-container">
      <div class="code-header">${escapeHtml(lang || 'code').toUpperCase()}</div>
      <pre class="code-block"><code>${escapeHtml(code.trim())}</code></pre>
    </div>`;
  });

  // Handle bold **text**
  clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Handle inline code `code`
  clean = clean.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Handle bullet lines and scientific sub/sup formatting
  const lines = clean.split('\n');
  const processedLines: string[] = [];
  let inCode = false;

  for (const line of lines) {
    if (line.includes('<div class="code-container">')) {
      inCode = true;
    }
    if (line.includes('</div>')) {
      inCode = false;
    }

    if (inCode) {
      processedLines.push(line);
      continue;
    }

    // Apply scientific subscripts & superscripts to text outside code
    const formattedLine = formatScientificToHtml(line);

    if (formattedLine.trim().startsWith('- ') || formattedLine.trim().startsWith('• ')) {
      processedLines.push(`<li class="bullet-item">${formattedLine.trim().replace(/^[-•]\s*/, '')}</li>`);
    } else {
      processedLines.push(formattedLine);
    }
  }

  return processedLines.join('\n');
}

/**
 * Generates a beautiful, multi-page printable PDF containing all study notes for a lesson.
 * Built with full Unicode, Bengali font support, and formatted code cards.
 */
export function exportNotesToPDF({ courseTitle, videoTitle, notes }: ExportNotesOptions): void {
  if (notes.length === 0) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export your study notes to PDF.');
    return;
  }

  const notesHtml = notes.map((note, index) => {
    const formattedBody = formatMarkdownToHtml(note.content);

    return `
      <div class="note-card">
        <div class="note-header">
          <span class="note-badge">NOTE #${index + 1}</span>
          <span class="note-timestamp">[${escapeHtml(note.timestampFormatted)}]</span>
          <span class="note-date">${new Date(note.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
        <div class="note-body">
          ${formattedBody}
        </div>
      </div>
    `;
  }).join('');

  const docContent = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(videoTitle)} — KaizenFlow Notes</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Inter:wght@400;600;700&family=Noto+Sans+Bengali:wght@400;600;700&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', 'Noto Sans Bengali', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'SolaimanLipi', sans-serif;
      color: #09090b;
      background: #ffffff;
      padding: 36px 48px;
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
    }

    .header-banner {
      border-bottom: 2px solid #18181b;
      padding-bottom: 16px;
      margin-bottom: 28px;
    }

    .brand-title {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.5px;
      text-transform: uppercase;
      color: #09090b;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .lesson-title {
      font-size: 15px;
      font-weight: 700;
      color: #18181b;
      margin-top: 6px;
      line-height: 1.4;
    }

    .course-meta {
      font-size: 12px;
      color: #71717a;
      margin-top: 4px;
    }

    .note-card {
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      padding: 16px 18px;
      margin-bottom: 18px;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .note-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f4f4f5;
    }

    .note-badge {
      background: #18181b;
      color: #fafafa;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    .note-timestamp {
      font-family: 'Fira Code', monospace;
      font-size: 11px;
      font-weight: 700;
      color: #b45309;
      background: #fef3c7;
      padding: 2px 7px;
      border-radius: 4px;
    }

    .note-date {
      font-size: 11px;
      color: #a1a1aa;
      margin-left: auto;
    }

    .note-body {
      font-size: 13px;
      color: #18181b;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    strong {
      font-weight: 700;
      color: #09090b;
    }

    sub {
      font-size: 78%;
      line-height: 0;
      position: relative;
      vertical-align: baseline;
      bottom: -0.25em;
      font-weight: 600;
      color: #b45309;
    }

    sup {
      font-size: 78%;
      line-height: 0;
      position: relative;
      vertical-align: baseline;
      top: -0.5em;
      font-weight: 600;
      color: #b45309;
    }

    .bullet-item {
      margin-left: 20px;
      margin-top: 4px;
      list-style-type: disc;
    }

    .inline-code {
      font-family: 'Fira Code', monospace;
      font-size: 11.5px;
      background: #f4f4f5;
      padding: 2px 5px;
      border-radius: 3px;
      color: #09090b;
      border: 1px solid #e4e4e7;
    }

    .code-container {
      margin: 12px 0;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #27272a;
      background: #09090b;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .code-header {
      background: #18181b;
      color: #a1a1aa;
      font-size: 10px;
      font-weight: 700;
      padding: 4px 10px;
      letter-spacing: 1px;
      border-bottom: 1px solid #27272a;
      font-family: 'Fira Code', monospace;
    }

    .code-block {
      background: #09090b;
      color: #f4f4f5;
      font-family: 'Fira Code', monospace;
      font-size: 11px;
      line-height: 1.5;
      padding: 12px;
      overflow-x: auto;
      white-space: pre;
    }

    @media print {
      body { padding: 15px; }
      .note-card { break-inside: avoid; page-break-inside: avoid; }
      .code-container { break-inside: avoid; page-break-inside: avoid; }
      @page {
        margin: 12mm;
      }
    }
  </style>
</head>
<body>
  <div class="header-banner">
    <div class="brand-title">KAIZENFLOW &bull; LECTURE STUDY TRANSCRIPT</div>
    <div class="lesson-title">${escapeHtml(videoTitle)}</div>
    <div class="course-meta">${courseTitle ? `Course: ${escapeHtml(courseTitle)} &bull; ` : ''}${notes.length} Timestamped Notes &bull; Exported on ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>

  <div class="notes-container">
    ${notesHtml}
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(docContent);
  printWindow.document.close();
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

  addChunk(`%PDF-1.4\n%\xE2\xE3\xCF\xD3\n`);

  offsets[1] = currentOffset;
  addChunk(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

  offsets[2] = currentOffset;
  addChunk(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`);

  offsets[3] = currentOffset;
  addChunk(
    `3 0 obj\n` +
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidth} ${pdfHeight}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\n` +
    `endobj\n`
  );

  offsets[4] = currentOffset;
  addChunk(
    `4 0 obj\n` +
    `<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\n` +
    `stream\n`
  );
  addChunk(jpegBytes);
  addChunk(`\nendstream\nendobj\n`);

  offsets[5] = currentOffset;
  addChunk(`5 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`);
  addChunk(streamBytes);
  addChunk(`endstream\nendobj\n`);

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
