import React, { createContext, useContext, useMemo, useState } from 'react';

type FocusContextValue = {
  focusedId: string | null;
  setFocusedId(id: string | null): void;
};

const FocusContext = createContext<FocusContextValue | null>(null);

export function FocusManager(props: { children: React.ReactNode }): JSX.Element {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const value = useMemo(() => ({ focusedId, setFocusedId }), [focusedId]);
  return <FocusContext.Provider value={value}>{props.children}</FocusContext.Provider>;
}

export function useFocusManager(): FocusContextValue {
  const value = useContext(FocusContext);
  if (!value) {
    throw new Error('useFocusManager must be used inside FocusManager');
  }
  return value;
}
