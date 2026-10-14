/**
 * Content Classifier Utility
 * Accurately detects whether a video is educational/instructional, entertainment/non-educational,
 * or a course introduction/promo/overview video with no quiz-worthy lecture content.
 */

export interface ContentClassificationResult {
  isNonEducational: boolean;
  contentType: 'music_entertainment' | 'gaming' | 'vlog' | 'drama' | 'intro_promo' | 'other';
  reason: string;
}

/**
 * Detects whether a video is merely a course introduction, teaser, trailer, promo, or syllabus overview
 * rather than an instructional lecture with testable academic concepts.
 */
export function isCourseIntroVideo(
  videoTitle: string,
  durationSeconds?: number,
  courseTitle?: string
): boolean {
  const combined = `${videoTitle} ${courseTitle || ''}`.toLowerCase();
  const dur = typeof durationSeconds === 'number' ? durationSeconds : 0;

  // Specific technical/academic topics that indicate a real lesson even if "intro" is in the title
  // e.g. "Introduction to Pointers in C" is a real lecture, whereas "Course Introduction" is an intro video
  const hasSpecificLessonTopic = /\b(variable|datatype|data\s+type|loop|while|for\s+loop|if\s+else|switch\s+case|function|pointer|array|string|struct|class|object|inheritance|recursion|sorting|searching|stack|queue|tree|graph|dp|operator|syntax|solve|solution|mechanics|thermodynamics|organic|calculus|derivative|integration|matrix|formula|derivation|theorem)\b/i.test(combined) ||
    /(ভ্যারিয়েবল|ডাটা\s*টাইপ|লুপ|ফাংশন|অ্যারে|পয়েন্টার|স্ট্রিং|স্ট্রাকচার|ক্লাস|অবজেক্ট|রিকার্সন|সর্টিং|সমস্যা\s*সমাধান|সূত্র|প্রতিপাদন|থিওরেম|গাণিতিক)/i.test(combined);

  // Explicit Intro, Trailer, Overview keywords
  const hasExplicitIntroKeywords = /\b(intro\b|introduction\b|course\s+intro|course\s+introduction|welcome\b|welcome\s+to|course\s+trailer|trailer\b|teaser\b|promo\b|preview\b|overview\b|course\s+overview|syllabus|curriculum|outline\b|getting\s+started|orientation\b|roadmap\b|prerequisites|guideline|guidelines|study\s+plan|about\s+the\s+course|announcement)\b/i.test(combined) ||
    /(কোর্স\s*পরিচিতি|পরিচিতি\s*পর্ব|ইন্ট্রো\b|ইন্ট্রোডাকশন|ভূমিকা\b|কোর্স\s*ওভারভিউ|অরিয়েন্টেশন|সিলেবাস|গাইডলাইন|শুরুর\s*কথা|প্রথম\s*ক্লাস|প্রস্তুতি|রুটিন|প্রিভিউ|ট্রেইলার)/i.test(combined);

  // If explicit intro keywords are present without a specific lecture concept and duration is under 6 minutes
  if (hasExplicitIntroKeywords && !hasSpecificLessonTopic && (dur === 0 || dur <= 360)) {
    return true;
  }

  // Claiming "Full Course" / "Complete Course" in under 3.5 minutes (e.g. 1:47 min teaser video)
  const hasFullCourseClaim = /\b(full\s+course|complete\s+course|crash\s+course|all\s+in\s+one|ফুল\s*কোর্স|সম্পূর্ণ\s*কোর্স)\b/i.test(combined);
  if (dur > 0 && dur <= 210 && hasFullCourseClaim) {
    return true;
  }

  // Very short video (under 2 minutes / 120s) with no specific concept taught
  if (dur > 0 && dur <= 120 && !hasSpecificLessonTopic) {
    return true;
  }

  return false;
}

export function classifyVideoContent(
  videoTitle: string,
  courseTitle?: string,
  videoId?: string,
  durationSeconds?: number
): ContentClassificationResult {
  // 1. Check if it is a Course Introduction / Overview / Promo video
  if (isCourseIntroVideo(videoTitle, durationSeconds, courseTitle)) {
    return {
      isNonEducational: true,
      contentType: 'intro_promo',
      reason: 'এই ভিডিওটি একটি কোর্স পরিচিতি বা ইন্ট্রোডাকশন ভিডিও, যেখানে কোনো মূল লেকচার কনসেপ্ট পড়ানো হয়নি। বিষয়ভিত্তিক লেকচার ভিডিওগুলোতে স্বয়ংক্রিয়ভাবে কুইজ পেয়ে যাবেন।',
    };
  }

  // 2. Check if there are cached AI notes in localStorage that already evaluated it as non-educational
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

  // 3. Explicit Educational Indicators (High-confidence safeguards to prevent false positives)
  const hasExplicitEducationalKeywords = /\b(tutorial|lecture|class|lesson|course|chapter|learn|study|introduction\s+to|intro\s+to|basics\s+of|fundamentals\s+of|crash\s+course|full\s+course|complete\s+course|masterclass|bootcamp|workshop|walkthrough|guide|how\s+to|explained|explanation|deep\s+dive|problem\s+solving|solution|solved|formula|derivation|concept|notes|syllabus|question\s+bank|board\s+exam|model\s+test|test\s+paper|hsc|ssc|jsc|psc|admission|buet|du|medical|bcs|iit|jee|neet|sat|ielts|toefl|gre|gmat|gate|upsc|chemistry|physics|biology|botany|zoology|anatomy|physiology|biochemistry|math|mathematics|calculus|algebra|geometry|trigonometry|statistics|probability|programming|coding|software|developer|computer\s+science|algorithm|algorithms|data\s+structure|data\s+structures|\bdsa\b|web\s+dev|frontend|backend|full\s*stack|html|css|javascript|typescript|react|next\.?js|node\.?js|angular|vue|python|django|flask|java|spring|c\+\+|cpp|golang|rust|swift|kotlin|flutter|dart|php|laravel|sql|database|docker|kubernetes|devops|aws|git|github|linux|api|machine\s+learning|deep\s+learning|\bai\b|artificial\s+intelligence|data\s+science|cybersecurity|networking|ui\/ux|figma|photoshop|illustrator|blender|accounting|finance|economics)\b/i.test(combinedTitle);

  if (hasExplicitEducationalKeywords) {
    return {
      isNonEducational: false,
      contentType: 'other',
      reason: '',
    };
  }

  // 4. Clear Entertainment & Non-Educational Keywords (Zero-ambiguity entertainment markers)
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
