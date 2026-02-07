import { DEFAULT_STORAGE } from "@mockify-core/types/rule";

export function initBackground() {
  chrome.runtime.onInstalled.addListener(async () => {
    const existing = await chrome.storage.local.get([
      "enabled",
      "profiles",
      "activeProfileId",
    ]);

    if (existing.enabled === undefined) {
      await chrome.storage.local.set({ enabled: DEFAULT_STORAGE.enabled });
    }

    if (existing.profiles === undefined) {
      await chrome.storage.local.set({ profiles: DEFAULT_STORAGE.profiles });
    }

    if (existing.activeProfileId === undefined) {
      await chrome.storage.local.set({
        activeProfileId: DEFAULT_STORAGE.activeProfileId,
      });
    }

    console.log("[Mockify] Extension installed/updated");
  });

  chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
  });
}
