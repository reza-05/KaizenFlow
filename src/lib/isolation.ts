// KaizenFlow Isolation Shield & In-App Distraction Guard

const ISOLATION_KEY = 'kaizenflow_isolation_enabled';
const EXTENSION_DETECTED_KEY = 'kaizenflow_shield_extension_detected';

export interface IsolationStatus {
  enabled: boolean;
  extensionInstalled: boolean;
  distractionAttempts: number;
}

type IsolationListener = (status: IsolationStatus) => void;
const listeners: Set<IsolationListener> = new Set();

let isExtensionPresent = false;
let distractionCount = 0;
let originalDocumentTitle = '';

// Check if running in browser
const isClient = typeof window !== 'undefined';

if (isClient) {
  // Store original title
  originalDocumentTitle = document.title || 'KaizenFlow';

  // Check DOM attribute set by content.js
  if (document.documentElement.getAttribute('data-kaizenflow-shield-installed') === 'true') {
    isExtensionPresent = true;
  }

  // Listen to messages from extension content script
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;
    const { type, enabled, installed } = event.data;

    if (type === 'KAIZENFLOW_SHIELD_READY' || type === 'KAIZENFLOW_ISOLATION_STATUS') {
      isExtensionPresent = true;
      sessionStorage.setItem(EXTENSION_DETECTED_KEY, 'true');

      if (typeof enabled === 'boolean') {
        localStorage.setItem(ISOLATION_KEY, String(enabled));
      }
      notifyListeners();
    }
  });

  // Ping extension once after load
  setTimeout(() => {
    window.postMessage({ type: 'KAIZENFLOW_PING' }, '*');
    if (sessionStorage.getItem(EXTENSION_DETECTED_KEY) === 'true') {
      isExtensionPresent = true;
      notifyListeners();
    }
  }, 300);

  // Tab Defocus / Distraction Guard (Level 1 Defense)
  document.addEventListener('visibilitychange', () => {
    const isIsolationOn = getIsolationEnabled();
    if (!isIsolationOn) return;

    if (document.hidden) {
      distractionCount++;
      document.title = '🚨 [ISOLATION ACTIVE] Return to Study!';
      notifyListeners();
    } else {
      document.title = originalDocumentTitle || 'KaizenFlow';
      // Dispatch custom event for in-app alert banner
      window.dispatchEvent(
        new CustomEvent('kaizenflow-focus-return', {
          detail: { distractionCount }
        })
      );
    }
  });
}

function notifyListeners() {
  const currentStatus: IsolationStatus = {
    enabled: getIsolationEnabled(),
    extensionInstalled: isExtensionPresent,
    distractionAttempts: distractionCount,
  };
  listeners.forEach((listener) => listener(currentStatus));
}

export function getIsolationEnabled(): boolean {
  if (!isClient) return false;
  return localStorage.getItem(ISOLATION_KEY) === 'true';
}

export function checkExtensionInstalled(): boolean {
  if (!isClient) return false;
  return (
    isExtensionPresent ||
    document.documentElement.getAttribute('data-kaizenflow-shield-installed') === 'true' ||
    sessionStorage.getItem(EXTENSION_DETECTED_KEY) === 'true'
  );
}

export function setIsolationEnabled(enabled: boolean): void {
  if (!isClient) return;
  localStorage.setItem(ISOLATION_KEY, String(enabled));

  // Forward command to Chrome Extension if installed
  window.postMessage({ type: 'KAIZENFLOW_SET_ISOLATION', enabled }, '*');

  notifyListeners();
}

export function subscribeToIsolation(listener: IsolationListener): () => void {
  listeners.add(listener);
  // Send initial state immediately
  listener({
    enabled: getIsolationEnabled(),
    extensionInstalled: checkExtensionInstalled(),
    distractionAttempts: distractionCount,
  });
  return () => {
    listeners.delete(listener);
  };
}

export function resetDistractionCount(): void {
  distractionCount = 0;
  notifyListeners();
}
