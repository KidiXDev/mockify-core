import { useAlert } from "@mockify-core/components/providers/alert-provider";
import { Button } from "@mockify-core/components/ui/button";
import { DialogFooter } from "@mockify-core/components/ui/dialog";
import { Input } from "@mockify-core/components/ui/input";
import {
  Select,
  SelectGroup,
  SelectItem,
} from "@mockify-core/components/ui/select";
import { Switch } from "@mockify-core/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@mockify-core/components/ui/tabs";
import { Textarea } from "@mockify-core/components/ui/textarea";
import type { MockRule } from "@mockify-core/types/rule";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import {
  Activity,
  Clock,
  Code2,
  FileJson,
  FileText,
  Link2,
  Send,
  Tag,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface RuleEditorProps {
  initialData?: MockRule | null;
  mode: "request" | "response";
  onSave: (data: Omit<MockRule, "id">) => void;
  onCancel: () => void;
}

const codeMirrorThemeExtension = EditorView.theme({
  "&": {
    backgroundColor: "transparent !important",
    lineHeight: "1.5",
    fontSize: "12px",
  },
  ".cm-gutters": {
    backgroundColor: "transparent !important",
    border: "none",
  },
  ".cm-content": {
    padding: "8px 0",
    height: "auto !important",
  },
  ".cm-cursor": {
    height: "1.2em !important",
  },
  ".cm-placeholder": {
    position: "absolute !important",
    left: "8px",
    color: "var(--color-muted-foreground) !important",
    opacity: "0.4",
    whiteSpace: "pre-wrap",
    pointerEvents: "none",
  },
  ".cm-line": {
    position: "relative",
    lineHeight: "1.5",
    padding: "0 8px",
  },
  ".cm-scroller::-webkit-scrollbar": {
    width: "6px",
    height: "6px",
  },
  ".cm-scroller::-webkit-scrollbar-track": {
    background: "transparent",
  },
  ".cm-scroller::-webkit-scrollbar-thumb": {
    background: "var(--color-border)",
    borderRadius: "10px",
  },
  ".cm-scroller::-webkit-scrollbar-thumb:hover": {
    background: "#334155",
  },
});

const codeMirrorBasicSetup = {
  lineNumbers: false,
  foldGutter: false,
  dropCursor: true,
  allowMultipleSelections: false,
  indentOnInput: true,
  bracketMatching: true,
  closeBrackets: true,
  autocompletion: true,
  rectangularSelection: true,
  crosshairCursor: true,
  highlightActiveLine: false,
  highlightSelectionMatches: true,
  searchKeymap: false,
  historyKeymap: false,
  drawSelection: false,
  tabSize: 2,
};

export function RuleEditor({
  initialData,
  mode,
  onSave,
  onCancel,
}: RuleEditorProps) {
  const { confirm } = useAlert();
  const [formData, setFormData] = useState({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    urlMatch: initialData?.urlMatch ?? "",
    isRegex: initialData?.isRegex ?? false,
    responseType: initialData?.responseType ?? ("json" as "json" | "text"),
    mockResponse: initialData?.mockResponse ?? "",
    statusCode: initialData?.statusCode ?? 200,
    delay: initialData?.delay ?? 0,
    enabled: initialData?.enabled ?? true,
    modifyRequest: mode === "request",
    requestMethod: initialData?.requestMethod ?? "POST",
    requestBody: initialData?.requestBody ?? "",
    queryParams: initialData?.queryParams ?? "",
  });

  const handleBeautify = () => {
    try {
      const parsed = JSON.parse(formData.mockResponse);
      setFormData({
        ...formData,
        mockResponse: JSON.stringify(parsed, null, 2),
      });
    } catch {
      confirm({
        title: "Format Error",
        description:
          "The response content is not valid JSON and cannot be beautified.",
        variant: "warning",
        confirmText: "Got it",
        showCancel: false,
      });
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(formData.mockResponse);
      setFormData({
        ...formData,
        mockResponse: JSON.stringify(parsed),
      });
    } catch {
      confirm({
        title: "Format Error",
        description:
          "The response content is not valid JSON and cannot be minified.",
        variant: "warning",
        confirmText: "Got it",
        showCancel: false,
      });
    }
  };

  const handleBeautifyRequestBody = () => {
    try {
      const parsed = JSON.parse(formData.requestBody);
      setFormData({
        ...formData,
        requestBody: JSON.stringify(parsed, null, 2),
      });
    } catch {
      confirm({
        title: "Format Error",
        description:
          "The request body is not valid JSON and cannot be beautified.",
        variant: "warning",
        confirmText: "Got it",
        showCancel: false,
      });
    }
  };

  const handleMinifyRequestBody = () => {
    try {
      const parsed = JSON.parse(formData.requestBody);
      setFormData({
        ...formData,
        requestBody: JSON.stringify(parsed),
      });
    } catch {
      confirm({
        title: "Format Error",
        description:
          "The request body is not valid JSON and cannot be minified.",
        variant: "warning",
        confirmText: "Got it",
        showCancel: false,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.urlMatch.trim()) return;
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            Rule Name
            <span className="text-[10px] text-muted-foreground/60 font-normal">
              (optional)
            </span>
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Mock User API"
            className="bg-background/50 border-border/50 focus:border-primary/50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Description
            <span className="text-[10px] text-muted-foreground/60 font-normal">
              (optional)
            </span>
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="e.g. Returns mock user data for testing purposes"
            className="bg-background/50 border-border/50 focus:border-primary/50 min-h-15 resize-none"
            rows={2}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              URL Match
            </label>
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-background/50 border border-border/50">
              <label
                htmlFor="is-regex"
                className="text-[10px] uppercase font-bold text-muted-foreground cursor-pointer select-none"
              >
                Regex
              </label>
              <Switch
                id="is-regex"
                className="scale-75 origin-right"
                checked={formData.isRegex}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isRegex: checked })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Input
              type="text"
              value={formData.urlMatch}
              onChange={(e) =>
                setFormData({ ...formData, urlMatch: e.target.value })
              }
              placeholder={
                formData.isRegex
                  ? "e.g. ^https://api\\.example\\.com/.*"
                  : "e.g. api/v1/users"
              }
              className="bg-background/50 border-border/50 focus:border-primary/50 font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              {formData.isRegex
                ? "The interceptor will use this as a regular expression to match URLs."
                : "The interceptor will match any URL containing this string."}
            </p>
          </div>
        </div>

        {mode === "request" && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <Send className="w-5 h-5 text-primary" />
            <div>
              <span className="text-sm font-semibold text-foreground block">
                Request Modification Mode
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Intercepting and modifying the outgoing request parameters.
              </p>
            </div>
          </div>
        )}

        {mode === "response" && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <Zap className="w-5 h-5 text-amber-500" />
            <div>
              <span className="text-sm font-semibold text-foreground block">
                Response Interception Mode
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Mocking the service response with custom data.
              </p>
            </div>
          </div>
        )}

        {mode === "request" && (
          <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                HTTP Method
              </label>
              <Select
                value={formData.requestMethod}
                onValueChange={(val: string | number) => {
                  const method = String(val);
                  if (
                    ["GET", "POST", "PUT", "DELETE", "PATCH"].includes(method)
                  ) {
                    setFormData({
                      ...formData,
                      requestMethod: method as
                        | "GET"
                        | "POST"
                        | "PUT"
                        | "DELETE"
                        | "PATCH",
                    });
                  }
                }}
              >
                <SelectGroup label="HTTP Methods">
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectGroup>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Override the HTTP method of the request
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                Query Parameters
              </label>
              <Input
                type="text"
                value={formData.queryParams}
                onChange={(e) =>
                  setFormData({ ...formData, queryParams: e.target.value })
                }
                placeholder="e.g. key1=value1&key2=value2"
                className="bg-background/50 border-border/50 focus:border-primary/50 font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Add or override URL query parameters (format:
                key1=value1&key2=value2)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-primary" />
                  Request Body (JSON)
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 text-[11px] px-2 gap-1.5"
                    onClick={handleBeautifyRequestBody}
                  >
                    Beautify
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 text-[11px] px-2"
                    onClick={handleMinifyRequestBody}
                  >
                    Minify
                  </Button>
                </div>
              </div>
              <div className="relative group border border-border/50 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all bg-card">
                <CodeMirror
                  value={formData.requestBody}
                  height="min(20vh, 300px)"
                  theme={oneDark}
                  extensions={[
                    json(),
                    EditorView.lineWrapping,
                    codeMirrorThemeExtension,
                  ]}
                  onChange={(value) =>
                    setFormData({ ...formData, requestBody: value })
                  }
                  placeholder='{\n  "key": "value"\n}'
                  className="text-xs font-mono"
                  basicSetup={codeMirrorBasicSetup}
                />
                <div className="flex items-center justify-end px-3 py-1.5 bg-background/40 border-t border-border/30">
                  <span className="text-[10px] text-muted-foreground/60 font-mono">
                    {formData.requestBody.length} characters
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Replace the request body with this JSON content
              </p>
            </div>
          </div>
        )}

        {mode === "response" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Status Code
                </label>
                <div className="relative group">
                  <Select
                    value={String(formData.statusCode)}
                    onValueChange={(val: string | number) =>
                      setFormData({
                        ...formData,
                        statusCode:
                          typeof val === "string" ? parseInt(val) || 200 : val,
                      })
                    }
                  >
                    <SelectGroup label="2xx Success">
                      <SelectItem value="200">200 OK</SelectItem>
                      <SelectItem value="201">201 Created</SelectItem>
                      <SelectItem value="204">204 No Content</SelectItem>
                    </SelectGroup>
                    <SelectGroup label="3xx Redirection">
                      <SelectItem value="301">301 Moved Permanently</SelectItem>
                      <SelectItem value="302">302 Found</SelectItem>
                      <SelectItem value="307">
                        307 Temporary Redirect
                      </SelectItem>
                    </SelectGroup>
                    <SelectGroup label="4xx Client Error">
                      <SelectItem value="400">400 Bad Request</SelectItem>
                      <SelectItem value="401">401 Unauthorized</SelectItem>
                      <SelectItem value="403">403 Forbidden</SelectItem>
                      <SelectItem value="404">404 Not Found</SelectItem>
                      <SelectItem value="409">409 Conflict</SelectItem>
                      <SelectItem value="422">
                        422 Unprocessable Content
                      </SelectItem>
                      <SelectItem value="429">429 Too Many Requests</SelectItem>
                    </SelectGroup>
                    <SelectGroup label="5xx Server Error">
                      <SelectItem value="500">
                        500 Internal Server Error
                      </SelectItem>
                      <SelectItem value="502">502 Bad Gateway</SelectItem>
                      <SelectItem value="503">
                        503 Service Unavailable
                      </SelectItem>
                      <SelectItem value="504">504 Gateway Timeout</SelectItem>
                    </SelectGroup>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Delay (ms)
                </label>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  value={formData.delay}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      delay: parseInt(e.target.value) || 0,
                    })
                  }
                  className="bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <FileJson className="w-4 h-4 text-primary" />
                Response Type
              </label>
              <Tabs
                value={formData.responseType}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    responseType: val as "json" | "text",
                  })
                }
              >
                <TabsList className="w-full bg-background/50 border border-border/50 p-1 h-11">
                  <TabsTrigger
                    value="json"
                    className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    JSON
                  </TabsTrigger>
                  <TabsTrigger
                    value="text"
                    className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Plain Text
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-primary" />
                  Mock Response
                </label>
                {formData.responseType === "json" && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 text-[11px] px-2 gap-1.5"
                      onClick={handleBeautify}
                    >
                      Beautify
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 text-[11px] px-2"
                      onClick={handleMinify}
                    >
                      Minify
                    </Button>
                  </div>
                )}
              </div>
              <div className="relative group border border-border/50 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all bg-card">
                <CodeMirror
                  value={formData.mockResponse}
                  height="min(30vh, 400px)"
                  theme={oneDark}
                  extensions={
                    formData.responseType === "json"
                      ? [
                          json(),
                          EditorView.lineWrapping,
                          codeMirrorThemeExtension,
                        ]
                      : [codeMirrorThemeExtension]
                  }
                  onChange={(value) =>
                    setFormData({ ...formData, mockResponse: value })
                  }
                  placeholder={
                    formData.responseType === "json"
                      ? '{\n  "success": true,\n  "data": []\n}'
                      : "Hello World"
                  }
                  className="text-xs font-mono"
                  basicSetup={codeMirrorBasicSetup}
                />
                <div className="flex items-center justify-end px-3 py-1.5 bg-background/40 border-t border-border/30">
                  <span className="text-[10px] text-muted-foreground/60 font-mono">
                    {formData.mockResponse.length} characters
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-border/30">
          <div className="flex items-center gap-3">
            <Switch
              id="rule-enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enabled: checked })
              }
            />
            <label
              htmlFor="rule-enabled"
              className="text-sm font-medium text-muted-foreground cursor-pointer"
            >
              Status: {formData.enabled ? "Enabled" : "Disabled"}
            </label>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          className="flex-1 h-11 border-border/50 hover:bg-secondary"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!formData.urlMatch.trim()}
          className="flex-1 h-11 shadow-lg shadow-primary/20"
        >
          {initialData ? "Save Changes" : "Create Rule"}
        </Button>
      </DialogFooter>
    </form>
  );
}
