import React, { createContext, useContext, useMemo } from 'react';

type UserPrefsContextValue = {
  quickReplies: string[];
  templates: string[];
};

const UserPrefsContext = createContext<UserPrefsContextValue>({ quickReplies: [], templates: [] });

export function UserPrefsSync(props: { children: React.ReactNode }): JSX.Element {
  const value = useMemo(
    () => ({
      quickReplies: ['Proceed', 'Looks good', 'Need input'],
      templates: ['Summarize', 'Explain diff'],
    }),
    [],
  );
  return <UserPrefsContext.Provider value={value}>{props.children}</UserPrefsContext.Provider>;
}

export function useUserPrefs(): UserPrefsContextValue {
  return useContext(UserPrefsContext);
}
