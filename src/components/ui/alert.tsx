import { cn } from "@mockify-core/utils/helper";
import { AlertTriangle, Info, X } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";

interface AlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  showCancel?: boolean;
  className?: string;
}

export function Alert({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
  showCancel = true,
  className,
}: AlertProps) {
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

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertTriangle className="w-10 h-10 text-red-500" />,
          bg: "bg-red-500/10",
          button: "bg-red-500 hover:bg-red-600 shadow-red-500/20",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-10 h-10 text-amber-500" />,
          bg: "bg-amber-500/10",
          button: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20",
        };
      default:
        return {
          icon: <Info className="w-10 h-10 text-blue-500" />,
          bg: "bg-blue-500/10",
          button: "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20",
        };
    }
  };

  if (!shouldRender) return null;

  const styles = getVariantStyles();

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className={cn(
          "fixed inset-0 bg-background/40 backdrop-blur-md transition-opacity duration-150",
          !isAnimateIn ? "opacity-0" : "opacity-100",
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full max-w-md bg-card border border-border/50 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] transition-all duration-150 overflow-hidden",
          !isAnimateIn ? "opacity-0 scale-95" : "opacity-100 scale-100",
          className,
        )}
      >
        <div className="p-8">
          <div className="flex flex-col items-center text-center gap-6">
            <div
              className={cn(
                "p-5 rounded-4xl shrink-0 shadow-inner ring-1 ring-white/10",
                styles.bg,
              )}
            >
              {styles.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed px-2">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-6 pt-0">
          {showCancel && (
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 font-bold h-12 rounded-2xl hover:bg-secondary/80 transition-all border border-border/50"
            >
              {cancelText}
            </Button>
          )}
          <Button
            onClick={onConfirm}
            className={cn(
              "flex-1 font-bold h-12 rounded-2xl shadow-xl transition-all active:scale-95 text-white",
              styles.button,
              !showCancel && "w-full",
            )}
          >
            {confirmText}
          </Button>
        </div>

        <div className="absolute top-0 right-0 p-4">
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
