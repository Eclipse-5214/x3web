// Manual theme (light/dark/system), accent color, and debug-log visibility —
// all persisted to localStorage. Accent is applied as CSS custom properties
// consumed via Tailwind's accent-* theme tokens (see app.css), so any color
// works, not just presets.

export type Theme = 'light' | 'dark' | 'system';

export interface AccentPreset {
  name: string;
  value: string;
}

export const ACCENTS: AccentPreset[] = [
  { name: 'Blue', value: '#2563eb' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Cyan', value: '#0891b2' },
];

const THEME_KEY = 'x3-theme';
const ACCENT_KEY = 'x3-accent';
const SHOW_LOG_KEY = 'x3-show-log';

function load(key: string, fallback: string): string {
  if (typeof localStorage === 'undefined') return fallback;
  return localStorage.getItem(key) ?? fallback;
}

// Lighten a #rrggbb color toward white by `amount` (0-1), for hover states.
function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.round(((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * amount);
  const g = Math.round(((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * amount);
  const b = Math.round((num & 0xff) + (255 - (num & 0xff)) * amount);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

export const settings: { theme: Theme; accent: string; showLog: boolean } = $state({
  theme: load(THEME_KEY, 'system') as Theme,
  accent: load(ACCENT_KEY, ACCENTS[0].value),
  showLog: load(SHOW_LOG_KEY, 'false') === 'true',
});

function resolvedIsDark(): boolean {
  if (settings.theme === 'dark') return true;
  if (settings.theme === 'light') return false;
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', resolvedIsDark());
}

function applyAccent(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--accent', settings.accent);
  document.documentElement.style.setProperty('--accent-hover', lighten(settings.accent, 0.15));
  document.documentElement.style.setProperty('--accent-soft', `${settings.accent}1a`);
}

export function setTheme(theme: Theme): void {
  settings.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  applyTheme();
}

export function setAccent(value: string): void {
  settings.accent = value;
  localStorage.setItem(ACCENT_KEY, value);
  applyAccent();
}

export function setShowLog(value: boolean): void {
  settings.showLog = value;
  localStorage.setItem(SHOW_LOG_KEY, String(value));
}

export function initTheme(): void {
  applyTheme();
  applyAccent();
  if (typeof matchMedia !== 'undefined') {
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (settings.theme === 'system') applyTheme();
    });
  }
}
