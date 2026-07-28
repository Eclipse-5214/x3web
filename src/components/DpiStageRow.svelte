<script lang="ts">
  let {
    index,
    value = $bindable(),
    max,
    dpiMin,
    dpiStep,
    isActive,
    presetDefault,
    onApply,
    onReset,
  }: {
    index: number;
    value: number;
    max: number;
    dpiMin: number;
    dpiStep: number;
    isActive: boolean;
    presetDefault: number;
    onApply: (index: number) => void;
    onReset: (index: number) => void;
  } = $props();
</script>

<div
  class="flex items-center gap-2 rounded-xl border px-2.5 py-2 transition {isActive
    ? 'border-accent/60 bg-accent-soft'
    : 'border-neutral-200 dark:border-neutral-800'}"
>
  <button
    onclick={() => onApply(index)}
    class="w-8 shrink-0 rounded-md px-1.5 py-1 text-[11px] font-semibold transition {isActive
      ? 'bg-accent text-white'
      : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'}"
    title="Select stage {index}"
  >
    S{index}
  </button>
  <input
    type="range"
    min={dpiMin}
    {max}
    step={dpiStep}
    bind:value
    onchange={() => onApply(index)}
    class="h-1.5 flex-1 cursor-pointer accent-accent"
  />
  <input
    type="number"
    min={dpiMin}
    {max}
    step={dpiStep}
    bind:value
    onchange={(e) => {
      value = Math.max(dpiMin, e.currentTarget.valueAsNumber || dpiMin);
      onApply(index);
    }}
    class="w-16 shrink-0 rounded-md border border-neutral-300 bg-transparent px-1.5 py-1 text-center font-mono text-xs tabular-nums dark:border-neutral-700"
  />
  <button
    onclick={() => onReset(index)}
    title="Reset to factory default ({presetDefault.toLocaleString()})"
    class="shrink-0 rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5">
      <path
        fill-rule="evenodd"
        d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
        clip-rule="evenodd"
      />
    </svg>
  </button>
</div>
