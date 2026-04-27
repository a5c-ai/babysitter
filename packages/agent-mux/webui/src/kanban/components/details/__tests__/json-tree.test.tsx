import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, setupUser } from '@/test/test-utils';
import { JsonTree, JsonTreeView } from '../json-tree';
import { createMockTaskDetail } from '@/test/fixtures';

// Mock clipboard
beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    configurable: true,
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
      write: vi.fn().mockResolvedValue(undefined),
      read: vi.fn().mockResolvedValue([]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn().mockReturnValue(false),
    },
  });
});

// ========================================================================
// JsonTreeView (generic JSON viewer)
// ========================================================================

describe('JsonTreeView', () => {
  it('renders null data as "null" text', () => {
    render(<JsonTreeView data={null} />);
    expect(screen.getByText('null')).toBeInTheDocument();
  });

  it('renders undefined data as "null" text', () => {
    render(<JsonTreeView data={undefined} />);
    expect(screen.getByText('null')).toBeInTheDocument();
  });

  it('renders string values with quotes', () => {
    render(<JsonTreeView data="hello" />);
    // PrimitiveValue wraps strings in &quot; entities
    expect(screen.getByText(/hello/)).toBeInTheDocument();
  });

  it('renders number values', () => {
    render(<JsonTreeView data={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders boolean true', () => {
    render(<JsonTreeView data={true} />);
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('renders boolean false', () => {
    render(<JsonTreeView data={false} />);
    expect(screen.getByText('false')).toBeInTheDocument();
  });

  it('renders null value inside an object', () => {
    render(<JsonTreeView data={{ key: null }} defaultExpanded />);
    expect(screen.getByText('null')).toBeInTheDocument();
    expect(screen.getByText('key')).toBeInTheDocument();
  });

  it('renders a simple object with keys expanded by default (<=10 keys)', () => {
    render(<JsonTreeView data={{ name: 'Alice', age: 30 }} />);
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('age')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('renders array items expanded by default (<=5 items)', () => {
    render(<JsonTreeView data={[1, 2, 3]} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('collapses large arrays by default (>5 items) showing item count', () => {
    const arr = [1, 2, 3, 4, 5, 6];
    render(<JsonTreeView data={arr} />);
    expect(screen.getByText('6 items')).toBeInTheDocument();
  });

  it('collapses large objects by default (>10 keys) showing key count', () => {
    const obj: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      obj[`key${i}`] = i;
    }
    render(<JsonTreeView data={obj} />);
    expect(screen.getByText('12 keys')).toBeInTheDocument();
  });

  it('toggles expand/collapse on click', async () => {
    const user = setupUser();
    const data = { a: 1, b: 2 };
    render(<JsonTreeView data={data} />);

    // Should be expanded by default (2 keys <= 10)
    expect(screen.getByText('a')).toBeInTheDocument();

    // Click the toggle row (the first role="button" is the expandable node)
    const toggleRows = screen.getAllByRole('button');
    const toggleRow = toggleRows[0];
    await user.click(toggleRow);

    // After collapsing, should show key count summary
    expect(screen.getByText('2 keys')).toBeInTheDocument();
  });

  it('expands a collapsed node on click', async () => {
    const user = setupUser();
    // Large array starts collapsed
    const arr = [10, 20, 30, 40, 50, 60];
    render(<JsonTreeView data={arr} />);

    // Collapsed - shows count
    expect(screen.getByText('6 items')).toBeInTheDocument();

    // Click to expand
    const toggleRow = screen.getByRole('button');
    await user.click(toggleRow);

    // Should now show individual values
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it('renders nested objects', () => {
    const data = { outer: { inner: 'value' } };
    render(<JsonTreeView data={data} defaultExpanded />);
    expect(screen.getByText('outer')).toBeInTheDocument();
    expect(screen.getByText('inner')).toBeInTheDocument();
  });

  it('shows empty text for empty object', () => {
    render(<JsonTreeView data={{}} defaultExpanded />);
    expect(screen.getByText('empty')).toBeInTheDocument();
  });

  it('shows empty text for empty array', () => {
    render(<JsonTreeView data={[]} defaultExpanded />);
    expect(screen.getByText('empty')).toBeInTheDocument();
  });

  it('renders copy button on leaf values', () => {
    render(<JsonTreeView data={{ name: 'test' }} />);
    const copyButtons = screen.getAllByTitle('Copy');
    expect(copyButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows 1 item for single-element array', () => {
    // Single item array is <=5 so expanded by default. Collapse it first.
    // Actually, let's test the count label text using defaultExpanded=false
    render(<JsonTreeView data={[42]} defaultExpanded={false} />);
    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('shows 1 key for single-key object', () => {
    render(<JsonTreeView data={{ solo: true }} defaultExpanded={false} />);
    expect(screen.getByText('1 key')).toBeInTheDocument();
  });

  it('supports keyboard toggle with Enter key', async () => {
    const user = setupUser();
    const data = { a: 1 };
    render(<JsonTreeView data={data} />);

    // Expanded by default
    expect(screen.getByText('a')).toBeInTheDocument();

    const toggleRows = screen.getAllByRole('button');
    const toggleRow = toggleRows[0];
    toggleRow.focus();
    await user.keyboard('{Enter}');

    // Should collapse and show count
    expect(screen.getByText('1 key')).toBeInTheDocument();
  });

  it('supports keyboard toggle with Space key', async () => {
    const user = setupUser();
    const data = { a: 1 };
    render(<JsonTreeView data={data} />);

    const toggleRows = screen.getAllByRole('button');
    const toggleRow = toggleRows[0];
    toggleRow.focus();
    await user.keyboard(' ');

    expect(screen.getByText('1 key')).toBeInTheDocument();
  });
});

// ========================================================================
// JsonTree (task-specific I/O viewer)
// ========================================================================

describe('JsonTree', () => {
  it('renders null task state with placeholder message', () => {
    render(<JsonTree task={null} />);
    expect(screen.getByText('Select a task to view data')).toBeInTheDocument();
  });

  it('renders "No I/O data" when task has neither input nor result', () => {
    const base = createMockTaskDetail();
    // Explicitly remove input and result (factory defaults them via ??)
    const task = { ...base, input: undefined, result: undefined };
    render(<JsonTree task={task} />);
    expect(screen.getByText('No I/O data for this task')).toBeInTheDocument();
  });

  it('renders Input tab active by default', () => {
    const task = createMockTaskDetail({
      input: { query: 'test' },
      result: { output: 'done' },
    });
    render(<JsonTree task={task} />);

    const inputBtn = screen.getByText('Input');
    const outputBtn = screen.getByText('Output');
    expect(inputBtn).toBeInTheDocument();
    expect(outputBtn).toBeInTheDocument();

    // Input data should be visible — key rendered as formatted label "Query" in metadata
    expect(screen.getByText('Query')).toBeInTheDocument();
  });

  it('switches to Output tab on click', async () => {
    const user = setupUser();
    const task = createMockTaskDetail({
      input: { query: 'test' },
      result: { status: 'ok', value: 42 },
    });
    render(<JsonTree task={task} />);

    // Click Output tab
    const outputBtn = screen.getByText('Output');
    await user.click(outputBtn);

    // Output data should now be visible — status rendered as StatusPill
    expect(screen.getByText('ok')).toBeInTheDocument();
  });

  it('renders input metadata section for requirements array', () => {
    const task = createMockTaskDetail({
      input: { requirements: ['req1', 'req2', 'req3'] },
      result: { done: true },
    });
    render(<JsonTree task={task} />);
    // Requirements is an array of strings but "requirements" is not in FINDINGS_KEYS,
    // so it goes to metadata. The Metadata section header should be present.
    expect(screen.getByText('Metadata')).toBeInTheDocument();
  });

  it('renders output score bar with score value', async () => {
    const user = setupUser();
    const task = createMockTaskDetail({
      input: { data: 'x' },
      result: { score: 85 },
    });
    render(<JsonTree task={task} />);

    // Switch to output
    await user.click(screen.getByText('Output'));

    // ScoreBar renders the score number and /100
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('/100')).toBeInTheDocument();
  });

  it('renders output summary block from summary field', async () => {
    const user = setupUser();
    const task = createMockTaskDetail({
      input: { data: 'x' },
      result: { summary: 'All tests passed successfully' },
    });
    render(<JsonTree task={task} />);

    await user.click(screen.getByText('Output'));

    // SummaryBlock renders the summary text
    expect(screen.getByText('All tests passed successfully')).toBeInTheDocument();
    // And the Summary section header
    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('renders output metadata for file arrays', async () => {
    const user = setupUser();
    const task = createMockTaskDetail({
      input: { data: 'x' },
      result: { filesCreated: ['a.ts', 'b.ts'], filesModified: ['c.ts'] },
    });
    render(<JsonTree task={task} />);

    await user.click(screen.getByText('Output'));

    // File arrays are complex objects rendered in Metadata section
    expect(screen.getByText('Metadata')).toBeInTheDocument();
  });

  it('renders metadata section for input with no recognized patterns', () => {
    const task = createMockTaskDetail({
      input: { foo: 'bar', baz: 42 },
      result: { done: true },
    });
    render(<JsonTree task={task} />);
    // Simple key-value pairs go to Metadata section
    expect(screen.getByText('Metadata')).toBeInTheDocument();
  });

  it('renders input metadata with iteration value', () => {
    const task = createMockTaskDetail({
      input: { iteration: 3, config: {} },
      result: { done: true },
    });
    render(<JsonTree task={task} />);
    // iteration=3 goes to Metadata, rendered as a number
    expect(screen.getByText('Metadata')).toBeInTheDocument();
  });

  it('renders when task has only input and no result', () => {
    const task = createMockTaskDetail({
      input: { query: 'only-input' },
      result: undefined,
    });
    render(<JsonTree task={task} />);
    // Key rendered as formatted label "Query" in metadata grid
    expect(screen.getByText('Query')).toBeInTheDocument();
  });

  it('renders when task has only result and no input', async () => {
    const user = setupUser();
    const task = createMockTaskDetail({
      input: undefined,
      result: { output: 'only-result' },
    });
    render(<JsonTree task={task} />);

    // Switch to output since input is undefined
    await user.click(screen.getByText('Output'));
    // "output" key rendered as "Output" label, but "Output" is also the tab button text.
    // Check for the value instead to avoid ambiguity.
    expect(screen.getByText('only-result')).toBeInTheDocument();
  });
});
