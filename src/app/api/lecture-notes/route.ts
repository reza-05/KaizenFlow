import { NextRequest, NextResponse } from 'next/server';
import { getSubtitles } from 'youtube-caption-extractor';
import { AILectureNotes, LectureNoteChapter } from '@/types';
import { decodeHtmlEntities } from '@/lib/youtube';

// Helper to convert seconds into "MM:SS" or "HH:MM:SS"
function formatSecondsToTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Convert "02:45" or "1:15:30" string into seconds
function parseTimestampToSeconds(ts: string): number {
  if (!ts) return 0;
  const parts = ts.trim().replace(/[\[\]]/g, '').split(':').map(p => parseInt(p, 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

// Scrape official YouTube chapter markers from watch page
async function fetchYouTubeOfficialChapters(videoId: string): Promise<Array<{ title: string; timeDesc: string; seconds: number }>> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cache: 'no-store',
    });
    if (!res.ok) return [];

    const html = await res.text();
    const chapters: Array<{ title: string; timeDesc: string; seconds: number }> = [];

    // MacroMarkers match
    const regex = /"macroMarkersListItemRenderer":\{"title":\{"simpleText":"(.*?)"\}.*?"timeDescription":\{"simpleText":"(.*?)"\}/g;
    let m;
    while ((m = regex.exec(html)) !== null) {
      const title = decodeHtmlEntities(m[1]);
      const timeDesc = m[2];
      const seconds = parseTimestampToSeconds(timeDesc);
      if (!chapters.some(c => c.seconds === seconds)) {
        chapters.push({ title, timeDesc, seconds });
      }
    }

    return chapters.sort((a, b) => a.seconds - b.seconds);
  } catch (err) {
    console.warn('Failed to extract video chapters:', err);
    return [];
  }
}

// Call Groq API with robust model fallbacks
async function generateWithGroq(apiKey: string, prompt: string): Promise<string> {
  const candidateModels = [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an elite academic scribe and software engineering lecturer. You write strictly grounded, authentic lecture notes based ONLY on verbatim video transcripts. You never hallucinate or invent topics. Respond strictly in valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 3000,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`Groq model ${model} failed (${res.status}):`, errText);
        lastError = new Error(`Groq API Error (${res.status}) on ${model}: ${errText}`);
        continue;
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (content) {
        console.log(`[Groq] Successfully generated lecture notes with model: ${model}`);
        return content;
      }
    } catch (err) {
      console.warn(`[Groq] Request failed for model ${model}:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('All Groq candidate models failed to generate response');
}

// Call Gemini API
async function generateWithGemini(apiKey: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API Error (${res.status}): ${errText}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || '{}';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const videoId = (body.videoId || '').trim();
    const videoTitle = (body.videoTitle || 'Lecture Video').trim();
    const courseTitle = (body.courseTitle || '').trim();
    const targetLanguage = (body.language || 'en').trim(); // 'en', 'bn', 'hi', 'mixed'
    const customApiKey = (body.customApiKey || '').trim();
    const customProvider = (body.customProvider || 'groq').trim(); // 'groq' | 'gemini'

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // 1. Fetch verbatim transcript lines
    let subtitles: Array<{ start: string | number; text: string }> = [];
    try {
      subtitles = await getSubtitles({ videoID: videoId, lang: targetLanguage === 'bn' ? 'bn' : targetLanguage === 'hi' ? 'hi' : 'en' });
    } catch {
      try {
        subtitles = await getSubtitles({ videoID: videoId });
      } catch (err) {
        console.warn('Subtitles not available for video:', err);
      }
    }

    // 2. Fetch official chapter markers
    const officialChapters = await fetchYouTubeOfficialChapters(videoId);

    // Build condensed transcript sample with timestamps for AI
    const sampledTranscript: string[] = [];
    if (subtitles.length > 0) {
      // Group lines every ~15-20 seconds to keep tokens compact while preserving verbatim context
      let currentGroup: string[] = [];
      let groupStart = 0;

      subtitles.forEach((s, idx) => {
        const sec = typeof s.start === 'string' ? parseFloat(s.start) : s.start;
        if (idx === 0) groupStart = Math.floor(sec);

        currentGroup.push(s.text);

        if (sec - groupStart >= 20 || idx === subtitles.length - 1) {
          sampledTranscript.push(`[${formatSecondsToTimestamp(groupStart)}] ${currentGroup.join(' ')}`);
          currentGroup = [];
          groupStart = Math.floor(sec);
        }
      });
    }

    // Build condensed transcript sample with timestamps for AI (staying strictly within Groq 8k TPM budget)
    let transcriptExcerpt = '';
    if (sampledTranscript.length > 0) {
      if (sampledTranscript.length <= 35) {
        transcriptExcerpt = sampledTranscript.join('\n');
      } else {
        // Sample evenly across the entire duration so AI captures all phases of the lesson
        const step = sampledTranscript.length / 32;
        const selected: string[] = [];
        for (let i = 0; i < 32; i++) {
          const idx = Math.min(Math.floor(i * step), sampledTranscript.length - 1);
          if (!selected.includes(sampledTranscript[idx])) {
            selected.push(sampledTranscript[idx]);
          }
        }
        transcriptExcerpt = selected.join('\n');
      }
    }

    const chaptersText = officialChapters.slice(0, 20).map(c => `[${c.timeDesc}] ${c.title}`).join('\n');

    // Check which AI provider to use
    const groqKey = customProvider === 'groq' && customApiKey ? customApiKey : process.env.GROQ_API_KEY;
    const geminiKey = customProvider === 'gemini' && customApiKey ? customApiKey : process.env.GEMINI_API_KEY;
    const activeKey = customApiKey || groqKey || geminiKey;
    const activeProvider = customApiKey ? customProvider : groqKey ? 'groq' : geminiKey ? 'gemini' : null;

    // IF an AI key is available, run deep LLM synthesis
    if (activeKey && activeProvider) {
      const languageInstruction = targetLanguage === 'bn' 
        ? `MANDATORY TRANSLATION TO BENGALI (বাংলা):
- The instructor in this video tutorial may be speaking in Hindi, Hinglish, or English. You MUST translate and explain all concepts, chapter titles, summary, and key takeaways into natural, high-quality BENGALI (বাংলা).
- Under NO circumstance should Hindi words, Hindi sentences, or Devanagari script appear in the explanation. Translate it completely to Bengali!
- Keep all programming code (e.g., C++, Python, Java, JavaScript, logic, variables) in authentic English code blocks.
- Keep standard computer science terms in English (e.g., Variable, Loop, Function, Pointer, Array, Recursion, Time Complexity).`
        : targetLanguage === 'en'
        ? `MANDATORY TRANSLATION TO ENGLISH:
- Even if the instructor is speaking in Hindi or Hinglish, translate and synthesize all explanations and notes into clear, academic ENGLISH. Do NOT output Hindi/Devanagari text in the explanation.
- Keep code in standard English code blocks.`
        : targetLanguage === 'hi'
        ? `Generate explanations in clear Hindi / Hinglish, keeping all code and technical terms in English.`
        : `Natural bilingual Bengali with technical English terms (Banglish style for students). Explain concepts in Bengali, keep technical terms and code in English.`;

      const prompt = `
You are an expert academic scribe, educator, and senior programmer.
You are generating authentic, high-quality lecture study notes for a student watching this educational video:

VIDEO TITLE: "${videoTitle}"
${courseTitle ? `COURSE / PLAYLIST: "${courseTitle}"` : ''}

OFFICIAL VIDEO CHAPTERS:
${chaptersText || 'None specified'}

${transcriptExcerpt 
  ? `VERBATIM TRANSCRIPT WITH TIMESTAMPS:
${transcriptExcerpt}` 
  : `NOTE ON TRANSCRIPT: Direct closed-caption stream was not attached to this video on YouTube.
- You MUST synthesize comprehensive, syllabus-grounded academic lecture notes based on this specific educational topic: "${videoTitle}".
- Break down the lecture systematically into 4 to 7 realistic timestamped chapters (e.g. 00:00, 03:20, 07:45, 14:10, 21:30, 28:00).
- NEVER return an empty response or say "transcript unavailable". Always generate thorough, helpful lecture notes with formulas, conceptual breakdown, and code implementations.`}

TASK & CRITICAL RULES:
1. CURRICULUM GROUNDING: Cover the authentic concepts, mathematical definitions, algorithms, and logical principles taught in this subject.
2. CODE FIDELITY: If the video is about programming, algorithms, or software development (C++, Python, Java, JavaScript, etc.), provide clean, authentic, compile-ready code snippets with syntax highlighting. If it is a non-coding topic (e.g. Math, Physics, Design), provide clear formulas or step-by-step methodologies.
3. TIMESTAMPS: Provide accurate or realistic sequential timestamps ("MM:SS") for each concept so students can navigate their study session.
4. ${languageInstruction}
5. STRUCTURED JSON: Respond ONLY with a valid JSON object matching this schema:
{
  "summary": "Crisp 2-3 sentence overview of what is taught in this lecture.",
  "chapters": [
    {
      "id": "ch_1",
      "title": "Topic Title",
      "timestamp": "MM:SS",
      "seconds": 120,
      "explanation": "Thorough, clear explanation of the concept...",
      "codeSnippet": "// code snippet if applicable",
      "codeLanguage": "cpp",
      "keyPoints": ["Point 1", "Point 2"]
    }
  ],
  "keyTakeaways": [
    "Crucial takeaway or common trap 1",
    "Crucial takeaway 2"
  ]
}
`;

      try {
        const rawResponse = activeProvider === 'groq'
          ? await generateWithGroq(activeKey, prompt)
          : await generateWithGemini(activeKey, prompt);

        console.log('[Groq] rawResponse received, length:', rawResponse.length);
        let parsed: any = {};
        try {
          parsed = JSON.parse(rawResponse);
        } catch (pErr) {
          console.error('[Groq] JSON.parse failed on rawResponse:', pErr);
        }
        const chapters: LectureNoteChapter[] = (parsed.chapters || []).map((ch: any, idx: number) => ({
          id: ch.id || `ch_${idx + 1}`,
          title: ch.title || `Section ${idx + 1}`,
          timestamp: ch.timestamp || '00:00',
          seconds: typeof ch.seconds === 'number' ? ch.seconds : parseTimestampToSeconds(ch.timestamp || '00:00'),
          explanation: ch.explanation || '',
          codeSnippet: (ch.codeSnippet && typeof ch.codeSnippet === 'string' && ch.codeSnippet.trim() !== '' && !ch.codeSnippet.includes('optional code snippet') && ch.codeSnippet.trim().toLowerCase() !== 'none' && ch.codeSnippet.trim().toLowerCase() !== 'n/a') ? ch.codeSnippet.trim() : undefined,
          codeLanguage: ch.codeLanguage || undefined,
          keyPoints: Array.isArray(ch.keyPoints) ? ch.keyPoints : [],
        }));

        // Generate clean markdown representation
        let markdown = `# ${videoTitle}\n\n${parsed.summary || ''}\n\n`;
        chapters.forEach(ch => {
          markdown += `### [${ch.timestamp}] ${ch.title}\n${ch.explanation}\n\n`;
          if (ch.codeSnippet) {
            markdown += `\`\`\`${ch.codeLanguage || 'text'}\n${ch.codeSnippet}\n\`\`\`\n\n`;
          }
          if (ch.keyPoints && ch.keyPoints.length > 0) {
            ch.keyPoints.forEach(kp => {
              markdown += `- ${kp}\n`;
            });
            markdown += '\n';
          }
        });

        if (parsed.keyTakeaways && parsed.keyTakeaways.length > 0) {
          markdown += `### 💡 Key Takeaways & Exam Tips\n`;
          parsed.keyTakeaways.forEach((kt: string) => {
            markdown += `- ${kt}\n`;
          });
        }

        const notes: AILectureNotes = {
          videoId,
          videoTitle,
          language: targetLanguage,
          summary: parsed.summary || `Lecture notes for ${videoTitle}`,
          chapters,
          keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
          fullMarkdown: markdown,
          generatedAt: new Date().toISOString(),
          isRealTranscriptGrounded: subtitles.length > 0,
        };

        return NextResponse.json(notes);
      } catch (aiErr: any) {
        console.error('AI synthesis failed, falling back to grounded transcript extractor:', aiErr);
      }
    }

    // FALLBACK (No API Key or AI error): Grounded Transcript & Chapter Synthesizer
    // Builds 100% genuine timestamped notes directly from real chapters & verbatim transcript!
    const generatedChapters: LectureNoteChapter[] = [];

    if (officialChapters.length > 0) {
      officialChapters.forEach((oc, idx) => {
        const nextSec = officialChapters[idx + 1]?.seconds || 99999;
        // Find transcript lines belonging to this chapter
        const matchingLines = subtitles
          .filter(s => {
            const sec = typeof s.start === 'string' ? parseFloat(s.start) : s.start;
            return sec >= oc.seconds && sec < nextSec;
          })
          .map(s => s.text)
          .slice(0, 15);

        const explanation = matchingLines.length > 0 
          ? matchingLines.join(' ') 
          : `Core topic covered in this section by the instructor. Review the timestamp to study the video explanation.`;

        generatedChapters.push({
          id: `oc_${idx + 1}`,
          title: oc.title,
          timestamp: oc.timeDesc,
          seconds: oc.seconds,
          explanation,
          keyPoints: [
            `Covered at [${oc.timeDesc}] in lecture`,
            `Follow along with the instructor's code and examples`,
          ],
        });
      });
    } else if (subtitles.length > 0) {
      // Chunk transcript every ~3-5 minutes
      const intervalSec = 180;
      let lastStart = 0;
      let bucket: string[] = [];

      subtitles.forEach((s, idx) => {
        const sec = typeof s.start === 'string' ? parseFloat(s.start) : s.start;
        bucket.push(s.text);

        if (sec - lastStart >= intervalSec || idx === subtitles.length - 1) {
          const ts = formatSecondsToTimestamp(lastStart);
          generatedChapters.push({
            id: `seg_${generatedChapters.length + 1}`,
            title: `Part ${generatedChapters.length + 1}: ${bucket.slice(0, 3).join(' ')}...`,
            timestamp: ts,
            seconds: Math.floor(lastStart),
            explanation: bucket.slice(0, 10).join(' '),
            keyPoints: [`Verbatim lecture segment starting at [${ts}]`],
          });
          bucket = [];
          lastStart = sec;
        }
      });
    } else {
      // Minimal template if no transcript available
      generatedChapters.push({
        id: 'ch_1',
        title: 'Core Lecture Overview',
        timestamp: '00:00',
        seconds: 0,
        explanation: `Comprehensive lecture on ${videoTitle}. Watch the video and capture personal timestamps in the notes tab.`,
        keyPoints: ['Full video session', 'Interactive timeline ready'],
      });
    }

    const fallbackSummary = `Lecture notes directly extracted from "${videoTitle}". Covers ${generatedChapters.length} key timestamped segments.`;
    let fallbackMarkdown = `# ${videoTitle}\n\n${fallbackSummary}\n\n`;
    generatedChapters.forEach(ch => {
      fallbackMarkdown += `### [${ch.timestamp}] ${ch.title}\n${ch.explanation}\n\n`;
    });

    const fallbackNotes: AILectureNotes = {
      videoId,
      videoTitle,
      language: targetLanguage,
      summary: fallbackSummary,
      chapters: generatedChapters,
      keyTakeaways: [
        'Watch sequentially and solve problems along with the instructor.',
        'Click any timestamp to seek the video player to that exact concept.',
      ],
      fullMarkdown: fallbackMarkdown,
      generatedAt: new Date().toISOString(),
      isRealTranscriptGrounded: subtitles.length > 0,
    };

    return NextResponse.json(fallbackNotes);
  } catch (err: any) {
    console.error('Error generating lecture notes:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate lecture notes' }, { status: 500 });
  }
}
