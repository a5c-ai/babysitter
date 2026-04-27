import Link from "next/link";

import { PageSection, PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageShell className="justify-center">
      <PageSection className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-foreground-muted">The page you are looking for does not exist.</p>
        <Button asChild variant="primary">
          <Link href="/projects">Back to projects</Link>
        </Button>
      </PageSection>
    </PageShell>
  );
}
