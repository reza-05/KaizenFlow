import { NextRequest, NextResponse } from 'next/server';
import { getSubtitles } from 'youtube-caption-extractor';
import { LectureQuizQuestion } from '@/types';
import { decodeHtmlEntities } from '@/lib/youtube';
import { humanizeBengaliText } from '@/lib/bengaliHumanizer';

// Scrape official YouTube chapters if available
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

    const regex = /"macroMarkersListItemRenderer":\{"title":\{"simpleText":"(.*?)"\}.*?"timeDescription":\{"simpleText":"(.*?)"\}/g;
    let m;
    while ((m = regex.exec(html)) !== null) {
      const title = decodeHtmlEntities(m[1]);
      const timeDesc = m[2];
      const parts = timeDesc.trim().replace(/[\[\]]/g, '').split(':').map(p => parseInt(p, 10));
      let seconds = 0;
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        seconds = parts[0] * 60 + parts[1];
      } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      if (!chapters.some(c => c.seconds === seconds)) {
        chapters.push({ title, timeDesc, seconds });
      }
    }

    return chapters.sort((a, b) => a.seconds - b.seconds);
  } catch {
    return [];
  }
}

// Groq API caller for quiz generation
async function generateQuizWithGroq(apiKey: string, prompt: string): Promise<string> {
  const candidateModels = [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
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
              content: 'You are an exceptional computer science professor, academic examiner, and senior educator. You generate strictly self-contained, technically rigorous, conceptual Multiple Choice Questions (MCQ) testing the core subject matter of educational video lectures. You respond strictly in valid JSON matching the requested schema with exactly 5 conceptual questions.',
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
        console.warn(`[Quiz-Groq] Model ${model} failed (${res.status}):`, errText);
        lastError = new Error(`Groq API Error (${res.status}): ${errText}`);
        continue;
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (content) {
        return content;
      }
    } catch (err) {
      console.warn(`[Quiz-Groq] Request failed for model ${model}:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('All Groq candidate models failed to generate quiz response');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const videoId = (body.videoId || '').trim();
    const videoTitle = (body.videoTitle || 'Lecture Video').trim();
    const courseTitle = (body.courseTitle || '').trim();
    const language = (body.language || 'bn').trim(); // 'bn' or 'en'
    const customApiKey = (body.customApiKey || '').trim();

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // 1. Fetch transcript lines if available
    let subtitles: Array<{ start: string | number; text: string }> = [];
    try {
      subtitles = await getSubtitles({ videoID: videoId, lang: language === 'bn' ? 'bn' : 'en' });
    } catch {
      try {
        subtitles = await getSubtitles({ videoID: videoId });
      } catch {}
    }

    // Check for non-educational content upfront with comprehensive academic safeguards
    const combinedTitle = `${videoTitle} ${courseTitle}`.toLowerCase();
    const hasExplicitEducationalKeywords = /\b(tutorial|lecture|class|lesson|course|chapter|learn|study|introduction\s+to|intro\s+to|basics\s+of|fundamentals\s+of|crash\s+course|full\s+course|complete\s+course|masterclass|bootcamp|workshop|walkthrough|guide|how\s+to|explained|explanation|deep\s+dive|problem\s+solving|solution|solved|formula|derivation|concept|notes|syllabus|question\s+bank|board\s+exam|model\s+test|test\s+paper|hsc|ssc|jsc|psc|admission|buet|du|medical|bcs|iit|jee|neet|sat|ielts|toefl|gre|gmat|gate|upsc|chemistry|physics|biology|botany|zoology|anatomy|physiology|biochemistry|math|mathematics|calculus|algebra|geometry|trigonometry|statistics|probability|programming|coding|software|developer|computer\s+science|algorithm|algorithms|data\s+structure|data\s+structures|\bdsa\b|web\s+dev|frontend|backend|full\s*stack|html|css|javascript|typescript|react|next\.?js|node\.?js|angular|vue|python|django|flask|java|spring|c\+\+|cpp|golang|rust|swift|kotlin|flutter|dart|php|laravel|sql|database|docker|kubernetes|devops|aws|git|github|linux|api|machine\s+learning|deep\s+learning|\bai\b|artificial\s+intelligence|data\s+science|cybersecurity|networking|ui\/ux|figma|photoshop|illustrator|blender|accounting|finance|economics)\b/i.test(combinedTitle);

    const hasStrongEntertainmentTitle = !hasExplicitEducationalKeywords && /\b(official\s+music\s+video|official\s+video|official\s+audio|lyric\s+video|lyrics\s+video|audio\s+track|audio\s+jukebox|full\s+album|album\s+song|band\s+song|bangla\s+song|hindi\s+song|english\s+song|music\s+video|audio\s+song|lofi\s+beats|lofi\s+remix|dj\s+remix|slowed\s*\+\s*reverb|slowed\s+and\s+reverb|bass\s+boosted|original\s+soundtrack|\bost\b|artcell|oniket\s+prantor|aurthohin|warfaze|miles|shironamhin|nagar\s+baul|habib\s+wahid|tahsan|arijit\s+singh|atif\s+aslam|anupam\s+roy|taylor\s+swift|ed\s+sheeran|eminem|drake|the\s+weeknd|k-?pop|bts|blackpink|singing\s+cover|guitar\s+cover|acoustic\s+cover|unplugged|live\s+concert|concert\s+performance|movie\s+trailer|teaser\s+trailer|official\s+trailer|\bteaser\b|full\s+movie|movie\s+scene|bangla\s+natok|eid\s+natok|\bnatok\b|telefilm|drama\s+serial|web\s+series|short\s+film|blockbuster\s+movie|match\s+highlights|full\s+match|goals\s+and\s+highlights|\bwwe\b|\bipl\b|\bbpl\b|penalty\s+shootout|knockout\s+highlights|gameplay|playthrough|let's\s+play|gaming\s+montage|funny\s+moments|pubg\s+mobile|\bpubg\b|free\s+fire|valorant|gta\s+5|gta\s+v|minecraft\s+gameplay|roblox\s+gameplay|prank\s+video|prank\s+call|\bprank\b|comedy\s+sketch|standup\s+comedy|stand\s+up\s+comedy|roast\s+video|\broast\b|reaction\s+video|reacts\s+to|daily\s+vlog|lifestyle\s+vlog|travel\s+vlog|food\s+vlog|family\s+vlog|mukbang|eating\s+show|24\s+hour\s+challenge|24\s+hours\s+in|meme\s+compilation)\b/i.test(combinedTitle);

    const totalSubs = subtitles.length;
    const musicSubCount = subtitles.filter(s => /\[(?:Music|Applause|Singing|Cheering)\]|[♪♫]/i.test(s.text)).length;
    const isAlmostExclusivelyMusicSubs = totalSubs > 0 && (musicSubCount / totalSubs) >= 0.60;

    if (hasStrongEntertainmentTitle || isAlmostExclusivelyMusicSubs) {
      return NextResponse.json({
        isEducational: false,
        contentType: 'music_entertainment',
        reason: 'এই ভিডিওটি একটি গান বা বিনোদনমূলক কনটেন্ট হিসেবে শনাক্ত হয়েছে। KaizenFlow কুইজ শুধুমাত্র শিক্ষামূলক লেকচার ও টিউটোরিয়ালের বিষয়বস্তু মূল্যায়নের জন্য তৈরি।',
        quiz: []
      });
    }

    // 2. Fetch official chapter markers
    const officialChapters = await fetchYouTubeOfficialChapters(videoId);

    const chaptersText = officialChapters.length > 0
      ? officialChapters.map(c => `[${c.timeDesc}] ${c.title}`).join('\n')
      : '';

    // Sample transcript text
    const cleanWords = subtitles
      .map(s => s.text.replace(/\[.*?\]|\(.*?\)|[♪♫]/g, '').trim())
      .filter(t => t.length > 0)
      .join(' ')
      .slice(0, 3500);

    const apiKey = customApiKey || process.env.GROQ_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json({ error: 'AI API Key is not configured' }, { status: 500 });
    }

    const prompt = `
You are an expert academic evaluator and master tutor (প্যাশনেট শিক্ষক ও মেন্টর).
Evaluate the following video content and generate a high-quality conceptual lecture quiz:

VIDEO TITLE: "${videoTitle}"
${courseTitle ? `COURSE / PLAYLIST: "${courseTitle}"` : ''}

${chaptersText ? `OFFICIAL CHAPTER OUTLINE:\n${chaptersText}\n` : ''}
${cleanWords ? `TRANSCRIPT EXCERPT:\n${cleanWords}\n` : ''}

TASK & EDUCATIONAL ASSESSMENT:
1. EDUCATIONAL ASSESSMENT:
   First evaluate whether this video is an EDUCATIONAL, INSTRUCTIONAL, ACADEMIC, or SKILL-LEARNING lesson (e.g. computer science, coding, sciences, math, engineering, humanities, business, tutorials, lectures, how-to guides).
   - If this video is clearly ENTERTAINMENT / NON-EDUCATIONAL (such as music songs, music videos, movie/drama clips, gaming streams/let's plays, comedy pranks, daily vlogs, sports match highlights):
     * Set "isEducational": false
     * Set "contentType": "music_entertainment" (or "gaming" / "vlog" / "drama")
     * Set "reason": "এই ভিডিওটি একটি গান বা বিনোদনমূলক কনটেন্ট হিসেবে শনাক্ত হয়েছে। KaizenFlow কুইজ শুধুমাত্র শিক্ষামূলক লেকচার ও টিউটোরিয়ালের বিষয়বস্তু মূল্যায়নের জন্য তৈরি।"
     * Set "quiz": []
     * Respond with this JSON structure and STOP.
   - Otherwise, set "isEducational": true, "contentType": "educational", and generate EXACTLY 5 high-yield, challenging, and strictly conceptual Multiple Choice Questions (MCQ) testing the core subject matter taught in this video lecture.

CRITICAL RULES & ZERO-TOLERANCE GUIDELINES:
1. STRICTLY FORBIDDEN QUESTIONS:
   - NEVER ask chronological, procedural, or meta questions like:
     * "What is discussed at the start of the video?"
     * "What happened at timestamp 17:40?"
     * "What did the teacher show in the first section?"
     * "What was the teacher's main takeaway?"
   - Such questions are completely worthless and infuriate students.

2. WHAT YOU MUST TEST INSTEAD (SUBJECT CONCEPTS):
   - Real, authentic subject matter:
     * Specific code syntax, variable types, operators, memory behavior, compilation errors, execution flow
     * Mathematical formulas, calculation steps, derivation logic, boundary conditions
     * Science laws, physical properties, chemical reactions, mechanisms, definitions
     * Practical real-world bugs, common developer/student traps, and edge-case behaviors
   - If the video is about "Two numbers sum in C++" for example: test C++ data types (int vs long long overflow), cin/cout syntax, operator precedence, uninitialized garbage values, or formatting.
   - If about "Differentiation": test derivative rules, power rule, product rule, chain rule, slope interpretation.

3. OPTION QUALITY:
   - Provide 4 realistic, plausible options for each question (A, B, C, D).
   - DO NOT write silly, obvious joke options. Every distractor must look like a credible answer or common misconception.
   - Randomly distribute the correct answer index across 0, 1, 2, and 3. DO NOT set all questions to index 0.

4. MANDATORY SELF-CONTAINEDNESS (সম্পূর্ণ ও স্বয়ংসম্পূর্ণ প্রশ্ন):
   - Every question MUST be 100% self-contained with all code snippets, inputs, and context explicitly written inside the question text.
   - If a question asks for a specific numerical value, return value, or output, the EXACT code snippet, variable names, or string literal MUST be explicitly shown inside the question.
   - If asking about code execution or output, ALWAYS put the exact code snippet inside the question text formatted with code or quotes.
   - NEVER introduce a variable, string, or number in the explanation that was not explicitly present in the question!

5. LANGUAGE:
   - Generate all questions, options, and explanations in natural, high-quality BENGALI (বাংলা) as spoken by a top academic mentor (BUET / 10 Minute School instructor).
   - Keep technical terms and programming code in English (e.g., Variable, Function, int, Loop, Syntax Error, Pointer, Resistor, Derivative, sizeof).
   - Each explanation must clearly explain WHY the correct answer is right and clarify the core concept.

RESPOND STRICTLY IN VALID JSON with this exact schema:
{
  "isEducational": true,
  "contentType": "educational",
  "reason": null,
  "quiz": [
    {
      "question": "C তে sizeof(\"Hello\") এর মান কত বাইট হবে?",
      "options": ["6", "5", "7", "4"],
      "answerIndex": 0,
      "explanation": "sizeof অপারেটর string literal এর শেষের null-character (\\\\0)-কেও গণনা করে। তাই 5 অক্ষরের সাথে 1 যোগ হয়ে মোট 6 বাইট হয়।"
    }
  ]
}
`;

    const rawResponse = await generateQuizWithGroq(apiKey, prompt);
    let parsed: any = {};
    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      // Clean potential markdown wrap
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    }

    // Check if the LLM flagged the video as non-educational
    if (parsed.isEducational === false) {
      return NextResponse.json({
        isEducational: false,
        contentType: parsed.contentType || 'music_entertainment',
        reason: parsed.reason || 'এই ভিডিওটি একটি গান বা বিনোদনমূলক কনটেন্ট হিসেবে শনাক্ত হয়েছে। KaizenFlow কুইজ শুধুমাত্র শিক্ষামূলক লেকচার ও টিউটোরিয়ালের বিষয়বস্তু মূল্যায়নের জন্য তৈরি।',
        quiz: []
      });
    }

    const rawQuiz = Array.isArray(parsed.quiz) ? parsed.quiz : [];
    if (rawQuiz.length === 0) {
      return NextResponse.json({ error: 'Failed to generate valid quiz questions' }, { status: 500 });
    }

    // Sanitize and humanize questions with self-containedness validator
    const sanitizedQuiz: LectureQuizQuestion[] = rawQuiz.slice(0, 5).map((q: any) => {
      let questionText = humanizeBengaliText(q.question || '');
      let explanationText = humanizeBengaliText(q.explanation || '');

      // Safety patch: If a question asks about sizeof string literal but forgot to specify the string,
      // and explanation mentions a specific string like "Hello", inject it directly into the question!
      if (/sizeof.*string\s*literal/i.test(questionText) && !/["'].+["']/.test(questionText)) {
        const matchStr = explanationText.match(/["']([^"']+)["']/);
        if (matchStr && matchStr[1]) {
          questionText = questionText.replace(/একটি\s*string\s*literal\s*এর/gi, `\`"${matchStr[1]}"\` string literal এর`);
        }
      }

      return {
        question: questionText,
        options: (q.options || []).map((opt: string) => humanizeBengaliText(opt)),
        answerIndex: typeof q.answerIndex === 'number' && q.answerIndex >= 0 && q.answerIndex <= 3 ? q.answerIndex : 0,
        explanation: explanationText,
      };
    });

    return NextResponse.json({ quiz: sanitizedQuiz });
  } catch (err: any) {
    console.error('[API /api/quiz] Error generating quiz:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
