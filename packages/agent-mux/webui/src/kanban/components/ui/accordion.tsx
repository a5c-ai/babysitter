"use client";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronRight } from "lucide-react";
import { cx } from "@a5c-ai/compendium";

interface AccordionProps {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Accordion({ children, className, ...props }: AccordionProps) {
  // Cast to any to avoid React 18 ForwardRefExoticComponent type mismatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Root = AccordionPrimitive.Root as any;
  return <Root className={className} {...props}>{children}</Root>;
}

export function AccordionItem({ className, children, value }: { className?: string; children: React.ReactNode; value: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Item = AccordionPrimitive.Item as any;
  return (
    <Item value={value} className={className}>
      {children}
    </Item>
  );
}

export function AccordionTrigger({ className, children }: { className?: string; children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Header = AccordionPrimitive.Header as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Trigger = AccordionPrimitive.Trigger as any;
  return (
    <Header className="flex">
      <Trigger
        className={cx(
          "flex flex-1 items-center gap-2 py-3 text-sm font-medium text-[var(--tkc-ink-quiet)] transition-all duration-200 hover:bg-[var(--tkc-panel-muted)] hover:text-[var(--tkc-ink)] [&[data-state=open]>svg]:rotate-90 [&[data-state=open]]:text-[var(--tkc-cinnabar)]",
          className
        )}
      >
        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--tkc-ink-quiet)] transition-transform duration-300 ease-in-out" />
        {children}
      </Trigger>
    </Header>
  );
}

export function AccordionContent({ className, children }: { className?: string; children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Content = AccordionPrimitive.Content as any;
  return (
    <Content className="overflow-hidden text-sm data-[state=open]:animate-[fadeIn_200ms_ease-out] data-[state=closed]:animate-[fadeIn_200ms_ease-out_reverse]">
      <div className={cx("border-t border-[color:var(--tkc-rule-m)] pb-4 pt-3", className)}>{children}</div>
    </Content>
  );
}
