"use client";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

interface TabsProps {
  className?: string;
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
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
      className={cn("inline-flex h-9 items-center gap-1 rounded-lg bg-background-secondary p-1", className)}
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
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium text-foreground-muted transition-all duration-200",
        "hover:text-foreground-secondary hover:bg-muted/50",
        "data-[state=active]:bg-background-tertiary data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:rounded-full after:bg-primary after:transition-all after:duration-200",
        "data-[state=active]:after:w-2/3",
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
