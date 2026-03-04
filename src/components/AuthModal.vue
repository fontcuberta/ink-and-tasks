<script setup>
import { ref, computed, nextTick } from 'vue';
import { useAuth } from '../composables/useAuth.js';
import { useToast } from '../composables/useToast.js';

const props = defineProps({
  modelValue: Boolean,
  initialTab: { type: String, default: 'signin' },
});
const emit = defineEmits(['update:modelValue']);

const { signUpWithEmail, signInWithEmail } = useAuth();
const { show: toast } = useToast();

const activeTab = ref(props.initialTab);
const email = ref('');
const password = ref('');
const error = ref('');
const submitting = ref(false);
const emailInput = ref(null);

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
});

function setTab(tab) {
  activeTab.value = tab;
  email.value = '';
  password.value = '';
  error.value = '';
  nextTick(() => emailInput.value?.focus());
}

function close() {
  visible.value = false;
  email.value = '';
  password.value = '';
  error.value = '';
}

async function submit() {
  if (submitting.value) return;
  error.value = '';
  submitting.value = true;

  try {
    const result = activeTab.value === 'signup'
      ? await signUpWithEmail(email.value, password.value)
      : await signInWithEmail(email.value, password.value);

    if (result.error) {
      error.value = result.error.message;
      return;
    }

    if (activeTab.value === 'signup') {
      close();
      toast('Check your inbox', { message: 'Confirm your email to sign in.', type: 'success', duration: 6000 });
    } else {
      close();
      toast('Welcome back!', { type: 'success' });
    }
  } catch (e) {
    error.value = 'Something went wrong. Try again.';
  } finally {
    submitting.value = false;
  }
}

function trapFocus(e) {
  if (e.key !== 'Tab') return;
  const focusable = e.currentTarget.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])');
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="auth-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        @keydown="trapFocus"
        @keydown.esc="close"
        @mousedown.self="close"
      >
        <div class="auth-modal">
          <button class="auth-modal__close" @click="close" aria-label="Close">
            <i class="ph-thin ph-x"></i>
          </button>

          <h2 id="auth-modal-title" class="auth-modal__title">
            {{ activeTab === 'signup' ? 'Create account' : 'Welcome back' }}
          </h2>

          <div class="auth-tabs" role="tablist">
            <button
              role="tab"
              :aria-selected="activeTab === 'signin'"
              :class="['auth-tab', { active: activeTab === 'signin' }]"
              @click="setTab('signin')"
            >Sign In</button>
            <button
              role="tab"
              :aria-selected="activeTab === 'signup'"
              :class="['auth-tab', { active: activeTab === 'signup' }]"
              @click="setTab('signup')"
            >Create Account</button>
          </div>

          <form class="auth-form" @submit.prevent="submit">
            <div class="form-group">
              <label class="sr-only" for="auth-email">Email</label>
              <input
                ref="emailInput"
                id="auth-email"
                v-model="email"
                type="email"
                class="input"
                placeholder="you@example.com"
                autocomplete="email"
                required
              />
            </div>
            <div class="form-group">
              <label class="sr-only" for="auth-password">Password</label>
              <input
                id="auth-password"
                v-model="password"
                type="password"
                class="input"
                placeholder="Min. 6 characters"
                :autocomplete="activeTab === 'signup' ? 'new-password' : 'current-password'"
                minlength="6"
                required
              />
            </div>
            <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
            <button type="submit" class="btn btn--gold" :disabled="submitting">
              {{ submitting ? 'Please wait...' : (activeTab === 'signup' ? 'Create account' : 'Sign in') }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.auth-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.auth-modal {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 100%;
  max-width: 380px;
  padding: 2rem;
  position: relative;
}
.auth-modal__close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: none;
  border: none;
  color: var(--color-muted);
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.3rem;
  transition: color 0.2s;
}
.auth-modal__close:hover {
  color: var(--color-cream);
}
.auth-modal__title {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  color: var(--color-cream);
  text-align: center;
  margin-bottom: 1.2rem;
}

.auth-tabs {
  display: flex;
  gap: 0.25rem;
  background: var(--color-surface-2);
  border-radius: 8px;
  padding: 0.2rem;
  margin-bottom: 1.5rem;
}
.auth-tab {
  flex: 1;
  border: none;
  background: none;
  color: var(--color-muted);
  font-family: var(--font-body);
  font-size: 0.85rem;
  padding: 0.5rem 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.auth-tab.active {
  background: var(--color-surface);
  color: var(--color-cream);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.auth-error {
  color: var(--color-danger-text);
  font-size: 0.8rem;
  text-align: center;
  margin: 0;
}

/* Transition */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.2s;
}
.modal-enter-active .auth-modal, .modal-leave-active .auth-modal {
  transition: transform 0.2s;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .auth-modal {
  transform: scale(0.95) translateY(8px);
}
.modal-leave-to .auth-modal {
  transform: scale(0.95) translateY(8px);
}
</style>
