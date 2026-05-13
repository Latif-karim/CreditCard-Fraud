type KpiCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  tone?: "default" | "danger" | "success";
};

export function KpiCard({ title, value, subtitle, tone = "default" }: KpiCardProps) {
  const toneClass =
    tone === "danger"
      ? "border-red-300 dark:border-danger/40"
      : tone === "success"
        ? "border-emerald-300 dark:border-success/40"
        : "border-slate-200 dark:border-slate-700";
  return (
    <div className={`rounded-2xl border bg-white p-4 dark:bg-slate-900 ${toneClass}`}>
      <p className="text-soft text-xs">{title}</p>
      <h3 className="my-2 text-3xl font-semibold text-slate-900 dark:text-white">{value}</h3>
      {subtitle ? <p className="text-soft text-sm">{subtitle}</p> : null}
    </div>
  );
}
