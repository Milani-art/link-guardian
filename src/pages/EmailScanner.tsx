import { useState } from "react";
import { Mail, Search, Link2, Shield } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import RiskBadge from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { analyzeURL, ScanResult } from "@/lib/detector";
import { addScan } from "@/lib/scan-store";
import { cn } from "@/lib/utils";

// Extract URLs from text
function extractURLs(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"')\]]+/gi;
  const matches = text.match(urlRegex) || [];
  return [...new Set(matches)];
}

const EmailScanner = () => {
  const [content, setContent] = useState("");
  const [results, setResults] = useState<ScanResult[]>([]);
  const [scanned, setScanned] = useState(false);

  const handleScan = () => {
    const urls = extractURLs(content);
    const scans = urls.map((u) => {
      const r = analyzeURL(u);
      addScan(r);
      return r;
    });
    setResults(scans);
    setScanned(true);
  };

  const dangerCount = results.filter(r => r.level === 'danger').length;
  const warningCount = results.filter(r => r.level === 'warning').length;
  const safeCount = results.filter(r => r.level === 'safe').length;

  return (
    <div className="min-h-screen pb-20">
      <AppHeader title="Email Scanner" />
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span>Paste email content to scan all links</span>
          </div>
          <Textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setScanned(false); }}
            placeholder="Paste your email text or HTML here…"
            className="min-h-[160px] font-mono text-sm bg-card resize-none"
          />
          <Button onClick={handleScan} className="w-full h-12 text-base font-semibold glow-primary" disabled={!content.trim()}>
            <Search className="w-5 h-5 mr-2" />
            Scan Email Links
          </Button>
        </div>

        {scanned && (
          <>
            {/* Summary */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">Scan Summary</span>
                <span className="text-xs text-muted-foreground font-mono">{results.length} link{results.length !== 1 ? 's' : ''} found</span>
              </div>
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground">No links found in the pasted content.</p>
              ) : (
                <div className="flex gap-3">
                  {dangerCount > 0 && (
                    <span className="text-xs bg-destructive/15 text-destructive px-2 py-1 rounded-full font-medium">
                      {dangerCount} dangerous
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-1 rounded-full font-medium">
                      {warningCount} warning{warningCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {safeCount > 0 && (
                    <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded-full font-medium">
                      {safeCount} safe
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className={cn(
                    "bg-card border rounded-xl p-3 flex items-center gap-3",
                    r.level === 'danger' ? "border-destructive/30" : r.level === 'warning' ? "border-amber-500/30" : "border-border"
                  )}>
                    <Link2 className={cn(
                      "w-4 h-4 flex-shrink-0",
                      r.level === 'safe' && "text-emerald-400",
                      r.level === 'warning' && "text-amber-400",
                      r.level === 'danger' && "text-destructive"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono truncate">{r.url}</p>
                      {r.findings.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">{r.findings[0].message}</p>
                      )}
                    </div>
                    <RiskBadge level={r.level} score={r.riskScore} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!scanned && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-3">How it works</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                Paste the full email body text
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                We extract and scan every link automatically
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                Dangerous links are flagged with detailed findings
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailScanner;
