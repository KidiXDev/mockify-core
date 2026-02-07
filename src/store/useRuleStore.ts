import type {
  MockRule,
  Profile,
  RecordedRequest,
  RecordingRule,
} from "@mockify-core/types/rule";
import { DEFAULT_STORAGE } from "@mockify-core/types/rule";
import {
  generateRuleId,
  getStorage,
  addProfile as storageAddProfile,
  addRecordingRule as storageAddRecordingRule,
  addRule as storageAddRule,
  clearRecordings as storageClearRecordings,
  deleteProfile as storageDeleteProfile,
  deleteRecordingRule as storageDeleteRecordingRule,
  deleteRule as storageDeleteRule,
  duplicateRule as storageDuplicateRule,
  setEnabled as storageSetEnabled,
  switchProfile as storageSwitchProfile,
  toggleRecordingRule as storageToggleRecordingRule,
  toggleRule as storageToggleRule,
  updateRecordingRule as storageUpdateRecordingRule,
  updateRule as storageUpdateRule,
} from "@mockify-core/utils/storage";
import { create } from "zustand";

interface RuleState {
  // Storage State
  profiles: Profile[];
  activeProfileId: string;
  enabled: boolean;
  recordingRules: RecordingRule[];
  recordings: RecordedRequest[];
  loading: boolean;

  // UI State
  viewingProfileId: string;
  editingRule: MockRule | null;
  isEditorOpen: boolean;
  searchQuery: string;

  // Actions
  initialize: () => Promise<() => void>;
  setEnabled: (enabled: boolean) => Promise<void>;
  addRule: (rule: Omit<MockRule, "id">) => Promise<void>;
  updateRule: (rule: MockRule) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  toggleRule: (id: string) => Promise<void>;
  duplicateRule: (id: string) => Promise<void>;

  // Profile Actions
  addProfile: (name: string) => Promise<string>;
  deleteProfile: (id: string) => Promise<void>;
  switchProfile: (id: string) => Promise<void>;
  // Recording Actions
  addRecordingRule: (rule: Omit<RecordingRule, "id">) => Promise<void>;
  updateRecordingRule: (rule: RecordingRule) => Promise<void>;
  deleteRecordingRule: (id: string) => Promise<void>;
  toggleRecordingRule: (id: string) => Promise<void>;
  clearRecordings: () => Promise<void>;

  setEditingRule: (rule: MockRule | null) => void;
  setIsEditorOpen: (isOpen: boolean) => void;
  setSearchQuery: (query: string) => void;
  setViewingProfile: (id: string) => void;
}

export const useRuleStore = create<RuleState>((set) => ({
  profiles: DEFAULT_STORAGE.profiles,
  activeProfileId: DEFAULT_STORAGE.activeProfileId,
  enabled: DEFAULT_STORAGE.enabled,
  recordingRules: DEFAULT_STORAGE.recordingRules,
  recordings: DEFAULT_STORAGE.recordings,
  loading: true,

  viewingProfileId: DEFAULT_STORAGE.activeProfileId,
  editingRule: null,
  isEditorOpen: false,
  searchQuery: "",

  initialize: async () => {
    const data = await getStorage();
    set({
      profiles: data.profiles,
      activeProfileId: data.activeProfileId,
      viewingProfileId: data.activeProfileId,
      enabled: data.enabled,
      recordingRules: data.recordingRules,
      recordings: data.recordings,
      loading: false,
    });

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName === "local") {
        if (changes.enabled !== undefined) {
          set({ enabled: changes.enabled.newValue as boolean });
        }
        if (changes.profiles !== undefined) {
          set({ profiles: changes.profiles.newValue as Profile[] });
        }
        if (changes.activeProfileId !== undefined) {
          set({ activeProfileId: changes.activeProfileId.newValue as string });
        }
        if (changes.recordingRules !== undefined) {
          set({
            recordingRules: changes.recordingRules.newValue as RecordingRule[],
          });
        }
        if (changes.recordings !== undefined) {
          set({ recordings: changes.recordings.newValue as RecordedRequest[] });
        }
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  },

  setEnabled: async (enabled: boolean) => {
    await storageSetEnabled(enabled);
  },

  addRule: async (rule: Omit<MockRule, "id">) => {
    const newRule: MockRule = {
      ...rule,
      id: generateRuleId(),
    };
    await storageAddRule(newRule);
  },

  updateRule: async (rule: MockRule) => {
    await storageUpdateRule(rule);
  },

  deleteRule: async (id: string) => {
    await storageDeleteRule(id);
  },

  toggleRule: async (id: string) => {
    await storageToggleRule(id);
  },

  duplicateRule: async (id: string) => {
    await storageDuplicateRule(id);
  },

  addProfile: async (name: string) => {
    return await storageAddProfile(name);
  },

  deleteProfile: async (id: string) => {
    await storageDeleteProfile(id);
  },

  switchProfile: async (id: string) => {
    await storageSwitchProfile(id);
  },

  setEditingRule: (rule: MockRule | null) => {
    set({ editingRule: rule });
  },

  setIsEditorOpen: (isOpen: boolean) => {
    set({ isEditorOpen: isOpen });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
  setViewingProfile: (id: string) => {
    set({ viewingProfileId: id });
  },

  addRecordingRule: async (rule: Omit<RecordingRule, "id">) => {
    const newRule: RecordingRule = {
      ...rule,
      id: generateRuleId(),
    };
    await storageAddRecordingRule(newRule);
  },

  updateRecordingRule: async (rule: RecordingRule) => {
    await storageUpdateRecordingRule(rule);
  },

  deleteRecordingRule: async (id: string) => {
    await storageDeleteRecordingRule(id);
  },

  toggleRecordingRule: async (id: string) => {
    await storageToggleRecordingRule(id);
  },

  clearRecordings: async () => {
    await storageClearRecordings();
  },
}));
