/**
 * LinkShield Detection Engine
 * Analyzes URLs for phishing indicators and assigns safety scores.
 */

const LinkShieldDetector = (() => {
  // Suspicious TLDs commonly used in phishing
  const SUSPICIOUS_TLDS = [
    '.xyz', '.top', '.club', '.work', '.click', '.link', '.gq', '.ml',
    '.cf', '.tk', '.ga', '.buzz', '.icu', '.monster', '.rest', '.cam',
    '.surf', '.uno', '.bid', '.win', '.loan', '.racing', '.review',
    '.trade', '.party', '.science', '.download', '.stream', '.cricket'
  ];

  // URL shortener domains
  const SHORTENERS = [
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
    'buff.ly', 'adf.ly', 'bit.do', 'mcaf.ee', 'su.pr', 'cli.gs',
    'shorturl.at', 'rb.gy', 'cutt.ly', 'v.gd', 'shrtco.de',
    'qr.ae', 'u.to', 'clck.ru', 'shorturl.asia'
  ];

  // Risky keywords in URLs
  const RISKY_KEYWORDS = [
    'login', 'signin', 'verify', 'account', 'update', 'secure',
    'banking', 'confirm', 'password', 'credential', 'suspend',
    'unusual', 'authenticate', 'wallet', 'recover', 'unlock',
    'alert', 'urgent', 'expire', 'validate', 'reactivate'
  ];

  // Trusted brands often spoofed
  const SPOOFED_BRANDS = [
    'paypal', 'apple', 'google', 'microsoft', 'amazon', 'netflix',
    'facebook', 'instagram', 'whatsapp', 'telegram', 'linkedin',
    'twitter', 'chase', 'wellsfargo', 'bankofamerica', 'citibank',
    'dropbox', 'adobe', 'spotify', 'steam', 'ebay', 'coinbase'
  ];

  function analyzeURL(url) {
    const findings = [];
    let riskScore = 0;

    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      const fullUrl = url.toLowerCase();

      // 1. Check for IP address URLs
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
        findings.push({ type: 'ip_address', severity: 'high', message: 'Uses IP address instead of domain name' });
        riskScore += 35;
      }

      // 2. Check suspicious TLDs
      for (const tld of SUSPICIOUS_TLDS) {
        if (hostname.endsWith(tld)) {
          findings.push({ type: 'suspicious_tld', severity: 'medium', message: `Suspicious TLD: ${tld}` });
          riskScore += 20;
          break;
        }
      }

      // 3. Check URL shorteners
      for (const shortener of SHORTENERS) {
        if (hostname === shortener || hostname.endsWith('.' + shortener)) {
          findings.push({ type: 'shortener', severity: 'medium', message: 'Shortened URL hides true destination' });
          riskScore += 25;
          break;
        }
      }

      // 4. Excessive subdomains (more than 3 levels)
      const parts = hostname.split('.');
      if (parts.length > 3) {
        findings.push({ type: 'subdomains', severity: 'medium', message: `Excessive subdomains (${parts.length} levels)` });
        riskScore += 15;
      }

      // 5. Risky keywords
      const foundKeywords = RISKY_KEYWORDS.filter(kw => fullUrl.includes(kw));
      if (foundKeywords.length > 0) {
        findings.push({ type: 'risky_keywords', severity: 'medium', message: `Risky keywords: ${foundKeywords.join(', ')}` });
        riskScore += Math.min(foundKeywords.length * 8, 25);
      }

      // 6. Brand spoofing detection
      for (const brand of SPOOFED_BRANDS) {
        if (hostname.includes(brand) && !hostname.endsWith(brand + '.com') && !hostname.endsWith(brand + '.org') && !hostname.endsWith(brand + '.net')) {
          findings.push({ type: 'brand_spoof', severity: 'high', message: `Possible ${brand} impersonation` });
          riskScore += 30;
          break;
        }
      }

      // 7. Homograph / lookalike characters
      if (/[а-яА-Я\u0400-\u04FF]/.test(hostname) || hostname !== decodeURIComponent(hostname)) {
        findings.push({ type: 'homograph', severity: 'high', message: 'Contains deceptive lookalike characters' });
        riskScore += 35;
      }

      // 8. Suspicious URL length
      if (url.length > 200) {
        findings.push({ type: 'long_url', severity: 'low', message: 'Unusually long URL' });
        riskScore += 10;
      }

      // 9. Multiple redirects / @ symbol
      if (parsed.username || url.includes('@')) {
        findings.push({ type: 'at_symbol', severity: 'high', message: 'URL contains @ symbol (possible redirect trick)' });
        riskScore += 30;
      }

      // 10. HTTP (no encryption)
      if (parsed.protocol === 'http:') {
        findings.push({ type: 'no_https', severity: 'low', message: 'No HTTPS encryption' });
        riskScore += 10;
      }

      // 11. Suspicious file extensions
      if (/\.(exe|scr|bat|cmd|msi|jar|vbs|ps1|zip|rar)(\?|$)/i.test(parsed.pathname)) {
        findings.push({ type: 'dangerous_file', severity: 'high', message: 'Links to potentially dangerous file' });
        riskScore += 30;
      }

      // 12. Data URI
      if (url.startsWith('data:')) {
        findings.push({ type: 'data_uri', severity: 'high', message: 'Data URI — may contain hidden content' });
        riskScore += 40;
      }

    } catch (e) {
      findings.push({ type: 'invalid', severity: 'high', message: 'Malformed URL' });
      riskScore += 30;
    }

    riskScore = Math.min(riskScore, 100);

    let level;
    if (riskScore >= 60) level = 'danger';
    else if (riskScore >= 30) level = 'warning';
    else level = 'safe';

    return { url, riskScore, level, findings };
  }

  return { analyzeURL };
})();

if (typeof module !== 'undefined') module.exports = LinkShieldDetector;
