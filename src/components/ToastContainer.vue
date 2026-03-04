<script setup>
import { useToast } from '../composables/useToast.js';

const { toasts, dismiss } = useToast();
</script>

<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="['toast', 'toast--' + t.type]"
          role="status"
          @click="dismiss(t.id)"
        >
          <div class="toast__title">{{ t.title }}</div>
          <div v-if="t.message" class="toast__message">{{ t.message }}</div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 340px;
}
.toast {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}
.toast--success { border-left: 3px solid var(--color-success); }
.toast--error   { border-left: 3px solid var(--color-danger); }
.toast--info    { border-left: 3px solid var(--color-gold); }
.toast__title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-cream);
}
.toast__message {
  font-size: 0.78rem;
  color: var(--color-muted);
  margin-top: 0.2rem;
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
