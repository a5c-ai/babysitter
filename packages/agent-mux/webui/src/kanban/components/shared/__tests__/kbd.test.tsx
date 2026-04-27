import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { Kbd } from '../kbd';

describe('Kbd', () => {
  it('renders without crashing', () => {
    render(<Kbd>K</Kbd>);
    expect(screen.getByText('K')).toBeInTheDocument();
  });

  it('renders the children text', () => {
    render(<Kbd>Enter</Kbd>);
    expect(screen.getByText('Enter')).toBeInTheDocument();
  });

  it('renders as a <kbd> element', () => {
    const { container } = render(<Kbd>A</Kbd>);
    const kbd = container.querySelector('kbd');
    expect(kbd).toBeInTheDocument();
    expect(kbd?.textContent).toBe('A');
  });

  it('applies default styling classes', () => {
    const { container } = render(<Kbd>X</Kbd>);
    const kbd = container.querySelector('kbd') as HTMLElement;
    expect(kbd.className).toContain('inline-flex');
    expect(kbd.className).toContain('font-mono');
  });

  it('applies custom className', () => {
    const { container } = render(<Kbd className="extra-class">M</Kbd>);
    const kbd = container.querySelector('kbd') as HTMLElement;
    expect(kbd.className).toContain('extra-class');
  });

  it('renders complex children', () => {
    render(
      <Kbd>
        <span>Ctrl</span>
      </Kbd>,
    );
    expect(screen.getByText('Ctrl')).toBeInTheDocument();
  });
});
