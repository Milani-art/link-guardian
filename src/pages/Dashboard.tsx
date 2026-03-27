import { Shield, AlertTriangle, ShieldCheck, ShieldAlert, Activity, TrendingUp } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { getStats, getScanHistory } from "@/lib/scan-store";
import RiskBadge from "@/components/RiskBadge";
import { useEffect, useState } from "react";
import type { ScanStats } from "@/lib/scan-store";
import type { ScanResult } from "@/lib/detector";

const Dashboard = () => {
  const [stats, setStats] = useState<ScanStats>(getStats());
  const [recent, setRecent] = useState<ScanResult[]>([]);

  useEffect(() => {
    setStats(getStats());
    setRecent(getScanHistory().slice(0, 5));
  }, []);

  const safePercent = stats.totalScans > 0 ? Math.round((stats.safeCount / stats.totalScans) * 100) : 100;

  return (
    <div className="min-h-screen pb-20">
      <AppHeader />
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Safety Score Ring */}
        <div className="flex flex-col items-center py-6">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={safePercent >= 80 ? "hsl(142 71% 45%)" : safePercent >= 50 ? "hsl(38 92% 50%)" : "hsl(var(--destructive))"}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${safePercent * 2.64} ${264 - safePercent * 2.64}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold font-heading">{safePercent}%</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Safe</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">Overall safety score</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Activity, label: "Total Scans", value: stats.totalScans, color: "text-primary" },
            { icon: ShieldCheck, label: "Safe Links", value: stats.safeCount, color: "text-emerald-400" },
            { icon: AlertTriangle, label: "Warnings", value: stats.warningCount, color: "text-amber-400" },
            { icon: ShieldAlert, label: "Dangerous", value: stats.dangerCount, color: "text-destructive" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-2xl font-bold font-heading">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Today/Week */}
        <div className="flex gap-3">
          <div className="flex-1 bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Today</span>
            </div>
            <p className="text-xl font-bold font-heading">{stats.todayScans}</p>
          </div>
          <div className="flex-1 bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">This Week</span>
            </div>
            <p className="text-xl font-bold font-heading">{stats.weekScans}</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Activity</h2>
          {recent.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No scans yet. Try scanning a URL!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((scan, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate">{scan.url}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(scan.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <RiskBadge level={scan.level} score={scan.riskScore} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
