import { Button } from "@mockify-core/components/ui/button";
import { Card } from "@mockify-core/components/ui/card";
import { Select, SelectItem } from "@mockify-core/components/ui/select";
import { Switch } from "@mockify-core/components/ui/switch";
import { useRuleStore } from "@mockify-core/store/useRuleStore";
import { Settings } from "lucide-react";
import type React from "react";
import { useEffect, useMemo } from "react";

export interface PopupAppProps {
  /** Extra content rendered below the logo/title */
  headerExtra?: React.ReactNode;
  /** Extra content rendered at the bottom of the popup */
  footerExtra?: React.ReactNode;
  /** Override the version label */
  version?: string;
}

export function PopupApp({ headerExtra, footerExtra }: PopupAppProps) {
  const {
    profiles,
    activeProfileId,
    enabled,
    loading,
    initialize,
    setEnabled,
    switchProfile,
  } = useRuleStore();

  useEffect(() => {
    const cleanup = initialize();
    return () => {
      cleanup.then((fn) => fn());
    };
  }, [initialize]);

  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeProfileId) || profiles[0];
  }, [profiles, activeProfileId]);

  const rules = useMemo(() => activeProfile?.rules || [], [activeProfile]);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  if (loading) {
    return (
      <div className="min-w-70 min-h-40 bg-background p-5 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-w-70 bg-background p-5 text-foreground border border-border shadow-xl">
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-4">
          <img src="/logo.png" alt="Mockify" className="w-8 h-8" />
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            Mockify
          </h1>
        </div>

        {headerExtra}

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">
            Active Profile
          </span>
          <Select
            value={activeProfileId}
            onValueChange={(id) => switchProfile(id as string)}
            className="h-9 text-xs mt-2"
          >
            {profiles.map((profile) => (
              <SelectItem
                key={profile.id}
                value={profile.id}
                className="text-xs"
              >
                {profile.name}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <Card className="p-4 mb-4 bg-secondary/50 border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                enabled
                  ? "bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  : "bg-muted-foreground/30"
              }`}
            />
            <span className="text-sm text-muted-foreground font-medium">
              {enabled ? "Active" : "Disabled"}
            </span>
          </div>
          <Switch checked={enabled} onCheckedChange={handleToggle} />
        </div>
      </Card>

      <Button
        variant="secondary"
        onClick={openOptions}
        className="w-full gap-2 text-sm font-medium"
      >
        <Settings className="w-4 h-4" />
        Settings & Profiles
      </Button>

      <div className="mt-4 pt-3 border-t border-border/50 text-center">
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
          {rules.length} rule{rules.length !== 1 ? "s" : ""} in active profile
        </span>
      </div>

      {footerExtra}
    </div>
  );
}

export default PopupApp;
