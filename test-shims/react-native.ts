import React from 'react';

type BaseProps = {
  children?: React.ReactNode;
  style?: unknown;
};

function createElement<TTag extends keyof JSX.IntrinsicElements>(tag: TTag) {
  return ({ children, ...props }: BaseProps & JSX.IntrinsicElements[TTag]) =>
    React.createElement(tag, props, children);
}

export const View = createElement('div');
export const Text = createElement('span');
export const ScrollView = createElement('div');
export const Pressable = ({
  children,
  onPress,
  ...props
}: BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement> & { onPress?: () => void }) =>
  React.createElement('button', { type: 'button', ...props, onClick: onPress }, children);
export const TextInput = ({
  children: _children,
  ...props
}: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) =>
  React.createElement('input', props);

export const Platform = {
  OS: 'web',
  select<T>(options: Record<string, T>): T | undefined {
    return options.web;
  },
};

export const StyleSheet = {
  create<T extends Record<string, unknown>>(styles: T): T {
    return styles;
  },
};
