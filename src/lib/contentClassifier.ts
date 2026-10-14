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
  // 1. Check if there are cached AI notes in localStorage that already evaluated it as non-educational
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
              reason: 'এই ভিডিওটি একটি গান বা বিনোদনমূলক কনটেন্ট হিসেবে শনাক্ত হয়েছে। KaizenFlow কুইজ শুধুমাত্র শিক্ষামূলক লেকচার ও টিউটোরিয়ালের বিষয়বস্তু মূল্যায়নের জন্য তৈরি।',
            };
          }
        }
      }
    } catch {}
  }

  const combinedTitle = `${videoTitle} ${courseTitle || ''}`.toLowerCase();

  // 2. Explicit Educational Indicators (High-confidence safeguards to prevent false positives)
  const hasExplicitEducationalKeywords = /\b(tutorial|lecture|class|lesson|course|chapter|learn|study|introduction\s+to|intro\s+to|basics\s+of|fundamentals\s+of|crash\s+course|full\s+course|complete\s+course|masterclass|bootcamp|workshop|walkthrough|guide|how\s+to|explained|explanation|deep\s+dive|problem\s+solving|solution|solved|formula|derivation|concept|notes|syllabus|question\s+bank|board\s+exam|model\s+test|test\s+paper|hsc|ssc|jsc|psc|admission|buet|du|medical|bcs|iit|jee|neet|sat|ielts|toefl|gre|gmat|gate|upsc|chemistry|physics|biology|botany|zoology|anatomy|physiology|biochemistry|math|mathematics|calculus|algebra|geometry|trigonometry|statistics|probability|programming|coding|software|developer|computer\s+science|algorithm|algorithms|data\s+structure|data\s+structures|\bdsa\b|web\s+dev|frontend|backend|full\s*stack|html|css|javascript|typescript|react|next\.?js|node\.?js|angular|vue|python|django|flask|java|spring|c\+\+|cpp|golang|rust|swift|kotlin|flutter|dart|php|laravel|sql|database|docker|kubernetes|devops|aws|git|github|linux|api|machine\s+learning|deep\s+learning|\bai\b|artificial\s+intelligence|data\s+science|cybersecurity|networking|ui\/ux|figma|photoshop|illustrator|blender|accounting|finance|economics)\b/i.test(combinedTitle);

  if (hasExplicitEducationalKeywords) {
    return {
      isNonEducational: false,
      contentType: 'other',
      reason: '',
    };
  }

  // 3. Clear Entertainment & Non-Educational Keywords (Zero-ambiguity entertainment markers)
  const isMusic = /\b(official\s+music\s+video|official\s+video|official\s+audio|lyric\s+video|lyrics\s+video|audio\s+track|audio\s+jukebox|full\s+album|album\s+song|band\s+song|bangla\s+song|hindi\s+song|english\s+song|music\s+video|audio\s+song|lofi\s+beats|lofi\s+remix|dj\s+remix|slowed\s*\+\s*reverb|slowed\s+and\s+reverb|bass\s+boosted|original\s+soundtrack|\bost\b|artcell|oniket\s+prantor|aurthohin|warfaze|miles|shironamhin|nagar\s+baul|habib\s+wahid|tahsan|arijit\s+singh|atif\s+aslam|anupam\s+roy|taylor\s+swift|ed\s+sheeran|eminem|drake|the\s+weeknd|k-?pop|bts|blackpink|singing\s+cover|guitar\s+cover|acoustic\s+cover|unplugged|live\s+concert|concert\s+performance)\b/i.test(combinedTitle);

  const isGaming = /\b(gameplay|playthrough|let's\s+play|gaming\s+montage|funny\s+moments|pubg\s+mobile|\bpubg\b|free\s+fire|valorant|gta\s+5|gta\s+v|minecraft\s+gameplay|roblox\s+gameplay)\b/i.test(combinedTitle);

  const isVlogComedy = /\b(prank\s+video|prank\s+call|\bprank\b|comedy\s+sketch|standup\s+comedy|stand\s+up\s+comedy|roast\s+video|\broast\b|reaction\s+video|reacts\s+to|daily\s+vlog|lifestyle\s+vlog|travel\s+vlog|food\s+vlog|family\s+vlog|mukbang|eating\s+show|24\s+hour\s+challenge|24\s+hours\s+in|meme\s+compilation)\b/i.test(combinedTitle);

  const isDramaMovie = /\b(movie\s+trailer|teaser\s+trailer|official\s+trailer|\bteaser\b|full\s+movie|movie\s+scene|bangla\s+natok|eid\s+natok|\bnatok\b|telefilm|drama\s+serial|web\s+series|short\s+film|blockbuster\s+movie|match\s+highlights|full\s+match|goals\s+and\s+highlights|\bwwe\b|\bipl\b|\bbpl\b|penalty\s+shootout|knockout\s+highlights)\b/i.test(combinedTitle);

  if (isMusic || isGaming || isVlogComedy || isDramaMovie) {
    let contentType: 'music_entertainment' | 'gaming' | 'vlog' | 'drama' | 'other' = 'music_entertainment';
    if (isGaming) contentType = 'gaming';
    else if (isVlogComedy) contentType = 'vlog';
    else if (isDramaMovie) contentType = 'drama';

    return {
      isNonEducational: true,
      contentType,
      reason: 'এই ভিডিওটি একটি গান বা বিনোদনমূলক কনটেন্ট হিসেবে শনাক্ত হয়েছে। KaizenFlow কুইজ শুধুমাত্র শিক্ষামূলক লেকচার ও টিউটোরিয়ালের বিষয়বস্তু মূল্যায়নের জন্য তৈরি।',
    };
  }

  return {
    isNonEducational: false,
    contentType: 'other',
    reason: '',
  };
}
