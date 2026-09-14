import { useState, useRef, useCallback, useEffect } from "react";
import { type Caption } from "@/lib/captions/types";
import { toast } from "sonner";

export function useEditorHistory(
  captions: Caption[],
  setCaptions: React.Dispatch<React.SetStateAction<Caption[]>>
) {
  const [history, setHistory] = useState<Caption[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoingRef = useRef(false);

  // Debounced history record
  useEffect(() => {
    if (isUndoRedoingRef.current) {
      isUndoRedoingRef.current = false;
      return;
    }
    if (captions.length === 0 && history.length <= 1 && history[0]?.length === 0) return;

    const timer = setTimeout(() => {
      const currentEntry = history[historyIndex];
      const nextStr = JSON.stringify(captions);
      const currentStr = currentEntry ? JSON.stringify(currentEntry) : "";

      if (nextStr !== currentStr) {
        setHistory((prev) => {
          const sliced = prev.slice(0, historyIndex + 1);
          return [...sliced, JSON.parse(JSON.stringify(captions))];
        });
        setHistoryIndex((prev) => prev + 1);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [captions, historyIndex, history]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoingRef.current = true;
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const entry = history[prevIndex];
      if (entry) setCaptions(JSON.parse(JSON.stringify(entry)));
      toast.success("Undo successful");
    }
  }, [historyIndex, history, setCaptions]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoingRef.current = true;
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const entry = history[nextIndex];
      if (entry) setCaptions(JSON.parse(JSON.stringify(entry)));
      toast.success("Redo successful");
    }
  }, [historyIndex, history, setCaptions]);

  const resetHistory = useCallback((initialCaptions: Caption[] = []) => {
    setHistory([JSON.parse(JSON.stringify(initialCaptions))]);
    setHistoryIndex(0);
  }, []);

  return {
    historyIndex,
    historyLength: history.length,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    handleUndo,
    handleRedo,
    resetHistory,
  };
}
