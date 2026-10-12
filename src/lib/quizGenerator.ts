import { VideoItem, LectureQuizQuestion, AILectureNotes } from '@/types';
import { humanizeBengaliText } from './bengaliHumanizer';

/**
 * Procedural + AI-backed Active Recall Quiz Engine
 * Delivers instant, high-yield conceptual MCQs for ANY lecture video.
 */

// Helper to look up cached AI lecture notes from localStorage
export function getCachedAiNotesForVideo(videoId: string): AILectureNotes | null {
  if (typeof window === 'undefined' || !videoId) return null;
  const languages = ['bn', 'en', 'mixed', 'hi'];
  for (const lang of languages) {
    const key = `kaizenflow_ai_notes_${videoId}_${lang}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.chapters?.length > 0 || parsed.quiz?.length > 0)) {
          return parsed;
        }
      } catch {}
    }
  }
  return null;
}

/**
 * Extracts or procedurally generates 3-4 interactive MCQs for a given video
 */
export function getOrGenerateQuizForVideo(
  video: VideoItem,
  courseTitle?: string
): LectureQuizQuestion[] {
  // 1. Check if AI notes already exist with high-quality quiz questions
  const cachedNotes = getCachedAiNotesForVideo(video.ytVideoId);
  if (cachedNotes?.quiz && cachedNotes.quiz.length >= 2) {
    return cachedNotes.quiz;
  }

  // 2. If AI notes have chapters/takeaways, build grounded quiz from chapters
  if (cachedNotes && cachedNotes.chapters && cachedNotes.chapters.length > 0) {
    const chapters = cachedNotes.chapters;
    const takeaways = cachedNotes.keyTakeaways || [];
    const questions: LectureQuizQuestion[] = [];

    const ch0 = chapters[0];
    questions.push({
      question: humanizeBengaliText(`লেকচারের শুরুতে [${ch0.timestamp}] কোন মূল কনসেপ্টের ওপর গুরুত্ব দেওয়া হয়েছে?`),
      options: [
        humanizeBengaliText(ch0.title),
        humanizeBengaliText(chapters[1]?.title || 'কোর্স ওভারভিউ ও প্রাথমিক ধারণা'),
        'এডভান্সড সিস্টেম আর্কিটেকচার সেটআপ',
        'এক্সটার্নাল ডিপেনডেন্সি কনফিগারেশন'
      ],
      answerIndex: 0,
      explanation: humanizeBengaliText(`লেকচারের প্রারম্ভেই [${ch0.timestamp}] "${ch0.title}" নিয়ে মূল কনসেপ্ট পরিষ্কার করা হয়েছে।`)
    });

    if (takeaways.length > 0) {
      questions.push({
        question: humanizeBengaliText('এই ক্লাসের প্রধান মূল নিয়ম বা গুরুত্বপূর্ণ টেকঅ্যাওয়ে কোনটি?'),
        options: [
          'সব ক্ষেত্রে ডিফল্ট অপশন অপরিবর্তিত রাখা',
          humanizeBengaliText(takeaways[0]),
          'কনসেপ্ট না বুঝে সরাসরি ফলাফল মুখস্থ করা',
          'তাত্ত্বিক ভিত্তি বাদ দিয়ে সমাপ্ত করা'
        ],
        answerIndex: 1,
        explanation: humanizeBengaliText(`লেকচারের সারসংক্ষেপ অনুযায়ী: "${takeaways[0]}"`)
      });
    }

    if (chapters.length > 1) {
      const chLast = chapters[chapters.length - 1];
      questions.push({
        question: humanizeBengaliText(`পরবর্তী অংশে [${chLast.timestamp}] "${chLast.title}" অধ্যায়ে কী দেখানো হয়েছে?`),
        options: [
          'কোনো বাস্তব প্রয়োগ ছাড়াই ক্লাস শেষ করা',
          'পূর্বের নিয়ম সম্পূর্ণ বাতিল করা',
          humanizeBengaliText(chLast.explanation.slice(0, 70) + (chLast.explanation.length > 70 ? '...' : '')),
          'কেবল তাত্ত্বিক সূত্র আলোচনা'
        ],
        answerIndex: 2,
        explanation: humanizeBengaliText(`অধ্যায়ে "${chLast.title}" নিয়ে বাস্তব উদাহরণ ও সঠিক ব্যাখ্যা তুলে ধরা হয়েছে।`)
      });
    }

    if (questions.length >= 2) {
      return questions;
    }
  }

  // 3. Procedural Topic-Aware Quiz Generation based on Video Title & Course
  return generateTopicAwareQuiz(video.title, courseTitle);
}

/**
 * Generates tailored active recall questions matching programming, science, or general topics
 */
function generateTopicAwareQuiz(videoTitle: string, courseTitle?: string): LectureQuizQuestion[] {
  const title = (videoTitle || '').toLowerCase();
  const cTitle = (courseTitle || '').toLowerCase();
  const combined = `${title} ${cTitle}`;

  // Subject / Topic Pattern Matches
  if (combined.includes('react') || combined.includes('next.js') || combined.includes('nextjs')) {
    return [
      {
        question: `রিয়্যাক্ট বা নেক্সট জেএস অ্যাপ্লিকেশনে "${cleanTitleShort(videoTitle)}"-এর ক্ষেত্রে স্টেট (State) পরিবর্তনের প্রধান নিয়ম কী?`,
        options: [
          'স্টেট সরাসরি মিউটেট (mutate) করে মান পরিবর্তন করা',
          'ইমিউটেবল (Immutable) উপায়ে নতুন স্টেট রিটার্ন বা সেট করা',
          'ডোম (DOM) ম্যানিপুলেশন করে সরাসরি ভ্যালু অ্যাসাইন করা',
          'সব স্টেটকে গ্লোবাল উইন্ডো অবজেক্টে সংরক্ষণ করা'
        ],
        answerIndex: 1,
        explanation: 'রিয়্যাক্টে স্টেট সবসময় ইমিউটেবল রাখতে হয়। সরাসরি মিউটেট করলে রি-রেন্ডার ট্রিগার সঠিকভাবে নাও হতে পারে।'
      },
      {
        question: 'কম্পোনেন্ট রি-রেন্ডারিং অপ্টিমাইজেশন ও পারফরম্যান্স বজায় রাখতে কোনটি সবচেয়ে কার্যকর?',
        options: [
          'প্রতিটি রেন্ডারে অপ্রয়োজনীয় ফাংশন ও অবজেক্ট পুনর্নির্মাণ এড়ানো (useCallback / useMemo)',
          'সব ডেটা লোকালস্টোরেজে সিঙ্ক করা',
          'ইনলাইন স্টাইলিং অতিরিক্ত ব্যবহার করা',
          'রি-রেন্ডার সম্পূর্ণ বন্ধ করে রাখা'
        ],
        answerIndex: 0,
        explanation: 'ফাংশন ও কম্পিউটেশন মেমোইজেশনের মাধ্যমে অপ্রয়োজনীয় চাইল্ড রি-রেন্ডার সফলভাবে রোধ করা যায়।'
      },
      {
        question: `এই লেকচারে "${cleanTitleShort(videoTitle)}" বাস্তবায়নের সময় কোন সাধারণ ভুলটি (common bug) এড়ানো জরুরি?`,
        options: [
          'প্রপস (Props) টাইপ ভ্যালিডেশন এড়িয়ে যাওয়া ও ডিপেনডেন্সি অ্যারে ভুল সেট করা',
          'কম্পোনেন্টে ক্লিনআপ ফাংশন ব্যবহার না করা',
          'এপিআই কল সঠিকভাবে অ্যাসিনক্রোনাসলি হ্যান্ডেল না করা',
          'উপরের সবগুলো সতর্কতা অবলম্বন করা'
        ],
        answerIndex: 3,
        explanation: 'ডিপেনডেন্সি অ্যারে মিস করা, আনমাউন্টে মেমোরি লিক এবং এপিআই রেস কন্ডিশন রিয়্যাক্টের খুব কমন বাগ।'
      }
    ];
  }

  if (combined.includes('javascript') || combined.includes('typescript') || combined.includes('js') || combined.includes('ts')) {
    return [
      {
        question: `জাভাস্ক্রিপ্ট বা টাইপস্ক্রিপ্টে "${cleanTitleShort(videoTitle)}" নিয়ে কাজ করার সময় অ্যাসিনক্রোনাস এক্সিকিউশন কীভাবে কাজ করে?`,
        options: [
          'কলস্ট্যাক ব্লক করে অন্যান্য সব অপারেশন থামিয়ে দেয়',
          'ইভেন্ট লুপ (Event Loop) ও মাইক্রোটাস্ক কিউ এর মাধ্যমে নন-ব্লকিং ভাবে কাজ সম্পন্ন করে',
          'সরাসরি মাল্টি-থ্রেডেড সিপিইউ প্রসেস চালু করে',
          'ব্রাউজারকে ক্যাশ ক্লিয়ার করতে বাধ্য করে'
        ],
        answerIndex: 1,
        explanation: 'জাভাস্ক্রিপ্ট সিঙ্গেল থ্রেডেড হওয়ায় ইভেন্ট লুপের মাধ্যমে অ্যাসিনক্রোনাস কাজ নন-ব্লকিং উপায়ে পরিচালিত হয়।'
      },
      {
        question: 'ভেরিয়েবল স্কোপিং ও মেমোরি সুরক্ষার ক্ষেত্রে আধুনিক বেস্ট প্র্যাকটিস কোনটি?',
        options: [
          'সর্বত্র গ্লোবাল var ডিক্লেয়ার করা',
          'প্রয়োজন অনুসারে ব্লক-স্কোপড const ও let ব্যবহার করা এবং টাইপ ডিফাইন করা',
          'স্কোপিং সম্পূর্ণ উপেক্ষা করা',
          'টাইপ চেকিং এড়িয়ে সবসময় any টাইপ দেওয়া'
        ],
        answerIndex: 1,
        explanation: 'const ও let ব্লক-লেভেল স্কোপ নিশ্চিত করে এবং ভেরিয়েবল ওভাররাইটিং রোধ করে।'
      },
      {
        question: `"${cleanTitleShort(videoTitle)}" এর মূল লক্ষ্য অর্জনে ফাংশনাল প্রোগ্রামিংয়ের কোন সুবিধাটি গুরুত্বপূর্ণ?`,
        options: [
          'সাইড-ইফেক্ট হ্রাস ও পিউর ফাংশনের (Pure Functions) মাধ্যমে অনুমানযোগ্য ফলাফল',
          'কোডের লাইন সংখ্যা জোর করে বাড়ানো',
          'একই ডেটা বারবার কপি না করা',
          'কম্পাইলারের ওয়ার্নিং ইগনোর করা'
        ],
        answerIndex: 0,
        explanation: 'পিউর ফাংশন কোডকে নির্ভরযোগ্য ও সহজে টেস্টযোগ্য (testable) করে তোলে।'
      }
    ];
  }

  if (combined.includes('python') || combined.includes('django') || combined.includes('flask')) {
    return [
      {
        question: `পাইথনে "${cleanTitleShort(videoTitle)}" ব্যবহারের সময় মেমোরি ম্যানেজমেন্ট ও ইফিশিয়েন্সি বৃদ্ধির সেরা উপায় কী?`,
        options: [
          'লার্জ ডেটাসেটের জন্য জেনারেটর (Generators / yield) ব্যবহার করা',
          'লুপের ভিতর সবসময় সম্পূর্ণ লিস্ট মেমোরিতে লোড করা',
          'টাইপ চেকিং বাদ দিয়ে কোড চালানো',
          'মেমোরি সম্পূর্ণ আনবাউন্ড রাখা'
        ],
        answerIndex: 0,
        explanation: 'পাইথনে জেনারেটর লেজি ইভ্যালুয়েশন নিশ্চিত করে ফলে র‍্যাম অপ্টিমাইজড থাকে।'
      },
      {
        question: 'পাইথনিক কোড লেখার ক্ষেত্রে (PEP 8) কোন বিষয়টি সবচেয়ে বেশি প্রাধান্য পায়?',
        options: [
          'কোডের রিডেবিলিটি ও স্পষ্ট স্ট্রাকচার বজায় রাখা',
          'এক লাইনে সব লজিক লিখে ফেলা',
          'এক্সেপশন হ্যান্ডলিং এড়িয়ে যাওয়া',
          'ভেরিয়েবলের অস্পষ্ট নাম রাখা'
        ],
        answerIndex: 0,
        explanation: 'The Zen of Python অনুযায়ী: "Readability counts" - স্পষ্ট কোড জটিল কোডের চেয়ে শ্রেষ্ঠ।'
      },
      {
        question: 'প্রোগ্রামে অপ্রত্যাশিত এরর বা ব্যতিক্রম হ্যান্ডেল করার আদর্শ নিয়ম কোনটি?',
        options: [
          'try-except ব্লকের মাধ্যমে নির্দিষ্ট এরর ক্যাচ করা ও লগ রাখা',
          'প্রোগ্রাম ক্র্যাশ করতে দিয়ে টার্মিনাল বন্ধ করা',
          'খালি except ব্লক দিয়ে সব এরর চেপে যাওয়া',
          'ইউজার ইনপুট যাচাই না করা'
        ],
        answerIndex: 0,
        explanation: 'স্পেসিফিক এক্সেপশন হ্যান্ডেল করলে অপ্রত্যাশিত ক্র্যাশ থেকে সিস্টেম নিরাপদ থাকে।'
      }
    ];
  }

  if (combined.includes('tree') || combined.includes('graph') || combined.includes('algorithm') || combined.includes('data structure') || combined.includes('dsa') || combined.includes('sort') || combined.includes('search')) {
    return [
      {
        question: `অ্যালগরিদম ও ডেটা স্ট্রাকচারে "${cleanTitleShort(videoTitle)}" এর প্রধান অপ্টিমাইজেশন লক্ষ্য কী?`,
        options: [
          'টাইম ও স্পেস কমপ্লেক্সিটি (Time & Space Complexity) সর্বনিম্ন রাখা',
          'অতিরিক্ত মেমোরি ব্যবহার করে লুপের সংখ্যা বাড়ানো',
          'ওয়ার্স্ট-কেস কমপ্লেক্সিটি সবসময় উপেক্ষা করা',
          'অপ্রয়োজনীয় রিকার্শন বাড়ানো'
        ],
        answerIndex: 0,
        explanation: 'দক্ষ ডেটা স্ট্রাকচারের মূল লক্ষ্য হলো বিগ-ও (Big-O) অনুযায়ী সময় ও মেমোরি সাশ্রয়ী অপারেশন নিশ্চিত করা।'
      },
      {
        question: 'সার্চিং বা ট্রাভার্সাল অপারেশনে স্ট্যাক বনাম কিউ (DFS vs BFS) এর প্রধান পার্থক্য কী?',
        options: [
          'DFS গভীরভাবে যায় (LIFO / Stack) এবং BFS স্তরভিত্তিক অনুসন্ধান করে (FIFO / Queue)',
          'দুটোই সবসময় একই ক্রমে নোড ভিজিট করে',
          'DFS শুধুমাত্র সাইক্লিক গ্রাফে কাজ করে',
          'BFS এর কোনো স্পেস কমপ্লেক্সিটি নেই'
        ],
        answerIndex: 0,
        explanation: 'DFS স্ট্যাকের সাহায্যে গভীরতা অনুসন্ধান করে এবং BFS কিউ ব্যবহার করে লেভেল অনুযায়ী অনুসন্ধান করে।'
      },
      {
        question: `এই টপিকে "${cleanTitleShort(videoTitle)}" এর ক্ষেত্রে বাউন্ডারি কন্ডিশন বা বেস কেস (Base Case) কেন অপরিহার্য?`,
        options: [
          'ইনফিনিট লুপ বা স্ট্যাক ওভারফ্লো (Stack Overflow) প্রতিরোধে',
          'কোডের রানটাইম দ্বিগুণ করার জন্য',
          'মেমোরি মেপে বের করার জন্য',
          'কম্পাইলারকে থামিয়ে রাখার জন্য'
        ],
        answerIndex: 0,
        explanation: 'রিকার্সিভ বা লুপিং অ্যালগরিদমে টার্মিনেটিং কন্ডিশন বা বেস কেস ছাড়া স্ট্যাক ওভারফ্লো ঘটে।'
      }
    ];
  }

  if (combined.includes('physics') || combined.includes('পদার্থবিজ্ঞান') || combined.includes('গতি') || combined.includes('বল') || combined.includes('তরঙ্গ') || combined.includes('আলো') || combined.includes('তড়িৎ')) {
    return [
      {
        question: `পদার্থবিজ্ঞানের এই ক্লাসে "${cleanTitleShort(videoTitle)}" সম্পর্কিত মূল প্রাকৃতিক সূত্রটি কোন নীতির ওপর প্রতিষ্ঠিত?`,
        options: [
          'শক্তির নিত্যতা নীতি বা নিউটনের গতিসূত্র',
          'ভর ধ্বংসের সূত্র',
          'অসীম শক্তির সৃষ্টি নীতি',
          'ঘর্ষণহীন কল্পিত ব্যবস্থা'
        ],
        answerIndex: 0,
        explanation: 'পদার্থবিজ্ঞানের বেশিরভাগ তড়িৎ ও বলবিদ্যা সংক্রান্ত ঘটনা শক্তির রূপান্তর ও সংরক্ষণশীল নীতির ওপর দাঁড়িয়ে।'
      },
      {
        question: 'গাণিতিক সমস্যা সমাধানের ক্ষেত্রে এসআই (SI) এককের সঠিক কনভার্সন কেন জরুরি?',
        options: [
          'ভুল এককে মান বসালে সামগ্রিক সূত্রের ফলাফল ও মাত্রা (dimensions) ভুল হয়ে যায়',
          'শুধুমাত্র পরীক্ষার খাতায় সুন্দর দেখানোর জন্য',
          'একক ছাড়া পদার্থবিজ্ঞানের মানের কোনো পার্থক্য হয় না',
          'সিজিএস একক ব্যবহারের নিষেধাজ্ঞা থাকায়'
        ],
        answerIndex: 0,
        explanation: 'রাশির সঠিক সাংখ্যিক মান ও ভৌত অর্থ প্রকাশের জন্য মাত্রা এবং এসআই এককের সামঞ্জস্য অত্যাবশ্যক।'
      },
      {
        question: `"${cleanTitleShort(videoTitle)}" এর ক্ষেত্রে কোন বাস্তব সীমাবদ্ধতা বা বাধাটি সাধারণত বিবেচনায় নেওয়া হয়?`,
        options: [
          'বাতাসের বাধা, ঘর্ষণ বা শক্তির অপচয় (Loss of Energy)',
          'মহাকর্ষীয় ধ্রুবকের পরিবর্তন',
          'আলোর গতির পরিবর্তন',
          'পরমাণুর বিভাজন'
        ],
        answerIndex: 0,
        explanation: 'বাস্তব ক্ষেত্রে ঘর্ষণ ও তাপীয় শক্তির অপচয়ের কারণে কোনো যন্ত্রের কর্মদক্ষতা ১০০% হয় না।'
      }
    ];
  }

  if (combined.includes('chemistry') || combined.includes('রসায়ন') || combined.includes('অর্গানিক') || combined.includes('মৌল') || combined.includes('বন্ধন')) {
    return [
      {
        question: `রসায়নে "${cleanTitleShort(videoTitle)}" এর বিক্রিয়া সংগঠনের মূল চালিকাশক্তি কোনটি?`,
        options: [
          'ইলেকট্রন গ্রহণ/বর্জন বা শেয়ারিংয়ের মাধ্যমে স্থায়িত্ব (Octet rule / Stability) অর্জন',
          'অপ্রয়োজনীয় তাপ সৃষ্টি করা',
          'যোজনীর অনিয়ন্ত্রিত বৃদ্ধি',
          'নিউক্লিয়াস ধ্বংস করা'
        ],
        answerIndex: 0,
        explanation: 'পরমাণুসমূহ স্থিতিশীল ইলেকট্রন বিন্যাস লাভের জন্যই রাসায়নিক বন্ধন ও বিক্রিয়ায় অংশগ্রহণ করে।'
      },
      {
        question: 'রাসায়নিক সাম্যাবস্থা বা লা-শাতেলিয়ার নীতির মূল বক্তব্য কী?',
        options: [
          'তাপমাত্রা, চাপ বা ঘনমাত্রার পরিবর্তন করলে বিক্রিয়ার সাম্যাবস্থা এমনভাবে স্থানান্তরিত হয় যাতে নিয়ামকের পরিবর্তনের ফলাফল প্রশমিত হয়',
          'বিক্রিয়া সবসময় সম্মুখমুখী রাখা',
          'সব বিক্রিয়ক গ্যাসীয় মাধ্যমে রাখা',
          'অনুঘটক বিক্রিয়ার সাম্যাবস্থা পরিবর্তন করে'
        ],
        answerIndex: 0,
        explanation: 'লা-শাতেলিয়ার নীতি অনুযায়ী বাহ্যিক প্রভাবকের পরিবর্তনের প্রভাব সাম্যাবস্থায় বিক্রিয়া নিজেই নিষ্ক্রিয় করার চেষ্টা করে।'
      },
      {
        question: `এই ক্লাসে "${cleanTitleShort(videoTitle)}" সম্পর্কিত যৌগের বিক্রিয়া শনাক্তকরণে কোনটি সবচেয়ে নির্ভরযোগ্য?`,
        options: [
          'নির্দিষ্ট বিকারক (Reagent) যোগে বিশেষ বর্ণ বা অধঃক্ষেপ পর্যবেক্ষণ',
          'শুধু গন্ধ শুঁকে নিশ্চিত হওয়া',
          'যৌগটিকে সরাসরি উত্তপ্ত করে ফেলে দেওয়া',
          'অনুমানের ওপর নির্ভর করা'
        ],
        answerIndex: 0,
        explanation: 'ল্যাবরেটরি টেস্টে নির্দিষ্ট রিএজেন্টের বিক্রিয়ায় অধঃক্ষেপ বা বর্ণের পরিবর্তনই মূল প্রমাণ।'
      }
    ];
  }

  if (combined.includes('math') || combined.includes('গণিত') || combined.includes('ক্যালকুলাস') || combined.includes('ত্রিকোণমিতি') || combined.includes('সমাকলন') || combined.includes('অন্তরীকরণ')) {
    return [
      {
        question: `উচ্চতর গণিতে "${cleanTitleShort(videoTitle)}" অনুশীলনের সময় প্রথম ধাপ কোনটি?`,
        options: [
          'প্রদত্ত ফাংশনের ডোমেন, রেঞ্জ ও অবিচ্ছিন্নতা (Continuity) যাচাই করা',
          'কোনো সূত্র ছাড়াই সরাসরি যোগ-বিয়োগ করা',
          'ফাংশনের মান শূন্য ধরে নেওয়া',
          'ফলাফল অনুমান করা'
        ],
        answerIndex: 0,
        explanation: 'ক্যালকুলাস ও গাণিতিক বিশ্লেষণে ফাংশনের অস্তিত্ব ও সীমা (limit) যাচাই করে এগোতে হয়।'
      },
      {
        question: 'অন্তরীকরণ (Differentiation) ও যোগজীকরণের (Integration) মৌলিক পারস্পরিক সম্পর্ক কী?',
        options: [
          'একটি অপরটির বিপরীত প্রক্রিয়া (Fundamental Theorem of Calculus)',
          'দুটো সম্পূর্ণ সম্পর্কহীন গণিত শাখা',
          'উভয় ক্ষেত্রেই ঢাল বা স্পর্শক নির্ণয় করা হয়',
          'যোগজীকরণ শুধুমাত্র জ্যামিতিক কোণ বের করে'
        ],
        answerIndex: 0,
        explanation: 'ক্যালকুলাসের মূল উপপাদ্য অনুযায়ী ডিফারেনশিয়েশন ও ইন্টিগ্রেশন পরস্পর বিপরীতমুখী গাণিতিক ক্রিয়া।'
      },
      {
        question: `"${cleanTitleShort(videoTitle)}" সমস্যা সমাধানের সময় কোন সতর্কতা অবলম্বন করা জরুরি?`,
        options: [
          'ধ্রুবক (Constant of Integration, +C) মনে রাখা ও সাইন (±) এরর সতর্কভাবে লক্ষ্য করা',
          'ফাংশনের ঘাত পরিবর্তন না করা',
          'ত্রিকোণমিতিক রূপান্তর এড়িয়ে চলা',
          'ব্র্যাকেট ব্যবহারে নিয়ম না মানা'
        ],
        answerIndex: 0,
        explanation: 'সাইন এরর এবং অনির্দিষ্ট যোগজে সমাকলন ধ্রুবক (+C) বাদ পড়া সবচেয়ে সাধারণ ভুল।'
      }
    ];
  }

  // Universal Fallback for any other academic / instructional video
  const cleanTitle = cleanTitleShort(videoTitle);
  return [
    {
      question: `এই লেকচারে "${cleanTitle}"-এর কোন মূল বিষয়ের ওপর সবচেয়ে বেশি গুরুত্ব দেওয়া হয়েছে?`,
      options: [
        `টপিকের প্রাথমিক ভিত্তি ও বাস্তব উদাহরণসহ স্পষ্ট ব্যাখ্যা`,
        'কোনো নিয়ম ছাড়াই সরাসরি জটিল সমীকরণ উপস্থাপন',
        'অপ্রয়োজনীয় জটিল টার্ম মুখস্থ করানো',
        'বিষয়বস্তু সংক্ষিপ্ত করে ছেড়ে দেওয়া'
      ],
      answerIndex: 0,
      explanation: `লেকচারের শুরুতেই "${cleanTitle}"-এর কোর কনসেপ্ট ও বাস্তব প্রয়োগ পরিষ্কার করে বুঝিয়ে দেওয়া হয়েছে।`
    },
    {
      question: `"${cleanTitle}" কার্যকরভাবে আয়ত্ত করার ক্ষেত্রে সবচেয়ে গুরুত্বপূর্ণ নিয়ম বা টেকঅ্যাওয়ে কোনটি?`,
      options: [
        'কনসেপ্ট না বুঝে কেবল ফলাফল বা আউটপুট মুখস্থ করা',
        'মূল নিয়ম বা সূত্রের ধারাবাহিক প্রয়োগ ও নিয়মিত প্র্যাকটিস',
        'কঠিন অংশগুলো এড়িয়ে যাওয়া',
        'শুধুমাত্র একবার দেখে রেখে দেওয়া'
      ],
      answerIndex: 1,
      explanation: 'যেকোনো তাত্ত্বিক বা ব্যবহারিক বিষয়ের দীর্ঘস্থায়ী ধারণার জন্য নিয়মিত হ্যান্ডস-অন প্র্যাকটিস অপরিহার্য।'
    },
    {
      question: `লেকচারের বিষয়বস্তু প্রয়োগ করার সময় কোন সাধারণ ভুলটি (Common Mistake) এড়ানো উচিত?`,
      options: [
        'ভিত্তি না বুঝে শর্টকাটের ওপর অতিরিক্ত নির্ভরশীল হওয়া',
        'সব নিয়ম ক্রমানুসারে মেনে চলা',
        'প্রয়োজনে পুনরায় লেকচার রিভিশন দেওয়া',
        'হাতে-কলমে সমস্যা সমাধানের চেষ্টা করা'
      ],
      answerIndex: 0,
      explanation: 'বেসিক না বুঝে শর্টকাটের পিছু নিলে কঠিন বা ভিন্নধর্মী পরিস্থিতিতে ভুল হওয়ার ঝুঁকি বেড়ে যায়।'
    }
  ];
}

function cleanTitleShort(rawTitle: string): string {
  if (!rawTitle) return 'এই লেকচার';
  return rawTitle
    .replace(/\[.*?\]|\(.*?\)/g, '')
    .replace(/\|\s*.*$/g, '')
    .replace(/-\s*.*$/g, '')
    .trim()
    .slice(0, 45);
}

// LocalStorage helpers for student's quiz progress
export function getStoredQuizState(videoId: string): {
  answers: Record<number, number>;
  isSubmitted: boolean;
  score?: number;
} {
  if (typeof window === 'undefined' || !videoId) {
    return { answers: {}, isSubmitted: false };
  }
  try {
    const raw = localStorage.getItem(`kaizenflow_quiz_state_${videoId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return { answers: {}, isSubmitted: false };
}

export function saveStoredQuizState(
  videoId: string,
  answers: Record<number, number>,
  isSubmitted: boolean,
  score?: number
): void {
  if (typeof window === 'undefined' || !videoId) return;
  try {
    localStorage.setItem(
      `kaizenflow_quiz_state_${videoId}`,
      JSON.stringify({ answers, isSubmitted, score, updatedAt: new Date().toISOString() })
    );
  } catch {}
}

export function clearStoredQuizState(videoId: string): void {
  if (typeof window === 'undefined' || !videoId) return;
  try {
    localStorage.removeItem(`kaizenflow_quiz_state_${videoId}`);
  } catch {}
}
