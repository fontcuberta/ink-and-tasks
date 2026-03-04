<script setup>
import { computed } from 'vue';

const props = defineProps({
  value: { type: Number, default: 0 },
  total: { type: Number, default: 1 },
  size: { type: Number, default: 28 },
  strokeWidth: { type: Number, default: 3 },
  color: { type: String, default: 'var(--color-gold)' },
});

const radius = computed(() => (props.size - props.strokeWidth) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const percent = computed(() => props.total > 0 ? props.value / props.total : 0);
const dashOffset = computed(() => circumference.value * (1 - percent.value));
</script>

<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="`0 0 ${size} ${size}`"
    class="progress-ring"
    role="img"
    :aria-label="`${value} of ${total} complete`"
  >
    <circle
      :cx="size / 2"
      :cy="size / 2"
      :r="radius"
      fill="none"
      stroke="var(--color-surface-2)"
      :stroke-width="strokeWidth"
    />
    <circle
      :cx="size / 2"
      :cy="size / 2"
      :r="radius"
      fill="none"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="dashOffset"
      transform="rotate(-90)"
      :transform-origin="`${size / 2} ${size / 2}`"
      class="progress-ring__fill"
    />
  </svg>
</template>

<style scoped>
.progress-ring__fill {
  transition: stroke-dashoffset 0.4s ease;
}
@media (prefers-reduced-motion: reduce) {
  .progress-ring__fill {
    transition: none;
  }
}
</style>
