// KaizenFlow Isolation Shield — Content Bridge Script

// Mark presence on the webpage
function announcePresence() {
  document.documentElement.setAttribute('data-kaizenflow-shield-installed', 'true');
  window.postMessage({ type: 'KAIZENFLOW_SHIELD_READY', version: '1.0.0' }, '*');
}

announcePresence();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', announcePresence);
}

// Relay web application messages to extension background service worker
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  // Toggle Isolation Mode request from KaizenFlow UI
  if (data.type === 'KAIZENFLOW_SET_ISOLATION') {
    chrome.runtime.sendMessage(
      { action: 'SET_ISOLATION', enabled: Boolean(data.enabled) },
      (response) => {
        window.postMessage(
          {
            type: 'KAIZENFLOW_ISOLATION_STATUS',
            enabled: response?.enabled,
            success: response?.success,
            installed: true
          },
          '*'
        );
      }
    );
  }

  // Ping / Handshake request
  if (data.type === 'KAIZENFLOW_PING') {
    chrome.runtime.sendMessage({ action: 'GET_STATUS' }, (response) => {
      window.postMessage(
        {
          type: 'KAIZENFLOW_ISOLATION_STATUS',
          enabled: response?.enabled,
          installed: true
        },
        '*'
      );
    });
  }
});

// Periodic sync every 2.5 seconds
setInterval(() => {
  try {
    chrome.runtime.sendMessage({ action: 'GET_STATUS' }, (response) => {
      if (chrome.runtime.lastError) return;
      window.postMessage(
        {
          type: 'KAIZENFLOW_ISOLATION_STATUS',
          enabled: response?.enabled,
          installed: true
        },
        '*'
      );
    });
  } catch {}
}, 2500);
