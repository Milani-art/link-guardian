import { useState, useEffect } from "react";
import { History, Trash2, Shield } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import RiskBadge from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { getScanHistory, clearHistory } from "@/lib/scan-store";
import type { ScanResult } from "@/lib/detector";
import { cn } from "@/lib/utils";

const ScanHistory = () => {
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [filter, setFilter] = useState<'all' | 'safe' | 'warning' | 'danger'>('all');

  useEffect(() => {
    setHistory(getScanHistory());
  }, []);

  const handleClear = () => {
    if (confirm("Clear all scan history?")) {
      clearHistory();
      setHistory([]);
    }
  };

  const filtered = filter === 'all' ? history : history.filter(s => s.level === filter);

  const filters: { value: typeof filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'danger', label: 'Danger' },
    { value: 'warning', label: 'Warning' },
    { value: 'safe', label: 'Safe' },
  ];

  return (
    <div className="min-h-screen pb-20">
      <AppHeader title="Scan History" />
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  filter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          {history.length > 0 && (
            <button onClick={handleClear} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {history.length === 0 ? "No scans yet" : "No results for this filter"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((scan, i) => (
              <div key={i} className={cn(
                "bg-card border rounded-xl p-3",
                scan.level === 'danger' ? "border-destructive/20" : scan.level === 'warning' ? "border-amber-500/20" : "border-border"
              )}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate">{scan.url}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(scan.timestamp).toLocaleDateString()} · {new Date(scan.timestamp).toLocaleTimeString()}
                      </span>
                      {scan.findings.length > 0 && (
                        <span className="text-[11px] text-muted-foreground">· {scan.findings.length} finding{scan.findings.length > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                  <RiskBadge level={scan.level} score={scan.riskScore} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanHistory;
