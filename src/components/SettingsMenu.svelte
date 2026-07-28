<script lang="ts">
  import { settings, setTheme, setAccent, setShowLog, ACCENTS, type Theme } from '../stores/theme.svelte';
  import ColorPicker from './ColorPicker.svelte';
  import pkg from '../../package.json';

  let open = $state(false);
  let showCustomPicker = $state(false);
  let menuEl: HTMLDivElement | undefined;

  function onWindowClick(e: MouseEvent) {
    if (open && menuEl && !menuEl.contains(e.target as Node)) {
      open = false;
      showCustomPicker = false;
    }
  }

  const themeOptions: { value: Theme; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  let isCustomAccent = $derived(!ACCENTS.some((a) => a.value === settings.accent));
</script>

<svelte:window onclick={onWindowClick} />

<div class="relative" bind:this={menuEl}>
  <button
    onclick={() => (open = !open)}
    aria-label="Settings"
    class="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
      <path fill-rule="evenodd" d="M8.34 1.804A1 1 0 019.32 1h1.36a1 1 0 01.98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 011.294.106l.962.962a1 1 0 01.106 1.294l-.834 1.25c.245.445.443.919.587 1.416l1.473.294a1 1 0 01.804.98v1.361a1 1 0 01-.804.98l-1.473.295a6.95 6.95 0 01-.587 1.416l.834 1.25a1 1 0 01-.106 1.294l-.962.962a1 1 0 01-1.294.106l-1.25-.834c-.445.245-.919.443-1.416.587l-.294 1.473a1 1 0 01-.98.804H9.32a1 1 0 01-.98-.804l-.295-1.473a6.957 6.957 0 01-1.416-.587l-1.25.834a1 1 0 01-1.294-.106l-.962-.962a1 1 0 01-.106-1.294l.834-1.25a6.957 6.957 0 01-.587-1.416l-1.473-.294A1 1 0 011 10.68V9.32a1 1 0 01.804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 01.106-1.294l.962-.962a1 1 0 011.294-.106l1.25.834a6.957 6.957 0 011.416-.587l.294-1.473zM13 10a3 3 0 11-6 0 3 3 0 016 0z" clip-rule="evenodd" />
    </svg>
  </button>

  {#if open}
    <div class="absolute right-0 z-10 mt-2 w-64 rounded-xl border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
      <div class="mb-4">
        <p class="mb-2 text-[11px] font-semibold tracking-wide text-neutral-400 uppercase">Theme</p>
        <div class="grid grid-cols-3 gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
          {#each themeOptions as opt}
            <button
              onclick={() => setTheme(opt.value)}
              class="rounded-md px-2 py-1 text-xs font-medium transition {settings.theme === opt.value
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}"
            >
              {opt.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="mb-4">
        <p class="mb-2 text-[11px] font-semibold tracking-wide text-neutral-400 uppercase">Accent</p>
        <div class="flex flex-wrap items-center gap-2">
          {#each ACCENTS as a}
            <button
              onclick={() => {
                setAccent(a.value);
                showCustomPicker = false;
              }}
              title={a.name}
              aria-label={a.name}
              style="background:{a.value}"
              class="h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-white transition dark:ring-offset-neutral-900 {settings.accent === a.value
                ? 'ring-neutral-400'
                : 'ring-transparent'}"
            ></button>
          {/each}
          <button
            onclick={() => (showCustomPicker = !showCustomPicker)}
            title="Custom color"
            aria-label="Custom color"
            aria-pressed={showCustomPicker}
            class="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 ring-2 ring-offset-2 ring-offset-white transition hover:bg-neutral-200 dark:bg-neutral-800 dark:ring-offset-neutral-900 dark:hover:bg-neutral-700 {isCustomAccent
              ? 'ring-accent'
              : 'ring-transparent'}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-3 w-3 text-neutral-400 dark:text-neutral-500">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          </button>
        </div>

        {#if showCustomPicker}
          <div class="mt-3 rounded-lg border border-neutral-100 p-2.5 dark:border-neutral-800">
            <ColorPicker value={settings.accent} onChange={setAccent} />
          </div>
        {/if}
      </div>

      <div class="mb-4 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
        <span class="text-xs font-medium">Debug log</span>
        <button
          onclick={() => setShowLog(!settings.showLog)}
          aria-pressed={settings.showLog}
          aria-label="Toggle debug log"
          class="relative h-5 w-9 rounded-full transition {settings.showLog ? 'bg-accent' : 'bg-neutral-300 dark:bg-neutral-700'}"
        >
          <span class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition {settings.showLog ? 'left-[18px]' : 'left-0.5'}"></span>
        </button>
      </div>

      <p class="mb-3 border-t border-neutral-100 pt-3 text-[11px] leading-relaxed text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
        This mouse's firmware only supports writing settings, not reading them back. DPI stage and
        polling rate shown reflect what this driver last wrote (remembered locally), not a live
        hardware read — they can go stale if changed elsewhere. Only the wired connection and the
        2.4G USB receiver are supported — not Bluetooth.
      </p>

      <p class="border-t border-neutral-100 pt-3 text-center text-[11px] text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
        Web driver v{pkg.version}
      </p>
    </div>
  {/if}
</div>
