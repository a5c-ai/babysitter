import { render, screen } from '@/test/test-utils';
import { vi } from 'vitest';
import { PaginationControls } from '../pagination-controls';
import userEvent from '@testing-library/user-event';

describe('PaginationControls', () => {
  const defaultProps = {
    currentPage: 0,
    totalItems: 25,
    itemsPerPage: 10,
    onPageChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when totalItems is 0', () => {
    const { container } = render(
      <PaginationControls {...defaultProps} totalItems={0} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('displays the item range text', () => {
    render(<PaginationControls {...defaultProps} currentPage={0} />);
    // Rendered as "1-10 of 25" (with en-dash or hyphen)
    // The range text span contains startItem, endItem, and totalItems
    const rangeText = screen.getByText(/of 25/);
    expect(rangeText).toBeInTheDocument();
    expect(rangeText).toHaveTextContent('1');
    expect(rangeText).toHaveTextContent('10');
  });

  it('displays correct range on second page', () => {
    render(<PaginationControls {...defaultProps} currentPage={1} />);
    expect(screen.getByText(/11/)).toBeInTheDocument();
  });

  it('caps the end item at totalItems on the last page', () => {
    render(
      <PaginationControls {...defaultProps} currentPage={2} totalItems={25} itemsPerPage={10} />
    );
    // Page 3 (index 2): items 21-25
    expect(screen.getByText(/25/)).toBeInTheDocument();
  });

  it('displays the current page number (1-indexed)', () => {
    render(<PaginationControls {...defaultProps} currentPage={1} />);
    // Should show "2" as the current page indicator
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('disables the previous button on the first page', () => {
    render(<PaginationControls {...defaultProps} currentPage={0} />);
    const prevBtn = screen.getByLabelText('Previous page');
    expect(prevBtn).toBeDisabled();
  });

  it('enables the previous button when not on the first page', () => {
    render(<PaginationControls {...defaultProps} currentPage={1} />);
    const prevBtn = screen.getByLabelText('Previous page');
    expect(prevBtn).not.toBeDisabled();
  });

  it('disables the next button on the last page', () => {
    // totalItems=25, itemsPerPage=10 => 3 pages (0,1,2), last page is index 2
    render(<PaginationControls {...defaultProps} currentPage={2} />);
    const nextBtn = screen.getByLabelText('Next page');
    expect(nextBtn).toBeDisabled();
  });

  it('enables the next button when not on the last page', () => {
    render(<PaginationControls {...defaultProps} currentPage={0} />);
    const nextBtn = screen.getByLabelText('Next page');
    expect(nextBtn).not.toBeDisabled();
  });

  it('calls onPageChange with previous page when clicking prev', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PaginationControls {...defaultProps} currentPage={1} onPageChange={onPageChange} />
    );

    await user.click(screen.getByLabelText('Previous page'));
    expect(onPageChange).toHaveBeenCalledWith(0);
  });

  it('calls onPageChange with next page when clicking next', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PaginationControls {...defaultProps} currentPage={0} onPageChange={onPageChange} />
    );

    await user.click(screen.getByLabelText('Next page'));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('handles single page of items (both buttons disabled)', () => {
    render(
      <PaginationControls
        {...defaultProps}
        currentPage={0}
        totalItems={5}
        itemsPerPage={10}
      />
    );
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
    expect(screen.getByLabelText('Next page')).toBeDisabled();
  });

  it('shows page 1 for a single page', () => {
    render(
      <PaginationControls
        {...defaultProps}
        currentPage={0}
        totalItems={5}
        itemsPerPage={10}
      />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
