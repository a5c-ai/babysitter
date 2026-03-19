import { render, screen } from '@/test/test-utils';
import { vi } from 'vitest';
import { SearchFilter } from '../search-filter';
import userEvent from '@testing-library/user-event';

describe('SearchFilter', () => {
  const defaultProps = {
    search: '',
    onSearchChange: vi.fn(),
    statusFilter: 'all' as const,
    onStatusFilterChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the search input with placeholder', () => {
    render(<SearchFilter {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search runs...')).toBeInTheDocument();
  });

  it('displays the current search value', () => {
    render(<SearchFilter {...defaultProps} search="my query" />);
    expect(screen.getByPlaceholderText('Search runs...')).toHaveValue('my query');
  });

  it('calls onSearchChange when typing in the search input', async () => {
    const onSearchChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchFilter {...defaultProps} onSearchChange={onSearchChange} />);

    const input = screen.getByPlaceholderText('Search runs...');
    await user.type(input, 'test');

    // Called once per character; the component receives change events with cumulative value
    // but because it's a controlled input with value from props (empty string),
    // each keystroke triggers onChange with just that character appended to the controlled value.
    // Since search prop stays '' (controlled), each call receives just the new char.
    expect(onSearchChange).toHaveBeenCalledTimes(4);
    // Verify it was called with each character
    expect(onSearchChange).toHaveBeenNthCalledWith(1, 't');
    expect(onSearchChange).toHaveBeenNthCalledWith(2, 'e');
    expect(onSearchChange).toHaveBeenNthCalledWith(3, 's');
    expect(onSearchChange).toHaveBeenNthCalledWith(4, 't');
  });

  it('renders all status filter buttons', () => {
    render(<SearchFilter {...defaultProps} />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('highlights the active status filter', () => {
    render(<SearchFilter {...defaultProps} statusFilter="completed" />);
    const completedBtn = screen.getByText('Completed');
    // Active filter has bg-primary/15 class
    expect(completedBtn.className).toContain('text-primary');
  });

  it('calls onStatusFilterChange when clicking a filter button', async () => {
    const onStatusFilterChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchFilter
        {...defaultProps}
        onStatusFilterChange={onStatusFilterChange}
      />
    );

    await user.click(screen.getByText('Failed'));
    expect(onStatusFilterChange).toHaveBeenCalledWith('failed');
  });

  it('calls onStatusFilterChange with "all" when clicking All button', async () => {
    const onStatusFilterChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchFilter
        {...defaultProps}
        statusFilter="completed"
        onStatusFilterChange={onStatusFilterChange}
      />
    );

    await user.click(screen.getByText('All'));
    expect(onStatusFilterChange).toHaveBeenCalledWith('all');
  });

  it('calls onStatusFilterChange with "waiting" when clicking Running', async () => {
    const onStatusFilterChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchFilter
        {...defaultProps}
        onStatusFilterChange={onStatusFilterChange}
      />
    );

    await user.click(screen.getByText('Running'));
    expect(onStatusFilterChange).toHaveBeenCalledWith('waiting');
  });

  it('does not show Group button when onGroupByProjectChange is not provided', () => {
    render(<SearchFilter {...defaultProps} />);
    expect(screen.queryByText('Group')).not.toBeInTheDocument();
  });

  it('shows Group button when onGroupByProjectChange is provided', () => {
    render(
      <SearchFilter
        {...defaultProps}
        onGroupByProjectChange={vi.fn()}
      />
    );
    expect(screen.getByText('Group')).toBeInTheDocument();
  });

  it('calls onGroupByProjectChange with toggled value when Group is clicked', async () => {
    const onGroupByProjectChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchFilter
        {...defaultProps}
        groupByProject={false}
        onGroupByProjectChange={onGroupByProjectChange}
      />
    );

    await user.click(screen.getByText('Group'));
    expect(onGroupByProjectChange).toHaveBeenCalledWith(true);
  });

  it('toggles Group button off when groupByProject is true', async () => {
    const onGroupByProjectChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchFilter
        {...defaultProps}
        groupByProject={true}
        onGroupByProjectChange={onGroupByProjectChange}
      />
    );

    await user.click(screen.getByText('Group'));
    expect(onGroupByProjectChange).toHaveBeenCalledWith(false);
  });
});
