# Chrome Web Store Listing — KaizenFlow Isolation Shield

> Last Updated: 2026-10-01
> Ready for submission to Google Chrome Developer Dashboard

---

## 1. Store Listing Details

**Extension Name:**
KaizenFlow Isolation Shield

**Short Description (Max 132 chars):**
Block Facebook, Instagram, WhatsApp, and social distractions across all tabs while in Isolation Mode on KaizenFlow.

**Detailed Description:**
KaizenFlow Isolation Shield is the official companion extension for KaizenFlow (https://kaizenflow.study).

When studying or preparing for technical interviews, social media feeds, messaging apps, and notifications are the #1 destroyer of focus and study streaks. 

KaizenFlow Isolation Shield provides a zero-distraction firewall:
- **Instant Browser-Wide Lock:** One click of the Isolation Mode toggle in KaizenFlow suspends access to distracting platforms across every tab in your browser.
- **Protected Platforms:** Temporarily suspends Facebook, Instagram, WhatsApp Web, X (Twitter), TikTok, and Reddit.
- **Focus Shield Screen:** If you attempt to open an unallowed site in another tab, you are greeted with a clean 503 Inaccessible notice and a 1-click button to return directly to your study room.
- **Seamless Sync:** Turn off Isolation Mode in your KaizenFlow dashboard when your study session is done to instantly restore normal browsing.

Privacy & Security:
KaizenFlow Isolation Shield runs 100% locally on your machine using Chrome's native declarative network engine. It does NOT track your browsing history, read private messages, or sell any personal data.

**Category:**
Productivity

**Single Purpose:**
Suspends access to distracting social media websites across all browser tabs while active in KaizenFlow.

**Primary Language:**
English

---

## 2. Permissions Justification (For Google Review Team)

| Permission | Type | Justification for Review Team |
|---|---|---|
| `declarativeNetRequest` | permissions | Required to dynamically redirect or block requests to distracting domains (such as facebook.com, instagram.com, and whatsapp.com) while the user has activated Isolation Mode. |
| `storage` | permissions | Used to persist the user's Isolation Mode state (Armed / Disarmed) locally on their device so it survives browser restarts. |
| `tabs` | permissions | Used to identify and focus the user's active KaizenFlow study room tab when they click the "Return to KaizenFlow" button from the blocked screen. |
| `*://*.facebook.com/*` | host_permissions | Target domain restricted during Isolation Mode. |
| `*://*.instagram.com/*` | host_permissions | Target domain restricted during Isolation Mode. |
| `*://*.whatsapp.com/*` & `*://web.whatsapp.com/*` | host_permissions | Target domain restricted during Isolation Mode. |
| `*://*.x.com/*` & `*://*.twitter.com/*` | host_permissions | Target domain restricted during Isolation Mode. |
| `*://*.tiktok.com/*` | host_permissions | Target domain restricted during Isolation Mode. |
| `*://*.reddit.com/*` | host_permissions | Target domain restricted during Isolation Mode. |

---

## 3. Privacy & Data Use Disclosure

- **Does this extension collect user data?** NO.
- **Data Usage:** Zero personal or sensitive data is collected, transmitted, or sold. All blocking rules are executed locally inside the browser.

---

## 4. How to Submit to Chrome Web Store

1. Go to **[Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)**.
2. Sign in with your Google account. (If this is your first extension, Google asks for a one-time $5 developer registration fee).
3. Click **"New Item"** / **"Add new item"**.
4. Upload the zip file from your project:
   `public/downloads/kaizenflow-shield.zip`
5. Copy and paste the **Title**, **Short Description**, and **Detailed Description** from Section 1 above.
6. Copy and paste the **Permissions Justification** from Section 2 above into the reviewer notes.
7. Click **"Submit for Review"**. Google takes 24-48 hours to approve.
8. Once approved, you get an official Chrome Web Store URL (`https://chromewebstore.google.com/detail/...`) for 1-click install!
