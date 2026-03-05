<script setup>
import { ref, computed } from 'vue';
import { useOnboarding } from '../composables/useOnboarding.js';
import { trapFocus } from '../utils/trapFocus.js';

const { isDone, markDone } = useOnboarding();

const step = ref(0);
const direction = ref('next');

const steps = [
  {
    icon: null,
    title: 'Ink & Tasks',
    subtitle: 'Your tattoo studio, organized.',
    body: 'Everything you need to manage clients, schedule sessions, and stay on top of your art — in one place.',
    cta: 'Get Started',
  },
  {
    icon: 'ph-thin ph-kanban',
    title: 'Your Pipeline',
    subtitle: 'Visual Kanban Board',
    body: 'Every project flows through five columns — from Inbox to Done & Healing. Drag cards between columns, add reference photos, and always know what\'s next.',
  },
  {
    icon: 'ph-thin ph-calendar-blank',
    title: 'Your Schedule',
    subtitle: 'Calendar & Time-boxing',
    body: 'Block drawing days and tattoo sessions on your calendar. Link events to projects so nothing falls through the cracks. Drag to reschedule.',
  },
  {
    icon: 'ph-thin ph-file-text',
    title: 'Stay Protected',
    subtitle: 'Digital Consent Forms',
    body: 'Clients sign directly on screen — no paper needed. Forms link to projects, store securely, and are always available to print or review.',
  },
  {
    icon: 'ph-thin ph-user-circle',
    title: 'Your Space',
    subtitle: 'Navigation & Account',
    body: 'Use the sidebar to switch between Board, Calendar, and Consent. Create an account to keep your data safe across devices.',
  },
  {
    icon: 'ph-thin ph-rocket-launch',
    title: 'You\'re all set.',
    subtitle: 'Time to ink.',
    body: 'Your studio is ready. Start by adding your first project to the board.',
    cta: 'Let\'s go',
  },
];

const current = computed(() => steps[step.value]);
const isFirst = computed(() => step.value === 0);
const isLast = computed(() => step.value === steps.length - 1);
const showNav = computed(() => !isFirst.value && !isLast.value);

function next() {
  if (isLast.value) {
    finish();
    return;
  }
  direction.value = 'next';
  step.value++;
}

function back() {
  if (step.value > 0) {
    direction.value = 'prev';
    step.value--;
  }
}

function skip() {
  finish();
}

function finish() {
  markDone();
}

const transitionName = computed(() =>
  direction.value === 'next' ? 'slide-left' : 'slide-right'
);
</script>

<template>
  <Teleport to="body">
    <Transition name="wizard-fade">
      <div
        v-if="!isDone"
        class="wizard-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to Ink & Tasks"
        @keydown="trapFocus"
        @keydown.esc="skip"
      >
        <div class="wizard-card">
          <!-- Skip link (not on first or last step) -->
          <button
            v-if="showNav"
            class="wizard-skip"
            @click="skip"
          >Skip</button>

          <!-- Step content with transition -->
          <Transition :name="transitionName" mode="out-in">
            <div :key="step" class="wizard-step">
              <!-- Branding header on first step -->
              <div v-if="isFirst" class="wizard-brand">
                <div class="wizard-brand__icon">
                  <i class="ph-thin ph-pen-nib"></i>
                </div>
              </div>

              <!-- Icon for middle and last steps -->
              <div v-else class="wizard-icon">
                <i :class="current.icon"></i>
              </div>

              <h2 :class="['wizard-title', { 'wizard-title--brand': isFirst }]">
                {{ current.title }}
              </h2>
              <p class="wizard-subtitle">{{ current.subtitle }}</p>
              <p class="wizard-body">{{ current.body }}</p>

              <!-- CTA button on first and last steps -->
              <button
                v-if="current.cta"
                class="wizard-cta"
                @click="next"
              >
                {{ current.cta }}
                <i v-if="isFirst" class="ph-thin ph-arrow-right" aria-hidden="true"></i>
                <i v-if="isLast" class="ph-thin ph-rocket-launch" aria-hidden="true"></i>
              </button>
            </div>
          </Transition>

          <!-- Navigation (middle steps) -->
          <div v-if="showNav" class="wizard-nav">
            <button class="wizard-nav__btn" @click="back" aria-label="Previous step">
              <i class="ph-thin ph-arrow-left" aria-hidden="true"></i>
              Back
            </button>
            <button class="wizard-nav__btn wizard-nav__btn--primary" @click="next">
              Next
              <i class="ph-thin ph-arrow-right" aria-hidden="true"></i>
            </button>
          </div>

          <!-- Progress dots -->
          <div class="wizard-dots" role="group" aria-label="Wizard progress">
            <button
              v-for="(s, i) in steps"
              :key="i"
              :class="['wizard-dot', { 'wizard-dot--active': i === step, 'wizard-dot--done': i < step }]"
              :aria-label="`Step ${i + 1} of ${steps.length}: ${s.title}`"
              :aria-current="i === step ? 'step' : undefined"
              @click="direction = i > step ? 'next' : 'prev'; step = i"
            ></button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Overlay */
.wizard-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 8, 6, 0.85);
  backdrop-filter: blur(12px);
  padding: 1rem;
}

/* Card */
.wizard-card {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  width: 100%;
  max-width: 480px;
  padding: 2.5rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  overflow: hidden;
  box-shadow:
    0 0 60px rgba(201, 168, 76, 0.08),
    0 24px 48px rgba(0, 0, 0, 0.5);
}

/* Skip */
.wizard-skip {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  background: none;
  border: none;
  color: var(--color-muted);
  font-family: var(--font-body);
  font-size: 0.78rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  transition: color 0.2s;
}
.wizard-skip:hover {
  color: var(--color-cream);
}

/* Step wrapper */
.wizard-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

/* Brand icon (step 0) */
.wizard-brand {
  margin-bottom: 1.5rem;
}
.wizard-brand__icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(201, 168, 76, 0.15), rgba(201, 168, 76, 0.05));
  border: 1px solid var(--color-gold-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  color: var(--color-gold);
  box-shadow: 0 0 30px rgba(201, 168, 76, 0.15);
  animation: brand-pulse 3s ease-in-out infinite;
}
@keyframes brand-pulse {
  0%, 100% { box-shadow: 0 0 30px rgba(201, 168, 76, 0.15); }
  50% { box-shadow: 0 0 50px rgba(201, 168, 76, 0.25); }
}

/* Step icon (steps 1-5) */
.wizard-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: var(--color-gold);
  margin-bottom: 1.25rem;
}

/* Title */
.wizard-title {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-cream);
  margin-bottom: 0.25rem;
  line-height: 1.3;
}
.wizard-title--brand {
  font-family: var(--font-display);
  font-size: 1.6rem;
  color: var(--color-gold);
  letter-spacing: 0.02em;
}

/* Subtitle */
.wizard-subtitle {
  font-family: var(--font-heading);
  font-size: 1rem;
  color: var(--color-gold);
  opacity: 0.8;
  margin-bottom: 0.85rem;
}

/* Body */
.wizard-body {
  font-family: var(--font-body);
  font-size: 0.88rem;
  color: var(--color-muted);
  line-height: 1.65;
  max-width: 380px;
  margin-bottom: 1.75rem;
}

/* CTA button (steps 0 and 5) */
.wizard-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--color-gold);
  color: var(--color-bg);
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: 0.85rem 2.2rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(201, 168, 76, 0.35);
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
}
.wizard-cta:hover {
  background: var(--color-gold-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(201, 168, 76, 0.45);
}
.wizard-cta:active {
  transform: translateY(0);
}

/* Navigation */
.wizard-nav {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.25rem;
  width: 100%;
  justify-content: center;
}
.wizard-nav__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.55rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-muted);
}
.wizard-nav__btn:hover {
  color: var(--color-cream);
  border-color: var(--color-muted);
}
.wizard-nav__btn--primary {
  background: var(--color-gold);
  border-color: var(--color-gold);
  color: var(--color-bg);
}
.wizard-nav__btn--primary:hover {
  background: var(--color-gold-hover);
  border-color: var(--color-gold-hover);
  box-shadow: 0 2px 12px rgba(201, 168, 76, 0.3);
}

/* Progress dots */
.wizard-dots {
  display: flex;
  gap: 0.45rem;
  margin-top: 1.75rem;
}
.wizard-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  padding: 0;
  background: var(--color-surface-3);
  cursor: pointer;
  transition: all 0.3s;
}
.wizard-dot--active {
  background: var(--color-gold);
  width: 22px;
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(201, 168, 76, 0.3);
}
.wizard-dot--done {
  background: var(--color-gold-dim);
}

/* ── Slide transitions ── */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-left-enter-from {
  transform: translateX(40px);
  opacity: 0;
}
.slide-left-leave-to {
  transform: translateX(-40px);
  opacity: 0;
}
.slide-right-enter-from {
  transform: translateX(-40px);
  opacity: 0;
}
.slide-right-leave-to {
  transform: translateX(40px);
  opacity: 0;
}

/* ── Overlay fade ── */
.wizard-fade-enter-active {
  transition: opacity 0.4s ease;
}
.wizard-fade-leave-active {
  transition: opacity 0.3s ease;
}
.wizard-fade-enter-from,
.wizard-fade-leave-to {
  opacity: 0;
}
.wizard-fade-enter-active .wizard-card {
  transition: transform 0.4s ease;
}
.wizard-fade-enter-from .wizard-card {
  transform: scale(0.92) translateY(16px);
}
.wizard-fade-leave-active .wizard-card {
  transition: transform 0.3s ease;
}
.wizard-fade-leave-to .wizard-card {
  transform: scale(0.96) translateY(8px);
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .wizard-brand__icon {
    animation: none;
  }
  .slide-left-enter-active,
  .slide-left-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active,
  .wizard-fade-enter-active,
  .wizard-fade-leave-active,
  .wizard-fade-enter-active .wizard-card,
  .wizard-fade-leave-active .wizard-card {
    transition: none;
  }
}

/* ── Mobile ── */
@media (max-width: 480px) {
  .wizard-card {
    padding: 2rem 1.25rem 1.5rem;
    border-radius: 14px;
  }
  .wizard-title--brand {
    font-size: 1.35rem;
  }
  .wizard-cta {
    width: 100%;
    justify-content: center;
  }
}
</style>
