import { addRecording } from "@mockify-core/utils/storage";

interface MockRule {
  id: string;
  enabled: boolean;
  urlMatch: string;
  isRegex: boolean;
  responseType: "json" | "text";
  mockResponse: string;
  statusCode: number;
  delay: number;
}

interface Profile {
  id: string;
  name: string;
  rules: MockRule[];
}

interface RecordingRule {
  id: string;
  enabled: boolean;
  urlMatch: string;
  isRegex: boolean;
}

interface MockifyConfig {
  enabled: boolean;
  rules: MockRule[];
  recordingRules: RecordingRule[];
}

let configSent = false;

async function sendConfigToPage() {
  const result = await chrome.storage.local.get([
    "enabled",
    "profiles",
    "activeProfileId",
    "recordingRules",
  ]);
  const enabled = (result.enabled as boolean) ?? true;
  const profiles = (result.profiles as Profile[]) ?? [];
  const activeProfileId = (result.activeProfileId as string) || profiles[0]?.id;

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) || profiles[0];
  const rules = activeProfile?.rules || [];
  const recordingRules = (result.recordingRules as RecordingRule[]) ?? [];

  const config: MockifyConfig = {
    enabled,
    rules,
    recordingRules,
  };

  window.postMessage(
    {
      type: "MOCKIFY_CONFIG_UPDATE",
      config: config,
    },
    "*",
  );

  configSent = true;
  console.log(
    "[Mockify Content] Config sent to page:",
    config.enabled,
    config.rules.length,
    "rules from profile:",
    activeProfile?.name,
  );
}

function injectScript(injectedScriptUrl: string) {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL(injectedScriptUrl);
  script.type = "module";
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => {
    script.remove();
  };
}

const notificationTimeouts = new WeakMap<
  HTMLElement,
  ReturnType<typeof setTimeout>
>();

function showNotification(url: string, type: "mocked" | "modified" = "mocked") {
  const id = "mockify-notification-root";
  let container = document.getElementById(id);
  let banner: HTMLDivElement;

  const isMocked = type === "mocked";
  const title = isMocked ? "Response Mocked" : "Request Modified";
  const iconColor = isMocked ? "#3b82f6" : "#f59e0b";

  if (!container) {
    container = document.createElement("div");
    container.id = id;
    container.style.position = "fixed";
    container.style.zIndex = "999999";
    container.style.top = "0";
    container.style.right = "0";
    container.style.pointerEvents = "none";

    const shadow = container.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      .banner {
        position: fixed;
        top: 24px;
        right: 24px;
        background: #0c152a;
        color: white;
        padding: 14px 18px;
        border-radius: 16px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        display: flex;
        align-items: center;
        gap: 14px;
        border: 1px solid #1e293b;
        transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease;
        user-select: none;
        width: 320px;
        pointer-events: auto;
        transform: translateX(400px);
        opacity: 0;
      }
      .banner.show {
        transform: translateX(0);
        opacity: 1;
      }
      .icon-wrapper {
        width: 38px;
        height: 38px;
        background: linear-gradient(135deg, var(--icon-color-1) 0%, var(--icon-color-2) 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }
      .icon-wrapper.modified {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      }
      .content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow: hidden;
      }
      .title {
        font-weight: 700;
        font-size: 15px;
        margin: 0;
        color: #f8fafc;
        letter-spacing: -0.01em;
        line-height: 1.2;
      }
      .subtitle {
        font-size: 11px;
        color: #94a3b8;
        margin: 0;
        font-weight: 500;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
        max-width: 100%;
      }
      .close-btn {
        cursor: pointer;
        color: #64748b;
        background: none;
        border: none;
        padding: 6px;
        display: flex;
        border-radius: 8px;
        transition: all 0.2s;
      }
      .close-btn:hover {
        background: #1e293b;
        color: #f8fafc;
      }
      .pulse {
        position: absolute;
        width: 8px;
        height: 8px;
        background: var(--pulse-color);
        border-radius: 50%;
        top: -2px;
        right: -2px;
        box-shadow: 0 0 0 0 var(--pulse-shadow);
        animation: pulse-animation 2s infinite;
      }
      .pulse.modified {
        background: #f59e0b;
      }
      @keyframes pulse-animation {
        0% { box-shadow: 0 0 0 0 var(--pulse-shadow); }
        70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
        100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }
    `;

    banner = document.createElement("div");
    banner.className = "banner";
    banner.style.setProperty("--icon-color-1", iconColor);
    banner.style.setProperty(
      "--icon-color-2",
      isMocked ? "#2563eb" : "#d97706",
    );
    banner.style.setProperty("--pulse-color", isMocked ? "#10b981" : "#f59e0b");
    banner.style.setProperty(
      "--pulse-shadow",
      isMocked ? "rgba(16, 185, 129, 0.7)" : "rgba(245, 158, 11, 0.7)",
    );

    banner.innerHTML = `
      <div class="icon-wrapper ${type}">
        <div style="position: relative;">
          ${
            isMocked
              ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>`
              : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>`
          }
          <div class="pulse ${type}"></div>
        </div>
      </div>
      <div class="content">
        <p class="title">${title}</p>
        <p class="subtitle" title="${url}">${url}</p>
      </div>
      <button class="close-btn" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    const closeBtn = banner.querySelector(".close-btn");
    closeBtn?.addEventListener("click", () => {
      banner.classList.remove("show");
      setTimeout(() => container?.remove(), 600);
    });

    shadow.appendChild(style);
    shadow.appendChild(banner);
    document.body.appendChild(container);
  } else {
    banner = container.shadowRoot?.querySelector(".banner") as HTMLDivElement;
    const titleElem = banner.querySelector(".title") as HTMLParagraphElement;
    const subtitle = banner.querySelector(".subtitle") as HTMLParagraphElement;
    const iconWrapper = banner.querySelector(".icon-wrapper") as HTMLDivElement;
    const pulse = banner.querySelector(".pulse") as HTMLDivElement;

    if (titleElem) titleElem.textContent = title;
    if (subtitle) {
      subtitle.textContent = url;
      subtitle.title = url;
    }
    if (iconWrapper) {
      iconWrapper.className = `icon-wrapper ${type}`;
      iconWrapper.innerHTML = `
        <div style="position: relative;">
          ${
            isMocked
              ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>`
              : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>`
          }
          <div class="pulse ${type}"></div>
        </div>
      `;
    }
    if (pulse) {
      pulse.className = `pulse ${type}`;
    }

    banner.style.setProperty("--icon-color-1", iconColor);
    banner.style.setProperty(
      "--icon-color-2",
      isMocked ? "#2563eb" : "#d97706",
    );
    banner.style.setProperty("--pulse-color", isMocked ? "#10b981" : "#f59e0b");
    banner.style.setProperty(
      "--pulse-shadow",
      isMocked ? "rgba(16, 185, 129, 0.7)" : "rgba(245, 158, 11, 0.7)",
    );
  }

  // Reset or start animation
  banner.classList.remove("show");
  requestAnimationFrame(() => {
    setTimeout(() => {
      banner.classList.add("show");
    }, 100);
  });

  // Auto-remove after 3 seconds
  const existingTimeout = notificationTimeouts.get(banner);
  if (existingTimeout) clearTimeout(existingTimeout);

  const timeoutId = setTimeout(() => {
    if (document.body.contains(container)) {
      banner.classList.remove("show");
      setTimeout(() => {
        if (document.body.contains(container)) {
          container.remove();
        }
      }, 600);
    }
  }, 3000);
  notificationTimeouts.set(banner, timeoutId);
}

/**
 * Initialize the content script.
 * @param injectedScriptUrl - The URL path to the injected script (from the extension's bundler).
 *   In consumer projects, this is typically obtained via `import injectedRaw from '...?script&module'`.
 */
export function initContent(injectedScriptUrl: string) {
  window.addEventListener("message", async (event) => {
    if (event.source !== window) return;

    if (event.data && event.data.type === "MOCKIFY_READY") {
      console.log("[Mockify Content] Received MOCKIFY_READY");
      await sendConfigToPage();
    }

    if (event.data && event.data.type === "MOCKIFY_REQUEST_CONFIG") {
      console.log("[Mockify Content] Received MOCKIFY_REQUEST_CONFIG");
      await sendConfigToPage();
    }

    if (event.data && event.data.type === "MOCKIFY_MOCK_APPLIED") {
      showNotification(event.data.url, "mocked");
    }

    if (event.data && event.data.type === "MOCKIFY_REQUEST_MODIFIED") {
      showNotification(event.data.url, "modified");
    }

    if (event.data && event.data.type === "MOCKIFY_RECORD_REQUEST") {
      addRecording(event.data.recording);
    }
  });

  injectScript(injectedScriptUrl);

  setTimeout(async () => {
    if (!configSent) {
      console.log("[Mockify Content] Sending config after timeout (fallback)");
      await sendConfigToPage();
    }
  }, 100);

  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === "local") {
      if (
        changes.enabled !== undefined ||
        changes.profiles !== undefined ||
        changes.activeProfileId !== undefined ||
        changes.recordingRules !== undefined
      ) {
        console.log(
          "[Mockify Content] Storage changed, sending updated config",
        );
        await sendConfigToPage();
      }
    }
  });
}
