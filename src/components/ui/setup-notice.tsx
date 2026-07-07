import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function SetupNotice({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <Card className="mb-6">
      <CardContent className="flex flex-col items-start gap-3 py-6">
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="max-w-prose text-sm text-muted-foreground">{body}</p>
        {cta && (
          <Link
            href={cta.href}
            className="mt-1 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {cta.label}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
