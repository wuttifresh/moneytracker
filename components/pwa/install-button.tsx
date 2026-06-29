'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferred) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        await deferred.prompt();
        setDeferred(null);
      }}
      className="hidden items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary sm:flex"
    >
      <Download className="h-4 w-4" />
      ติดตั้งแอป
    </button>
  );
}
