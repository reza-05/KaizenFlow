// KaizenFlow Isolation Shield — Popup Controller

document.addEventListener('DOMContentLoaded', () => {
  const switchEl = document.getElementById('isolationSwitch');
  const badgeEl = document.getElementById('statusBadge');
  const openAppBtn = document.getElementById('openAppBtn');

  // Load initial status
  chrome.runtime.sendMessage({ action: 'GET_STATUS' }, (response) => {
    const isEnabled = Boolean(response?.enabled);
    if (switchEl) switchEl.checked = isEnabled;
    updateBadge(isEnabled);
  });

  // Handle switch toggle
  if (switchEl) {
    switchEl.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      chrome.runtime.sendMessage({ action: 'SET_ISOLATION', enabled }, (response) => {
        updateBadge(Boolean(response?.enabled));
      });
    });
  }

  // Open / Focus KaizenFlow app
  if (openAppBtn) {
    openAppBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'FOCUS_KAIZENFLOW' });
      window.close();
    });
  }

  function updateBadge(enabled) {
    if (!badgeEl) return;
    if (enabled) {
      badgeEl.textContent = 'ACTIVE';
      badgeEl.style.color = '#ef4444';
    } else {
      badgeEl.textContent = 'OFF';
      badgeEl.style.color = '#71717a';
    }
  }
});
