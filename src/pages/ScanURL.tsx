import { useState } from "react";
import { Search, Shield, AlertTriangle, ShieldAlert, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import RiskBadge from "@/components/RiskBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { analyzeURL, ScanResult } from "@/lib/detector";
import { addScan } from "@/lib/scan-store";
import { cn } from "@/lib/utils";

const ScanURL = () => {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [showFindings, setShowFindings] = useState(true);

  const handleScan = () => {
    let target = url.trim();
    if (!target) return;
    if (!target.startsWith("http://") && !target.startsWith("https://") && !target.startsWith("data:")) {
      target = "https://" + target;
    }
    const r = analyzeURL(target);
    addScan(r);
    setResult(r);
  };

  const levelConfig = {
    safe: { icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Safe" },
    warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Warning" },
    danger: { icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", label: "Dangerous" },
  };

  return (
    <div className="min-h-screen pb-20">
      <AppHeader title="Scan URL" />
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Input */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              placeholder="Enter URL to scan…"
              className="pl-10 h-12 font-mono text-sm bg-card"
            />
          </div>
          <Button onClick={handleScan} className="w-full h-12 text-base font-semibold glow-primary" disabled={!url.trim()}>
            <Shield className="w-5 h-5 mr-2" />
            Scan Link
          </Button>
        </div>

        {/* Result */}
        {result && (() => {
          const cfg = levelConfig[result.level];
          const Icon = cfg.icon;
          return (
            <div className={cn("rounded-xl border p-5 space-y-4", cfg.bg, cfg.border)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-8 h-8", cfg.color)} />
                  <div>
                    <p className={cn("text-lg font-bold font-heading", cfg.color)}>{cfg.label}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{result.url}</p>
                  </div>
                </div>
                <RiskBadge level={result.level} score={result.riskScore} />
              </div>

              {/* Risk meter */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Risk Level</span>
                  <span>{result.riskScore}/100</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      result.level === 'safe' && "bg-emerald-400",
                      result.level === 'warning' && "bg-amber-400",
                      result.level === 'danger' && "bg-destructive"
                    )}
                    style={{ width: `${result.riskScore}%` }}
                  />
                </div>
              </div>

              {/* Findings */}
              {result.findings.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowFindings(!showFindings)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
                  >
                    {showFindings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {result.findings.length} finding{result.findings.length > 1 ? 's' : ''} detected
                  </button>
                  {showFindings && (
                    <div className="mt-3 space-y-2">
                      {result.findings.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className={cn(
                            "mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0",
                            f.severity === 'high' && "bg-destructive",
                            f.severity === 'medium' && "bg-amber-400",
                            f.severity === 'low' && "bg-muted-foreground"
                          )} />
                          <span className="text-foreground/80">{f.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {result.level === 'safe' && result.findings.length === 0 && (
                <p className="text-sm text-emerald-400/80">No threats detected. This link appears safe.</p>
              )}
            </div>
          );
        })()}

        {/* Tips */}
        {!result && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-3">Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                Paste any URL from emails, messages, or social media
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                We check for 12+ phishing & scam patterns
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                All scanning happens locally — your data stays private
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanURL;
