/**
 * useSession — convenience hook that returns session state and dispatch.
 *
 * Must be called from within a SessionProvider subtree.
 */

import type { Dispatch } from "react";
import { useSessionContext, type SessionAction } from "../contexts/SessionContext.js";
import type { SessionState } from "../types.js";

export interface UseSessionResult {
  state: SessionState;
  dispatch: Dispatch<SessionAction>;
}

export function useSession(): UseSessionResult {
  const { state, dispatch } = useSessionContext();
  return { state, dispatch };
}
