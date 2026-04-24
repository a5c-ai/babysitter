"use client";

import { Suspense, useState } from "react";
import { Field, Input, LogoWordmark } from "@a5c-ai/compendium";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useGatewayAuth } from "@/components/agent-mux/gateway-provider";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useGatewayAuth();
  const [gatewayUrl, setGatewayUrl] = useState("http://127.0.0.1:7878");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login({ gatewayUrl, token });
      router.replace(searchParams.get("next") || "/sessions");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-6 py-10">
      <form onSubmit={handleSubmit} className="w-full rounded-3xl border border-border bg-card p-8 shadow-lg">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
          agent-mux
        </p>
        <div className="mb-3">
          <LogoWordmark className="h-6 w-auto" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Connect the gateway</h1>
        <p className="mt-3 text-sm leading-6 text-foreground-muted">
          The kanban app keeps the gateway URL and bearer token in local storage so it can reconnect
          to the same agent-mux instance between page loads.
        </p>

        <div className="mt-6 grid gap-4">
          <Field label="Gateway URL">
            <Input
              value={gatewayUrl}
              onChange={(event) => setGatewayUrl(event.target.value)}
              placeholder="http://127.0.0.1:7878"
            />
          </Field>

          <Field label="Bearer token">
            <Input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="paste token"
            />
          </Field>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-error/20 bg-error-muted px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={submitting || !token.trim()}
          >
            Connect gateway
          </Button>
        </div>
      </form>
    </section>
  );
}
