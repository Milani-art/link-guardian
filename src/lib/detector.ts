/**
 * LinkShield Detection Engine (TypeScript port)
 */

const SUSPICIOUS_TLDS = [
  '.xyz', '.top', '.club', '.work', '.click', '.link', '.gq', '.ml',
  '.cf', '.tk', '.ga', '.buzz', '.icu', '.monster', '.rest', '.cam',
  '.surf', '.uno', '.bid', '.win', '.loan', '.racing', '.review',
  '.trade', '.party', '.science', '.download', '.stream', '.cricket'
];

const SHORTENERS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
  'buff.ly', 'adf.ly', 'bit.do', 'mcaf.ee', 'su.pr', 'cli.gs',
  'shorturl.at', 'rb.gy', 'cutt.ly', 'v.gd', 'shrtco.de',
  'qr.ae', 'u.to', 'clck.ru', 'shorturl.asia'
];

const RISKY_KEYWORDS = [
  'login', 'signin', 'verify', 'account', 'update', 'secure',
  'banking', 'confirm', 'password', 'credential', 'suspend',
  'unusual', 'authenticate', 'wallet', 'recover', 'unlock',
  'alert', 'urgent', 'expire', 'validate', 'reactivate'
];

const SPOOFED_BRANDS = [
  'paypal', 'apple', 'google', 'microsoft', 'amazon', 'netflix',
  'facebook', 'instagram', 'whatsapp', 'telegram', 'linkedin',
  'twitter', 'chase', 'wellsfargo', 'bankofamerica', 'citibank',
  'dropbox', 'adobe', 'spotify', 'steam', 'ebay', 'coinbase'
];

export interface Finding {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface ScanResult {
  url: string;
  riskScore: number;
  level: 'safe' | 'warning' | 'danger';
  findings: Finding[];
  timestamp: number;
}

export function analyzeURL(url: string): ScanResult {
  const findings: Finding[] = [];
  let riskScore = 0;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const fullUrl = url.toLowerCase();

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
      findings.push({ type: 'ip_address', severity: 'high', message: 'Uses IP address instead of domain name' });
      riskScore += 35;
    }

    for (const tld of SUSPICIOUS_TLDS) {
      if (hostname.endsWith(tld)) {
        findings.push({ type: 'suspicious_tld', severity: 'medium', message: `Suspicious TLD: ${tld}` });
        riskScore += 20;
        break;
      }
    }

    for (const shortener of SHORTENERS) {
      if (hostname === shortener || hostname.endsWith('.' + shortener)) {
        findings.push({ type: 'shortener', severity: 'medium', message: 'Shortened URL hides true destination' });
        riskScore += 25;
        break;
      }
    }

    const parts = hostname.split('.');
    if (parts.length > 3) {
      findings.push({ type: 'subdomains', severity: 'medium', message: `Excessive subdomains (${parts.length} levels)` });
      riskScore += 15;
    }

    const foundKeywords = RISKY_KEYWORDS.filter(kw => fullUrl.includes(kw));
    if (foundKeywords.length > 0) {
      findings.push({ type: 'risky_keywords', severity: 'medium', message: `Risky keywords: ${foundKeywords.join(', ')}` });
      riskScore += Math.min(foundKeywords.length * 8, 25);
    }

    for (const brand of SPOOFED_BRANDS) {
      if (hostname.includes(brand) && !hostname.endsWith(brand + '.com') && !hostname.endsWith(brand + '.org') && !hostname.endsWith(brand + '.net')) {
        findings.push({ type: 'brand_spoof', severity: 'high', message: `Possible ${brand} impersonation` });
        riskScore += 30;
        break;
      }
    }

    if (/[а-яА-Я\u0400-\u04FF]/.test(hostname) || hostname !== decodeURIComponent(hostname)) {
      findings.push({ type: 'homograph', severity: 'high', message: 'Contains deceptive lookalike characters' });
      riskScore += 35;
    }

    if (url.length > 200) {
      findings.push({ type: 'long_url', severity: 'low', message: 'Unusually long URL' });
      riskScore += 10;
    }

    if (parsed.username || url.includes('@')) {
      findings.push({ type: 'at_symbol', severity: 'high', message: 'URL contains @ symbol (possible redirect trick)' });
      riskScore += 30;
    }

    if (parsed.protocol === 'http:') {
      findings.push({ type: 'no_https', severity: 'low', message: 'No HTTPS encryption' });
      riskScore += 10;
    }

    if (/\.(exe|scr|bat|cmd|msi|jar|vbs|ps1|zip|rar)(\?|$)/i.test(parsed.pathname)) {
      findings.push({ type: 'dangerous_file', severity: 'high', message: 'Links to potentially dangerous file' });
      riskScore += 30;
    }

    if (url.startsWith('data:')) {
      findings.push({ type: 'data_uri', severity: 'high', message: 'Data URI — may contain hidden content' });
      riskScore += 40;
    }

  } catch {
    findings.push({ type: 'invalid', severity: 'high', message: 'Malformed URL' });
    riskScore += 30;
  }

  riskScore = Math.min(riskScore, 100);

  let level: ScanResult['level'];
  if (riskScore >= 60) level = 'danger';
  else if (riskScore >= 30) level = 'warning';
  else level = 'safe';

  return { url, riskScore, level, findings, timestamp: Date.now() };
}
