// KaizenFlow Isolation Shield — Blocked Page Controller

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const target = urlParams.get('target') || 'Distraction Site';

  const domainEl = document.getElementById('targetDomain');
  if (domainEl) {
    domainEl.textContent = target;
  }

  // Return to KaizenFlow Study Room
  const returnBtn = document.getElementById('returnBtn');
  if (returnBtn) {
    returnBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'FOCUS_KAIZENFLOW' });
    });
  }

  // Emergency Disable
  const disableBtn = document.getElementById('disableBtn');
  if (disableBtn) {
    disableBtn.addEventListener('click', () => {
      const confirmDisable = confirm(
        '⚠️ Are you sure you want to disable Isolation Mode? Your focus streak momentum might be affected.'
      );
      if (confirmDisable) {
        chrome.runtime.sendMessage({ action: 'SET_ISOLATION', enabled: false }, () => {
          // Go back or reload the original site
          window.location.href = `https://${target}`;
        });
      }
    });
  }
});
