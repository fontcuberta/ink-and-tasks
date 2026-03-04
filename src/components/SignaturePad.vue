<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import SignaturePad from 'signature_pad';

const props = defineProps({ modelValue: String });
const emit = defineEmits(['update:modelValue']);

const canvas = ref(null);
const wrapper = ref(null);
let pad = null;
let resizeObserver = null;

function resizeCanvas() {
  if (!canvas.value || !wrapper.value) return;
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  const w = wrapper.value.clientWidth;
  const h = wrapper.value.clientHeight;
  canvas.value.width = w * ratio;
  canvas.value.height = h * ratio;
  canvas.value.getContext('2d').scale(ratio, ratio);
  canvas.value.style.width = w + 'px';
  canvas.value.style.height = h + 'px';
  if (pad) pad.clear();
}

onMounted(() => {
  pad = new SignaturePad(canvas.value, {
    backgroundColor: 'rgba(0,0,0,0)',
    penColor: '#e8dcc8',
    minWidth: 1,
    maxWidth: 2.5,
  });

  pad.addEventListener('endStroke', () => {
    emit('update:modelValue', pad.toDataURL());
  });

  resizeObserver = new ResizeObserver(() => resizeCanvas());
  resizeObserver.observe(wrapper.value);
  nextTick(resizeCanvas);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  pad?.off();
});

function clear() {
  pad?.clear();
  emit('update:modelValue', '');
}

defineExpose({ clear });
</script>

<template>
  <div class="sig-wrapper" ref="wrapper">
    <canvas ref="canvas" class="sig-canvas"></canvas>
    <button type="button" class="sig-clear" @click="clear" aria-label="Clear signature">
      <i class="ph-thin ph-eraser"></i> Clear
    </button>
  </div>
</template>

<style scoped>
.sig-wrapper {
  position: relative;
  width: 100%;
  height: 140px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface-2);
  overflow: hidden;
}
.sig-canvas {
  display: block;
  cursor: crosshair;
  touch-action: none;
}
.sig-clear {
  position: absolute;
  bottom: 6px;
  right: 8px;
  background: rgba(0,0,0,0.5);
  border: none;
  color: var(--color-muted);
  font-family: var(--font-body);
  font-size: 0.72rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: color 0.2s;
}
.sig-clear:hover {
  color: var(--color-cream);
}
</style>
