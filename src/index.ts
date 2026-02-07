// ──────────────────────────────────────────────
// mockify-core  –  main barrel export
// ──────────────────────────────────────────────

// Types
export type {
  MockRule,
  RecordingRule,
  RecordedRequest,
  Profile,
  MockifyStorage,
} from "./types/rule";
export { DEFAULT_STORAGE } from "./types/rule";

// Utils
export { cn } from "./utils/helper";
export {
  getStorage,
  addRule,
  updateRule,
  deleteRule,
  toggleRule,
  duplicateRule,
  addProfile,
  deleteProfile,
  switchProfile,
  addRecordingRule,
  deleteRecordingRule,
  toggleRecordingRule,
  clearRecordings,
  addRecording,
} from "./utils/storage";

// Store
export { useRuleStore } from "./store/useRuleStore";

// Background / Content / Injected  (entry-point helpers)
export { initBackground } from "./background/background";
export { initContent } from "./content/content";

// UI Components
export { Alert } from "./components/ui/alert";
export { Badge } from "./components/ui/badge";
export { Button } from "./components/ui/button";
export { Card } from "./components/ui/card";
export { Dialog, DialogFooter } from "./components/ui/dialog";
export { Input } from "./components/ui/input";
export { Popover } from "./components/ui/popover";
export { Select, SelectGroup, SelectItem } from "./components/ui/select";
export { Switch } from "./components/ui/switch";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
export { Textarea } from "./components/ui/textarea";

// Providers
export { AlertProvider, useAlert } from "./components/providers/alert-provider";

// Pages – Popup
export { PopupApp, type PopupAppProps } from "./pages/popup/PopupApp";

// Pages – Options
export {
  OptionsApp,
  type OptionsAppProps,
  OptionsAppDefault,
} from "./pages/options/OptionsApp";
export { RuleEditor } from "./pages/options/RuleEditor";
export { Replay } from "./pages/options/Replay";
