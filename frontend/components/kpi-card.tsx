import type { LucideIcon } from "lucide-react";

export type KpiTone = "default" | "danger" | "success" | "warning" | "info" | "violet";

type KpiCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  tone?: KpiTone;
  icon: LucideIcon;
};

const toneStyles: Record<
  KpiTone,
  { border: string; glow: string; iconBg: string; iconText: string; value: string }
> = {
  default: {
    border: "border-sky-200/80 dark:border-sky-500/25",
    glow: "from-sky-500/10 via-transparent to-transparent dark:from-sky-400/15",
    iconBg: "bg-sky-500/15 dark:bg-sky-400/15",
    iconText: "text-sky-600 dark:text-sky-300",
    value: "text-slate-900 dark:text-white",
  },
  danger: {
    border: "border-red-200/80 dark:border-red-500/30",
    glow: "from-red-500/12 via-transparent to-transparent dark:from-red-400/15",
    iconBg: "bg-red-500/15 dark:bg-red-400/15",
    iconText: "text-red-600 dark:text-red-300",
    value: "text-red-700 dark:text-red-200",
  },
  success: {
    border: "border-emerald-200/80 dark:border-emerald-500/30",
    glow: "from-emerald-500/12 via-transparent to-transparent dark:from-emerald-400/15",
    iconBg: "bg-emerald-500/15 dark:bg-emerald-400/15",
    iconText: "text-emerald-600 dark:text-emerald-300",
    value: "text-emerald-800 dark:text-emerald-100",
  },
  warning: {
    border: "border-amber-200/80 dark:border-amber-500/30",
    glow: "from-amber-500/12 via-transparent to-transparent dark:from-amber-400/15",
    iconBg: "bg-amber-500/15 dark:bg-amber-400/15",
    iconText: "text-amber-700 dark:text-amber-300",
    value: "text-amber-800 dark:text-amber-100",
  },
  info: {
    border: "border-cyan-200/80 dark:border-cyan-500/30",
    glow: "from-cyan-500/12 via-transparent to-transparent dark:from-cyan-400/15",
    iconBg: "bg-cyan-500/15 dark:bg-cyan-400/15",
    iconText: "text-cyan-700 dark:text-cyan-300",
    value: "text-slate-900 dark:text-white",
  },
  violet: {
    border: "border-violet-200/80 dark:border-violet-500/30",
    glow: "from-violet-500/12 via-transparent to-transparent dark:from-violet-400/15",
    iconBg: "bg-violet-500/15 dark:bg-violet-400/15",
    iconText: "text-violet-600 dark:text-violet-300",
    value: "text-slate-900 dark:text-white",
  },
};

export function KpiCard({ title, value, subtitle, tone = "default", icon: Icon }: KpiCardProps) {
  const s = toneStyles[tone];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white/95 to-slate-50/90 p-4 shadow-md shadow-slate-200/40 transition hover:-translate-y-0.5 hover:shadow-lg dark:from-slate-900/95 dark:to-slate-950/90 dark:shadow-black/30 ${s.border}`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${s.glow}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-soft text-xs font-medium uppercase tracking-wide">{title}</p>
          <h3 className={`my-2 truncate text-2xl font-bold tracking-tight sm:text-3xl ${s.value}`}>{value}</h3>
          {subtitle ? <p className="text-soft text-xs leading-relaxed">{subtitle}</p> : null}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition group-hover:scale-105 ${s.iconBg}`}
        >
          <Icon className={`h-5 w-5 ${s.iconText}`} strokeWidth={2.25} />
        </div>
      </div>
    </div>
  );
}
