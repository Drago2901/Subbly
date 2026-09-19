import React, { useEffect, useState } from "react";
import { onPwaUpdate } from "@/lib/pwa/registerServiceWorker";
import { RefreshCw, Sparkles, X } from "lucide-react";

export const PwaUpdateToast: React.FC = () => {
  const [updateReady, setUpdateReady] = useState(false);
  const [reloadFn, setReloadFn] = useState<(() => void) | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = onPwaUpdate((reload) => {
      setReloadFn(() => reload);
      setUpdateReady(true);
    });
    return unsubscribe;
  }, []);

  if (!updateReady || dismissed) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-card/95 backdrop-blur-md px-4 py-3 text-foreground shadow-2xl ring-1 ring-black/5 dark:ring-white/10 max-w-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow flex-shrink-0">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground">Update Available</p>
          <p className="text-[11px] text-muted-foreground truncate">
            A new version of Subbly is ready.
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => reloadFn?.()}
            className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition cursor-pointer shadow-sm"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Update</span>
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition cursor-pointer"
            aria-label="Dismiss update notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
