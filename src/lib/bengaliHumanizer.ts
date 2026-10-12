/**
 * bengaliHumanizer.ts
 * Transforms robotic machine-translated Bengali text into natural, fluent, 
 * humanized academic Bengali as written by top Bangladeshi mentors/educators.
 */

import { AILectureNotes, LectureNoteChapter } from '@/types';

// Map of common AI-translated / Google-Translate cliches to humanized Bengali
const HUMANIZATION_RULES: Array<[RegExp, string | ((...args: string[]) => string)]> = [
  // 1. Robotic Instructor Clichés
  [/ইন্সট্রাক্টর\s*কিছু\s*সাধারণ\s*সমস্যার\s*সমাধান\s*দেখান:?/gi, 'কমন কিছু সমস্যা ও তাৎক্ষণিক সমাধান:'],
  [/ইন্সট্রাক্টর\s*সাধারণ\s*সমস্যার\s*সমাধান\s*দেখান:?/gi, 'কমন কিছু সমস্যা ও তাৎক্ষণিক সমাধান:'],
  [/ইন্সট্রাক্টর\s*কিছু\s*সমস্যার\s*সমাধান\s*দেখান:?/gi, 'কমন সমস্যা ও সমাধান:'],
  [/ইন্সট্রাক্টর\s*দেখান\s*যে/gi, 'লক্ষ্য করুন যে'],
  [/ইন্সট্রাক্টর\s*দেখান:?/gi, 'মনে রাখার মূল বিষয়:'],
  [/ইন্সট্রাক্টর\s*আলোচনা\s*করেন\s*যে/gi, 'এখানে ব্যাখ্যা করা হয়েছে যে'],
  [/ইন্সট্রাক্টর\s*পরামর্শ\s*দেন:?/gi, 'বিশেষ পরামর্শ:'],
  [/ইন্সট্রাক্টর\s*উল্লেখ\s*করেন\s*যে/gi, 'উল্লেখ্য যে'],

  // 2. Dim light mistranslations (Translating English "dim" to "ধূসর" / gray)
  [/খুব\s*ধূসর\s*হবে/gi, 'খুব মৃদু বা ডিম (dim) হয়ে যাবে'],
  [/ধূসর\s*হবে/gi, 'মৃদু বা ডিম (dim) হয়ে যাবে'],
  [/ধূসর\s*হয়ে\s*যাবে/gi, 'মৃদু বা ডিম (dim) হয়ে যাবে'],
  [/ধূসর\s*আলো/gi, 'মৃদু আলো (dim light)'],
  [/আলো\s*ধূসর/gi, 'আলো মৃদু বা অনুজ্জ্বল'],

  // 3. Blink mistranslations ("টিমটিম" -> "ব্লিঙ্ক (blink)")
  [/খুব\s*দ্রুত\s*টিমটিম\s*করে/gi, 'খুব দ্রুত ব্লিঙ্ক (blink) করে'],
  [/দ্রুত\s*টিমটিম\s*করে/gi, 'দ্রুত ব্লিঙ্ক (blink) করে'],
  [/টিমটিম\s*করে/gi, 'ব্লিঙ্ক (blink) করে'],
  [/টিমটিম\s*করলে/gi, 'ব্লিঙ্ক করলে'],

  // 4. Robotic Symptom Question-Bullets (e.g., "• LED না জ্বলে? রেজিস্টর..." -> "• LED না জ্বললে: রেজিস্টর...")
  [/•\s*([A-Za-z0-9_\s]+)\s*না\s*জ্বলে\?/gi, '• $1 না জ্বললে:'],
  [/([A-Za-z0-9_\s]+)\s*না\s*জ্বলে\?/gi, '$1 না জ্বললে:'],
  [/•\s*([A-Za-z0-9_\s]+)\s*দ্রুত\s*টিমটিম\s*করে\?/gi, '• $1 খুব দ্রুত ব্লিঙ্ক করলে:'],
  [/([A-Za-z0-9_\s]+)\s*দ্রুত\s*টিমটিম\s*করে\?/gi, '$1 খুব দ্রুত ব্লিঙ্ক করলে:'],
  [/•\s*কোড\s*কম্পাইল\s*না\s*হলে/gi, '• কোড কম্পাইল এরর দিলে:'],

  // 5. Heavy robotic passive voice -> Active natural phrasing
  [/ব্যবহার\s*করে\s*বাস্তব\s*হার্ডওয়্যার\s*না\s*থাকলেও\s*সার্কিট\s*ও\s*কোডের\s*কার্যকারিতা\s*পরীক্ষা\s*করা\s*হয়/gi, 'ব্যবহার করে ফিজিক্যাল হার্ডওয়্যার ছাড়াই সার্কিট ও কোড সরাসরি টেস্ট করে নেওয়া যায়'],
  [/বাস্তব\s*হার্ডওয়্যার\s*না\s*থাকলেও/gi, 'ফিজিক্যাল হার্ডওয়্যার ছাড়াই'],
  [/সার্কিট\s*ও\s*কোডের\s*কার্যকারিতা\s*পরীক্ষা\s*করা\s*হয়/gi, 'সার্কিট ও কোড অনায়াসেই টেস্ট ও ভেরিফাই করা যায়'],
  [/কার্যকারিতা\s*পরীক্ষা\s*করা\s*হয়/gi, 'কার্যকারিতা সহজেই টেস্ট ও যাচাই করা যায়'],
  [/কোড\s*সঠিকভাবে\s*কাজ\s*করছে\s*নিশ্চিত\s*হয়/gi, 'কোড ঠিকঠাক কাজ করছে কি না নিশ্চিত হওয়া যায়'],
  [/সঠিকভাবে\s*কাজ\s*করছে\s*নিশ্চিত\s*হয়/gi, 'ঠিকঠাক কাজ করছে কি না নিশ্চিত হওয়া যায়'],
  [/কাজ\s*করছে\s*নিশ্চিত\s*হয়/gi, 'কাজ করছে কি না নিশ্চিত হওয়া যায়'],
  [/নিশ্চিত\s*করা\s*হয়/gi, 'নিশ্চিত হওয়া যায়'],
  [/পরীক্ষা\s*করা\s*হয়/gi, 'টেস্ট বা যাচাই করা যায়'],
  [/প্রদর্শন\s*করা\s*হয়েছে/gi, 'তুলে ধরা হয়েছে'],
  [/প্রদর্শন\s*করেন/gi, 'তুলে ধরেন'],
  [/পর্যবেক্ষণ\s*করা\s*হয়/gi, 'লক্ষ্য করা যায়'],
  [/লক্ষ্য\s*করা\s*হয়/gi, 'দেখা যায়'],

  // 6. Naturalizing imperatives and phrasing
  [/পুনরায়\s*পরীক্ষা\s*করুন/gi, 'পুনরায় টেস্ট করে দেখুন'],
  [/চেক\s*করুন\।/gi, 'চেক করে নিন।'],
  [/ইনস্ট্রাক্টরের\s*মূল\s*টেকঅ্যাওয়ে\s*হলো:?/gi, 'লেকচারের মূল টেকঅ্যাওয়ে:'],

  // 7. Cleaning up awkward machine bullet punctuation
  [/;\s*মান\s*কমিয়ে/gi, ', তাই মান কিছুটা কমিয়ে'],
  [/delay\s*সময়\s*বাড়ান/gi, 'delay-র সময় কিছুটা বাড়িয়ে দিন'],
];

/**
 * Humanizes a Bengali string by replacing stiff machine-translation artifacts
 * with warm, natural, idiomatic academic phrasing.
 */
export function humanizeBengaliText(text: string): string {
  if (!text || typeof text !== 'string') return text || '';

  let result = text;
  for (const [regex, replacement] of HUMANIZATION_RULES) {
    result = result.replace(regex, replacement as any);
  }

  return result;
}

/**
 * Recursively humanizes all fields of an AILectureNotes object.
 */
export function humanizeLectureNotes(notes: AILectureNotes): AILectureNotes {
  if (!notes) return notes;

  const humanizeChapter = (ch: LectureNoteChapter): LectureNoteChapter => ({
    ...ch,
    title: humanizeBengaliText(ch.title),
    explanation: humanizeBengaliText(ch.explanation),
    keyPoints: Array.isArray(ch.keyPoints) 
      ? ch.keyPoints.map(humanizeBengaliText)
      : ch.keyPoints,
  });

  const chapters = Array.isArray(notes.chapters) 
    ? notes.chapters.map(humanizeChapter)
    : [];

  const keyTakeaways = Array.isArray(notes.keyTakeaways)
    ? notes.keyTakeaways.map(humanizeBengaliText)
    : [];

  const summary = humanizeBengaliText(notes.summary);

  const quiz = Array.isArray(notes.quiz)
    ? notes.quiz.map(q => ({
        ...q,
        question: humanizeBengaliText(q.question),
        options: Array.isArray(q.options) ? q.options.map(humanizeBengaliText) : q.options,
        explanation: humanizeBengaliText(q.explanation),
      }))
    : notes.quiz;

  return {
    ...notes,
    summary,
    chapters,
    keyTakeaways,
    quiz,
    fullMarkdown: humanizeBengaliText(notes.fullMarkdown || ''),
  };
}
