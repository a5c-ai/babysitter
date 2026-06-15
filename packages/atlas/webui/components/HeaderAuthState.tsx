"use client";

import * as React from "react";
import Link from "next/link";
import { LogIn, LogOut, UserRound } from "lucide-react";

type SessionUser = {
  id: string | null;
  email: string | null;
  name: string | null;
  image: string | null;
};

export function HeaderAuthState() {
  const [user, setUser] = React.useState<SessionUser | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/private/session")
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled) {
          setUser(payload.user ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (user) {
    return (
      <>
        <Link href="/workspace" className="atlas-header__link">
          <UserRound style={{ width: 15, height: 15 }} />
          <span>Workspace</span>
        </Link>
        <button
          type="button"
          className="atlas-header__button"
          onClick={() => window.location.assign("/api/auth/signout?callbackUrl=/")}
        >
          <LogOut style={{ width: 15, height: 15 }} />
          <span>Logout</span>
        </button>
      </>
    );
  }

  return (
    <button
      type="button"
      className="atlas-header__button"
      onClick={() => window.location.assign("/api/auth/github?callbackUrl=/workspace")}
    >
      <LogIn style={{ width: 15, height: 15 }} />
      <span>Login</span>
    </button>
  );
}
