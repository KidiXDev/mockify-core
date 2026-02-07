import { cn } from "@mockify-core/utils/helper";
import * as React from "react";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const Tabs = ({ value, onValueChange, children, className }: TabsProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(
            child as React.ReactElement<{
              value: string;
              onValueChange: (value: string) => void;
            }>,
            {
              value,
              onValueChange,
            },
          );
        }
        return child;
      })}
    </div>
  );
};

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const TabsList = ({
  children,
  className,
  value,
  onValueChange,
}: TabsListProps) => {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-secondary/50 p-1 text-muted-foreground",
        className,
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const childElement = child as React.ReactElement<{
            value: string;
            active?: boolean;
            onClick?: () => void;
          }>;
          return React.cloneElement(childElement, {
            active: childElement.props.value === value,
            onClick: () => onValueChange?.(childElement.props.value),
          });
        }
        return child;
      })}
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  active?: boolean;
  onClick?: () => void;
}

const TabsTrigger = ({
  children,
  className,
  active,
  onClick,
}: TabsTriggerProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50",
        active
          ? "bg-secondary text-primary shadow-sm"
          : "hover:bg-secondary/80 hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  currentValue?: string;
}

const TabsContent = ({
  value,
  children,
  className,
  currentValue,
}: TabsContentProps) => {
  if (value !== currentValue) return null;
  return (
    <div
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none",
        className,
      )}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsContent, TabsList, TabsTrigger };
