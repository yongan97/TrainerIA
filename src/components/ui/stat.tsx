import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Stat({
  label,
  value,
  suffix,
  className,
  hint,
}: {
  label: string;
  value: string;
  suffix?: string;
  className?: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-semibold tabular-nums", className)}>
          {value}
          {suffix && value !== "—" && (
            <span className="ml-1 text-base font-normal text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
