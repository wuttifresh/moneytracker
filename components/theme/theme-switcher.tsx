'use client';

import { useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { THEMES, THEME_COOKIE, type ThemeId } from '@/lib/themes';

const ONE_YEAR = 60 * 60 * 24 * 365;

function applyTheme(theme: ThemeId) {
  document.documentElement.setAttribute('data-theme', theme);
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  try {
    localStorage.setItem(THEME_COOKIE, theme);
  } catch {
    // localStorage may be unavailable (private mode); cookie is the source of truth.
  }
}

export function ThemeSwitcher({ initialTheme }: { initialTheme: ThemeId }) {
  const [theme, setTheme] = useState<ThemeId>(initialTheme);
  const [open, setOpen] = useState(false);

  function select(next: ThemeId) {
    setTheme(next);
    applyTheme(next);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="เปลี่ยนธีม"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-card-foreground transition-colors hover:bg-secondary"
      >
        <Palette className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-card p-1 shadow-xl"
          >
            <p className="px-3 py-2 text-xs font-medium text-muted-foreground">
              เลือกธีม
            </p>
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="menuitemradio"
                aria-checked={theme === t.id}
                onClick={() => select(t.id)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-card-foreground transition-colors hover:bg-secondary"
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full ring-1 ring-border"
                  style={{ backgroundColor: t.swatch }}
                />
                <span className="flex-1 text-left">{t.label}</span>
                {theme === t.id && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
