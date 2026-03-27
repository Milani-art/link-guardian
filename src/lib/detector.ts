/**
 * Phishara Detection Engine
 */

// Phishing email phrases — triggers warning/danger when found in email body
const PHISHING_PHRASES_HIGH: string[] = [
  'your account has been suspended',
  'your account will be closed',
  'verify your identity immediately',
  'confirm your payment information',
  'unauthorized transaction',
  'click here to restore access',
  'your password has expired',
  'we detected unusual activity',
  'action required immediately',
  'failure to verify will result in',
  'your account has been compromised',
  'security alert: unauthorized login',
  'respond within 24 hours or',
  'click below to avoid suspension',
  'we will suspend your account',
  'your payment was declined',
  'confirm your social security',
  'provide your credit card details',
  'wire transfer request',
  'send gift cards',
];

const PHISHING_PHRASES_MEDIUM: string[] = [
  'act now',
  'limited time offer',
  'you have been selected',
  'congratulations you won',
  'click here',
  'do not share this email',
  'dear customer',
  'dear valued member',
  'dear user',
  'verify your account',
  'update your information',
  'confirm your details',
  'reset your password',
  'unusual sign-in activity',
  'prize claim',
  'free gift',
  'risk free',
  'no obligation',
  'winner notification',
  'inheritance fund',
];

export interface EmailAnalysis {
  riskScore: number;
  level: 'safe' | 'warning' | 'danger';
  findings: Finding[];
}

export function analyzeEmailContent(text: string): EmailAnalysis {
  const findings: Finding[] = [];
  let riskScore = 0;
  const lower = text.toLowerCase();

  // Check high-severity phishing phrases
  const highMatches = PHISHING_PHRASES_HIGH.filter(p => lower.includes(p));
  if (highMatches.length > 0) {
    findings.push({
      type: 'phishing_language',
      severity: 'high',
      message: `Dangerous phishing phrases detected: "${highMatches[0]}"${highMatches.length > 1 ? ` (+${highMatches.length - 1} more)` : ''}`
    });
    riskScore += Math.min(highMatches.length * 20, 60);
  }

  // Check medium-severity phrases
  const medMatches = PHISHING_PHRASES_MEDIUM.filter(p => lower.includes(p));
  if (medMatches.length > 0) {
    findings.push({
      type: 'suspicious_language',
      severity: 'medium',
      message: `Suspicious phrases: "${medMatches[0]}"${medMatches.length > 1 ? ` (+${medMatches.length - 1} more)` : ''}`
    });
    riskScore += Math.min(medMatches.length * 10, 30);
  }

  // Urgency pressure tactics (ALL CAPS, excessive exclamation marks)
  const capsWords = text.match(/\b[A-Z]{4,}\b/g) || [];
  if (capsWords.length >= 3) {
    findings.push({ type: 'urgency_caps', severity: 'medium', message: `Excessive capitalization used for pressure (${capsWords.length} words)` });
    riskScore += 15;
  }

  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations >= 5) {
    findings.push({ type: 'urgency_exclamation', severity: 'low', message: `Excessive exclamation marks (${exclamations})` });
    riskScore += 10;
  }

  // Spoofed brand mentions in email body
  const brandMentions = SPOOFED_BRANDS.filter(b => lower.includes(b));
  if (brandMentions.length > 0 && (highMatches.length > 0 || medMatches.length > 0)) {
    findings.push({
      type: 'brand_impersonation',
      severity: 'high',
      message: `References ${brandMentions.join(', ')} alongside phishing language`
    });
    riskScore += 25;
  }

  riskScore = Math.min(riskScore, 100);

  let level: EmailAnalysis['level'];
  if (riskScore >= 60) level = 'danger';
  else if (riskScore >= 30) level = 'warning';
  else level = 'safe';

  return { riskScore, level, findings };
}

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
