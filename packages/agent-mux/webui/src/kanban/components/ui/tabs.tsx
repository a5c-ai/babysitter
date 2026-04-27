"use client";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

interface TabsProps {
  className?: string;
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  orientation?: "horizontal" | "vertical";
  onValueChange?: (value: string) => void;
  "data-testid"?: string;
}

export function Tabs({ className, children, "data-testid": testId, ...props }: TabsProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Root = TabsPrimitive.Root as any;
  return (
    <Root className={className} data-testid={testId} {...props}>
      {children}
    </Root>
  );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const List = TabsPrimitive.List as any;
  return (
    <List
      className={cn("tkc-tabs", className)}
    >
      {children}
    </List>
  );
}

export function TabsTrigger({ className, children, value }: { className?: string; children: React.ReactNode; value: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Trigger = TabsPrimitive.Trigger as any;
  return (
    <Trigger
      value={value}
      className={cn(
        "tkc-tab inline-flex items-center justify-center gap-1.5 whitespace-nowrap",
        "data-[state=active]:border-b-[var(--tkc-cinnabar)] data-[state=active]:text-[var(--tkc-cinnabar)]",
        className
      )}
    >
      {children}
    </Trigger>
  );
}

export function TabsContent({ className, children, value }: { className?: string; children: React.ReactNode; value: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Content = TabsPrimitive.Content as any;
  return (
    <Content value={value} className={cn("mt-2 focus-visible:outline-none", className)}>
      {children}
    </Content>
  );
}
