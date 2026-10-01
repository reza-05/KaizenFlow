// KaizenFlow Isolation Shield — Service Worker (Manifest V3)

const RULE_IDS = [1, 2, 3, 4, 5, 6, 7];

const BLOCK_RULES = [
  {
    id: 1,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: { extensionPath: '/blocked.html?target=facebook.com' }
    },
    condition: {
      urlFilter: '||facebook.com',
      resourceTypes: ['main_frame']
    }
  },
  {
    id: 2,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: { extensionPath: '/blocked.html?target=instagram.com' }
    },
    condition: {
      urlFilter: '||instagram.com',
      resourceTypes: ['main_frame']
    }
  },
  {
    id: 3,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: { extensionPath: '/blocked.html?target=whatsapp.com' }
    },
    condition: {
      urlFilter: '||whatsapp.com',
      resourceTypes: ['main_frame']
    }
  },
  {
    id: 4,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: { extensionPath: '/blocked.html?target=x.com' }
    },
    condition: {
      urlFilter: '||x.com',
      resourceTypes: ['main_frame']
    }
  },
  {
    id: 5,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: { extensionPath: '/blocked.html?target=twitter.com' }
    },
    condition: {
      urlFilter: '||twitter.com',
      resourceTypes: ['main_frame']
    }
  },
  {
    id: 6,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: { extensionPath: '/blocked.html?target=tiktok.com' }
    },
    condition: {
      urlFilter: '||tiktok.com',
      resourceTypes: ['main_frame']
    }
  },
  {
    id: 7,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: { extensionPath: '/blocked.html?target=reddit.com' }
    },
    condition: {
      urlFilter: '||reddit.com',
      resourceTypes: ['main_frame']
    }
  }
];

async function setIsolation(enabled) {
  try {
    await chrome.storage.local.set({ isolationEnabled: enabled });

    if (enabled) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: RULE_IDS,
        addRules: BLOCK_RULES
      });

      await chrome.action.setBadgeText({ text: 'ON' });
      await chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    } else {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: RULE_IDS
      });

      await chrome.action.setBadgeText({ text: '' });
    }

    return { success: true, enabled };
  } catch (err) {
    console.error('Failed to update isolation rules:', err);
    return { success: false, error: err.message };
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_STATUS') {
    chrome.storage.local.get(['isolationEnabled'], (result) => {
      sendResponse({ enabled: Boolean(result.isolationEnabled) });
    });
    return true; // Keep channel open for async response
  }

  if (request.action === 'SET_ISOLATION') {
    setIsolation(request.enabled).then((res) => {
      sendResponse(res);
    });
    return true;
  }

  if (request.action === 'FOCUS_KAIZENFLOW') {
    chrome.tabs.query({}, (tabs) => {
      const kizenTab = tabs.find((t) =>
        t.url && (t.url.includes('localhost:3000') || t.url.includes('127.0.0.1:3000') || t.url.includes('kaizenflow.study'))
      );

      if (kizenTab && kizenTab.id) {
        chrome.tabs.update(kizenTab.id, { active: true });
        if (kizenTab.windowId) {
          chrome.windows.update(kizenTab.windowId, { focused: true });
        }
        sendResponse({ success: true, tabId: kizenTab.id });
      } else {
        chrome.tabs.create({ url: 'http://localhost:3000' }, (newTab) => {
          sendResponse({ success: true, created: true });
        });
      }
    });
    return true;
  }
});

// Restore rules on service worker wake or extension startup
chrome.runtime.onStartup.addListener(async () => {
  const result = await chrome.storage.local.get(['isolationEnabled']);
  if (result.isolationEnabled) {
    await setIsolation(true);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.local.get(['isolationEnabled']);
  if (result.isolationEnabled) {
    await setIsolation(true);
  }
});
