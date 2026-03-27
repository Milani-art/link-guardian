/**
 * Phishara Content Script
 * Scans all links on the page and adds visual warnings.
 */

(function () {
  const SHIELD_ATTR = 'data-linkshield';
  let settings = { blockHighRisk: false, enabled: true };

  // Load settings
  chrome.storage.local.get(['linkshield_settings'], (result) => {
    if (result.linkshield_settings) {
      settings = { ...settings, ...result.linkshield_settings };
    }
    if (settings.enabled) scanPage();
  });

  // Listen for setting changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.linkshield_settings) {
      settings = { ...settings, ...changes.linkshield_settings.newValue };
      if (settings.enabled) scanPage();
      else removeAllWarnings();
    }
  });

  function scanPage() {
    const links = document.querySelectorAll('a[href]:not([' + SHIELD_ATTR + '])');
    links.forEach(processLink);

    // Observe DOM for new links
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.tagName === 'A' && node.href && !node.hasAttribute(SHIELD_ATTR)) {
            processLink(node);
          }
          const innerLinks = node.querySelectorAll?.('a[href]:not([' + SHIELD_ATTR + '])');
          innerLinks?.forEach(processLink);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function processLink(anchor) {
    const href = anchor.href;
    if (!href || href.startsWith('javascript:') || href.startsWith('#') || href.startsWith('mailto:')) return;

    anchor.setAttribute(SHIELD_ATTR, 'scanned');
    const result = LinkShieldDetector.analyzeURL(href);

    if (result.level === 'safe') return;

    anchor.setAttribute(SHIELD_ATTR, result.level);
    anchor.classList.add('linkshield-' + result.level);

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'linkshield-tooltip linkshield-tooltip-' + result.level;
    tooltip.innerHTML = `
      <div class="linkshield-tooltip-header">
        <span class="linkshield-icon">${result.level === 'danger' ? '🛑' : '⚠️'}</span>
        <strong>Phishara ${result.level === 'danger' ? 'DANGER' : 'Warning'}</strong>
        <span class="linkshield-score">Risk: ${result.riskScore}/100</span>
      </div>
      <ul class="linkshield-findings">
        ${result.findings.map(f => `<li class="linkshield-finding-${f.severity}">${f.message}</li>`).join('')}
      </ul>
      ${result.level === 'danger' && settings.blockHighRisk ? '<div class="linkshield-blocked">🚫 This link has been blocked</div>' : ''}
    `;

    anchor.style.position = anchor.style.position || 'relative';
    anchor.appendChild(tooltip);

    // Block dangerous links if setting enabled
    if (result.level === 'danger' && settings.blockHighRisk) {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showBlockModal(href, result);
      }, true);
    }

    // Track stats
    updateStats(result.level);
  }

  function showBlockModal(url, result) {
    const existing = document.getElementById('linkshield-block-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'linkshield-block-modal';
    modal.className = 'linkshield-modal-overlay';
    modal.innerHTML = `
      <div class="linkshield-modal">
        <div class="linkshield-modal-icon">🛑</div>
        <h2>Link Blocked by Phishara</h2>
        <p class="linkshield-modal-url">${url.substring(0, 80)}${url.length > 80 ? '...' : ''}</p>
        <p>This link scored <strong>${result.riskScore}/100</strong> risk and has been blocked for your safety.</p>
        <ul>
          ${result.findings.map(f => `<li>${f.message}</li>`).join('')}
        </ul>
        <div class="linkshield-modal-actions">
          <button class="linkshield-btn-safe" id="ls-close">Go Back (Safe)</button>
          <button class="linkshield-btn-danger" id="ls-proceed">Proceed Anyway</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('ls-close').onclick = () => modal.remove();
    document.getElementById('ls-proceed').onclick = () => {
      modal.remove();
      window.open(url, '_blank');
    };
  }

  function updateStats(level) {
    chrome.storage.local.get(['linkshield_stats'], (result) => {
      const stats = result.linkshield_stats || { warnings: 0, blocked: 0, scanned: 0 };
      stats.scanned++;
      if (level === 'warning') stats.warnings++;
      if (level === 'danger') stats.blocked++;
      chrome.storage.local.set({ linkshield_stats: stats });
    });
  }

  function removeAllWarnings() {
    document.querySelectorAll('[' + SHIELD_ATTR + ']').forEach(el => {
      el.removeAttribute(SHIELD_ATTR);
      el.classList.remove('linkshield-warning', 'linkshield-danger');
      el.querySelector('.linkshield-tooltip')?.remove();
    });
  }
})();
