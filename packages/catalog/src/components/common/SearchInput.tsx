"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  /** Callback when search value changes */
  onChange?: (value: string) => void;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Show loading state */
  isLoading?: boolean;
  /** Show clear button */
  showClear?: boolean;
  /** Callback when clear button is clicked */
  onClear?: () => void;
  /** Callback when search is submitted (Enter key) */
  onSubmit?: (value: string) => void;
  /** Custom search icon */
  searchIcon?: React.ReactNode;
  /** Size variant */
  inputSize?: "sm" | "md" | "lg";
  /** Custom class name */
  className?: string;
  /** Controlled value */
  value?: string;
  /** Default value */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** ID for the input */
  id?: string;
  /** Name for the input */
  name?: string;
  /** Blur handler */
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  /** Focus handler */
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  /** Key down handler (called before internal handling) */
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}

const sizeClasses = {
  sm: "h-8 text-sm pl-8 pr-8",
  md: "h-9 text-sm pl-9 pr-9",
  lg: "h-10 text-base pl-10 pr-10",
};

const iconSizeClasses = {
  sm: "h-4 w-4 left-2",
  md: "h-4 w-4 left-3",
  lg: "h-5 w-5 left-3",
};

const clearButtonSizeClasses = {
  sm: "right-2",
  md: "right-3",
  lg: "right-3",
};

export function SearchInput({
  onChange,
  debounceMs = 300,
  isLoading = false,
  showClear = true,
  onClear,
  onSubmit,
  searchIcon,
  inputSize = "md",
  className,
  value: controlledValue,
  defaultValue = "",
  placeholder = "Search...",
  disabled,
  autoFocus,
  id,
  name,
  onBlur,
  onFocus,
  onKeyDown: externalKeyDown,
}: SearchInputProps) {
  const size = inputSize;
  const [internalValue, setInternalValue] = React.useState(
    String(defaultValue)
  );
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Use controlled value if provided
  const value = controlledValue !== undefined ? String(controlledValue) : internalValue;
  const setValue = controlledValue !== undefined
    ? (v: string) => onChange?.(v)
    : setInternalValue;

  // Cleanup debounce on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (debounceMs > 0 && controlledValue === undefined) {
      debounceRef.current = setTimeout(() => {
        onChange?.(newValue);
      }, debounceMs);
    } else {
      onChange?.(newValue);
    }
  };

  const handleClear = () => {
    setValue("");
    onChange?.("");
    onClear?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    externalKeyDown?.(e);
    if (e.key === "Enter") {
      e.preventDefault();
      // Cancel pending debounce and trigger immediately
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      onChange?.(value);
      onSubmit?.(value);
    }
    if (e.key === "Escape" && value) {
      handleClear();
    }
  };

  // Steampunk brass magnifying glass icon
  const defaultSearchIcon = (
    <svg
      className={cn(iconSizeClasses[size])}
      style={{ color: '#B8860B' }}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3" />
    </svg>
  );

  return (
    <div className={cn("relative", className)}>
      {/* Search Icon */}
      <span
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2",
          iconSizeClasses[size]
        )}
      >
        {searchIcon || defaultSearchIcon}
      </span>

      {/* Input - Steampunk parchment style */}
      <input
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={cn(
          "w-full rounded-md disabled:cursor-not-allowed disabled:opacity-50",
          sizeClasses[size]
        )}
        style={{
          backgroundColor: '#F5E6C8',
          border: '2px solid #B8860B',
          color: '#4A3728',
          fontFamily: 'Georgia, serif',
          boxShadow: 'inset 0 1px 3px rgba(61, 43, 31, 0.1)',
        }}
      />

      {/* Loading/Clear Button */}
      <div
        className={cn(
          "absolute top-1/2 flex -translate-y-1/2 items-center gap-1",
          clearButtonSizeClasses[size]
        )}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            style={{ color: '#B8860B' }}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {showClear && value && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-sm p-0.5"
            style={{ color: '#6B5744' }}
            aria-label="Clear search"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/** Search input with suggestions dropdown */
export interface SearchInputWithSuggestionsProps extends SearchInputProps {
  /** Suggestions to display */
  suggestions?: string[];
  /** Callback when a suggestion is selected */
  onSuggestionSelect?: (suggestion: string) => void;
  /** Show suggestions dropdown */
  showSuggestions?: boolean;
}

export function SearchInputWithSuggestions({
  suggestions = [],
  onSuggestionSelect,
  showSuggestions = true,
  onChange,
  onSubmit,
  ...props
}: SearchInputWithSuggestionsProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filteredSuggestions = suggestions.filter((s) => s.length > 0);
  const hasSuggestions = filteredSuggestions.length > 0;

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (value: string) => {
    onChange?.(value);
    setIsOpen(showSuggestions && hasSuggestions);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSuggestionSelect?.(suggestion);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || !hasSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
          const suggestion = filteredSuggestions[selectedIndex];
          if (suggestion) {
            e.preventDefault();
            handleSuggestionClick(suggestion);
          }
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <SearchInput
        onChange={handleChange}
        onSubmit={onSubmit}
        onFocus={() => setIsOpen(showSuggestions && hasSuggestions)}
        onKeyDown={handleKeyDown}
        {...props}
      />

      {/* Suggestions Dropdown - Steampunk styled */}
      {isOpen && hasSuggestions && (
        <div
          className="absolute top-full z-50 mt-1 w-full rounded-md py-1 shadow-lg"
          style={{
            backgroundColor: '#F9F0DC',
            border: '1px solid #A67C00',
            boxShadow: '0 4px 12px rgba(61, 43, 31, 0.2)',
          }}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm transition-colors"
              )}
              style={{
                fontFamily: 'Georgia, serif',
                color: index === selectedIndex ? '#B8860B' : '#4A3728',
                backgroundColor: index === selectedIndex ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchInput;
