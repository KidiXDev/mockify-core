import { cn } from "@mockify-core/utils/helper";
import { X } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function DialogFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "p-6 border-t border-border bg-secondary/10 flex items-center justify-end gap-3 shrink-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Dialog({
  isOpen,
  onClose,
  children,
  title,
  description,
  className,
}: DialogProps) {
  const [shouldRender, setShouldRender] = React.useState(isOpen);
  const [isAnimateIn, setIsAnimateIn] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        setIsAnimateIn(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimateIn(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (shouldRender) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-150",
          !isAnimateIn ? "opacity-0" : "opacity-100",
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl transition-all duration-150 flex flex-col max-h-[90vh] overflow-hidden",
          !isAnimateIn ? "opacity-0 scale-95" : "opacity-100 scale-100",
          className,
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div>
            {title && (
              <h2 className="text-xl font-bold text-foreground leading-none">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-2">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col min-h-0 container-content">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
