import { cn } from "@/lib/utils";

export function ProgressBar({
  percent,
  className,
  trackClassName,
  barClassName,
}: {
  percent: number;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-sand", trackClassName, className)}>
      <div
        className={cn("h-full rounded-full bg-accent transition-all duration-500 ease-out", barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
