/**
 * Content Classifier Utility
 * Accurately detects whether a video is educational/instructional or entertainment/non-educational.
 */

export interface ContentClassificationResult {
  isNonEducational: boolean;
  contentType: 'music_entertainment' | 'gaming' | 'vlog' | 'drama' | 'other';
  reason: string;
}

export function classifyVideoContent(
  videoTitle: string,
  courseTitle?: string,
  videoId?: string
): ContentClassificationResult {
  // 1. Check if there are cached AI notes in localStorage that already marked it as non-educational
  if (typeof window !== 'undefined' && videoId) {
    try {
      const languages = ['bn', 'en', 'mixed', 'hi'];
      for (const lang of languages) {
        const raw = localStorage.getItem(`kaizenflow_ai_notes_${videoId}_${lang}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.isEducational === false) {
            return {
              isNonEducational: true,
              contentType: (parsed.contentType as any) || 'music_entertainment',
              reason: parsed.nonEducationalReason || parsed.summary || 'এই ভিডিওটি মনে হচ্ছে বিনোদনমূলক বা অ-শিক্ষামূলক কনটেন্ট, যেমন গেমিং, ড্রামা, মিউজিক বা ব্লগের মতো। KaizenFlow কুইজ শিক্ষামূলক টিউটোরিয়ালগুলোর কনসেপ্ট যাচাইয়ের জন্য সবচেয়ে উপযোগী, তাই আপনি যদি তবুও কুইজ চান তাহলে ‘Force Generate’ অপশনটি ব্যবহার করতে পারেন।',
            };
          }
        }
      }
    } catch {}
  }

  const combinedTitle = `${videoTitle} ${courseTitle || ''}`.toLowerCase();

  // 2. Explicit Educational Indicators (Prevent false negatives on creative academic titles)
  const hasExplicitEducationalKeywords = /\b(tutorial|lecture|class|lesson|course|chapter|learn|introduction\s+to|basics\s+of|crash\s+course|full\s+course|problem\s+solving|solution|formula|derivation|chemistry|physics|biology|math|mathematics|calculus|algebra|programming|coding|algorithm|data\s+structure|web\s+dev|frontend|backend|software|how\s+to|guide|explained|explanation|syllabus|hsc|ssc|admission|buet|du|medical|exam|question\s+bank)\b/i.test(combinedTitle);

  if (hasExplicitEducationalKeywords) {
    return {
      isNonEducational: false,
      contentType: 'other',
      reason: '',
    };
  }

  // 3. Clear Entertainment & Non-Educational Keywords (Zero Hallucination)
  const isMusic = /\b(official\s+music\s+video|official\s+video|official\s+audio|lyric\s+video|lyrics\s+video|full\s+album|lofi\s+beats|dj\s+remix|original\s+soundtrack|\bost\b|band\s+song|bangla\s+song|music\s+video|audio\s+song|album\s+song|artcell|oniket\s+prantor|singing|guitar\s+cover|acoustic\s+cover|concert|live\s+music)\b/i.test(combinedTitle);

  const isGaming = /\b(gameplay|playthrough|let's\s+play|gaming\s+montage|funny\s+moments|pubg|free\s+fire|valorant|gta\s+5|minecraft)\b/i.test(combinedTitle);

  const isVlogComedy = /\b(prank\s+video|prank|comedy\s+sketch|standup\s+comedy|roast\s+video|reaction\s+video|daily\s+vlog|travel\s+vlog|food\s+vlog|mukbang|24\s+hour\s+challenge)\b/i.test(combinedTitle);

  const isDramaMovie = /\b(movie\s+trailer|teaser\s+trailer|teaser|full\s+movie|movie\s+scene|natok|telefilm|drama\s+serial|web\s+series|match\s+highlights|full\s+match|goals|knockout|\bwwe\b|\bipl\b|\bbpl\b)\b/i.test(combinedTitle);

  if (isMusic || isGaming || isVlogComedy || isDramaMovie) {
    let contentType: 'music_entertainment' | 'gaming' | 'vlog' | 'drama' | 'other' = 'music_entertainment';
    if (isGaming) contentType = 'gaming';
    else if (isVlogComedy) contentType = 'vlog';
    else if (isDramaMovie) contentType = 'drama';

    return {
      isNonEducational: true,
      contentType,
      reason: 'এই ভিডিওটি মনে হচ্ছে বিনোদনমূলক বা অ-শিক্ষামূলক কনটেন্ট, যেমন গেমিং, ড্রামা, মিউজিক বা ব্লগের মতো। KaizenFlow কুইজ শিক্ষামূলক টিউটোরিয়ালের বিষয়বস্তু যাচাইয়ের জন্য সবচেয়ে উপযোগী, তাই আপনি যদি তবুও কুইজ দিতে চান তাহলে ‘Force Generate’ অপশনটি ব্যবহার করতে পারেন।',
    };
  }

  return {
    isNonEducational: false,
    contentType: 'other',
    reason: '',
  };
}
