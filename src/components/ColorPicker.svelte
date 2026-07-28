<script lang="ts">
  import { untrack } from 'svelte';
  import { hexToHsv, hsvToHex, type Hsv } from '../lib/colorUtils';

  let { value, onChange }: { value: string; onChange: (hex: string) => void } = $props();

  // Seeded from the initial prop, then locally driven by drag input;
  // the effect below resyncs it if `value` changes from outside (e.g. a preset).
  let hsv = $state<Hsv>(untrack(() => hexToHsv(value)));
  let svEl: HTMLDivElement | undefined;
  let hueEl: HTMLDivElement | undefined;

  // Stay in sync if the value changes externally (e.g. a preset was clicked).
  $effect(() => {
    if (hsvToHex(hsv).toLowerCase() !== value.toLowerCase()) {
      hsv = hexToHsv(value);
    }
  });

  let hueColor = $derived(hsvToHex({ h: hsv.h, s: 1, v: 1 }));

  function clamp01(n: number): number {
    return Math.min(1, Math.max(0, n));
  }

  function setFromSvPointer(e: PointerEvent): void {
    if (!svEl) return;
    const rect = svEl.getBoundingClientRect();
    const s = clamp01((e.clientX - rect.left) / rect.width);
    const v = clamp01(1 - (e.clientY - rect.top) / rect.height);
    hsv = { ...hsv, s, v };
    onChange(hsvToHex(hsv));
  }

  function setFromHuePointer(e: PointerEvent): void {
    if (!hueEl) return;
    const rect = hueEl.getBoundingClientRect();
    const h = clamp01((e.clientX - rect.left) / rect.width) * 360;
    hsv = { ...hsv, h };
    onChange(hsvToHex(hsv));
  }

  function drag(handler: (e: PointerEvent) => void) {
    return (e: PointerEvent) => {
      handler(e);
      const move = (ev: PointerEvent) => handler(ev);
      const stop = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', stop);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', stop);
    };
  }

  function onHexInput(e: Event & { currentTarget: HTMLInputElement }): void {
    const v = e.currentTarget.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      onChange(v);
    } else {
      e.currentTarget.value = value;
    }
  }
</script>

<div class="w-full select-none">
  <div
    bind:this={svEl}
    onpointerdown={drag(setFromSvPointer)}
    role="slider"
    tabindex="0"
    aria-label="Saturation and brightness"
    aria-valuenow={Math.round(hsv.v * 100)}
    aria-valuemin="0"
    aria-valuemax="100"
    class="relative h-28 w-full cursor-crosshair rounded-lg"
    style="background: linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, {hueColor})"
  >
    <div
      class="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
      style="left:{hsv.s * 100}%; top:{(1 - hsv.v) * 100}%"
    ></div>
  </div>

  <div
    bind:this={hueEl}
    onpointerdown={drag(setFromHuePointer)}
    role="slider"
    tabindex="0"
    aria-label="Hue"
    aria-valuenow={Math.round(hsv.h)}
    aria-valuemin="0"
    aria-valuemax="360"
    class="relative mt-3 h-2.5 w-full cursor-pointer rounded-full"
    style="background: linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)"
  >
    <div
      class="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
      style="left:{(hsv.h / 360) * 100}%; background:{hueColor}"
    ></div>
  </div>

  <div class="mt-3 flex items-center gap-2">
    <span class="h-6 w-6 shrink-0 rounded-md border border-neutral-300 dark:border-neutral-700" style="background:{value}"></span>
    <input
      type="text"
      value={value}
      onchange={onHexInput}
      class="w-full rounded-md border border-neutral-300 bg-transparent px-2 py-1 font-mono text-xs uppercase dark:border-neutral-700"
    />
  </div>
</div>
