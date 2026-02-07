import { useAlert } from "@mockify-core/components/providers/alert-provider";
import { Badge } from "@mockify-core/components/ui/badge";
import { Button } from "@mockify-core/components/ui/button";
import { Card } from "@mockify-core/components/ui/card";
import { Dialog } from "@mockify-core/components/ui/dialog";
import { Input } from "@mockify-core/components/ui/input";
import { Popover } from "@mockify-core/components/ui/popover";
import { Switch } from "@mockify-core/components/ui/switch";
import { useRuleStore } from "@mockify-core/store/useRuleStore";
import type { MockRule } from "@mockify-core/types/rule";
import {
  Clock,
  Code2,
  Copy,
  Download,
  Edit3,
  Github,
  Layers,
  Plus,
  Radio,
  Search,
  Send,
  Settings2,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { RuleEditor } from "./RuleEditor";
import { Replay } from "./Replay";

/**
 * Extension slot props for OptionsApp.
 *
 * These allow Pro (or any consuming app) to inject extra UI into the
 * options page while keeping the core layout and logic identical.
 */
export interface OptionsAppProps {
  /** Extra content rendered at the bottom of the sidebar, above the version row */
  sidebarFooterExtra?: ReactNode;
  /** Extra content rendered in the top-right header area (before search) */
  headerExtra?: ReactNode;
  /** Version string shown at the bottom of the sidebar (default: "v1.0.0") */
  version?: string;
  /** Logo image source (default: "/logo.png") */
  logoSrc?: string;
  /** App title displayed next to the logo (default: "Mockify") */
  title?: string;
  /** GitHub URL. Pass `null` to hide the link. */
  githubUrl?: string | null;
}

export function OptionsApp({
  sidebarFooterExtra,
  headerExtra,
  version = "v1.0.0",
  logoSrc = "/logo.png",
  title = "Mockify",
  githubUrl = "https://github.com/kidixdev/mockify",
}: OptionsAppProps) {
  const { confirm } = useAlert();
  const {
    profiles,
    activeProfileId,
    viewingProfileId,
    enabled,
    loading,
    editingRule,
    isEditorOpen,
    searchQuery,
    initialize,
    setEnabled,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    duplicateRule,
    addProfile,
    deleteProfile,
    switchProfile,
    setEditingRule,
    setIsEditorOpen,
    setSearchQuery,
    setViewingProfile,
  } = useRuleStore();

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newRuleType, setNewRuleType] = useState<"request" | "response">(
    "response",
  );
  const [isNewRulePopoverOpen, setIsNewRulePopoverOpen] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"rules" | "replay">(
    "rules",
  );

  useEffect(() => {
    const cleanup = initialize();
    return () => {
      cleanup.then((fn) => fn());
    };
  }, [initialize]);

  const viewingProfile = useMemo(() => {
    return profiles.find((p) => p.id === viewingProfileId) || profiles[0];
  }, [profiles, viewingProfileId]);

  const rules = useMemo(() => viewingProfile?.rules || [], [viewingProfile]);

  const filteredRules = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return rules.filter(
      (rule) =>
        rule.urlMatch.toLowerCase().includes(query) ||
        rule.mockResponse.toLowerCase().includes(query) ||
        (rule.name && rule.name.toLowerCase().includes(query)) ||
        (rule.description && rule.description.toLowerCase().includes(query)),
    );
  }, [rules, searchQuery]);

  const handleCreate = (type: "request" | "response") => {
    setNewRuleType(type);
    setEditingRule(null);
    setIsEditorOpen(true);
    setIsNewRulePopoverOpen(false);
  };

  const handleEdit = (rule: MockRule) => {
    setEditingRule(rule);
    setIsEditorOpen(true);
  };

  const handleSave = async (data: Omit<MockRule, "id">) => {
    if (editingRule && editingRule.id) {
      await updateRule({
        ...editingRule,
        ...data,
      });
    } else {
      await addRule(data);
    }
    setIsEditorOpen(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: "Delete Intercept Rule",
      description:
        "Are you sure you want to delete this rule? This action cannot be undone and Mockify will stop intercepting requests matching this URL.",
      confirmText: "Delete Rule",
      cancelText: "Keep it",
      variant: "danger",
    });

    if (confirmed) {
      await deleteRule(id);
    }
  };

  const handleAddProfile = async () => {
    if (!newProfileName.trim()) return;
    const newId = await addProfile(newProfileName.trim());
    setViewingProfile(newId);
    setNewProfileName("");
    setIsProfileDialogOpen(false);
  };

  const handleDeleteProfile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (profiles.length <= 1) return;

    const profile = profiles.find((p) => p.id === id);
    const confirmed = await confirm({
      title: "Delete Profile",
      description: `Are you sure you want to delete profile "${profile?.name}"? All rules within this profile will be permanently removed.`,
      confirmText: "Delete Profile",
      variant: "danger",
    });

    if (confirmed) {
      await deleteProfile(id);
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await duplicateRule(id);
  };

  const handleExportRule = (rule: MockRule, e: React.MouseEvent) => {
    e.stopPropagation();
    const data = JSON.stringify(rule, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mockify-rule-${rule.urlMatch.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportRule = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (re) => {
        try {
          const rule = JSON.parse(re.target?.result as string);
          if (rule.urlMatch && rule.mockResponse !== undefined) {
            const ruleData = {
              ...rule,
              isRegex: rule.isRegex ?? false,
              statusCode: rule.statusCode ?? 200,
              delay: rule.delay ?? 0,
            };
            delete ruleData.id;
            await addRule(ruleData);
          }
        } catch {
          confirm({
            title: "Import Error",
            description: "Invalid Rule JSON file.",
            showCancel: false,
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;
    const data = JSON.stringify(profile, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mockify-profile-${profile.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProfile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (re) => {
        try {
          const profile = JSON.parse(re.target?.result as string);
          if (profile.name && profile.rules) {
            const newProfile = {
              ...profile,
              id: crypto.randomUUID(),
              rules: (profile.rules as MockRule[]).map((r) => ({
                ...r,
                isRegex: r.isRegex ?? false,
                statusCode: r.statusCode ?? 200,
                delay: r.delay ?? 0,
              })),
            };
            const currentProfiles = [...profiles, newProfile];
            await chrome.storage.local.set({ profiles: currentProfiles });
          }
        } catch {
          confirm({
            title: "Import Error",
            description: "Invalid Profile JSON file.",
            showCancel: false,
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg shadow-primary/20" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground selection:bg-primary/30 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border/50 bg-[#060b1d] flex flex-col shrink-0">
        <div className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-8">
            <img src={logoSrc} alt={title} className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex bg-background/50 p-1 rounded-xl mb-6">
          <button
            onClick={() => setActiveSidebarTab("rules")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSidebarTab === "rules"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Rules
          </button>
          <button
            onClick={() => setActiveSidebarTab("replay")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSidebarTab === "replay"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Radio
              className={`w-3.5 h-3.5 ${activeSidebarTab === "replay" ? "animate-pulse" : ""}`}
            />
            Replay
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {activeSidebarTab === "rules" ? (
            <div className="px-6 space-y-1 flex flex-col h-full min-h-0">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                  Profiles
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsProfileDialogOpen(true)}
                    className="p-1 hover:bg-primary/10 hover:text-primary rounded-md transition-colors"
                    title="Add Profile"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleImportProfile}
                    className="p-1 hover:bg-primary/10 hover:text-primary rounded-md transition-colors"
                    title="Import Profile"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 mb-6">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    onClick={() => setViewingProfile(profile.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left relative overflow-hidden cursor-pointer group ${
                      viewingProfileId === profile.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                    }`}
                  >
                    {viewingProfileId === profile.id && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-full" />
                    )}
                    {activeProfileId === profile.id && (
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500/50"
                        title="Globally Active"
                      />
                    )}
                    <Layers
                      className={`w-4 h-4 ${viewingProfileId === profile.id ? "text-primary" : "text-muted-foreground/50"}`}
                    />
                    <div className="flex-1 flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate">
                        {profile.name}
                      </span>
                      {activeProfileId === profile.id && (
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter -mt-0.5">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold bg-background/40 px-1.5 py-0.5 rounded-md border border-border/20 group-hover:border-border/40 transition-colors">
                      {profile.rules.length}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <button
                        onClick={(e) => handleExportProfile(profile.id, e)}
                        className="p-1 hover:bg-primary hover:text-primary-foreground rounded-lg transition-all"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      {profiles.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteProfile(profile.id, e)}
                          className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-6 space-y-4">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <p className="text-[10px] text-primary font-black uppercase tracking-wider">
                    Replay Mode
                  </p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Record real traffic and convert it into mocking rules
                  instantly.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto p-6 space-y-4">
          <Card className="p-4 bg-secondary/20 border-border/40 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground">
                Enable {title}
              </span>
              <Badge
                variant={enabled ? "emerald" : "secondary"}
                className="text-[9px] px-1.5"
              >
                {enabled ? "READY" : "OFF"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-muted-foreground/60 leading-tight">
                {title} is {enabled ? "intercepting" : "ignoring"} requests
              </span>
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => setEnabled(checked)}
              />
            </div>
          </Card>

          {/* Extension slot: sidebarFooterExtra – e.g. Pro login button, sync status */}
          {sidebarFooterExtra}

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              {githubUrl !== null && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground/40 hover:text-primary transition-colors"
                  title="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
              <a
                href="#"
                className="text-muted-foreground/40 hover:text-primary transition-colors"
                title="Settings"
              >
                <Settings2 className="w-4 h-4" />
              </a>
            </div>
            <span className="text-[10px] font-black text-muted-foreground/20 italic tracking-tighter">
              {version}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background/50 backdrop-blur-3xl overflow-hidden relative">
        {/* Top Header Blur effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />

        <header className="h-20 border-b border-border/30 flex items-center justify-between px-8 bg-background/30 backdrop-blur-md shrink-0 z-10">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              {viewingProfile?.name}
              <Badge
                variant="outline"
                className="text-[10px] font-bold border-primary/20 text-primary bg-primary/5"
              >
                {rules.length} Rules
              </Badge>
              {activeProfileId === viewingProfileId ? (
                <Badge
                  variant="emerald"
                  className="text-[9px] font-black uppercase"
                >
                  Active
                </Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => switchProfile(viewingProfileId)}
                  className="h-6 px-2 text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all rounded-md"
                >
                  Set as Active
                </Button>
              )}
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
              {activeProfileId === viewingProfileId
                ? "Globally active profile"
                : "Viewing profile (Inactive)"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Extension slot: headerExtra – e.g. sync button, user avatar */}
            {headerExtra}

            <div className="relative w-64 md:w-80 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Find in this profile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-secondary/20 border-border/30 focus:border-primary/50 focus:bg-secondary/40 transition-all rounded-xl text-sm"
              />
            </div>
            <Popover
              open={isNewRulePopoverOpen}
              onOpenChange={setIsNewRulePopoverOpen}
              trigger={
                <Button className="h-10 px-5 gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all font-bold rounded-xl">
                  <Plus className="w-4 h-4" />
                  New Rule
                </Button>
              }
              align="right"
              className="w-56 p-2 bg-[#0a0f25] border-border/50"
            >
              <div className="flex flex-col gap-1">
                <div className="px-2 py-1.5 mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    Select Rule Type
                  </span>
                </div>
                <button
                  onClick={() => handleCreate("response")}
                  className="flex items-center gap-3 w-full p-2.5 rounded-xl text-left hover:bg-primary/10 group transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      Modify Response
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Mock status code and body
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => handleCreate("request")}
                  className="flex items-center gap-3 w-full p-2.5 rounded-xl text-left hover:bg-primary/10 group transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Send className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      Modify Request
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Change method, body or params
                    </span>
                  </div>
                </button>
              </div>
            </Popover>
            <Button
              variant="outline"
              size="icon"
              onClick={handleImportRule}
              className="h-10 w-10 border-border/30 hover:border-primary/30 rounded-xl"
              title="Import Rule"
            >
              <Upload className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-5xl mx-auto h-full">
            {activeSidebarTab === "rules" ? (
              <div className="space-y-4">
                {rules.length === 0 ? (
                  <Card className="p-16 text-center bg-secondary/5 border-dashed border-2 border-border/30 rounded-[2.5rem] group transition-all hover:border-primary/20">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-primary/5 flex items-center justify-center transform transition-transform duration-500">
                      <Zap className="w-10 h-10 text-primary/50" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      No Interception Rules
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-8 font-medium">
                      This profile is currently empty. Add your first rule to
                      start intercepting and mocking requests.
                    </p>
                    <Button
                      onClick={() => setIsNewRulePopoverOpen(true)}
                      variant="secondary"
                      className="px-8 h-12 rounded-xl font-bold bg-secondary/80 hover:bg-secondary transition-all"
                    >
                      Create Your First Rule
                    </Button>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {filteredRules.length === 0 && (
                      <div className="p-12 text-center text-muted-foreground font-semibold italic opacity-50">
                        No matching rules in this profile...
                      </div>
                    )}
                    {filteredRules.map((rule) => (
                      <Card
                        key={rule.id}
                        className={`group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 border-border/30 hover:border-primary/20 bg-secondary/10 backdrop-blur-sm rounded-2xl ${
                          !rule.enabled ? "opacity-60" : ""
                        }`}
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <Badge
                                  variant={
                                    rule.modifyRequest ? "blue" : "amber"
                                  }
                                  className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0"
                                >
                                  {rule.modifyRequest ? "Request" : "Response"}
                                </Badge>
                                {rule.isRegex && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0 border-primary/20 text-primary/70"
                                  >
                                    Regex
                                  </Badge>
                                )}
                                <span className="text-[10px] text-muted-foreground/40 font-mono">
                                  {rule.id}
                                </span>
                              </div>
                              <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                {rule.name || rule.urlMatch}
                              </h3>
                              {rule.name && (
                                <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5 opacity-50">
                                  {rule.urlMatch}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Switch
                                checked={rule.enabled}
                                onCheckedChange={() => toggleRule(rule.id)}
                                className="scale-75 origin-right"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground/60">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                              {rule.modifyRequest ? (
                                <span>{rule.requestMethod || "ALL"}</span>
                              ) : (
                                <span>{rule.statusCode || 200} OK</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground/60">
                              <Clock className="w-3 h-3" />
                              {rule.delay || 0}ms
                            </div>
                            {rule.responseType && (
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground/60 uppercase">
                                <Code2 className="w-3 h-3" />
                                {rule.responseType}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex items-center justify-end px-3 py-2 bg-secondary/20 border-t border-border/10 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleDuplicate(rule.id, e)}
                              className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-all"
                              title="Duplicate"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleExportRule(rule, e)}
                              className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-all"
                              title="Export"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEdit(rule)}
                              className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(rule.id, e)}
                              className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Replay />
            )}
          </div>
        </div>
      </main>

      <Dialog
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={
          editingRule
            ? editingRule.modifyRequest
              ? "Modify Request Rule"
              : "Modify Response Rule"
            : newRuleType === "request"
              ? "New Request Modification"
              : "New Response Mock"
        }
        description={
          editingRule
            ? "Update your interception rule configuration."
            : newRuleType === "request"
              ? "Configure how to intercept and modify an outgoing request."
              : "Configure how to mock a response for a specific URL."
        }
        className="max-w-3xl"
      >
        <RuleEditor
          key={editingRule?.id ?? `new-${newRuleType}`}
          initialData={editingRule}
          mode={
            editingRule
              ? editingRule.modifyRequest
                ? "request"
                : "response"
              : newRuleType
          }
          onSave={handleSave}
          onCancel={() => setIsEditorOpen(false)}
        />
      </Dialog>

      <Dialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        title="Create New Profile"
        description="Profiles help you organize your rules for different environments or testing scenarios."
        className="max-w-md"
      >
        <div className="p-6 space-y-4">
          <Input
            placeholder="Profile Name (e.g. Staging, Production Debug)"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            className="h-11 rounded-xl"
            autoFocus
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setIsProfileDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl"
              onClick={handleAddProfile}
              disabled={!newProfileName.trim()}
            >
              Create Profile
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default OptionsApp;
