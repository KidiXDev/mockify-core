interface MockRule {
  id: string;
  enabled: boolean;
  urlMatch: string;
  isRegex: boolean;
  responseType: "json" | "text";
  mockResponse: string;
  statusCode: number;
  delay: number;
  // Request modification fields
  modifyRequest?: boolean;
  requestMethod?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  requestBody?: string;
  queryParams?: string;
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

(function () {
  let config: MockifyConfig = {
    enabled: false,
    rules: [],
    recordingRules: [],
  };

  let configReceived = false;

  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  // Extended XMLHttpRequest type with mockify properties
  type MockifyXHR = XMLHttpRequest & {
    _mockifyUrl: string;
    _mockifyOriginalUrl: string;
    _mockifyMethod: string;
  };

  function findMatchingRule(url: string): MockRule | undefined {
    if (!config.enabled || !configReceived) return undefined;
    return config.rules.find((rule) => {
      if (!rule.enabled) return false;
      if (rule.isRegex) {
        try {
          const regex = new RegExp(rule.urlMatch);
          return regex.test(url);
        } catch (e) {
          console.error(`[Mockify] Invalid regex: ${rule.urlMatch}`, e);
          return false;
        }
      }
      return url.includes(rule.urlMatch);
    });
  }

  function findMatchingRecordingRule(url: string): RecordingRule | undefined {
    if (!config.enabled || !configReceived) return undefined;
    return config.recordingRules.find((rule) => {
      if (!rule.enabled) return false;
      if (rule.isRegex) {
        try {
          const regex = new RegExp(rule.urlMatch);
          return regex.test(url);
        } catch (e) {
          console.error(
            `[Mockify] Invalid recording regex: ${rule.urlMatch}`,
            e,
          );
          return false;
        }
      }
      return url.includes(rule.urlMatch);
    });
  }

  function createMockResponse(rule: MockRule): Response {
    const headers = new Headers({
      "Content-Type":
        rule.responseType === "json" ? "application/json" : "text/plain",
      "X-Mockify": "true",
    });

    let body = rule.mockResponse;
    if (rule.responseType === "json") {
      try {
        JSON.parse(rule.mockResponse);
      } catch {
        body = JSON.stringify({ error: "Invalid JSON in mock response" });
      }
    }

    return new Response(body, {
      status: rule.statusCode || 200,
      statusText: getStatusText(rule.statusCode || 200),
      headers: headers,
    });
  }

  function getStatusText(code: number): string {
    const statusTexts: { [key: number]: string } = {
      200: "OK",
      201: "Created",
      204: "No Content",
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      500: "Internal Server Error",
      502: "Bad Gateway",
      503: "Service Unavailable",
      504: "Gateway Timeout",
    };
    return statusTexts[code] || "Unknown";
  }

  function applyQueryParams(url: string, queryParams: string): string {
    if (!queryParams || !queryParams.trim()) return url;

    try {
      const urlObj = new URL(url, window.location.origin);
      const params = new URLSearchParams(queryParams);

      params.forEach((value, key) => {
        urlObj.searchParams.set(key, value);
      });

      return urlObj.toString();
    } catch (e) {
      console.error("[Mockify] Error applying query params:", e);
      return url;
    }
  }

  function prepareRequestBody(
    rule: MockRule,
    originalBody?: BodyInit | null | undefined,
  ): BodyInit | null | undefined {
    if (!rule.modifyRequest || !rule.requestBody) return originalBody;
    return rule.requestBody;
  }

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    const matchingRule = findMatchingRule(url);
    const matchingRecordingRule = findMatchingRecordingRule(url);

    if (matchingRecordingRule) {
      const record = async (resp: Response) => {
        try {
          const clonedResp = resp.clone();
          const responseBody = await clonedResp.text();
          const requestHeaders: Record<string, string> = {};
          if (init?.headers) {
            new Headers(init.headers).forEach(
              (v, k) => (requestHeaders[k] = v),
            );
          }
          const responseHeaders: Record<string, string> = {};
          resp.headers.forEach((v, k) => (responseHeaders[k] = v));

          window.postMessage(
            {
              type: "MOCKIFY_RECORD_REQUEST",
              recording: {
                id: Math.random().toString(36).substring(2),
                url,
                method: init?.method || "GET",
                requestHeaders,
                requestBody: init?.body ? String(init.body) : null,
                responseHeaders,
                responseBody,
                statusCode: resp.status,
                timestamp: Date.now(),
              },
            },
            "*",
          );
        } catch (e) {
          console.error("[Mockify] Error recording fetch:", e);
        }
      };

      if (matchingRule) {
        // ... handled below
      } else {
        return originalFetch.apply(window, [input, init]).then((resp) => {
          record(resp);
          return resp;
        });
      }
    }

    if (matchingRule) {
      if (matchingRule.modifyRequest) {
        console.log(
          `%c[Mockify] Modifying request: ${url}`,
          "color: #f59e0b; font-weight: bold;",
        );

        let modifiedUrl = url;
        if (matchingRule.queryParams) {
          modifiedUrl = applyQueryParams(url, matchingRule.queryParams);
          console.log(
            `%c[Mockify] Modified URL: ${modifiedUrl}`,
            "color: #f59e0b;",
          );
        }

        const modifiedInit: RequestInit = { ...init };

        if (matchingRule.requestMethod) {
          modifiedInit.method = matchingRule.requestMethod;
          console.log(
            `%c[Mockify] Modified method: ${matchingRule.requestMethod}`,
            "color: #f59e0b;",
          );
        }

        if (matchingRule.requestBody) {
          modifiedInit.body = prepareRequestBody(matchingRule, init?.body);
          console.log(
            `%c[Mockify] Modified body: ${modifiedInit.body}`,
            "color: #f59e0b;",
          );
        }

        window.postMessage(
          { type: "MOCKIFY_REQUEST_MODIFIED", url: modifiedUrl },
          "*",
        );

        return originalFetch.apply(window, [modifiedUrl, modifiedInit]);
      }

      console.log(
        `%c[Mockify] Intercepted fetch: ${url} (Delay: ${matchingRule.delay}ms)`,
        "color: #10b981; font-weight: bold;",
      );

      if (matchingRule.delay > 0) {
        await sleep(matchingRule.delay);
      }

      window.postMessage({ type: "MOCKIFY_MOCK_APPLIED", url }, "*");
      return createMockResponse(matchingRule);
    }

    return originalFetch.apply(window, [input, init]);
  };

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async: boolean = true,
    username?: string | null,
    password?: string | null,
  ): void {
    const urlString = typeof url === "string" ? url : url.href;
    const matchingRule = findMatchingRule(urlString);

    let modifiedUrl = urlString;
    let modifiedMethod = method;

    if (matchingRule && matchingRule.modifyRequest) {
      if (matchingRule.queryParams) {
        modifiedUrl = applyQueryParams(urlString, matchingRule.queryParams);
        console.log(
          `%c[Mockify] XHR Modified URL: ${modifiedUrl}`,
          "color: #f59e0b;",
        );
      }

      if (matchingRule.requestMethod) {
        modifiedMethod = matchingRule.requestMethod;
        console.log(
          `%c[Mockify] XHR Modified method: ${modifiedMethod}`,
          "color: #f59e0b;",
        );
      }
    }

    const xhr = this as MockifyXHR;
    xhr._mockifyUrl = modifiedUrl;
    xhr._mockifyOriginalUrl = urlString;
    xhr._mockifyMethod = modifiedMethod;

    return originalXHROpen.apply(this, [
      modifiedMethod,
      modifiedUrl,
      async,
      username,
      password,
    ]);
  };

  XMLHttpRequest.prototype.send = function (
    body?: Document | XMLHttpRequestBodyInit | null,
  ): void {
    const xhr = this as MockifyXHR;
    const url = xhr._mockifyOriginalUrl || xhr._mockifyUrl;

    const matchingRecordingRule = findMatchingRecordingRule(url);

    if (matchingRecordingRule) {
      const recordXHR = () => {
        try {
          const responseHeaders: Record<string, string> = {};
          const headerLines = xhr.getAllResponseHeaders().split(/[\r\n]+/);
          headerLines.forEach((line) => {
            const parts = line.split(": ");
            if (parts.length === 2) responseHeaders[parts[0]] = parts[1];
          });

          window.postMessage(
            {
              type: "MOCKIFY_RECORD_REQUEST",
              recording: {
                id: Math.random().toString(36).substring(2),
                url,
                method: xhr._mockifyMethod || "GET",
                requestHeaders: {},
                requestBody: body ? String(body) : null,
                responseHeaders,
                responseBody: xhr.responseText,
                statusCode: xhr.status,
                timestamp: Date.now(),
              },
            },
            "*",
          );
        } catch (e) {
          console.error("[Mockify] Error recording XHR:", e);
        }
      };

      this.addEventListener("load", recordXHR);
    }

    const matchingRule = findMatchingRule(url);

    if (matchingRule) {
      if (matchingRule.modifyRequest) {
        console.log(
          `%c[Mockify] Modifying XHR request: ${url}`,
          "color: #f59e0b; font-weight: bold;",
        );

        let modifiedBody: Document | XMLHttpRequestBodyInit | null | undefined =
          body;
        if (matchingRule.requestBody) {
          const bodyStr = prepareRequestBody(
            matchingRule,
            body as BodyInit | null | undefined,
          );
          modifiedBody = bodyStr as
            | Document
            | XMLHttpRequestBodyInit
            | null
            | undefined;
          console.log(
            `%c[Mockify] XHR Modified body: ${modifiedBody}`,
            "color: #f59e0b;",
          );
        }

        window.postMessage(
          { type: "MOCKIFY_REQUEST_MODIFIED", url: xhr._mockifyUrl },
          "*",
        );

        return originalXHRSend.apply(this, [modifiedBody]);
      }

      console.log(
        `%c[Mockify] Intercepted XHR: ${url} (Delay: ${matchingRule.delay}ms)`,
        "color: #10b981; font-weight: bold;",
      );

      const respond = () => {
        window.postMessage({ type: "MOCKIFY_MOCK_APPLIED", url }, "*");

        Object.defineProperty(xhr, "readyState", {
          writable: true,
          value: 4,
        });

        Object.defineProperty(xhr, "status", {
          writable: true,
          value: matchingRule.statusCode || 200,
        });

        Object.defineProperty(xhr, "statusText", {
          writable: true,
          value: getStatusText(matchingRule.statusCode || 200),
        });

        let responseBody = matchingRule.mockResponse;
        if (matchingRule.responseType === "json") {
          try {
            JSON.parse(matchingRule.mockResponse);
          } catch {
            responseBody = JSON.stringify({
              error: "Invalid JSON in mock response",
            });
          }
        }

        Object.defineProperty(xhr, "responseText", {
          writable: true,
          value: responseBody,
        });

        Object.defineProperty(xhr, "response", {
          writable: true,
          value: responseBody,
        });

        const responseHeaders =
          matchingRule.responseType === "json"
            ? `content-type: application/json\r\nx-mockify: true`
            : `content-type: text/plain\r\nx-mockify: true`;

        xhr.getAllResponseHeaders = function () {
          return responseHeaders;
        };

        xhr.getResponseHeader = function (name: string): string | null {
          const lower = name.toLowerCase();
          if (lower === "content-type") {
            return matchingRule.responseType === "json"
              ? "application/json"
              : "text/plain";
          }
          if (lower === "x-mockify") {
            return "true";
          }
          return null;
        };

        const readyStateEvent = new Event("readystatechange");
        xhr.dispatchEvent(readyStateEvent);

        const loadEvent = new ProgressEvent("load", {
          lengthComputable: true,
          loaded: responseBody.length,
          total: responseBody.length,
        });
        xhr.dispatchEvent(loadEvent);

        const loadEndEvent = new ProgressEvent("loadend", {
          lengthComputable: true,
          loaded: responseBody.length,
          total: responseBody.length,
        });
        xhr.dispatchEvent(loadEndEvent);

        if (typeof xhr.onreadystatechange === "function") {
          xhr.onreadystatechange(readyStateEvent as unknown as Event);
        }
        if (typeof xhr.onload === "function") {
          xhr.onload(loadEvent);
        }
        if (typeof xhr.onloadend === "function") {
          xhr.onloadend(loadEndEvent);
        }
      };

      if (matchingRule.delay > 0) {
        setTimeout(respond, matchingRule.delay);
      } else {
        setTimeout(respond, 0);
      }

      return;
    }

    return originalXHRSend.apply(this, [body]);
  };

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data && event.data.type === "MOCKIFY_CONFIG_UPDATE") {
      config = event.data.config;
      configReceived = true;
      console.log(
        `%c[Mockify] Config updated: ${config.enabled ? "enabled" : "disabled"}, ${config.rules.length} rules`,
        "color: #10b981;",
      );
    }
  });

  window.postMessage({ type: "MOCKIFY_READY" }, "*");

  setTimeout(() => {
    if (!configReceived) {
      console.log(
        "%c[Mockify] Config not received, requesting...",
        "color: #f59e0b;",
      );
      window.postMessage({ type: "MOCKIFY_REQUEST_CONFIG" }, "*");
    }
  }, 50);

  setTimeout(() => {
    if (!configReceived) {
      console.log(
        "%c[Mockify] Config still not received after retry",
        "color: #ef4444;",
      );
      window.postMessage({ type: "MOCKIFY_REQUEST_CONFIG" }, "*");
    }
  }, 200);

  console.log(
    "%c[Mockify] Interceptor initialized",
    "color: #10b981; font-weight: bold;",
  );
})();
