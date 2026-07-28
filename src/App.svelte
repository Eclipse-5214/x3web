<script lang="ts">
  import {
    VENDOR_ID,
    PRODUCT_IDS,
    PRODUCT_ID_WIRED,
    DPI_STAGE_REPORT_ID,
    POLLING_RATE_REPORT_ID,
    DPI_PRESET_STAGES,
    POLLING_RATES,
    DPI_MIN,
    DPI_MAX,
    DPI_STEP,
    buildDpiStagePayload,
    buildCustomDpiPayload,
    buildPollingRatePayload,
    bytesToHex,
  } from './lib/x3protocol';
  import SettingsMenu from './components/SettingsMenu.svelte';
  import DpiStageRow from './components/DpiStageRow.svelte';
  import PillButton from './components/PillButton.svelte';
  import { settings } from './stores/theme.svelte';
  import { loadCachedState, saveCachedState } from './lib/stateCache';

  const STAGE_COUNT = DPI_PRESET_STAGES.length; // 6, all custom-adjustable

  // The mouse can't be read back (see x3protocol.ts), so we remember the last
  // state *this driver* wrote as a best guess. Goes stale if something else
  // (the official app, another tab) changes the mouse in between. On first
  // ever use (no cache yet) we assume the mouse's factory-ship defaults.
  const FACTORY_DEFAULT_STAGE = 2; // 1600 DPI
  const FACTORY_DEFAULT_RATE = 1000; // Hz
  const cached = loadCachedState();

  let device = $state<HIDDevice | null>(null);
  let connectionKind = $derived(device ? (PRODUCT_ID_WIRED === device.productId ? 'Wired' : '2.4G Wireless') : null);
  let activeStage = $state<number | null>(cached?.activeStage ?? FACTORY_DEFAULT_STAGE);
  let activeRate = $state<number | null>(cached?.activeRate ?? FACTORY_DEFAULT_RATE);
  let stageDpi = $state<number[]>(cached?.stageDpi ?? [...DPI_PRESET_STAGES]);
  let logLines = $state<string[]>([]);

  const pollRateOptions = Object.keys(POLLING_RATES).map(Number).sort((a, b) => a - b);

  // The slider/input can go up to a stage's own factory preset even when that
  // exceeds the safe custom-encoding range (currently only stage 6 / 26000) —
  // reaching it uses the firmware preset path below instead of custom encoding.
  function stageMax(index: number): number {
    return Math.max(DPI_MAX, DPI_PRESET_STAGES[index - 1]);
  }

  function roundDpi(value: number): number {
    const snapped = Math.round(value / DPI_STEP) * DPI_STEP;
    return Math.min(DPI_MAX, Math.max(DPI_MIN, snapped));
  }

  function log(msg: string): void {
    const t = new Date().toLocaleTimeString();
    logLines = [...logLines, `[${t}] ${msg}`].slice(-200);
  }

  function rememberState(): void {
    saveCachedState({ stageDpi, activeStage, activeRate });
  }

  async function connect(): Promise<void> {
    if (!('hid' in navigator)) {
      log('WebHID is not available. Use Chrome or Edge, served over http(s) or localhost.');
      return;
    }
    let candidates: HIDDevice[];
    try {
      candidates = await navigator.hid.requestDevice({
        filters: PRODUCT_IDS.map((productId) => ({ vendorId: VENDOR_ID, productId })),
      });
    } catch (err) {
      log(`requestDevice failed: ${(err as Error).message}`);
      return;
    }
    if (candidates.length === 0) {
      log('No device selected.');
      return;
    }

    for (const d of candidates) {
      try {
        if (!d.opened) await d.open();
      } catch (err) {
        log(`Could not open ${d.productName}: ${(err as Error).message}`);
        continue;
      }
      const hasDpiReport = d.collections.some((c) =>
        c.featureReports?.some((r) => r.reportId === DPI_STAGE_REPORT_ID),
      );
      const hasPollingReport = d.collections.some((c) =>
        c.featureReports?.some((r) => r.reportId === POLLING_RATE_REPORT_ID),
      );
      if (hasDpiReport && hasPollingReport) {
        device = d;
        break;
      }
    }

    if (!device) {
      log(
        'Config interface not found among the selected device(s). Reconnect and try picking a different entry — several are usually listed for the same mouse.',
      );
      return;
    }

    log('Connected to config interface.');
    navigator.hid.addEventListener('disconnect', (e) => {
      if (e.device === device) {
        device = null;
        activeStage = null;
        activeRate = null;
        log('Device disconnected.');
      }
    });
  }

  async function applyPreset(index: number, reason: string): Promise<void> {
    stageDpi[index - 1] = DPI_PRESET_STAGES[index - 1];
    if (!device) return;
    const payload = buildDpiStagePayload(index);
    try {
      await device.sendFeatureReport(DPI_STAGE_REPORT_ID, payload);
      activeStage = index;
      rememberState();
      log(`Stage ${index} -> ${DPI_PRESET_STAGES[index - 1].toLocaleString()} DPI (firmware preset, ${reason}). Report ${DPI_STAGE_REPORT_ID}: ${bytesToHex(payload)}`);
    } catch (err) {
      log(`Failed to set DPI stage: ${(err as Error).message}`);
    }
  }

  async function applyStageDpi(index: number): Promise<void> {
    const requested = stageDpi[index - 1];
    // Above the safe custom-encoding range: fall back to the firmware preset
    // rather than risk the byte21 collision (see x3protocol.ts DPI_MAX note).
    if (requested > DPI_MAX) {
      await applyPreset(index, 'above custom-value range');
      return;
    }

    stageDpi[index - 1] = roundDpi(requested);
    if (!device) return;
    const dpiValue = stageDpi[index - 1];
    const payload = buildCustomDpiPayload(index, dpiValue);
    try {
      await device.sendFeatureReport(DPI_STAGE_REPORT_ID, payload);
      activeStage = index;
      rememberState();
      log(`Stage ${index} -> ${dpiValue.toLocaleString()} DPI. Report ${DPI_STAGE_REPORT_ID}: ${bytesToHex(payload)}`);
    } catch (err) {
      log(`Failed to set DPI: ${(err as Error).message}`);
    }
  }

  async function resetStage(index: number): Promise<void> {
    await applyPreset(index, 'reset to factory default');
  }

  async function setPollingRate(hz: number): Promise<void> {
    if (!device) return;
    const payload = buildPollingRatePayload(hz);
    try {
      await device.sendFeatureReport(POLLING_RATE_REPORT_ID, payload);
      activeRate = hz;
      rememberState();
      log(`Polling rate -> ${hz}Hz. Report ${POLLING_RATE_REPORT_ID}: ${bytesToHex(payload)}`);
    } catch (err) {
      log(`Failed to set polling rate: ${(err as Error).message}`);
    }
  }
</script>

<main class="flex h-svh flex-col overflow-hidden bg-gradient-to-b from-neutral-50 to-neutral-100 p-4 text-neutral-900 sm:p-6 dark:from-neutral-950 dark:to-neutral-900 dark:text-neutral-100">
  <div class="mx-auto flex w-full max-w-7xl min-h-0 flex-1 flex-col">
    <header class="mb-4 flex shrink-0 items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white shadow-lg" style="box-shadow: 0 8px 20px -8px var(--accent)">
        X3
      </div>
      <div class="flex-1">
        <h1 class="text-base leading-tight font-semibold tracking-tight">Attack Shark X3</h1>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">Unofficial WebHID driver</p>
      </div>

      <div class="flex items-center gap-2">
        <span class="relative flex h-2.5 w-2.5">
          {#if device}
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
          {/if}
          <span class="relative inline-flex h-2.5 w-2.5 rounded-full {device ? 'bg-green-500' : 'bg-neutral-400 dark:bg-neutral-600'}"></span>
        </span>
        <span class="hidden text-sm font-medium sm:inline">
          {device ? (device.productName || 'Attack Shark X3') : 'Not connected'}
        </span>
        {#if connectionKind}
          <span class="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {connectionKind}
          </span>
        {/if}
      </div>

      <button
        onclick={connect}
        class="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-accent-hover active:scale-[0.98]"
      >
        {device ? 'Reconnect' : 'Connect'}
      </button>

      <SettingsMenu />
    </header>

    {#if !device}
      <section class="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 p-6 text-center dark:border-neutral-700">
        <p class="mb-1 text-sm font-medium">No mouse connected</p>
        <p class="max-w-xs text-xs text-neutral-500 dark:text-neutral-400">
          Click Connect and pick the X3 from the browser's device picker. If more than one entry
          shows up, grant them all — the driver finds the right one automatically. Works wired or
          over the 2.4G USB receiver — Bluetooth mode isn't supported.
        </p>
      </section>
    {:else}
      <div class="grid min-h-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-[1.6fr_1fr]">
        <section class="flex min-h-0 flex-col rounded-2xl border border-neutral-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80">
          <h2 class="mb-2 shrink-0 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
            DPI Stages
          </h2>
          <div class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-2">
            {#each { length: STAGE_COUNT } as _, i}
              {@const index = i + 1}
              <DpiStageRow
                {index}
                bind:value={stageDpi[i]}
                max={stageMax(index)}
                dpiMin={DPI_MIN}
                dpiStep={DPI_STEP}
                isActive={activeStage === index}
                presetDefault={DPI_PRESET_STAGES[i]}
                onApply={applyStageDpi}
                onReset={resetStage}
              />
            {/each}
          </div>
        </section>

        <div class="flex min-h-0 flex-col gap-4">
          <section class="shrink-0 rounded-2xl border border-neutral-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80">
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
              Polling Rate
            </h2>
            <div class="flex flex-wrap gap-1.5">
              {#each pollRateOptions as hz}
                <PillButton active={activeRate === hz} onclick={() => setPollingRate(hz)}>
                  {hz} Hz
                </PillButton>
              {/each}
            </div>
          </section>

          {#if settings.showLog}
            <section class="flex min-h-0 flex-1 flex-col rounded-2xl border border-neutral-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80">
              <h2 class="mb-2 shrink-0 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                Debug Log
              </h2>
              <div class="min-h-16 flex-1 overflow-y-auto rounded-lg bg-neutral-100 p-2.5 font-mono text-[11px] break-all text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
                {#each logLines as line}
                  <div>{line}</div>
                {:else}
                  <div>Ready.</div>
                {/each}
              </div>
            </section>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</main>
