import { useEffect } from "react";

interface UseEditorKeyboardOptions {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onTogglePlay?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  disabled?: boolean;
}

export function useEditorKeyboard({
  onUndo,
  onRedo,
  onSave,
  onTogglePlay,
  onZoomIn,
  onZoomOut,
  disabled = false,
}: UseEditorKeyboardOptions) {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an editable field
      const target = e.target as HTMLElement | null;
      const isInput =
        Boolean(target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          (typeof target.closest === "function" && target.closest("[contenteditable]"))));

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Save: Cmd+S / Ctrl+S
      if (cmdOrCtrl && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Redo: Cmd+Shift+Z / Ctrl+Shift+Z / Cmd+Y / Ctrl+Y
      if ((cmdOrCtrl && e.shiftKey && (e.key === "z" || e.key === "Z")) ||
          (cmdOrCtrl && (e.key === "y" || e.key === "Y"))) {
        e.preventDefault();
        onRedo?.();
        return;
      }

      // Undo: Cmd+Z / Ctrl+Z
      if (cmdOrCtrl && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        onUndo?.();
        return;
      }

      // Timeline Zoom In: Ctrl/Cmd + = or +
      if (cmdOrCtrl && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        onZoomIn?.();
        return;
      }

      // Timeline Zoom Out: Ctrl/Cmd + - or _
      if (cmdOrCtrl && (e.key === "-" || e.key === "_")) {
        e.preventDefault();
        onZoomOut?.();
        return;
      }

      // Play/Pause: Space (only when not editing text)
      if (e.code === "Space" && !isInput) {
        e.preventDefault();
        onTogglePlay?.();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUndo, onRedo, onSave, onTogglePlay, onZoomIn, onZoomOut, disabled]);
}
