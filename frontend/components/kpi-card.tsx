type KpiCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  tone?: "default" | "danger" | "success";
};

export function KpiCard({ title, value, subtitle, tone = "default" }: KpiCardProps) {
  const toneClass =
    tone === "danger"
      ? "border-danger/40"
      : tone === "success"
        ? "border-success/40"
        : "border-slate-700";
  return (
    <div className={`rounded-2xl border bg-slate-900 ${toneClass} p-4`}>
      <p className="text-soft text-xs">{title}</p>
      <h3 className="my-2 text-3xl font-semibold">{value}</h3>
      {subtitle ? <p className="text-soft text-sm">{subtitle}</p> : null}
    </div>
  );
}
