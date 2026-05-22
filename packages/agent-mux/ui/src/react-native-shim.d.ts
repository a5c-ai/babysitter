declare module 'react-native' {
  import * as React from 'react';

  export type ViewProps = Record<string, unknown>;
  export type TextProps = Record<string, unknown>;
  export type ScrollViewProps = {
    onScroll?: (event: { nativeEvent: { contentOffset: { y: number } } }) => void;
    contentContainerStyle?: unknown;
    children?: React.ReactNode;
  };
  export type TextInputProps = Record<string, unknown>;

  export const View: React.ComponentType<any>;
  export const Text: React.ComponentType<any>;
  export const ScrollView: React.ComponentType<any>;
  export const Pressable: React.ComponentType<any>;
  export const TextInput: React.ComponentType<any>;
  export const Platform: {
    OS: string;
    select?: <T>(options: Record<string, T>) => T | undefined;
  };
  export const StyleSheet: {
    create<T extends Record<string, any>>(styles: T): T;
  };
}
