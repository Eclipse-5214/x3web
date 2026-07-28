<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    active = false,
    onclick,
    children,
  }: {
    active?: boolean;
    onclick: () => void;
    children: Snippet;
  } = $props();
</script>

<button
  {onclick}
  class="min-w-16 rounded-lg border px-2.5 py-1.5 text-sm transition {active
    ? 'border-accent bg-accent text-white'
    : 'border-neutral-300 hover:border-accent dark:border-neutral-700'}"
>
  {@render children()}
</button>
