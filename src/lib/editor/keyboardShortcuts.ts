export type EditorShortcutAction =
  | "undo"
  | "redo"
  | "duplicate"
  | "delete"
  | "copy"
  | "paste"
  | "selectAll"
  | "nudgeLeft"
  | "nudgeRight"
  | "nudgeUp"
  | "nudgeDown";

export type EditorShortcut = {
  action: EditorShortcutAction;
  key: string;
  shift?: boolean;
  metaOrCtrl?: boolean;
  alt?: boolean;
};

export const EDITOR_SHORTCUTS: EditorShortcut[] = [
  { action: "undo", key: "z", metaOrCtrl: true },
  { action: "redo", key: "z", metaOrCtrl: true, shift: true },
  { action: "duplicate", key: "d", metaOrCtrl: true },
  { action: "delete", key: "Backspace" },
  { action: "delete", key: "Delete" },
  { action: "copy", key: "c", metaOrCtrl: true },
  { action: "paste", key: "v", metaOrCtrl: true },
  { action: "selectAll", key: "a", metaOrCtrl: true },
  { action: "nudgeLeft", key: "ArrowLeft" },
  { action: "nudgeRight", key: "ArrowRight" },
  { action: "nudgeUp", key: "ArrowUp" },
  { action: "nudgeDown", key: "ArrowDown" },
];

export function matchesEditorShortcut(event: KeyboardEvent, shortcut: EditorShortcut): boolean {
  if (shortcut.metaOrCtrl && !(event.metaKey || event.ctrlKey)) return false;
  if (!shortcut.metaOrCtrl && (event.metaKey || event.ctrlKey)) return false;
  if (Boolean(shortcut.shift) !== event.shiftKey) return false;
  if (Boolean(shortcut.alt) !== event.altKey) return false;
  return event.key.toLowerCase() === shortcut.key.toLowerCase();
}

export function isEditableTarget(target: EventTarget | null): boolean {
  const element = target instanceof HTMLElement ? target : null;
  if (!element) return false;
  return element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName);
}
