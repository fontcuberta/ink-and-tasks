<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuth } from './composables/useAuth.js';
import { useToast } from './composables/useToast.js';
import AuthModal from './components/AuthModal.vue';
import ToastContainer from './components/ToastContainer.vue';

const { user, loading, isAnonymous, isSignedIn, email, init, signOut } = useAuth();
const { show: toast } = useToast();
const route = useRoute();

const showAuth = ref(false);
const authTab = ref('signin');
const navOpen = ref(false);

function openAuth(tab = 'signin') {
  authTab.value = tab;
  showAuth.value = true;
}

async function handleSignOut() {
  try {
    await signOut();
    toast('Signed out', { type: 'info' });
  } catch (err) {
    toast('Sign out failed', { message: err.message, type: 'error' });
  }
}

watch(isSignedIn, (val) => {
  if (val) showAuth.value = false;
});

const navItems = [
  { path: '/board', label: 'Board', icon: 'ph-thin ph-kanban' },
  { path: '/calendar', label: 'Calendar', icon: 'ph-thin ph-calendar-blank' },
  { path: '/consent', label: 'Consent', icon: 'ph-thin ph-file-text' },
];

onMounted(async () => {
  try {
    await init();
  } catch (err) {
    console.error('[Ink & Tasks] Init failed:', err);
    toast('Connection issue', { message: 'Could not reach the server.', type: 'error' });
  }
});
</script>

<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside :class="['sidebar', { 'sidebar--open': navOpen }]">
      <div class="sidebar__brand">
        <h1 class="sidebar__title">Ink & Tasks</h1>
        <p class="sidebar__subtitle">Artist management</p>
      </div>

      <nav class="sidebar__nav" aria-label="Main navigation">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-link', { active: route.path === item.path }]"
          @click="navOpen = false"
        >
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar__footer">
        <template v-if="isSignedIn">
          <div class="sidebar__user">
            <i class="ph-thin ph-user-circle"></i>
            <span class="sidebar__email">{{ email }}</span>
          </div>
          <button class="btn--signout" @click="handleSignOut">
            <i class="ph-thin ph-sign-out"></i>
            Sign out
          </button>
        </template>
        <template v-else-if="isAnonymous">
          <p class="sidebar__anon-hint">Your data is temporary.</p>
          <button class="btn btn--gold btn--sm" @click="openAuth('signup')">Create account</button>
        </template>
        <template v-else-if="!loading">
          <button class="btn btn--gold btn--sm" @click="openAuth('signin')">Sign in</button>
        </template>
      </div>
    </aside>

    <!-- Mobile top bar -->
    <header class="topbar">
      <button class="topbar__menu" @click="navOpen = !navOpen" aria-label="Toggle menu">
        <i class="ph-thin ph-list"></i>
      </button>
      <h1 class="topbar__title">Ink & Tasks</h1>
      <button
        v-if="!isSignedIn && !loading"
        class="btn--header-signin"
        @click="openAuth('signin')"
      >Sign in</button>
      <button
        v-else-if="isSignedIn"
        class="btn--signout btn--signout-sm"
        @click="handleSignOut"
        aria-label="Sign out"
      >
        <i class="ph-thin ph-sign-out" aria-hidden="true"></i>
      </button>
    </header>

    <!-- Main content -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>

    <!-- Overlays -->
    <AuthModal v-model="showAuth" :initialTab="authTab" />
    <ToastContainer />

    <!-- Mobile sidebar backdrop -->
    <Transition name="fade">
      <div v-if="navOpen" class="sidebar-backdrop" @click="navOpen = false"></div>
    </Transition>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-bg);
}

/* ─── Sidebar ─── */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  padding: 1.5rem 1rem;
  gap: 1.5rem;
  z-index: 100;
}
.sidebar__brand {
  padding: 0 0.25rem;
}
.sidebar__title {
  font-family: var(--font-display);
  font-size: 1.15rem;
  color: var(--color-gold);
  margin: 0;
  line-height: 1.3;
}
.sidebar__subtitle {
  font-family: var(--font-heading);
  font-size: 0.8rem;
  color: var(--color-muted);
  margin: 0.15rem 0 0;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  color: var(--color-muted);
  text-decoration: none;
  font-size: 0.88rem;
  transition: all 0.15s;
}
.nav-link i { font-size: 1.15rem; }
.nav-link:hover {
  background: var(--color-surface-2);
  color: var(--color-cream);
}
.nav-link.active {
  background: var(--color-gold-glow);
  color: var(--color-gold);
}

.sidebar__footer {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.5rem 0.25rem 0;
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
}
.sidebar__user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-cream);
  font-size: 0.8rem;
  min-width: 0;
}
.sidebar__user i { font-size: 1.1rem; color: var(--color-muted); }
.sidebar__email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sidebar__anon-hint {
  font-size: 0.78rem;
  color: var(--color-muted);
  margin: 0;
}

.btn--signout {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: var(--color-surface-2);
  border: 1px solid var(--color-muted);
  border-radius: 20px;
  color: var(--color-cream);
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.35rem 0.9rem;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
  white-space: nowrap;
  width: fit-content;
}
.btn--signout:hover {
  color: var(--color-danger-text);
  border-color: var(--color-danger-text);
  background: var(--color-danger-text-dim);
}

/* ─── Mobile top bar ─── */
.topbar {
  display: none;
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 0.6rem 1rem;
  align-items: center;
  gap: 0.75rem;
}
.topbar__menu {
  background: none;
  border: none;
  color: var(--color-cream);
  font-size: 1.4rem;
  cursor: pointer;
  padding: 0.2rem;
}
.topbar__title {
  flex: 1;
  font-family: var(--font-display);
  font-size: 0.95rem;
  color: var(--color-gold);
  margin: 0;
}
.btn--header-signin {
  background: var(--color-surface-2);
  border: 1px solid var(--color-gold-dim);
  border-radius: 20px;
  color: var(--color-gold);
  font-family: var(--font-body);
  font-size: 0.78rem;
  padding: 0.3rem 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn--header-signin:hover {
  background: var(--color-gold-glow);
  border-color: var(--color-gold);
}
.btn--signout-sm {
  padding: 0.3rem 0.6rem;
  font-size: 0.9rem;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 90;
}

/* ─── Main ─── */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1.5rem;
  overflow: hidden;
  min-width: 0;
}

/* ─── Transitions ─── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }
  .sidebar--open {
    transform: translateX(0);
  }
  .topbar {
    display: flex;
  }
  .main-content {
    padding: 1rem;
  }
}
</style>
