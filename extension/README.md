# 🛡️ KaizenFlow Isolation Shield (Official Chrome Extension)

Manifest V3 companion extension that works with **KaizenFlow** to enforce deep focus by shutting down social media websites across your entire browser.

---

## 🚀 Quick Setup (Load into Chrome in 10 Seconds)

1. Open Google Chrome (or Microsoft Edge / Brave / Arc).
2. Go to `chrome://extensions/` in the address bar.
3. Turn on **Developer mode** toggle in the top-right corner.
4. Click the **Load unpacked** button in the top-left.
5. Select this folder:
   ```
   /Users/md.shifatreza/.gemini/antigravity/scratch/kizen/extension
   ```
6. That's it! The **KaizenFlow Isolation Shield** icon will appear in your extension toolbar.

---

## 🎯 How It Works

- **Toggle in KaizenFlow Web App:** Turn on the **Isolation Mode** button in the top corner of the KaizenFlow navbar.
- **Browser-Wide Defense:** The extension immediately uses Chrome's `declarativeNetRequest` engine to disable:
  - 🌐 Facebook (`facebook.com`, `m.facebook.com`)
  - 📸 Instagram (`instagram.com`)
  - 💬 WhatsApp Web (`web.whatsapp.com`)
  - 🐦 X / Twitter (`x.com`, `twitter.com`)
  - 🎵 TikTok (`tiktok.com`)
  - 🤖 Reddit (`reddit.com`)
- **Site Down Screen:** If you open any of those sites in any tab, it displays a custom **503 Service Unavailable / Inaccessible** screen with a 1-click button to return directly to your study room.
- **Zero Distraction:** Turn off the toggle in KaizenFlow when your study session is done to instantly restore normal browsing.
