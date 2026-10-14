import { VideoItem, LectureQuizQuestion } from '@/types';
import { humanizeBengaliText } from './bengaliHumanizer';

/**
 * Real AI-Powered Quiz Engine
 * Fetches strictly conceptual, 5-question quizzes via /api/quiz (Groq LLM).
 */

// Fetch 5 genuine AI-generated conceptual questions from backend
export interface QuizFetchResponse {
  questions: LectureQuizQuestion[];
  isEducational: boolean;
  reason?: string;
  contentType?: 'music_entertainment' | 'gaming' | 'vlog' | 'drama' | 'other';
}

// Fetch 5 genuine AI-generated conceptual questions from backend
export async function fetchAiQuizForVideo(
  video: VideoItem,
  courseTitle?: string,
  forceFresh: boolean = false
): Promise<QuizFetchResponse> {
  const cacheKey = `kaizenflow_quiz_data_${video.ytVideoId}`;

  // Check cache first unless forced fresh
  if (!forceFresh && typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          return { questions: parsed, isEducational: true };
        }
      }
    } catch {}
  }

  // Call /api/quiz
  try {
    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: video.ytVideoId,
        videoTitle: video.title,
        courseTitle: courseTitle || '',
        language: 'bn',
      }),
    });

    if (res.ok) {
      const data = await res.json();

      // Check if API rejected as non-educational
      if (data.isEducational === false) {
        return {
          questions: [],
          isEducational: false,
          reason: data.reason,
          contentType: data.contentType,
        };
      }

      if (Array.isArray(data.quiz) && data.quiz.length >= 3) {
        const sanitized: LectureQuizQuestion[] = data.quiz.map((q: any) => ({
          question: humanizeBengaliText(q.question || ''),
          options: (q.options || []).map((opt: string) => humanizeBengaliText(opt)),
          answerIndex: typeof q.answerIndex === 'number' ? q.answerIndex : 0,
          explanation: humanizeBengaliText(q.explanation || ''),
        }));

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(sanitized));
          } catch {}
        }

        return { questions: sanitized, isEducational: true };
      }
    }
  } catch (err) {
    console.warn('[QuizEngine] API fetch failed, falling back to topic concept bank:', err);
  }

  // Fallback to rich subject-matter concept questions
  const fallback = generateConceptQuizFallback(video.title, courseTitle);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(fallback));
    } catch {}
  }
  return { questions: fallback, isEducational: true };
}

// Read cached questions if they already exist
export function getStoredQuizQuestions(videoId: string): LectureQuizQuestion[] | null {
  if (typeof window === 'undefined' || !videoId) return null;
  try {
    const raw = localStorage.getItem(`kaizenflow_quiz_data_${videoId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 3) {
        return parsed;
      }
    }
  } catch {}
  return null;
}

// User answer progress helpers
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

export function clearAllQuizDataForVideo(videoId: string): void {
  if (typeof window === 'undefined' || !videoId) return;
  try {
    localStorage.removeItem(`kaizenflow_quiz_data_${videoId}`);
    localStorage.removeItem(`kaizenflow_quiz_state_${videoId}`);
  } catch {}
}

/**
 * Intelligent topic-specific concept question bank.
 * Used ONLY if the user is offline or the AI backend encounters a network error.
 * STRICT RULE: Tests subject concepts directly (Syntax, logic, rules, formulas).
 * ZERO chronological questions ("What was said at the beginning?").
 */
function generateConceptQuizFallback(videoTitle: string, courseTitle?: string): LectureQuizQuestion[] {
  const title = (videoTitle || '').toLowerCase();
  const cTitle = (courseTitle || '').toLowerCase();
  const text = `${title} ${cTitle}`;

  // C / C++ / Programming Basics (Variables, Sum, Input/Output)
  if (text.includes('c++') || text.includes(' cpp') || text.includes(' c ') || text.includes('programming') || text.includes('variable') || text.includes('sum')) {
    return [
      {
        question: 'C++ এ `cin >> a >> b;` স্টেটমেন্টের মাধ্যমে দুটি ভ্যারিয়েবলে ইনপুট নেওয়ার ক্ষেত্রে কোন উক্তিটি সঠিক?',
        options: [
          'ব্যবহারকারী স্পেস (Space), ট্যাব বা এন্টার (Enter) দিয়ে ইনপুট আলাদা করতে পারেন',
          'ইনপুট শুধুমাত্র কমা (,) দিয়ে আলাদা করতে হয়',
          'প্রথম ইনপুটের পর অবশ্যই নতুন লাইন প্রিন্ট হতে হবে',
          'cin দিয়ে একই লাইনে একাধিক ইনপুট নেওয়া সম্ভব নয়'
        ],
        answerIndex: 0,
        explanation: 'C++ এ cin ডিফল্টভাবে যেকোনো হোয়াইটস্পেস (Space, Tab, Newline) স্কিপ করে আলাদা টোকেন হিসেবে ইনপুট গ্রহণ করে।'
      },
      {
        question: 'দুটি পূর্ণসংখ্যা যোগ করার সময় `int a, b; int sum = a + b;` কোডে যদি a এবং b এর মান অত্যন্ত বড় হয় (যেমন $2 \\times 10^9$), তখন কী ঘটবে?',
        options: [
          'কম্পাইলার স্বয়ংক্রিয়ভাবে মেমোরি দ্বিগুণ করে ফলাফল ঠিক রাখবে',
          'Integer Overflow ঘটবে এবং ভুল নেগেটিভ বা অপ্রত্যাশিত মান আউটপুট আসবে',
          'কম্পাইলেশন এরর দেখাবে এবং কোড রান হবে না',
          'প্রোগ্রাম স্বয়ংক্রিয়ভাবে float এ কনভার্ট হবে'
        ],
        answerIndex: 1,
        explanation: 'স্ট্যান্ডার্ড 32-বিট int এর সর্বোচ্চ সীমা প্রায় $2.14 \\times 10^9$। দুটি বড় সংখ্যার যোগফল এই সীমা অতিক্রম করলে integer overflow ঘটে, যার জন্য `long long` টাইপ ব্যবহার করা উচিত।'
      },
      {
        question: 'C++ এ কোনো ভ্যারিয়েবল ডিক্লেয়ার করার পর মান ইনিশিয়ালাইজ (Initialize) না করে সরাসরি যোগ করলে কী মান ব্যবহৃত হয়?',
        options: [
          'ডিফল্টভাবে 0 (শূন্য)',
          'মেমোরিতে পূর্বে থাকা অনির্ধারিত গার্বেজ ভ্যালু (Garbage Value)',
          'সবসময় নাল (NULL)',
          'কম্পাইলার এরর দেয়'
        ],
        answerIndex: 1,
        explanation: 'লোকাল ভ্যারিয়েবল ইনিশিয়ালাইজ না করলে তাতে মেমোরির পূর্বের আবর্জনা বা গার্বেজ ভ্যালু থেকে যায়, যা অনির্ভরযোগ্য ফলাফলের জন্ম দেয়।'
      },
      {
        question: 'নিম্নের স্টেটমেন্টে `cout << "Sum = " << a + b;` আউটপুট প্রিন্ট করার সময় অপারেটর প্রেসিডেন্স কীভাবে কাজ করে?',
        options: [
          '`+` অপারেটরের প্রেসিডেন্স `<<` এর চেয়ে বেশি হওয়ায় প্রথমে যোগ সম্পন্ন হয়, এরপর প্রিন্ট হয়',
          '`<<` অপারেটর প্রথমে সম্পন্ন হয় এবং স্ট্রিং এর সাথে সরাসরি যুক্ত হয়',
          'উভয় অপারেটর সমান অগ্রাধিকার পায়',
          'ব্র্যাকেট ছাড়া যোগ অপারেশন সিনট্যাক্স এরর দেয়'
        ],
        answerIndex: 0,
        explanation: 'অ্যারিথমেটিক অপারেটর `+` এর অগ্রাধিকার (precedence) বিটওয়াইজ/স্ট্রিম অপারেটর `<<` এর চেয়ে বেশি। তাই আগে যোগফল নির্ণীত হয়, তারপর তা আউটপুট স্ট্রিমে যায়।'
      },
      {
        question: 'দুটি পূর্ণসংখ্যার গড় (Average) নির্ণয় করতে `(a + b) / 2` লিখলে যদি a=5 এবং b=4 হয়, আউটপুট কত হবে?',
        options: [
          '4.5 (সঠিক দশমিক ভগ্নাংশ)',
          '4 (পূর্ণসংখ্যার ভাগ বা Integer Division এর কারণে দশমিক বাদ যাবে)',
          '5 (সিলিং মান)',
          '0 (ফ্লোটিং এরর)'
        ],
        answerIndex: 1,
        explanation: 'দুটি int এর ভাগফল পূর্ণসংখ্যা হয় এবং দশমিক অংশ ট্রাঙ্কেট (বাদ) হয়ে যায়। সঠিক ভগ্নাংশ পেতে `(a + b) / 2.0` অথবা টাইপকাস্টিং প্রয়োজন।'
      }
    ];
  }

  // React / Next.js / Web Dev
  if (text.includes('react') || text.includes('next.js') || text.includes('javascript') || text.includes('js')) {
    return [
      {
        question: 'React কম্পোনেন্টে স্টেট (State) পরিবর্তনের সময় সরাসরি মিউটেশন (যেমন `state.count = 5`) না করে সেটার ফাংশন ব্যবহার করার কারণ কী?',
        options: [
          'সরাসরি মিউটেট করলে React স্টেট পরিবর্তন শনাক্ত করতে পারে না এবং রি-রেন্ডার ট্রিগার হয় না',
          'সরাসরি মিউটেট করলে ব্রাউজার ক্র্যাশ করে',
          'জাভাস্ক্রিপ্ট সরাসরি অবজেক্ট মডিফিকেশন সমর্থন করে না',
          'স্টেট শুধুমাত্র লোকালস্টোরেজে আপডেট হয়'
        ],
        answerIndex: 0,
        explanation: 'React শ্যালো কম্প্যারিজনের মাধ্যমে স্টেট পরিবর্তন ডিটেক্ট করে। স্টেট অবজেক্ট ইমিউটেবল রেখে সেটার ফাংশন কল করলেই নতুন রেফারেন্সের মাধ্যমে রি-রেন্ডার ট্রিগার হয়।'
      },
      {
        question: '`useEffect` হুকে ডিপেনডেন্সি অ্যারে খালি (`[]`) রাখার অর্থ কী?',
        options: [
          'প্রতিটি স্টেট পরিবর্তনের সাথে সাথে ইফেক্টটি বারবার রান হবে',
          'কম্পোনেন্ট প্রথমবার মাউন্ট (Mount) হওয়ার পর ইফেক্টটি কেবল একবার রান হবে',
          'ইফেক্টটি কখনো রান হবে না',
          'কম্পোনেন্ট আনমাউন্টে সাথে সাথে এরর দিবে'
        ],
        answerIndex: 1,
        explanation: 'খালি ডিপেনডেন্সি অ্যারে নির্দেশ করে যে ইফেক্টটি কোনো স্টেটের ওপর নির্ভরশীল নয়, তাই এটি কেবল প্রাথমিক মাউন্টে একবারই এক্সিকিউট হয়।'
      },
      {
        question: 'React এ কোনো লিস্ট রেন্ডার করার সময় প্রতিটি এলিমেন্টে ইউনিক `key` প্রপ ব্যবহার করা কেন অপরিহার্য?',
        options: [
          'UI তে উপাদানগুলোর সিএসএস স্টাইলিং নিশ্চিত করতে',
          'Virtual DOM রিকনসিলিয়েশন প্রক্রিয়ায় কোন উপাদানটি যোগ, পরিবর্তন বা ডিলিট হয়েছে তা দ্রুত শনাক্ত করতে',
          'লোকালস্টোরেজের সাথে সিঙ্ক করার জন্য',
          'ব্রাউজারকে মেমোরি ক্লিয়ার করতে বাধ্য করতে'
        ],
        answerIndex: 1,
        explanation: 'Diffing অ্যালগরিদম প্রতিটি আইটেমকে ট্র্যাক করতে key ব্যবহার করে, যাতে পুরো লিস্ট রি-রেন্ডার না করে কেবল পরিবর্তিত উপাদানটি DOM এ আপডেট করা যায়।'
      },
      {
        question: 'জাভাস্ক্রিপ্টে অ্যাসিনক্রোনাস কোড হ্যান্ডেল করার ক্ষেত্রে `async/await` এর প্রধান সুবিধা কোনটি?',
        options: [
          'কলব্যাক হেল (Callback Hell) দূর করে অ্যাসিনক্রোনাস কোডকে সিনক্রোনাস কোডের মতো সহজে পাঠযোগ্য ও হ্যান্ডেলযোগ্য করা',
          'কোড সিঙ্গেল থ্রেড থেকে সরাসরি মাল্টি-থ্রেডে কনভার্ট করা',
          'মেমোরি ব্যবহার সম্পূর্ণ শূন্যে নামিয়ে আনা',
          'ট্রাই-ক্যাচ ব্লক ব্যবহারের প্রয়োজনীয়তা বাতিল করা'
        ],
        answerIndex: 0,
        explanation: 'async/await মূলত Promises এর ওপর সিনট্যাক্টিক সুগার, যা চেইনিং ও কলব্যাকের জটিলতা দূর করে কোডকে পরিচ্ছন্ন করে তোলে।'
      },
      {
        question: 'React কম্পোনেন্টে ফর্ম ইনপুট হ্যান্ডেল করার জন্য "Controlled Component" বলতে কী বোঝায়?',
        options: [
          'যেখানে ফর্ম উপাদানের মান (Value) সরাসরি React State দ্বারা নিয়ন্ত্রিত হয়',
          'যেখানে DOM সরাসরি ইনপুটের মান ধারণ করে (useRef দিয়ে)',
          'যেখানে ফর্ম সাবমিট সম্পূর্ণ ব্লক করা থাকে',
          'যেখানে কেবল পাসওয়ার্ড ইনপুট দেওয়া যায়'
        ],
        answerIndex: 0,
        explanation: 'Controlled Component এ ইনপুট ফিল্ডের value স্টেট থেকে আসে এবং onChange ইভেন্টের মাধ্যমে প্রতি ক্লিকে স্টেট আপডেট হয়।'
      }
    ];
  }

  // Science / Math / General Universal Concept Bank
  return [
    {
      question: `"${videoTitle.slice(0, 40)}"-এর ক্ষেত্রে মূল তাত্ত্বিক ভিত্তি বা গাণিতিক নীতিটি কীসের ওপর প্রতিষ্ঠিত?`,
      options: [
        'মৌলিক স্বতঃসিদ্ধ সূত্র ও নিয়মতান্ত্রিক ধাপের ধারাবাহিক প্রয়োগ',
        'কোনো নিয়ম ছাড়াই শুধুমাত্র অনুমানভিত্তিক সমাধান',
        'বাস্তব জগতের সব সীমাবদ্ধতা ও মাত্রা উপেক্ষা করা',
        'ফলাফল অপরিবর্তিত রেখে সব চলক মুছে ফেলা'
      ],
      answerIndex: 0,
      explanation: 'যেকোনো বৈজ্ঞানিক বা গাণিতিক সমস্যা সমাধানের মূল ভিত্তি হলো সার্বজনীন নিয়ম ও সূত্রের ধাপে ধাপে সুনির্দিষ্ট প্রয়োগ।'
    },
    {
      question: 'গাণিতিক বা লজিক্যাল সমস্যা সমাধানের ক্ষেত্রে বাউন্ডারি কন্ডিশন (Boundary Conditions) কেন অত্যন্ত গুরুত্বপূর্ণ?',
      options: [
        'চরম বা প্রান্তিক মানে সিস্টেমের আচরণ সঠিক ও বৈধ থাকছে কি না তা নিশ্চিত করতে',
        'শুধুমাত্র সমীকরণের আকার ছোট করার জন্য',
        'বাউন্ডারি মান সবসময় শূন্য ধরে নেওয়া বাধ্যতামূলক',
        'গ্রাফ আঁকা সম্পূর্ণ বন্ধ রাখার জন্য'
      ],
      answerIndex: 0,
      explanation: 'প্রান্তিক বা বাউন্ডারি কন্ডিশন যাচাই না করলে শূন্য দিয়ে ভাগ (Divide by Zero) বা ইনফিনিট লুপের মতো জটিল ত্রুটি দেখা দেয়।'
    },
    {
      question: 'তত্ত্ব থেকে বাস্তব প্রয়োগের রূপান্তরে কোন বিষয়টিকে সবচেয়ে বড় বাধা হিসেবে বিবেচনা করা হয়?',
      options: [
        'বাস্তব ব্যবস্থার ঘর্ষণ, শক্তির অপচয় বা পরিবেশগত সীমাবদ্ধতা (Real-world constraints)',
        'গণিতের মৌলিক নিয়মের পরিবর্তনশীলতা',
        'ধ্রুবক সংখ্যার পরিবর্তন',
        'লজিক্যাল গেটের অপ্রতুলতা'
      ],
      answerIndex: 0,
      explanation: 'আদর্শ তাত্ত্বিক মডেলে ঘর্ষণ বা অপচয় শূন্য ধরা হলেও বাস্তব ক্ষেত্রে পরিবেশগত সীমাবদ্ধতা মূল নিয়ামক।'
    },
    {
      question: 'জটিল সমস্যাকে সহজে সমাধানের জন্য "Divide and Conquer" বা ধাপে ধাপে বিভক্তিকরণের মূল কৌশল কী?',
      options: [
        'বড় ও জটিল সমস্যাকে কয়েকটি ছোট, সহজে সমাধানযোগ্য অংশে বিভক্ত করে পরে সমন্বিত করা',
        'সব অংশ বাদ দিয়ে কেবল শেষের ফলাফল বিবেচনা করা',
        'একই সাথে সব অজানা চলকের মান অনুমান করা',
        'সমস্যা সমাধানের চেষ্টা না করে বিকল্প খোঁজা'
      ],
      answerIndex: 0,
      explanation: 'মডিউলার বা ক্ষুদ্র অংশে ভাগ করে সমাধান করলে জটিলতা বহুগুণ কমে যায় এবং ভুলের সম্ভাবনা হ্রাস পায়।'
    },
    {
      question: 'পরীক্ষায় বা প্র্যাকটিসে এই বিষয়ের সমাধান করার সময় সবচেয়ে সাধারণ ভুলটি (Common Trap) কী?',
      options: [
        'একক (Units), সাইন (±) এবং পূর্বশর্ত সঠিকভাবে যাচাই না করে সরাসরি সূত্রে মান বসানো',
        'সব নিয়ম ক্রমানুসারে মেনে চলা',
        'ধাপে ধাপে হিসাব সম্পন্ন করা',
        'সঠিক সংজ্ঞার ওপর নির্ভর করা'
      ],
      answerIndex: 0,
      explanation: 'এককের অসামঞ্জস্যতা এবং চিহ্নের ভুল (Sign Error) হলো শিক্ষার্থীদের সবচেয়ে ঘনঘন হওয়া অসতর্ক ভুল।'
    }
  ];
}
