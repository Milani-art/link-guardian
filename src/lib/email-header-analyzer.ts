/**
 * Phishara Email Header Analyzer
 * Detects suspicious patterns in email headers (From, Reply-To, Return-Path, etc.)
 */

import { Finding } from "./detector";

export interface HeaderAnalysis {
  riskScore: number;
  level: 'safe' | 'warning' | 'danger';
  findings: Finding[];
}

interface ParsedHeaders {
  from?: string;
  replyTo?: string;
  returnPath?: string;
  receivedChain: string[];
  subject?: string;
  xMailer?: string;
  contentType?: string;
  mimeVersion?: string;
}

const FREE_EMAIL_PROVIDERS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'mail.com', 'protonmail.com', 'zoho.com', 'icloud.com', 'yandex.com',
  'gmx.com', 'live.com', 'msn.com', 'me.com', 'inbox.com'
];

const SPOOFED_BRANDS = [
  'paypal', 'apple', 'google', 'microsoft', 'amazon', 'netflix',
  'facebook', 'instagram', 'whatsapp', 'telegram', 'linkedin',
  'twitter', 'chase', 'wellsfargo', 'bankofamerica', 'citibank',
  'dropbox', 'adobe', 'spotify', 'steam', 'ebay', 'coinbase'
];

/** Extract email address from a header value like "John Doe <john@example.com>" */
function extractEmail(headerValue: string): string | null {
  const match = headerValue.match(/<([^>]+)>/);
  if (match) return match[1].toLowerCase().trim();
  // Bare email
  const bare = headerValue.match(/[\w.+-]+@[\w.-]+\.\w+/);
  return bare ? bare[0].toLowerCase().trim() : null;
}

/** Extract display name from "Display Name <email>" */
function extractDisplayName(headerValue: string): string | null {
  const match = headerValue.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : null;
}

/** Extract domain from email address */
function getDomain(email: string): string {
  return email.split('@')[1] || '';
}

/** Parse raw email text for header fields */
function parseHeaders(rawText: string): ParsedHeaders {
  const headers: ParsedHeaders = { receivedChain: [] };

  // Split at first blank line — headers are above, body below
  const headerBlock = rawText.split(/\n\s*\n/)[0] || rawText;
  const lines = headerBlock.split('\n');

  // Unfold continuation lines (lines starting with whitespace)
  const unfolded: string[] = [];
  for (const line of lines) {
    if (/^\s+/.test(line) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += ' ' + line.trim();
    } else {
      unfolded.push(line);
    }
  }

  for (const line of unfolded) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim().toLowerCase();
    const val = line.slice(colonIdx + 1).trim();

    switch (key) {
      case 'from': headers.from = val; break;
      case 'reply-to': headers.replyTo = val; break;
      case 'return-path': headers.returnPath = val; break;
      case 'received': headers.receivedChain.push(val); break;
      case 'subject': headers.subject = val; break;
      case 'x-mailer': headers.xMailer = val; break;
      case 'content-type': headers.contentType = val; break;
      case 'mime-version': headers.mimeVersion = val; break;
    }
  }

  return headers;
}

/** Check if text contains header-like patterns */
export function containsHeaders(text: string): boolean {
  const headerPatterns = /^(From|Reply-To|Return-Path|Received|Subject|Date|To|MIME-Version|Content-Type|X-Mailer):\s/mi;
  return headerPatterns.test(text);
}

/** Main analysis function */
export function analyzeEmailHeaders(rawText: string): HeaderAnalysis {
  const findings: Finding[] = [];
  let riskScore = 0;

  if (!containsHeaders(rawText)) {
    return { riskScore: 0, level: 'safe', findings: [] };
  }

  const headers = parseHeaders(rawText);

  // --- 1. From / Reply-To mismatch ---
  if (headers.from && headers.replyTo) {
    const fromEmail = extractEmail(headers.from);
    const replyEmail = extractEmail(headers.replyTo);
    if (fromEmail && replyEmail) {
      const fromDomain = getDomain(fromEmail);
      const replyDomain = getDomain(replyEmail);
      if (fromDomain !== replyDomain) {
        findings.push({
          type: 'header_reply_mismatch',
          severity: 'high',
          message: `Reply-To domain (${replyDomain}) differs from sender domain (${fromDomain})`
        });
        riskScore += 30;
      }
    }
  }

  // --- 2. From / Return-Path mismatch ---
  if (headers.from && headers.returnPath) {
    const fromEmail = extractEmail(headers.from);
    const returnEmail = extractEmail(headers.returnPath);
    if (fromEmail && returnEmail) {
      const fromDomain = getDomain(fromEmail);
      const returnDomain = getDomain(returnEmail);
      if (fromDomain !== returnDomain) {
        findings.push({
          type: 'header_return_path_mismatch',
          severity: 'medium',
          message: `Return-Path domain (${returnDomain}) differs from sender domain (${fromDomain})`
        });
        riskScore += 20;
      }
    }
  }

  // --- 3. Display name spoofing (brand name in display name but free email provider) ---
  if (headers.from) {
    const displayName = extractDisplayName(headers.from);
    const fromEmail = extractEmail(headers.from);
    if (displayName && fromEmail) {
      const nameLower = displayName.toLowerCase();
      const domain = getDomain(fromEmail);

      // Brand name in display but using free email
      const spoofedBrand = SPOOFED_BRANDS.find(b => nameLower.includes(b));
      if (spoofedBrand && FREE_EMAIL_PROVIDERS.includes(domain)) {
        findings.push({
          type: 'header_display_name_spoof',
          severity: 'high',
          message: `Display name references "${spoofedBrand}" but email uses ${domain}`
        });
        riskScore += 35;
      }

      // Brand name in display but domain doesn't match brand
      if (spoofedBrand && !FREE_EMAIL_PROVIDERS.includes(domain) && !domain.includes(spoofedBrand)) {
        findings.push({
          type: 'header_brand_domain_mismatch',
          severity: 'high',
          message: `Claims to be "${spoofedBrand}" but sends from ${domain}`
        });
        riskScore += 30;
      }
    }
  }

  // --- 4. Free email provider impersonating an organization ---
  if (headers.from) {
    const fromEmail = extractEmail(headers.from);
    if (fromEmail) {
      const domain = getDomain(fromEmail);
      const displayName = extractDisplayName(headers.from);
      // If display name looks corporate (contains words like support, team, admin, security)
      // but domain is free email
      if (displayName && FREE_EMAIL_PROVIDERS.includes(domain)) {
        const corporateTerms = ['support', 'team', 'admin', 'security', 'billing', 'service', 'helpdesk', 'noreply', 'notification'];
        const hasCorpTerm = corporateTerms.some(t => displayName.toLowerCase().includes(t));
        if (hasCorpTerm) {
          findings.push({
            type: 'header_free_email_corporate',
            severity: 'medium',
            message: `Sender uses corporate-sounding name "${displayName}" but sends from free email (${domain})`
          });
          riskScore += 20;
        }
      }
    }
  }

  // --- 5. Suspicious Received chain (too many hops or unusual origins) ---
  if (headers.receivedChain.length > 6) {
    findings.push({
      type: 'header_excessive_hops',
      severity: 'medium',
      message: `Unusual number of mail server hops (${headers.receivedChain.length})`
    });
    riskScore += 15;
  }

  // --- 6. Missing critical headers ---
  if (!headers.from) {
    findings.push({
      type: 'header_missing_from',
      severity: 'high',
      message: 'Missing From header — likely a forged or malformed email'
    });
    riskScore += 25;
  }

  // --- 7. Suspicious X-Mailer values ---
  if (headers.xMailer) {
    const mailerLower = headers.xMailer.toLowerCase();
    const suspiciousMailers = ['phpmailer', 'swiftmailer', 'mass mailer', 'bulk', 'sendinblue'];
    const foundMailer = suspiciousMailers.find(m => mailerLower.includes(m));
    if (foundMailer) {
      findings.push({
        type: 'header_suspicious_mailer',
        severity: 'low',
        message: `Sent using mass-mailing tool: ${headers.xMailer}`
      });
      riskScore += 10;
    }
  }

  riskScore = Math.min(riskScore, 100);

  let level: HeaderAnalysis['level'];
  if (riskScore >= 60) level = 'danger';
  else if (riskScore >= 30) level = 'warning';
  else level = 'safe';

  return { riskScore, level, findings };
}
