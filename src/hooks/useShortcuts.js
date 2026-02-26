import { useEffect } from "react";

const useShortcuts = (handlers) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");

      const { key, ctrlKey, metaKey, altKey } = event;

      const active = document.activeElement;
      const isInput =
        active &&
        (["INPUT", "TEXTAREA"].includes(active.tagName) ||
          active.isContentEditable);

      /* ---------------- NEW CHAT ---------------- */

      // Windows → Ctrl + C
      if (!isMac && ctrlKey && key.toLowerCase() === "c") {
        event.preventDefault();
        handlers.onNewChat();
        return;
      }

      // Mac → C (only when NOT typing)
      if (
        isMac &&
        !isInput &&
        key.toLowerCase() === "c" &&
        !metaKey &&
        !ctrlKey &&
        !altKey
      ) {
        event.preventDefault();
        handlers.onNewChat();
        return;
      }

      /* ---------------- SEARCH TOGGLE ---------------- */

      // Windows → Ctrl + S
      if (!isMac && ctrlKey && key.toLowerCase() === "s") {
        event.preventDefault();
        handlers.onSearch(); // must toggle in parent
        return;
      }

      // Mac → S
      if (
        isMac &&
        !isInput &&
        key.toLowerCase() === "s" &&
        !metaKey &&
        !ctrlKey &&
        !altKey
      ) {
        event.preventDefault();
        handlers.onSearch();
        return;
      }

      /* ---------------- MODEL SWITCH ---------------- */

      // Alt / Option + M
      if (altKey && key.toLowerCase() === "m") {
        console.log("ALT + M DETECTED"); // 👈 ADD THIS
        event.preventDefault();
        handlers.onChangeModel();
        return;
      }

      /* ---------------- TOPIC MODAL TOGGLE ---------------- */

      // Alt / Option + T
      if (altKey && key.toLowerCase() === "t") {
        event.preventDefault();
        handlers.onTopic();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
};

export default useShortcuts;
