import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../accordion';

describe('Accordion', () => {
  function renderAccordion(defaultValue?: string) {
    return render(
      <Accordion type="single" collapsible defaultValue={defaultValue}>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Section 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
  }

  it('renders without crashing', () => {
    renderAccordion();
    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
  });

  it('renders trigger buttons', () => {
    renderAccordion();
    const triggers = screen.getAllByRole('button');
    expect(triggers.length).toBe(2);
  });

  it('shows content of a pre-opened item', () => {
    renderAccordion('item-1');
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('expands an item on click', async () => {
    const user = userEvent.setup();
    renderAccordion();

    const trigger = screen.getByText('Section 1');
    await user.click(trigger);

    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('collapses an expanded item on click (collapsible)', async () => {
    const user = userEvent.setup();
    renderAccordion('item-1');

    const trigger = screen.getByText('Section 1');
    await user.click(trigger);

    // After collapsing, Content 1 should be hidden
    const content = screen.queryByText('Content 1');
    // The content might still be in DOM but hidden by data-state=closed
    // Since Radix keeps it in the DOM with data-state, check the attribute
    if (content) {
      const parent = content.closest('[data-state]');
      expect(parent?.getAttribute('data-state')).toBe('closed');
    }
  });

  it('renders chevron icon in triggers', () => {
    const { container } = renderAccordion();
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Accordion with multiple type', () => {
  it('allows multiple items open simultaneously', async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="multiple">
        <AccordionItem value="a">
          <AccordionTrigger>Item A</AccordionTrigger>
          <AccordionContent>Content A</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Item B</AccordionTrigger>
          <AccordionContent>Content B</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    await user.click(screen.getByText('Item A'));
    await user.click(screen.getByText('Item B'));

    expect(screen.getByText('Content A')).toBeInTheDocument();
    expect(screen.getByText('Content B')).toBeInTheDocument();
  });
});
