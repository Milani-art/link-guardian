// LinkShield Popup Script

const toggleEnabled = document.getElementById('toggle-enabled');
const toggleBlock = document.getElementById('toggle-block');

// Load state
chrome.storage.local.get(['linkshield_settings', 'linkshield_stats'], (result) => {
  const settings = result.linkshield_settings || { enabled: true, blockHighRisk: false };
  const stats = result.linkshield_stats || { scanned: 0, warnings: 0, blocked: 0 };

  toggleEnabled.classList.toggle('active', settings.enabled);
  toggleBlock.classList.toggle('active', settings.blockHighRisk);

  document.getElementById('stat-scanned').textContent = stats.scanned;
  document.getElementById('stat-warnings').textContent = stats.warnings;
  document.getElementById('stat-blocked').textContent = stats.blocked;
});

toggleEnabled.addEventListener('click', () => {
  toggleEnabled.classList.toggle('active');
  saveSettings();
});

toggleBlock.addEventListener('click', () => {
  toggleBlock.classList.toggle('active');
  saveSettings();
});

function saveSettings() {
  chrome.storage.local.set({
    linkshield_settings: {
      enabled: toggleEnabled.classList.contains('active'),
      blockHighRisk: toggleBlock.classList.contains('active')
    }
  });
}
