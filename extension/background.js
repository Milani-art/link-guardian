// Phishara Background Service Worker
// Initializes default settings on install

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    linkshield_settings: {
      enabled: true,
      blockHighRisk: false
    },
    linkshield_stats: {
      scanned: 0,
      warnings: 0,
      blocked: 0
    }
  });
});
