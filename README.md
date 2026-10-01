# Kizen — Lock In & Learn

> **Continuous Growth, Zero Distraction.**  
> Transform any YouTube playlist into an active, locked-in study portal with proof-of-focus verification, streaks, and an autonomous syllabus-to-roadmap matching engine.

[![Next.js](https://img.shields.io/badge/Next.js-16+-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%20v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Ready-ffca28?style=flat-square&logo=firebase)](https://firebase.google.com/)

---

## 🎯 The Problem

Learning through online video tutorials on YouTube is plagued by the **YouTube Distraction Paradox**:
* **Algorithmic Traps:** Recommendations, clickbait thumbnails, intrusive ads, and short-form video feeds derail study sessions within minutes.
* **Passive Consumption:** Students play lectures in background tabs or skim forward to conclude lessons without cognitively retaining information.
* **The Academic Curriculum Gap:** University students have specific semester syllabi but waste hours scouring YouTube for sequential lectures that map directly to their exams.

**Kizen solves this completely.**

---

## ✨ Core Features

### 1. 🛡️ Cinema Focus Player
* **100% Distraction Stripping:** Complete elimination of YouTube sidebars, related videos, comments, and overlays.
* **Custom Playback Speed:** Defaults to **1.0x (Normal)** with a precision slider supporting `0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 1.75x, 2.0x, 2.5x, 3.0x`.
* **Isolated Auto-Play:** When a video finishes, ONLY the next video in that exact course queue begins playing.

### 2. 🔐 Proof-of-Focus (Attention Verification Engine)
* **Dynamic Floating Code:** A random 4-digit code appears on the player viewport for 16 seconds at an unpredictable playback window (between 25% and 65%).
* **Watch-Time Gate:** Scrubbing or fast-forwarding to the end is blocked from completing. The code submission box remains strictly locked until the user has genuinely watched at least **80% of total video duration**.
* Submitting the collected code awards **+50 XP**, marks the lesson verified `[✓]`, increments the Daily Streak, and triggers celebratory confetti.

### 3. 📚 Flagship: Syllabus-to-Roadmap Matcher
* Paste your university course syllabus or exam topics (e.g. *CSE220: Data Structures*).
* Choose your preferred learning language:
  * 🇧🇩 **Bangla** (e.g., Anisul Islam, Learn with Sumit, university teachers)
  * 🇬🇧 **English** (e.g., freeCodeCamp, CS50, Abdul Bari, Striver)
  * 🇮🇳 **Hindi** (e.g., CodeWithHarry, Apna College, Gate Smashers)
* The engine breaks down the curriculum and curates the highest-yield video across top-rated YouTube channels into an instant custom roadmap.

### 4. 🚪 In-House Focus Trap & UX Balance
* **Window Blur Detection:** Automatically detects when the learner switches tabs or leaves the window.
* **3-Second Grace Period:** Avoids interrupting legitimate note-takers. Continued absence triggers a gentle pause and focus-lost reminder.
* **Two Study Modes:**
  * *Lecture Mode:* Strict focus trap for conceptual lectures.
  * *Studio Mode:* Allows split-screen code editors (VS Code / Terminal) while keeping the 80% watch-time gate active.

### 5. 📊 365-Day Consistency Heatmap & Streaks
* GitHub-style 16-week contribution grid displaying daily study volume with graduated emerald intensity.
* Tracks Daily Streak (🔥), total study hours, and active learning days.

### 6. 📝 In-Video Timestamped Notes
* Markdown notepad embedded beside the player.
* Click `+ Add Note at this second` to insert current playback time (e.g., `[04:25]`). Clicking any timestamp seeks the video directly.
* 1-click export to Markdown (`.md`).

---

## 🎨 Human-Crafted Visual Identity

* **Default Editorial Light Mode:** Pure Paper White (`#ffffff`), Soft Ivory (`#fafafa`), and Deep Ink Charcoal (`#18181b`) text with delicate 1px borders (`#e4e4e7`). Inspired by Notion and Apple.
* **Toggleable Dark Mode:** Clean deep graphite palette for nighttime learners.
* **Zero Cheap AI Clichés:** Strictly stripped of neon purple/blue glowing gradients, 4-corner sparkle stars (`✨`), thunderbolts (`⚡`), or development jargon.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | Next.js 16+ (App Router, React 19, TypeScript) |
| **Styling & Icons** | Tailwind CSS v4 + Lucide Icons + Canvas Confetti |
| **State & Persistence** | Persistent Local Storage + Firebase (Firestore & Auth ready) |
| **Player Engine** | YouTube IFrame Player API (Isolated Sandbox) |
| **Cross-Platform** | Web (macOS, Windows, Linux) & Flutter Mobile App Ready |

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+ (tested on v26)
* npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/reza-05/kizen.git
cd kizen

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 Documentation

For the comprehensive Hackathon Problem Statement and Engineering Specification, refer to:
* `docs/Kizen_Hackathon_Problem_Statement.pdf`
* `docs/KIZEN_PRD_SPECIFICATION.md`

---

## 📜 License

MIT License &copy; 2026 Kizen Team. Developed for deep focus and continuous learning.
