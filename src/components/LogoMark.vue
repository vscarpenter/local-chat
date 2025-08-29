<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    class="logo-mark"
  >
    <!-- Gradient background bubble -->
    <defs>
      <linearGradient id="g-bubble" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="var(--bg-button)" />
        <stop offset="100%" stop-color="var(--border-input-focus)" />
      </linearGradient>
      <linearGradient id="g-house" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.85" />
      </linearGradient>
      <linearGradient id="g-spark" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fff" />
        <stop offset="100%" stop-color="#fff" stop-opacity="0.6" />
      </linearGradient>
    </defs>

    <!-- Chat bubble base -->
    <path
      d="M32 6c13.255 0 24 8.954 24 20s-10.745 20-24 20c-2.33 0-4.58-.28-6.71-.8-1.05-.26-2.16.04-2.93.77L13.7 54.22c-1.45 1.39-3.83-.02-3.31-1.9l2.96-10.64c.23-.82-.05-1.7-.73-2.25C9.26 35.82 8 32.99 8 30 8 14.954 18.745 6 32 6z"
      fill="url(#g-bubble)"
    />

    <!-- House/roof inside bubble -->
    <path
      d="M20 35.5v-8.2c0-.47.22-.9.6-1.18l10.9-8.2a2 2 0 0 1 2.4 0l10.9 8.2c.38.28.6.71.6 1.18v8.2a2 2 0 0 1-2 2h-4.5a1.5 1.5 0 0 1-1.5-1.5v-6h-9v6A1.5 1.5 0 0 1 27.9 37.5H23a3 3 0 0 1-3-3z"
      fill="url(#g-house)"
    />

    <!-- Small sparkle to suggest AI -->
    <circle cx="44" cy="16" r="3" fill="url(#g-spark)" />
  </svg>
</template>

<script setup>
const props = defineProps({
  size: { type: [Number, String], default: 28 },
})
</script>

<style scoped>
.logo-mark {
  display: block;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.12));
  border-radius: 12px;
}
</style>
