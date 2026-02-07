import { cn } from "@mockify-core/utils/helper";
import * as React from "react";
import { createPortal } from "react-dom";

interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({
  trigger,
  children,
  className,
  align = "left",
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen =
    setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;

  const triggerRef = React.useRef<HTMLDivElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 });
  const [isReady, setIsReady] = React.useState(false);

  React.useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      setCoords({
        top: rect.bottom + scrollY,
        left: rect.left + scrollX,
        width: rect.width,
      });
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [isOpen]);

  return (
    <>
      <div ref={triggerRef} onClick={toggle} className="w-full">
        {trigger}
      </div>
      {isOpen &&
        isReady &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              top: coords.top + 4,
              left:
                align === "left"
                  ? coords.left
                  : align === "right"
                    ? coords.left + coords.width
                    : coords.left + coords.width / 2,
              minWidth: coords.width,
              transform:
                align === "right"
                  ? "translateX(-100%)"
                  : align === "center"
                    ? "translateX(-50%)"
                    : "none",
              position: "fixed",
              zIndex: 100,
            }}
          >
            <div
              className={cn(
                "bg-card border border-border rounded-lg shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100",
                align === "right" ? "origin-top-right" : "origin-top-left",
                className,
              )}
            >
              {children}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
