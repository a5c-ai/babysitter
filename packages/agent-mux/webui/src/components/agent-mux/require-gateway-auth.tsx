"use client";

import { useNavigate } from "react-router-dom-v6";

import { Button } from "@a5c-ai/compendium";
import { useGatewayAuth } from "@/components/agent-mux/gateway-provider";

export function RequireGatewayAuth(props: { children: React.ReactNode; title?: string; body?: string }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useGatewayAuth();

  if (isAuthenticated) {
    return <>{props.children}</>;
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-6 py-10">
      <div className="w-full rounded-3xl border border-border bg-card p-8 shadow-lg">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
          Gateway Required
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {props.title ?? "Connect agent-mux before using this page"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground-muted">
          {props.body ??
            "This surface wraps live agent-mux sessions and hooks. Connect through the gateway login flow, then come back here."}
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="primary" onClick={() => navigate("/login")}>
            Connect gateway
          </Button>
          <Button variant="ghost" onClick={() => navigate("/settings")}>
            Open settings
          </Button>
        </div>
      </div>
    </section>
  );
}
