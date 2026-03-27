import { cn } from "@/lib/utils";

const RiskBadge = ({ level, score }: { level: 'safe' | 'warning' | 'danger'; score: number }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium",
      level === 'safe' && "bg-emerald-500/15 text-emerald-400",
      level === 'warning' && "bg-amber-500/15 text-amber-400",
      level === 'danger' && "bg-destructive/15 text-destructive"
    )}
  >
    <span className={cn(
      "w-1.5 h-1.5 rounded-full",
      level === 'safe' && "bg-emerald-400",
      level === 'warning' && "bg-amber-400",
      level === 'danger' && "bg-destructive"
    )} />
    {score}/100
  </span>
);

export default RiskBadge;
