import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-semibold">Page Not Found</h2>
      <p className="text-foreground-muted">The page you are looking for does not exist.</p>
      <Button asChild variant="primary">
        <Link href="/">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
