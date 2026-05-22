import React, { useMemo } from 'react';
import {
  CommandPalette as CompendiumCommandPalette,
  type CommandItem as CompendiumCommandItem,
} from '@a5c-ai/compendium';

export interface CommandPaletteAction {
  id: string;
  label: string;
  run(): void;
}

export function CommandPalette(props: {
  actions: CommandPaletteAction[];
  open: boolean;
  onClose(): void;
}): JSX.Element | null {
  const items = useMemo<CompendiumCommandItem[]>(
    () =>
      props.actions.map((action) => ({
        id: action.id,
        label: action.label,
        onSelect: action.run,
      })),
    [props.actions],
  );

  return (
    <CompendiumCommandPalette
      open={props.open}
      items={items}
      placeholder="Jump, toggle, start…"
      onClose={props.onClose}
    />
  );
}
