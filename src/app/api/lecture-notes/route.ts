import { NextRequest, NextResponse } from 'next/server';
import { getSubtitles } from 'youtube-caption-extractor';
import { AILectureNotes, LectureNoteChapter } from '@/types';
import { decodeHtmlEntities } from '@/lib/youtube';
import { humanizeLectureNotes } from '@/lib/bengaliHumanizer';

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
              content: 'You are an exceptional, passionate Bangladeshi teacher, master educator, and top academic mentor (like a senior instructor from BUET / Dhaka University / 10 Minute School). You write crystal-clear, engaging, humanized study notes in the requested language (e.g. Bengali/বাংলা) covering the full curriculum, formulas, whiteboard derivations, step-by-step problem-solving, and code. Your writing style is 100% natural, active, warm, and pedagogical—NEVER sounding like a stiff, robotic machine translation (Google Translate style). Respond strictly in valid JSON matching the requested schema with all chapters and summary populated.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
          max_tokens: 3500,
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
        temperature: 0.4,
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
    const forceGenerate = Boolean(body.forceGenerate);

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

    // Clean and verify if transcript has actual educational speech (ignore background music [Music], applause, etc.)
    const cleanedTranscriptWords = subtitles
      .map(s => s.text.replace(/\[.*?\]|\(.*?\)|[♪♫]/g, '').trim())
      .filter(t => t.length > 0)
      .join(' ')
      .split(/\s+/)
      .filter(w => w.length > 1);

    const hasMeaningfulSpeech = cleanedTranscriptWords.length >= 25;

    // 3. Fast Heuristic Guardrail for Clear Non-Educational Entertainment Videos (Zero Hallucination)
    const combinedTitle = `${videoTitle} ${courseTitle}`.toLowerCase();
    
    // Explicit educational indicators (to prevent false negatives on creative lecture titles)
    const hasExplicitEducationalKeywords = /\b(tutorial|lecture|class|lesson|course|chapter|learn|introduction\s+to|basics\s+of|crash\s+course|full\s+course|problem\s+solving|solution|formula|derivation|chemistry|physics|biology|math|mathematics|calculus|algebra|programming|coding|algorithm|data\s+structure|web\s+dev|frontend|backend|software|how\s+to|guide|explained|explanation|syllabus|hsc|ssc|admission|buet|du|medical|exam|question\s+bank)\b/i.test(combinedTitle);

    // Broad spectrum of non-educational entertainment genres (gaming, movie clips, vlogs, comedy, sports, music)
    const hasStrongEntertainmentTitle = !hasExplicitEducationalKeywords && /\b(official\s+music\s+video|official\s+video|official\s+audio|lyric\s+video|lyrics\s+video|full\s+album|lofi\s+beats|dj\s+remix|original\s+soundtrack|\bost\b|movie\s+trailer|teaser\s+trailer|teaser|full\s+movie|movie\s+scene|gameplay|playthrough|let's\s+play|gaming\s+montage|funny\s+moments|prank\s+video|prank|comedy\s+sketch|standup\s+comedy|roast\s+video|reaction\s+video|daily\s+vlog|travel\s+vlog|food\s+vlog|mukbang|24\s+hour\s+challenge|natok|telefilm|drama\s+serial|web\s+series|match\s+highlights|full\s+match|goals|knockout|\bwwe\b|\bipl\b|\bbpl\b)\b/i.test(combinedTitle);

    const totalSubs = subtitles.length;
    const musicSubCount = subtitles.filter(s => /\[(?:Music|Applause|Singing|Cheering)\]|[♪♫]/i.test(s.text)).length;
    const isAlmostExclusivelyMusicSubs = totalSubs > 0 && (musicSubCount / totalSubs) >= 0.65;

    // Reject early ONLY if user didn't force generate AND it is unquestionably non-educational
    if (!forceGenerate && (hasStrongEntertainmentTitle || isAlmostExclusivelyMusicSubs)) {
      const reason = targetLanguage === 'bn' || targetLanguage === 'mixed'
        ? 'ভিডিওটি একটি নন-এডুকেশনাল বা বিনোদনমূলক কনটেন্ট (যেমন: গান, গেমিং, নাটক, ভ্লগ, কমেডি বা মুভি ক্লিপ) হিসেবে শনাক্ত হয়েছে। KaizenFlow-এর এআই নোট সাধারণত পড়াশোনা, টিউটোরিয়াল বা একাডেমিক ক্লাসের জন্য সবচেয়ে ভালো কাজ করে। আপনি যদি এই ভিডিওর জন্যও নোট তৈরি করতে চান, তবে নিচে "Force Generate" বাটনে ক্লিক করতে পারেন।'
        : 'This video appears to be entertainment or non-instructional content (e.g. music, gaming stream, vlog, comedy, drama, sports) rather than an educational tutorial. KaizenFlow AI Notes work best for educational lectures. If you still want notes for this video, click "Force Generate Notes".';

      const nonEduNotes: AILectureNotes = {
        videoId,
        videoTitle,
        language: targetLanguage,
        summary: reason,
        chapters: [],
        keyTakeaways: [],
        fullMarkdown: `# ${videoTitle}\n\n${reason}`,
        generatedAt: new Date().toISOString(),
        isRealTranscriptGrounded: subtitles.length > 0,
        isEducational: false,
        nonEducationalReason: reason,
        contentType: 'music_entertainment',
      };

      return NextResponse.json(targetLanguage === 'bn' || targetLanguage === 'mixed' ? humanizeLectureNotes(nonEduNotes) : nonEduNotes);
    }

    // Build condensed transcript sample with timestamps for AI (staying strictly within Groq 8k TPM budget)
    const sampledTranscript: string[] = [];
    if (hasMeaningfulSpeech) {
      let currentGroup: string[] = [];
      let groupStart = 0;

      subtitles.forEach((s, idx) => {
        // Skip pure music/bracket lines
        const cleanLine = s.text.replace(/\[.*?\]|\(.*?\)|[♪♫]/g, '').trim();
        if (!cleanLine) return;

        const sec = typeof s.start === 'string' ? parseFloat(s.start) : s.start;
        if (idx === 0) groupStart = Math.floor(sec);

        currentGroup.push(cleanLine);

        if (sec - groupStart >= 20 || idx === subtitles.length - 1) {
          if (currentGroup.length > 0) {
            sampledTranscript.push(`[${formatSecondsToTimestamp(groupStart)}] ${currentGroup.join(' ')}`);
          }
          currentGroup = [];
          groupStart = Math.floor(sec);
        }
      });
    }

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

    // Detect whether this course/video is about programming vs academic science/humanities
    const isCodingTopic = /c\+\+|cpp|\b(c|java|python|javascript|typescript|golang|rust|ruby|php|swift|kotlin|c#|sql|html|css|react|next\.?js|node\.?js|angular|vue|django|flask|spring|laravel)\b|coding|programmer|programming|software|data structures?|\bdsa\b|web dev|frontend|backend|full stack|leetcode|codeforces|git|github/i.test(`${videoTitle} ${courseTitle}`);

    // Check which AI provider to use
    const groqKey = customProvider === 'groq' && customApiKey ? customApiKey : process.env.GROQ_API_KEY;
    const geminiKey = customProvider === 'gemini' && customApiKey ? customApiKey : process.env.GEMINI_API_KEY;
    const activeKey = customApiKey || groqKey || geminiKey;
    const activeProvider = customApiKey ? customProvider : groqKey ? 'groq' : geminiKey ? 'gemini' : null;

    // IF an AI key is available, run deep LLM synthesis
    if (activeKey && activeProvider) {
      const languageInstruction = targetLanguage === 'bn' 
        ? `MANDATORY HUMANIZED BENGALI GUIDELINES (মানুষের মতো প্রাঞ্জল, স্বাভাবিক ও শিক্ষণীয় বাংলা নোট):
- The instructor in this tutorial may speak Hindi, Hinglish, or English. You MUST explain and teach all concepts, chapter titles, summary, key takeaways, and quiz in natural, native, high-quality BENGALI (বাংলা) as taught by a passionate, top Bangladeshi mentor (BUET / 10 Minute School style).
- STRICTLY BAN ROBOTIC TRANSLATION CLICHES & GOOGLE-TRANSLATE ARTIFACTS:
  * NEVER write "ইন্সট্রাক্টর কিছু সমস্যার সমাধান দেখান:", "ইন্সট্রাক্টর দেখান যে", "ইন্সট্রাক্টর আলোচনা করেন"। Instead, state the concept directly: "কমন কিছু সমস্যা ও তাৎক্ষণিক সমাধান:", "যেভাবে কাজ করে:", "মনে রাখার মূল নিয়ম:"।
  * NEVER use stiff robotic passive voice like "পরীক্ষা করা হয়", "নিশ্চিত হয়", "প্রদর্শন করা হয়েছে", "পর্যবেক্ষণ করা হয়"। Write in natural active voice: "সহজেই টেস্ট করে নেওয়া যায়", "কোড ত্রুটিমুক্তভাবে রান করছে কি না তা নিশ্চিত হওয়া যায়", "সরাসরি পর্যবেক্ষণ করা যায়"।
  * NEVER translate "dim" (dim light) as "ধূসর" (gray color)! "Dim LED" means "LED-র আলো খুব মৃদু বা ডিম (dim) হয়ে যাওয়া"।
  * NEVER translate "blink" as awkward "টিমটিম করে"! Use "দ্রুত ব্লিঙ্ক (blink) করে" or "অন-অফ করে"।
  * Avoid robotic question bullets like "• LED না জ্বলে?". Write clear symptom-solution bullets:
    "• LED না জ্বললে: রেজিস্টরের সংযোগ বা পোলারিটি (+ / - প্রান্ত) ঠিক আছে কি না চেক করে নিন।"
    "• LED খুব দ্রুত ব্লিঙ্ক করলে: delay() এর সময় কিছুটা বাড়িয়ে দিন।"
    "• কোড কম্পাইল না হলে: সেমিকোলন (;) বা আনডিফাইন্ড ভ্যারিয়েবল রয়েছে কি না দেখে নিন।"
    "• রেজিস্টরের মান অতিরিক্ত বড় হলে: LED-র আলো খুব মৃদু বা ডিম হয়ে যাবে; তাই 220Ω-330Ω রেজিস্টর ব্যবহার করুন।"
- Keep standard computer science / engineering / science terms in English or natural Bengali pronunciation (e.g., Variable, Loop, Function, Pointer, Pin, Delay, Resistor, Breadboard, Simulation, Compile Error, Serial Monitor, VCC, GND).
- Under NO circumstance should Hindi words, Hindi sentences, or Devanagari script appear in the explanation. Everything must be natural Bengali.`
        : targetLanguage === 'en'
        ? `MANDATORY TRANSLATION TO ENGLISH:
- Even if the instructor is speaking in Hindi or Hinglish, translate and synthesize all explanations and notes into clear, academic ENGLISH. Do NOT output Hindi/Devanagari text in the explanation.`
        : targetLanguage === 'hi'
        ? `Generate explanations in clear Hindi / Hinglish, keeping all code and technical terms in English.`
        : `Natural bilingual Bengali with technical English terms (Banglish style for students). Explain concepts in rich, fluent Bengali, keeping technical terms and code in English.`;

      const prompt = `
You are an expert academic mentor, educator, and master tutor (প্যাশনেট শিক্ষক ও মেন্টর).
You are generating authentic, high-quality, humanized lecture study notes for a student watching this educational video:

VIDEO TITLE: "${videoTitle}"
${courseTitle ? `COURSE / PLAYLIST: "${courseTitle}"` : ''}

OFFICIAL VIDEO CHAPTERS:
${chaptersText || 'None specified'}

${hasMeaningfulSpeech && transcriptExcerpt 
  ? `VERBATIM TRANSCRIPT WITH TIMESTAMPS:
${transcriptExcerpt}` 
  : `NOTE ON LECTURE FORMAT: In this video tutorial, the instructor teaches and solves problems by writing on an OpenBoard digital whiteboard / blackboard (হোয়াইটবোর্ডে হাতে-কলমে সূত্র প্রতিপাদন, থিওরি ও গাণিতিক সমস্যা সমাধান করছেন)।
- You MUST construct complete, thorough, syllabus-grounded academic lecture notes for: "${videoTitle}" ${courseTitle ? `(Course: "${courseTitle}")` : ''}.
- Provide the full formulas, step-by-step mathematical derivations, reaction equations / concepts, solved practice examples, and MCQ shortcut techniques.
- Break down the lecture systematically into 5 to 8 realistic timestamped chapters (e.g. 00:00, 06:15, 14:30, 26:10, 39:45, 54:00, 68:30).
- NEVER return empty chapters or say "only music was played". Synthesize complete, high-yield academic study notes as taught on the whiteboard.`}

TASK & CRITICAL RULES:
1. EDUCATIONAL ASSESSMENT:
${forceGenerate ? '- USER OVERRIDE: The user explicitly requested "FORCE GENERATE". You MUST set "isEducational": true and extract structured notes, key concepts, or timeline breakdown regardless of video genre.' : `- Rigorously evaluate whether this video is an EDUCATIONAL, INSTRUCTIONAL, or ACADEMIC lesson (e.g. academic curriculum, coding/computer science, science, math, software/creative skill tutorials, language learning, business, how-to guides).
- If this video is clearly NON-EDUCATIONAL entertainment (such as video gaming stream / Let's Play, movie/drama clip, music/song, prank, daily vlog, comedy skit, roast, sports match/highlights, celebrity talk show):
  * Set "isEducational": false
  * Set "contentType": "entertainment"
  * In "nonEducationalReason", write a courteous, natural explanation in ${targetLanguage === 'bn' || targetLanguage === 'mixed' ? 'Bengali (বাংলা)' : 'English'} explaining that this video appears to be entertainment / non-instructional content (e.g. gaming, drama, music, vlog, sports) and that KaizenFlow AI Notes work best for educational tutorials, mentioning they can click "Force Generate" if they still want notes.
  * Return empty arrays for "chapters", "keyTakeaways", and null for "quiz".
- Otherwise (if it teaches any educational concept, skill, theory, or instructional technique), set "isEducational": true, "contentType": "educational", and generate full lecture notes.`}
2. CURRICULUM GROUNDING: Cover the authentic concepts, mathematical definitions, chemical formulas/reactions, physics laws, or algorithms taught in this subject.
3. ${isCodingTopic 
  ? `PROGRAMMING CODE FIDELITY: This is a programming course. Provide clean, authentic code snippets with syntax highlighting in 'codeSnippet' and specify 'codeLanguage' (e.g. cpp, python, java, js).`
  : `STRICT PROHIBITION OF PROGRAMMING CODE: This is a Science / Chemistry / Math / Academic lecture, NOT a programming class. You MUST NOT generate any programming code, Python scripts, or algorithms! 'codeSnippet' and 'codeLanguage' MUST BE null! All mathematical formulas (e.g., A = Z + N, Ksp, etc.), reaction equations, and derivations must be written directly in 'explanation' and 'keyPoints'.`}
4. TIMESTAMPS: Provide accurate or realistic sequential timestamps ("MM:SS") for each concept so students can navigate their study session.
5. ${languageInstruction}
6. SCIENTIFIC & MATHEMATICAL NOTATION: Use standard subscript ('_' or '_{...}') and superscript ('^' or '^{...}') notation for all formulas, chemical equations, powers, and orbital symbols (e.g. d_{x^2-y^2}, d_{z^2}, H_2O, Ca^{2+}, 10^{-3}, x^2 + y^2 = r^2).
7. STRUCTURED JSON: Respond ONLY with a valid JSON object matching this schema:
{
  "isEducational": ${forceGenerate ? 'true' : 'true'},
  "contentType": "educational",
  "nonEducationalReason": null,
  "summary": "Crisp 2-3 sentence overview of what is taught in this lecture.",
  "chapters": [
    {
      "id": "ch_1",
      "title": "Topic Title",
      "timestamp": "MM:SS",
      "seconds": 120,
      "explanation": "Thorough, clear explanation of the concept...",
      "codeSnippet": ${isCodingTopic ? '"// code snippet if taught in this section"' : 'null'},
      "codeLanguage": ${isCodingTopic ? '"cpp"' : 'null'},
      "keyPoints": ["Point 1", "Point 2"]
    }
  ],
  "keyTakeaways": [
    "Crucial takeaway or common trap 1",
    "Crucial takeaway 2"
  ],
  "quiz": [
    {
      "question": "Clear conceptual question testing understanding of this lecture?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "explanation": "Why Option A is correct based on the lecture"
    }
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
        const cleanText = (t: any): string => {
          if (typeof t !== 'string') return '';
          return t.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\t/g, '  ').trim();
        };

        const isEdu = forceGenerate ? true : parsed.isEducational !== false;
        if (!isEdu) {
          const nonEduReason = cleanText(parsed.nonEducationalReason) || cleanText(parsed.summary) || (
            targetLanguage === 'bn' || targetLanguage === 'mixed'
              ? 'ভিডিওটি একটি গান বা বিনোদনমূলক কনটেন্ট হিসেবে শনাক্ত হয়েছে। KaizenFlow-এর এআই নোট সাধারণত টিউটোরিয়াল বা একাডেমিক ক্লাসের জন্য তৈরি। আপনি চাইলে Force Generate বাটনে ক্লিক করতে পারেন।'
              : 'This video appears to be an entertainment or music video rather than an instructional lecture.'
          );

          const nonEduNotes: AILectureNotes = {
            videoId,
            videoTitle,
            language: targetLanguage,
            summary: nonEduReason,
            chapters: [],
            keyTakeaways: [],
            quiz: undefined,
            fullMarkdown: `# ${videoTitle}\n\n${nonEduReason}`,
            generatedAt: new Date().toISOString(),
            isRealTranscriptGrounded: hasMeaningfulSpeech,
            isEducational: false,
            nonEducationalReason: nonEduReason,
            contentType: parsed.contentType || 'music_entertainment',
          };

          return NextResponse.json(
            targetLanguage === 'bn' || targetLanguage === 'mixed'
              ? humanizeLectureNotes(nonEduNotes)
              : nonEduNotes
          );
        }

        const chapters: LectureNoteChapter[] = (parsed.chapters || []).map((ch: any, idx: number) => {
          const rawCode = cleanText(ch.codeSnippet);
          const hasValidCode = isCodingTopic && rawCode !== '' && !rawCode.includes('optional code snippet') && !rawCode.includes('code snippet if taught') && rawCode.toLowerCase() !== 'none' && rawCode.toLowerCase() !== 'null' && rawCode.toLowerCase() !== 'n/a';

          return {
            id: ch.id || `ch_${idx + 1}`,
            title: cleanText(ch.title) || `Section ${idx + 1}`,
            timestamp: ch.timestamp || '00:00',
            seconds: typeof ch.seconds === 'number' ? ch.seconds : parseTimestampToSeconds(ch.timestamp || '00:00'),
            explanation: cleanText(ch.explanation),
            codeSnippet: hasValidCode ? rawCode : undefined,
            codeLanguage: hasValidCode ? (ch.codeLanguage || undefined) : undefined,
            keyPoints: Array.isArray(ch.keyPoints) ? ch.keyPoints.map(cleanText).filter(Boolean) : [],
          };
        });

        const quiz = Array.isArray(parsed.quiz)
          ? parsed.quiz.slice(0, 3).map((q: any) => ({
              question: cleanText(q.question),
              options: Array.isArray(q.options) ? q.options.map(cleanText).filter(Boolean) : [],
              answerIndex: typeof q.answerIndex === 'number' && q.answerIndex >= 0 && q.answerIndex < 4 ? q.answerIndex : 0,
              explanation: cleanText(q.explanation),
            })).filter((q: any) => q.question && q.options.length >= 2)
          : undefined;

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
          quiz: quiz && quiz.length > 0 ? quiz : undefined,
          fullMarkdown: markdown,
          generatedAt: new Date().toISOString(),
          isRealTranscriptGrounded: hasMeaningfulSpeech,
          isEducational: true,
          contentType: 'educational',
        };

        const finalNotes = (targetLanguage === 'bn' || targetLanguage === 'mixed')
          ? humanizeLectureNotes(notes)
          : notes;

        return NextResponse.json(finalNotes);
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
      isEducational: true,
      contentType: 'educational',
    };

    const finalFallbackNotes = (targetLanguage === 'bn' || targetLanguage === 'mixed')
      ? humanizeLectureNotes(fallbackNotes)
      : fallbackNotes;

    return NextResponse.json(finalFallbackNotes);
  } catch (err: any) {
    console.error('Error generating lecture notes:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate lecture notes' }, { status: 500 });
  }
}
