console.log("🚀 LodeInfo Context Bridge: Background service worker loaded");

// Set up command listener
chrome.commands.onCommand.addListener(async (command) => {
  console.log(`🔹 Command event received: ${command}`);
  if (command !== "send-context") return;

  console.log("⌨️ Shortcut triggered: Ctrl + Shift + L");

  // Trigger Electron app to show (Unified behavior)
  fetch("http://localhost:8001/show").catch(() => {
    console.warn(
      "⚠️ Could not notify Electron app. Is it running with the LodeInfo server on 8001?",
    );
  });

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      console.error("❌ No active tab detected in current window.");
      return;
    }

    const url = tab.url || "";
    console.log(`🔍 Active tab: ${url} (ID: ${tab.id})`);

    /* Ignore restricted pages */
    if (
      !url ||
      url.startsWith("chrome://") ||
      url.startsWith("edge://") ||
      url.startsWith("about:") ||
      url.startsWith("chrome-extension://")
    ) {
      console.warn(
        "🚫 Restricted URL or empty URL. Extension cannot extract context here.",
      );
      return;
    }

    // Special handling for PDFs
    if (url.toLowerCase().endsWith(".pdf")) {
      console.log(
        "📄 Detected PDF file. Sending URL to backend for extraction.",
      );
      sendToBackend({
        url: url,
        title: tab.title || "PDF Document",
        context: null, // Backend will fetch and extract text
        is_pdf: true,
      });
      return;
    }

    console.log(" Injecting extraction script...");

    // Directly execute extraction for maximum reliability
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: () => {
          try {
            const data = {
              url: window.location.href,
              title: document.title,
              context: document.body.innerText,
            };
            console.log("📄 [Content Script] Context extracted successfully");
            return { success: true, payload: data };
          } catch (e) {
            console.error("❌ [Content Script] Extraction error:", e);
            return { success: false, error: e.message };
          }
        },
      },
      (results) => {
        if (chrome.runtime.lastError) {
          console.error(
            "❌ Scripting error (Tab may be restricted or closed):",
            chrome.runtime.lastError.message,
          );
          return;
        }

        if (results && results[0] && results[0].result) {
          const response = results[0].result;
          if (response.success) {
            console.log("📥 Context received from script:", response.payload);
            sendToBackend(response.payload);
          } else {
            console.error(
              "❌ Content extraction returned failure:",
              response.error,
            );
          }
        } else {
          console.error("❌ No results returned from script execution.");
        }
      },
    );
  } catch (err) {
    console.error("❌ Background script fatal error:", err);
  }
});

async function sendToBackend(payload) {
  const API_URL = "http://127.0.0.1:8000/api/context/";
  console.log(`🌐 POSTing context to: ${API_URL}`);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log("✅ Successfully sent context to Django backend.");
    } else {
      console.error(
        `❌ Backend error: ${response.status} ${response.statusText}`,
      );
      const text = await response.text();
      console.error("Backend response:", text);
    }
  } catch (err) {
    console.error(
      "❌ Failed to reach backend. Is server running at localhost:8000?",
      err,
    );
  }
}
