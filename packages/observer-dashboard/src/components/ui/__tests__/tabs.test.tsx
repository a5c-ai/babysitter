import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';

describe('Tabs', () => {
  function renderTabs(defaultValue = 'tab1', onValueChange?: (v: string) => void) {
    return render(
      <Tabs defaultValue={defaultValue} onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>,
    );
  }

  it('renders without crashing', () => {
    renderTabs();
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  it('renders tab triggers as buttons', () => {
    renderTabs();
    const triggers = screen.getAllByRole('tab');
    expect(triggers.length).toBe(3);
  });

  it('shows content of the default active tab', () => {
    renderTabs('tab1');
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('switches content when clicking a different tab', async () => {
    const user = userEvent.setup();
    renderTabs('tab1');

    await user.click(screen.getByText('Tab 2'));
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('marks the active tab with data-state=active', () => {
    renderTabs('tab1');
    const tab1 = screen.getByText('Tab 1');
    expect(tab1.getAttribute('data-state')).toBe('active');
  });

  it('marks inactive tabs with data-state=inactive', () => {
    renderTabs('tab1');
    const tab2 = screen.getByText('Tab 2');
    expect(tab2.getAttribute('data-state')).toBe('inactive');
  });

  it('calls onValueChange when switching tabs', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderTabs('tab1', onChange);

    await user.click(screen.getByText('Tab 2'));
    expect(onChange).toHaveBeenCalledWith('tab2');
  });

  it('renders TabsList with styling classes', () => {
    renderTabs();
    const tablist = screen.getByRole('tablist');
    expect(tablist.className).toContain('inline-flex');
  });
});
