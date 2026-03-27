import { ScanResult } from './detector';

const STORAGE_KEY = 'linkshield_scans';
const STATS_KEY = 'linkshield_stats';

export interface ScanStats {
  totalScans: number;
  safeCount: number;
  warningCount: number;
  dangerCount: number;
  todayScans: number;
  weekScans: number;
}

export function getScanHistory(): ScanResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addScan(result: ScanResult): void {
  const history = getScanHistory();
  history.unshift(result);
  // Keep last 500 scans
  if (history.length > 500) history.length = 500;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  updateStats(result);
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STATS_KEY);
}

function updateStats(result: ScanResult): void {
  const stats = getStats();
  stats.totalScans++;
  if (result.level === 'safe') stats.safeCount++;
  else if (result.level === 'warning') stats.warningCount++;
  else if (result.level === 'danger') stats.dangerCount++;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function getStats(): ScanStats {
  try {
    const data = localStorage.getItem(STATS_KEY);
    const base: ScanStats = data ? JSON.parse(data) : {
      totalScans: 0, safeCount: 0, warningCount: 0, dangerCount: 0, todayScans: 0, weekScans: 0,
    };
    // Compute today/week from history
    const history = getScanHistory();
    const now = Date.now();
    const dayMs = 86400000;
    base.todayScans = history.filter(s => now - s.timestamp < dayMs).length;
    base.weekScans = history.filter(s => now - s.timestamp < dayMs * 7).length;
    return base;
  } catch {
    return { totalScans: 0, safeCount: 0, warningCount: 0, dangerCount: 0, todayScans: 0, weekScans: 0 };
  }
}
