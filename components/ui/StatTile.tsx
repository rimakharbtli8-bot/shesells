import { Card } from "./Card";

export function StatTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-muted">{label}</span>
        {icon}
      </div>
      <span className="text-2xl font-semibold tracking-tight text-ink">{value}</span>
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </Card>
  );
}
