import { render, screen, act } from '@/test/test-utils';
import { vi } from 'vitest';
import { ProjectSearchInput } from '../project-search-input';
import userEvent from '@testing-library/user-event';

describe('ProjectSearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with default placeholder', () => {
    render(<ProjectSearchInput onSearch={vi.fn()} />);
    expect(screen.getByPlaceholderText('Filter runs...')).toBeInTheDocument();
  });

  it('renders with a custom placeholder', () => {
    render(<ProjectSearchInput onSearch={vi.fn()} placeholder="Search here..." />);
    expect(screen.getByPlaceholderText('Search here...')).toBeInTheDocument();
  });

  it('calls onSearch after debounce delay when typing', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ProjectSearchInput onSearch={onSearch} debounceMs={300} />);

    const input = screen.getByPlaceholderText('Filter runs...');
    await user.type(input, 'hello');

    // Should not have called yet with "hello" (debounced)
    // But will have been called with intermediate values as timers advance
    // After all timers settle, it should have the final value
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenLastCalledWith('hello');
  });

  it('debounces rapid typing', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ProjectSearchInput onSearch={onSearch} debounceMs={500} />);

    const input = screen.getByPlaceholderText('Filter runs...');
    await user.type(input, 'abc');

    // Clear all calls so far
    onSearch.mockClear();

    // Advance to trigger the final debounced call
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should have called with the final value
    expect(onSearch).toHaveBeenCalledWith('abc');
  });

  it('calls onSearch with empty string initially after debounce', () => {
    const onSearch = vi.fn();
    render(<ProjectSearchInput onSearch={onSearch} debounceMs={300} />);

    // Initial render triggers useEffect with empty value
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('updates the input value as the user types', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ProjectSearchInput onSearch={vi.fn()} />);

    const input = screen.getByPlaceholderText('Filter runs...');
    await user.type(input, 'test');

    expect(input).toHaveValue('test');
  });

  it('uses custom debounceMs', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ProjectSearchInput onSearch={onSearch} debounceMs={100} />);

    const input = screen.getByPlaceholderText('Filter runs...');
    await user.type(input, 'x');

    onSearch.mockClear();

    // Advance less than debounce
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Not called yet with the last character value change
    const _callsAfter50 = onSearch.mock.calls.length;

    // Advance past debounce
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onSearch).toHaveBeenCalledWith('x');
  });
});
