import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../tooltip';

describe('Tooltip', () => {
  it('renders the trigger element', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <button>Hover me</button>
          </TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('renders trigger as child when asChild is set', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Trigger</button>
          </TooltipTrigger>
          <TooltipContent>Info</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
  });

  it('shows tooltip content when open is true', () => {
    render(
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger>
            <button>Btn</button>
          </TooltipTrigger>
          <TooltipContent>Visible tooltip</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    // Radix renders tooltip text twice (visible + accessible hidden span)
    const matches = screen.getAllByText('Visible tooltip');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('does not show tooltip content when open is false', () => {
    render(
      <TooltipProvider>
        <Tooltip open={false}>
          <TooltipTrigger>
            <button>Btn</button>
          </TooltipTrigger>
          <TooltipContent>Hidden tooltip</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.queryByText('Hidden tooltip')).not.toBeInTheDocument();
  });

  it('applies custom className to tooltip content', () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger>
            <button>Btn</button>
          </TooltipTrigger>
          <TooltipContent className="my-tooltip">Tooltip content here</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    // Find the element with the custom class directly
    const contentEl = container.querySelector('.my-tooltip');
    expect(contentEl).toBeInTheDocument();
    expect(contentEl?.textContent).toContain('Tooltip content here');
  });

  it('renders children inside TooltipProvider', () => {
    render(
      <TooltipProvider>
        <span>Wrapped child</span>
      </TooltipProvider>,
    );
    expect(screen.getByText('Wrapped child')).toBeInTheDocument();
  });
});
