import { Alert } from "@mockify-core/components/ui/alert";
import React, { createContext, useCallback, useContext, useState } from "react";

interface AlertOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  showCancel?: boolean;
}

interface AlertContextType {
  confirm: (options: AlertOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    options: AlertOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: AlertOptions) => {
    return new Promise<boolean>((resolve) => {
      setAlertState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleClose = (value: boolean) => {
    if (alertState) {
      alertState.resolve(value);
      setAlertState((prev) => (prev ? { ...prev, isOpen: false } : null));
      setTimeout(() => {
        setAlertState(null);
      }, 150);
    }
  };

  return (
    <AlertContext.Provider value={{ confirm }}>
      {children}
      {alertState && (
        <Alert
          isOpen={alertState.isOpen}
          onClose={() => handleClose(false)}
          onConfirm={() => handleClose(true)}
          {...alertState.options}
        />
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
