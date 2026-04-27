'use client';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ProjectSearchInputProps {
  onSearch: (value: string) => void;
  debounceMs?: number;
  className?: string;
  placeholder?: string;
}

export function ProjectSearchInput({
  onSearch,
  debounceMs = 300,
  className,
  placeholder = 'Filter runs...'
}: ProjectSearchInputProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-9 py-2 text-xs text-foreground placeholder:text-foreground-muted focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:shadow-neon-glow-primary-focus transition-all"
      />
    </div>
  );
}
