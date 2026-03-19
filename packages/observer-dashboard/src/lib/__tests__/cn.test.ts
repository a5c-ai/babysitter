import { describe, it, expect } from 'vitest';
import { cn } from '../cn';

describe('cn', () => {
  it('returns an empty string when called with no arguments', () => {
    expect(cn()).toBe('');
  });

  it('returns a single class name unchanged', () => {
    expect(cn('text-red-500')).toBe('text-red-500');
  });

  it('merges multiple class names', () => {
    const result = cn('px-2', 'py-1');
    expect(result).toContain('px-2');
    expect(result).toContain('py-1');
  });

  it('handles conditional classes via clsx syntax', () => {
    expect(cn('base', false && 'hidden')).toBe('base');
    expect(cn('base', true && 'visible')).toBe('base visible');
  });

  it('handles undefined and null inputs', () => {
    expect(cn('base', undefined, null, 'extra')).toBe('base extra');
  });

  it('handles array inputs', () => {
    expect(cn(['px-2', 'py-1'])).toContain('px-2');
    expect(cn(['px-2', 'py-1'])).toContain('py-1');
  });

  it('handles object inputs', () => {
    expect(cn({ 'text-red-500': true, hidden: false })).toBe('text-red-500');
  });

  it('merges conflicting Tailwind classes correctly (tailwind-merge)', () => {
    // tailwind-merge should resolve conflicts, last one wins
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('merges conflicting padding classes', () => {
    expect(cn('p-4', 'px-2')).toBe('p-4 px-2');
  });

  it('deduplicates identical class names', () => {
    // tailwind-merge handles dedup
    const result = cn('flex', 'flex');
    expect(result).toBe('flex');
  });

  it('handles empty strings', () => {
    expect(cn('', 'base', '')).toBe('base');
  });

  it('handles complex mixed inputs', () => {
    const result = cn(
      'base-class',
      undefined,
      { 'conditional-class': true, 'excluded-class': false },
      ['array-class'],
    );
    expect(result).toContain('base-class');
    expect(result).toContain('conditional-class');
    expect(result).not.toContain('excluded-class');
    expect(result).toContain('array-class');
  });
});
