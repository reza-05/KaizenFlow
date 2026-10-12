# KaizenFlow — Lock In & Learn

> **Continuous Growth, Zero Distraction.**  
> Transform any YouTube playlist into an active, locked-in study portal with proof-of-focus verification, AI lecture notes, active recall quizzes, streaks, and an autonomous syllabus-to-roadmap matching engine.

[![Next.js](https://img.shields.io/badge/Next.js-16+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%20v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Sync-ffca28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Groq AI](https://img.shields.io/badge/AI-Groq%20%7C%20Gemini-f97316?style=for-the-badge)](https://console.groq.com/)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

---

## 🎯 The YouTube Distraction Paradox & Our Solution

Learning through video tutorials on YouTube is one of the most popular yet inefficient ways to study:

| The YouTube Problem | KaizenFlow Solution |
| :--- | :--- |
| **Algorithmic Traps:** Clickbait thumbnails, Shorts, and recommendations derail sessions within minutes. | **100% Sandboxed Cinema Player:** All YouTube feeds, sidebars, comments, and overlays are permanently stripped. |
| **Passive Consumption:** Students play lectures in background tabs or scrub to the end without retaining anything. | **Proof-of-Focus Checkpoint Engine:** 4 random digits appear across the video; verification is locked until **80% genuine watch-time**. |
| **No Active Recall:** Passive listening creates the illusion of competence without actual comprehension. | **In-Lesson AI Active Recall Quizzes:** Instant concept-check MCQs generated from the exact lecture material. |
| **Scattered Note-Taking:** Pausing to type notes is tedious and leads to losing the video timeline. | **Timestamped AI Lecture Notes:** Automated chapter summaries, formulas, and takeaways with 1-click PDF export & sharing. |
| **Cross-Tab Distractions:** Students easily stray to social media (Facebook, Reddit, X) while watching. | **Isolation Shield Extension:** Browser-level shield that blocks distraction websites across all browser tabs while studying. |

---

## ✨ Key Features & Architecture

### 1. 🎬 Sandboxed Cinema Focus Player & Master Dock
* **Zero Distractions:** Complete isolation from the YouTube recommendation engine, comments, and related videos.
* **Persistent Speed Memory:** Learner preference (`1.0x, 1.25x, 1.5x, 2.0x, etc.`) is remembered across all videos automatically via `localStorage`.
* **Master Control Dock:** Quick access to Play/Pause, 10s Rewind (`J`), Next Lecture (`Shift+N`), Volume Slider, Subtitles (`CC`), Playback Speed, and YouTube-style Settings Popover.
* **View Modes:** Standard 2-column view, Cinema Theater View (`T`), and Pure Fullscreen (`F`).

### 2. 🔐 4-Digit Proof-of-Focus Verification Engine
* **Non-Linear Milestones:** 4 sequential focus checkpoints (`#1`, `#2`, `#3`, `#4`) are generated across the video timeline.
* **10-Second Checkpoint Toasts:** As each milestone is reached, a subtle toast reveals a focus digit for 10 seconds.
* **Review Pills:** Learners can click on past checkpoint pills to review collected digits before submission.
* **80% Watch-Time Lock:** Scrubbing forward or skipping past the milestones blocks verification. Submitting the code grants **+50 XP**, marks the lesson verified `[✓]`, increments the streak, and fires celebratory confetti!

### 3. 🧠 Comprehensive AI Lecture Notes & Bengali Humanizer
* **Transcript Extraction:** Uses real YouTube caption streams via `youtube-caption-extractor` and Groq / Gemini AI.
* **Structured Academic Markdown:** Generates Overview, Core Takeaways, Time-coded Chapter breakdown, Formulas, and Practical Applications.
* **Smart Content Classification:** Automatically detects non-educational videos (music, entertainment, vlogs) and offers dual pathways: *"Take Personal Notes Instead"* or *"Force Generate"*.
* **Bengali Natural Humanizer Engine (`bengaliHumanizer.ts`):** Replaces rigid AI machine translations with authentic academic classroom Bengali.
* **1-Click PDF Export & Public Sharing:** Download stylized PDF notes or generate public share links (`/notes/[id]`) for study groups.

### 4. 🎯 In-Lesson Active Recall MCQ Quizzes
* **Interactive Concept Checks:** 3–5 tailored multiple-choice questions dynamically generated from the active lecture's transcript.
* **Instant Rationales:** Detailed pedagogical explanations for both correct and incorrect options.
* **Score & Mastery Tracking:** Immediate feedback to ensure comprehension before advancing to subsequent modules.

### 5. 🛡️ Cross-Tab Isolation Shield (Chrome Extension)
* **Browser-Level Defense:** Integrates with the included Manifest V3 Chrome Extension (`extension/`).
* **Distraction Blocking:** Suspends social media tabs (Facebook, Instagram, Twitter/X, Reddit, TikTok, YouTube browse feeds) during study sessions.
* **Distraction Attempts Logger:** Keeps an audit trail of blocked tab switches and logs focus breaks.
* **HUD Dynamic Island Pill:** Warns the student with a floating island HUD when an unpermitted tab switch is detected.

### 6. 🏆 Gamified Scholar Progression & Clash Flame Streaks
* **Scholar Ranks (Levels 1–10):** Climb from *Novice Scholar (Lvl 1)* to *Grandmaster Polymath (Lvl 10)* with dynamic level titles and XP bars.
* **Clash of Clans Roaring Flame & Ember Animation:** High-momentum streaks ignite a stylized CSS flame with live dancing sparks and ember particles.
* **Unlockable Badges:** Achievements for milestones like *First Blood*, *7-Day Flame*, *Century Scholar (100 Lessons)*, *Speed Demon*, and *Night Owl*.

### 7. 📊 Codeforces-Style 365-Day Activity Momentum Heatmap
* **53-Week Continuous Flow:** Visualizes daily study volume and proof-of-focus verification logs from 365 days ago up to today.
* **Intensity Tiers:** Dynamic color scaling from subtle background cells to deep emerald flame-active tiles (`#047857`).
* **3-Column Consistency Metrics:** Real-time calculation of *All Time*, *Last Year*, and *Current Month* active study streaks.

### 8. 📱 Ultra-Responsive Mobile & Tablet Experience
* **Zero Horizontal Overflow:** Bulletproof CSS layout tested on 360px viewports (Samsung Galaxy S20, iPhone SE).
* **Unified Segmented Controls:** Seamlessly switch between **Queue**, **AI Notes**, **Quiz**, and **Personal Notes** via mobile bottom-docked tabs.
* **Adaptive Navbar:** Automatically collapses Level badges and condenses the Isolation Shield into a tactile icon button on phones (`< 640px`).

### 9. 💳 Pro Scholar Tier & Localized Checkout (bKash / Nagad)
* **Bangladeshi Mobile Banking (MFS):** Includes integrated checkout modal supporting bKash, Nagad, and Rocket payments for premium AI lecture note quotas.
* **Instant Tier Activation:** Seamless local checkout simulation with transaction ID verification.

### 10. ☁️ Offline-First Architecture & Firebase Cloud Sync
* **Instant Offline Cache:** All playlists, notes, progress, and streaks are preserved in `localStorage` for zero network latency.
* **Live Cloud Synchronization:** Real-time two-way synchronization with Firebase Firestore & Authentication.
* **Dynamic Sync HUD Status:** Real-time badge indicators: `Cloud Synced` (green), `Syncing...` (amber spin), and `Offline Cache` (zinc).

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action |
| :---: | :--- |
| `Space` or `K` | Play / Pause video |
| `J` | Rewind 10 seconds |
| `L` | Fast-forward 10 seconds |
| `Shift + N` | Skip to next lecture in queue |
| `T` | Toggle Theater / Wide Cinema mode |
| `F` | Toggle Pure Fullscreen (Video-only) |
| `M` | Mute / Unmute audio |
| `?` | Open Keyboard Shortcuts Help Modal |

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies | Role |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16** (App Router, React 19, TypeScript 5) | Server-rendered foundation, high-performance UI components |
| **Styling & Design System** | **Tailwind CSS v4** + Lucide React + Canvas Confetti | Paper White & Ink Charcoal aesthetic, custom CoC flame animations |
| **AI & Transcript Engine** | **Groq LLaMA 3.3 / Google Gemini 2.5** + `youtube-caption-extractor` | Automated lecture note generation, active recall quiz builder |
| **Browser Security** | **Chrome Extension (Manifest V3)** | Cross-tab distraction site blocker and tab isolation |
| **State & Cloud Storage** | **Firebase Firestore + Auth** & Persistent LocalStorage | Offline-first optimistic state with automatic cloud synchronization |
| **PDF Generation** | HTML5 Canvas / jsPDF printing pipeline | 1-Click high-resolution stylized lecture notes export |

---

## 📁 Project Directory Structure

```text
├── extension/                     # Chrome Extension (Manifest V3 Distraction Shield)
│   ├── manifest.json              # Extension permissions and declarativeNetRequest rules
│   ├── background.js              # Tab monitoring & webRequest distraction interceptor
│   ├── popup.html / popup.js      # Status popup and settings
│   └── blocked.html               # Mindful study redirect screen
├── src/
│   ├── app/                       # Next.js 16 App Router pages
│   │   ├── page.tsx               # Primary Study Room, Player, and Library Dashboard
│   │   ├── layout.tsx             # Root Layout with Viewport metadata & AuthProvider
│   │   ├── globals.css            # Custom CSS animations & Clash flame keyframes
│   │   ├── rewards/page.tsx       # Scholar Levels, Badges, and XP Progression Hub
│   │   ├── login/page.tsx         # Firebase Authentication (Google & Email)
│   │   ├── notes/[id]/page.tsx    # Public Note Sharing view
│   │   └── api/                   # Serverless routes (lecture-notes, quiz, youtube, reviews)
│   ├── components/
│   │   ├── player/                # CinemaPlayer, StudySidebar, LessonQuizSection, Master Dock
│   │   ├── dashboard/             # CourseCard, ActivityHeatmap, AddCourseModal
│   │   ├── layout/                # Responsive Navbar, Theme Switcher, User Menu
│   │   ├── isolation/             # IsolationToggle, IsolationModal, Extension Bridge
│   │   ├── payment/               # BkashNagadCheckoutModal
│   │   └── ui/                    # ClashFlame, KeyboardShortcutsModal, Badges
│   ├── lib/                       # Core business logic
│   │   ├── storage.ts             # LocalStorage & Firestore sync layer
│   │   ├── isolation.ts           # Extension communication & tab blur listener
│   │   ├── bengaliHumanizer.ts    # Academic Bengali post-processing engine
│   │   ├── pdfExport.ts           # PDF note compilation and download
│   │   └── rewards.ts             # XP thresholds, Level titles, and Badges
│   └── types/                     # TypeScript definitions (Playlist, Video, Note, Quiz)
├── public/                        # Static assets, branding icons, and sounds
├── .env.example                   # Environment variable template
└── package.json                   # Dependencies and npm scripts
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or later (tested on v20+)
* **Package Manager**: `npm` or `pnpm`
* *(Optional)* A free **Groq API Key** from [console.groq.com](https://console.groq.com) or **Gemini API Key** from [aistudio.google.com](https://aistudio.google.com) for AI notes & quizzes.

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/reza-05/KaizenFlow.git
cd KaizenFlow

# Install dependencies
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Populate your keys:

```env
# AI Transcript & Quiz Engine
GROQ_API_KEY=gsk_your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Web Configuration (Optional for cloud sync)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

> **Note:** If AI keys are omitted, the app will gracefully fall back to local interactive notes and manual note-taking.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Installing the Isolation Shield Chrome Extension

To enable cross-tab distraction website blocking:

1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** via the toggle switch in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the `extension/` directory located inside this repository.
5. The **KaizenFlow Isolation Shield** icon will appear in your Chrome toolbar.
6. Return to [http://localhost:3000](http://localhost:3000) and click the **Shield** toggle in the top Navbar!

---

## 🎨 Design Philosophy & Human Craftsmanship

* **Editorial Notion/Apple Aesthetic:** Clean Paper White (`#ffffff`), Soft Ivory Canvas (`#fafafa`), and Deep Charcoal Ink (`#18181b`) typography with 1px border subtleness (`#e4e4e7`).
* **Zero AI Clichés:** Purely human-designed UI without oversaturated neon gradients, floating four-corner sparkle stars, or cheesy slogans.
* **Tactile Interactions:** Micro-interactions, custom keyboard shortcuts, and satisfying gamified progress feedback built specifically for students who want to lock in and master difficult subjects.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

&copy; 2026 **KaizenFlow Team**. Engineered for continuous improvement and deep work.
