import { Badge } from "@mockify-core/components/ui/badge";
import { Button } from "@mockify-core/components/ui/button";
import { Card } from "@mockify-core/components/ui/card";
import { Input } from "@mockify-core/components/ui/input";
import { useRuleStore } from "@mockify-core/store/useRuleStore";
import type { RecordedRequest } from "@mockify-core/types/rule";
import {
  Activity,
  Check,
  Clock,
  Database,
  Globe,
  Play,
  Plus,
  Radio,
  Search,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

export function Replay() {
  const {
    recordingRules,
    recordings,
    addRecordingRule,
    deleteRecordingRule,
    toggleRecordingRule,
    clearRecordings,
    setEditingRule,
    setIsEditorOpen,
  } = useRuleStore();

  const [activeTab, setActiveTab] = useState<"recordings" | "rules">(
    "recordings",
  );
  const [newRuleUrl, setNewRuleUrl] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecordings = useMemo(() => {
    if (!searchTerm) return recordings;
    const lower = searchTerm.toLowerCase();
    return recordings.filter(
      (r) =>
        r.url.toLowerCase().includes(lower) ||
        r.method.toLowerCase().includes(lower) ||
        r.responseBody.toLowerCase().includes(lower),
    );
  }, [recordings, searchTerm]);

  const handleAddRule = async () => {
    if (!newRuleUrl.trim()) return;
    await addRecordingRule({
      enabled: true,
      urlMatch: newRuleUrl.trim(),
      isRegex: false,
    });
    setNewRuleUrl("");
  };

  const handleCreateMockRule = (recording: RecordedRequest) => {
    setEditingRule({
      id: "",
      enabled: true,
      urlMatch: recording.url,
      isRegex: false,
      responseType: recording.responseHeaders["content-type"]?.includes(
        "application/json",
      )
        ? "json"
        : "text",
      mockResponse: recording.responseBody,
      statusCode: recording.statusCode,
      delay: 0,
    });
    setIsEditorOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex bg-secondary/20 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("recordings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "recordings"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Radio
              className={`w-4 h-4 ${activeTab === "recordings" ? "animate-pulse" : ""}`}
            />
            Recordings
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "rules"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity className="w-4 h-4" />
            Recording Rules
          </button>
        </div>

        <div className="flex-1" />

        {activeTab === "recordings" && recordings.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearRecordings}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "rules" ? (
          <div className="space-y-4">
            <Card className="p-4 bg-card/40 border-border/30">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter URL or pattern to record..."
                    value={newRuleUrl}
                    onChange={(e) => setNewRuleUrl(e.target.value)}
                    className="pl-10 h-10"
                    onKeyDown={(e) => e.key === "Enter" && handleAddRule()}
                  />
                </div>
                <Button onClick={handleAddRule} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Pattern
                </Button>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground font-medium">
                Requests matching these patterns will be automatically captured
                when they occur in any tab.
              </p>
            </Card>

            <div className="grid gap-2">
              {recordingRules.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-border/30 rounded-2xl flex flex-col items-center">
                  <Database className="w-12 h-12 text-muted-foreground/20 mb-4" />
                  <p className="text-sm font-bold text-muted-foreground">
                    No active recording rules
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Add a pattern above to start capturing traffic
                  </p>
                </div>
              ) : (
                recordingRules.map((rule) => (
                  <Card
                    key={rule.id}
                    className="p-3 bg-card/40 border-border/20 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${rule.enabled ? "bg-primary/10 text-primary" : "bg-muted/10 text-muted-foreground"}`}
                      >
                        <Radio className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold font-mono">
                          {rule.urlMatch}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {rule.isRegex ? "Regex" : "Includes"} Match
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleRecordingRule(rule.id)}
                        className={`h-8 w-8 ${rule.enabled ? "text-emerald-500" : "text-muted-foreground"}`}
                      >
                        {rule.enabled ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRecordingRule(rule.id)}
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full min-h-0">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search recordings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-secondary/20 border-border/30"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 space-y-2">
              {filteredRecordings.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-border/30 rounded-2xl flex flex-col items-center">
                  <Play className="w-12 h-12 text-muted-foreground/20 mb-4" />
                  <p className="text-sm font-bold text-muted-foreground">
                    No recordings captured
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Captured requests will appear here when they match your
                    rules.
                  </p>
                </div>
              ) : (
                filteredRecordings.map((rec) => (
                  <Card
                    key={rec.id}
                    className="p-4 bg-card/40 border-border/20 hover:border-primary/30 transition-all group overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="secondary"
                            className="font-black text-[9px] uppercase tracking-tighter"
                          >
                            {rec.method}
                          </Badge>
                          <Badge
                            variant={
                              rec.statusCode >= 400 ? "destructive" : "emerald"
                            }
                            className="font-black text-[9px]"
                          >
                            {rec.statusCode}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono truncate flex-1">
                            {rec.url}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(rec.timestamp).toLocaleTimeString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            {(rec.responseBody.length / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleCreateMockRule(rec)}
                        className="gap-2 shrink-0 h-9 rounded-xl shadow-lg shadow-primary/10 active:scale-95 transition-all"
                      >
                        <Zap className="w-4 h-4" />
                        Create Rule
                      </Button>
                    </div>

                    <div className="mt-3 bg-[#060b1d] rounded-lg p-2 border border-border/10 overflow-hidden">
                      <pre className="text-[9px] text-muted-foreground/80 font-mono line-clamp-2 overflow-hidden pointer-events-none">
                        {rec.responseBody.substring(0, 200)}
                      </pre>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
