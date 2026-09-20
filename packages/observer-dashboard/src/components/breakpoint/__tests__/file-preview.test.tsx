import { render, screen, setupUser } from '@/test/test-utils';
import { FilePreview } from '../file-preview';
import type { BreakpointFile } from '@/types';

describe('FilePreview', () => {
  const defaultProps = {
    runId: 'run-1',
    effectId: 'eff-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset global fetch mock
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // Null rendering
  // -----------------------------------------------------------------------
  it('returns null when files array is empty', () => {
    const { container } = render(
      <FilePreview files={[]} {...defaultProps} />,
    );

    expect(container.innerHTML).toBe('');
  });

  // -----------------------------------------------------------------------
  // Renders file list
  // -----------------------------------------------------------------------
  it('renders "Attached Files" heading', () => {
    const files: BreakpointFile[] = [
      { path: 'src/index.ts', format: 'code', language: 'typescript' },
    ];

    render(<FilePreview files={files} {...defaultProps} />);

    expect(screen.getByText('Attached Files')).toBeInTheDocument();
  });

  it('renders file paths in the list', () => {
    const files: BreakpointFile[] = [
      { path: 'src/main.ts', format: 'code' },
      { path: 'README.md', format: 'markdown' },
    ];

    render(<FilePreview files={files} {...defaultProps} />);

    expect(screen.getByText('src/main.ts')).toBeInTheDocument();
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Format badges
  // -----------------------------------------------------------------------
  it('displays format badges for each file', () => {
    const files: BreakpointFile[] = [
      { path: 'config.json', format: 'json' },
      { path: 'notes.md', format: 'markdown' },
      { path: 'script.sh', format: 'code' },
    ];

    render(<FilePreview files={files} {...defaultProps} />);

    expect(screen.getByText('json')).toBeInTheDocument();
    expect(screen.getByText('markdown')).toBeInTheDocument();
    expect(screen.getByText('code')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Language badge
  // -----------------------------------------------------------------------
  it('displays language badge when language is specified', () => {
    const files: BreakpointFile[] = [
      { path: 'app.py', format: 'code', language: 'python' },
    ];

    render(<FilePreview files={files} {...defaultProps} />);

    expect(screen.getByText('python')).toBeInTheDocument();
  });

  it('does not display language badge when language is not specified', () => {
    const files: BreakpointFile[] = [
      { path: 'data.json', format: 'json' },
    ];

    render(<FilePreview files={files} {...defaultProps} />);

    // Only the format badge should be present
    expect(screen.getByText('json')).toBeInTheDocument();
    // No language badge -- check there's only one badge-like element for this file
    expect(screen.queryByText('python')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Icons by format
  // -----------------------------------------------------------------------
  it('renders markdown icon for markdown files', () => {
    const files: BreakpointFile[] = [
      { path: 'README.md', format: 'markdown' },
    ];

    render(<FilePreview files={files} {...defaultProps} />);

    expect(screen.getByTestId('icon-FileText')).toBeInTheDocument();
  });

  it('renders json icon for json files', () => {
    const files: BreakpointFile[] = [
      { path: 'config.json', format: 'json' },
    ];

    render(<FilePreview files={files} {...defaultProps} />);

    expect(screen.getByTestId('icon-FileJson')).toBeInTheDocument();
  });

  it('renders code icon for code files', () => {
    const files: BreakpointFile[] = [
      { path: 'main.ts', format: 'code' },
    ];

    render(<FilePreview files={files} {...defaultProps} />);

    expect(screen.getByTestId('icon-Code')).toBeInTheDocument();
  });

  it('renders fallback icon for unknown format', () => {
    const files: BreakpointFile[] = [
      { path: 'file.xyz', format: 'unknown' },
    ];

    render(<FilePreview files={files} {...defaultProps} />);

    // Fallback uses FileText icon
    expect(screen.getByTestId('icon-FileText')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // File content loading via accordion expand
  // -----------------------------------------------------------------------
  it('fetches and displays file content when accordion item is expanded', async () => {
    const user = setupUser();
    const mockContent = 'const x = 42;';
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ content: mockContent }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })),
    ));

    const files: BreakpointFile[] = [
      { path: 'src/index.ts', format: 'code', language: 'typescript' },
    ];

    render(<FilePreview files={files} {...defaultProps} />);

    // Click the accordion trigger to expand
    await user.click(screen.getByText('src/index.ts'));

    // Wait for the content to appear
    expect(await screen.findByText('const x = 42;')).toBeInTheDocument();

    // Verify fetch was called with the correct URL
    expect(fetch).toHaveBeenCalledWith(
      '/api/runs/run-1/tasks/eff-1?file=src%2Findex.ts',
      expect.anything(),
    );
  });

  it('shows fallback text when content fetch fails', async () => {
    const user = setupUser();
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
      Promise.resolve(new Response('Unprocessable Entity', {
        status: 422,
        headers: { 'Content-Type': 'text/plain' },
      })),
    ));

    const files: BreakpointFile[] = [
      { path: 'broken.ts', format: 'code' },
    ];

    render(<FilePreview files={files} {...defaultProps} />);

    await user.click(screen.getByText('broken.ts'));

    expect(await screen.findByText('// Failed to load file content')).toBeInTheDocument();
  });

  it('shows "No content available" when API returns empty content', async () => {
    const user = setupUser();
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })),
    ));

    const files: BreakpointFile[] = [
      { path: 'empty.ts', format: 'code' },
    ];

    render(<FilePreview files={files} {...defaultProps} />);

    await user.click(screen.getByText('empty.ts'));

    expect(await screen.findByText('// No content available')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // JSON formatting
  // -----------------------------------------------------------------------
  it('pretty-prints JSON content', async () => {
    const user = setupUser();
    const jsonContent = '{"key":"value","num":42}';
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ content: jsonContent }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })),
    ));

    const files: BreakpointFile[] = [
      { path: 'data.json', format: 'json' },
    ];

    render(<FilePreview files={files} {...defaultProps} />);

    await user.click(screen.getByText('data.json'));

    // Pretty-printed JSON includes the key on a separate line
    expect(await screen.findByText(/"key": "value",/)).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Markdown rendering
  // -----------------------------------------------------------------------
  it('renders markdown content as preformatted text', async () => {
    const user = setupUser();
    const mdContent = '# Hello World\nSome paragraph text';
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ content: mdContent }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })),
    ));

    const files: BreakpointFile[] = [
      { path: 'notes.md', format: 'markdown' },
    ];

    render(<FilePreview files={files} {...defaultProps} />);

    await user.click(screen.getByText('notes.md'));

    expect(await screen.findByText(/# Hello World/)).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Code content with line numbers
  // -----------------------------------------------------------------------
  it('renders code content with line numbers', async () => {
    const user = setupUser();
    const codeContent = 'line one\nline two\nline three';
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ content: codeContent }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })),
    ));

    const files: BreakpointFile[] = [
      { path: 'main.ts', format: 'code' },
    ];

    render(<FilePreview files={files} {...defaultProps} />);

    await user.click(screen.getByText('main.ts'));

    // Line numbers should be rendered
    expect(await screen.findByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Content should be rendered
    expect(screen.getByText('line one')).toBeInTheDocument();
    expect(screen.getByText('line two')).toBeInTheDocument();
    expect(screen.getByText('line three')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Multiple files
  // -----------------------------------------------------------------------
  it('renders multiple files in the accordion', () => {
    const files: BreakpointFile[] = [
      { path: 'file1.ts', format: 'code' },
      { path: 'file2.json', format: 'json' },
      { path: 'file3.md', format: 'markdown' },
    ];

    render(<FilePreview files={files} {...defaultProps} />);

    expect(screen.getByText('file1.ts')).toBeInTheDocument();
    expect(screen.getByText('file2.json')).toBeInTheDocument();
    expect(screen.getByText('file3.md')).toBeInTheDocument();
  });
});
