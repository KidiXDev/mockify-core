import { cn } from "@mockify-core/utils/helper";
import { Check, ChevronDown } from "lucide-react";
import * as React from "react";
import { Popover } from "./popover";

interface SelectProps {
  value: string | number;
  onValueChange: (value: string | number) => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
}

const SelectContext = React.createContext<{
  value: string | number;
  onValueChange: (value: string | number) => void;
  onClose: () => void;
} | null>(null);

export function Select({
  value,
  onValueChange,
  placeholder,
  children,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Find the selected child's label
  const getSelectedLabel = () => {
    let label: React.ReactNode = placeholder;
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        if (child.type === SelectGroup) {
          const groupProps = child.props as { children: React.ReactNode };
          React.Children.forEach(groupProps.children, (groupChild) => {
            if (React.isValidElement(groupChild)) {
              const itemProps = groupChild.props as {
                value?: string | number;
                children?: React.ReactNode;
              };
              if (itemProps.value === value) {
                label = itemProps.children;
              }
            }
          });
        } else {
          const props = child.props as {
            value?: string | number;
            children?: React.ReactNode;
          };
          if (props.value === value) {
            label = props.children;
          }
        }
      }
    });
    return label;
  };

  return (
    <SelectContext.Provider
      value={{ value, onValueChange, onClose: () => setIsOpen(false) }}
    >
      <Popover
        open={isOpen}
        onOpenChange={setIsOpen}
        className="max-h-[300px] overflow-y-auto custom-scrollbar"
        trigger={
          <button
            type="button"
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-background/80",
              className,
            )}
          >
            <span className="truncate">{getSelectedLabel()}</span>
            <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200" />
          </button>
        }
      >
        <div className="p-1 min-w-[200px]">{children}</div>
      </Popover>
    </SelectContext.Provider>
  );
}

interface SelectGroupProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function SelectGroup({ label, children, className }: SelectGroupProps) {
  return (
    <div className={cn("px-2 py-1.5", className)}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1 px-1">
        {label}
      </div>
      {children}
    </div>
  );
}

interface SelectItemProps {
  value: string | number;
  children: React.ReactNode;
  className?: string;
}

export function SelectItem({ value, children, className }: SelectItemProps) {
  const context = React.useContext(SelectContext);
  if (!context) return null;

  const isSelected = String(context.value) === String(value);

  return (
    <button
      type="button"
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-secondary focus:bg-secondary data-disabled:pointer-events-none data-disabled:opacity-50 transition-colors",
        isSelected && "bg-primary/10 text-primary font-medium",
        className,
      )}
      onClick={() => {
        context.onValueChange(value);
        context.onClose();
      }}
    >
      <span className="truncate">{children}</span>
      {isSelected && (
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4" />
        </span>
      )}
    </button>
  );
}
