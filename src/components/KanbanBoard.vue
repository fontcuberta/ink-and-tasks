<script setup>
import { ref, computed, reactive, watch } from 'vue';
import draggable from 'vuedraggable';
import { useProjects } from '../composables/useProjects.js';
import { useToast } from '../composables/useToast.js';
import { useGamification } from '../composables/useGamification.js';
import { useStreak } from '../composables/useStreak.js';
import { supabase } from '../supabase.js';
import ProjectModal from './ProjectModal.vue';
import QuickAdd from './QuickAdd.vue';
import ProgressRing from './ProgressRing.vue';

const { COLUMNS, projects, byColumn, moveToColumn, load } = useProjects();
const { show: toast } = useToast();
const { celebrate, playWhoosh, playSuccess } = useGamification();
const { count: streakCount, recordProgress } = useStreak();

const selectedProject = ref(null);
const showQuickAdd = ref(false);
const liveMessage = ref('');

const columnLabels = {
  inbox: 'Inbox',
  deposit: 'Awaiting Deposit',
  drawing: 'Drawing',
  ready: 'Ready to Tattoo',
  done: 'Done & Healing',
};

const columnIcons = {
  inbox: 'ph-thin ph-tray',
  deposit: 'ph-thin ph-currency-dollar',
  drawing: 'ph-thin ph-pencil-line',
  ready: 'ph-thin ph-check-circle',
  done: 'ph-thin ph-heart',
};

const columnLists = reactive(
  Object.fromEntries(COLUMNS.map(col => [col, []]))
);

watch(() => projects.value, () => {
  for (const col of COLUMNS) {
    columnLists[col].splice(0, columnLists[col].length, ...byColumn(col));
  }
}, { immediate: true });

const totalProjects = computed(() => projects.value.length);
const doneCount = computed(() => columnLists.done?.length ?? 0);

async function getSignedUrl(path) {
  if (!path) return '';
  const { data, error } = await supabase.storage.from('reference-images').createSignedUrl(path, 3600);
  if (error) return '';
  return data?.signedUrl ?? '';
}

const imageUrlCache = ref({});

async function ensureImageUrl(path) {
  if (!path || imageUrlCache.value[path]) return;
  imageUrlCache.value[path] = await getSignedUrl(path);
}

function getImageUrl(path) {
  if (!path) return '';
  ensureImageUrl(path);
  return imageUrlCache.value[path] ?? '';
}

function primaryImage(project) {
  const img = project.project_images?.find(i => i.is_primary)
    || project.project_images?.[0];
  return img ? getImageUrl(img.storage_path) : null;
}

function timeSince(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

function oldestInColumn(col) {
  const items = columnLists[col];
  if (!items || items.length < 2) return null;
  return items.reduce((oldest, p) =>
    new Date(p.created_at) < new Date(oldest.created_at) ? p : oldest
  ).id;
}

async function onColumnChange(col, evt) {
  if (!evt.added) return;
  const item = evt.added.element;
  const newIndex = evt.added.newIndex;

  playWhoosh();

  const { error } = await moveToColumn(item.id, col, newIndex);
  if (error) {
    toast('Move failed', { message: error.message, type: 'error' });
    await load();
    return;
  }

  if (col === 'done') {
    celebrate();
    playSuccess();
    recordProgress();
  }

  liveMessage.value = `${item.client_name} moved to ${columnLabels[col]}`;
}

function nextColumn(col) {
  const idx = COLUMNS.indexOf(col);
  return idx < COLUMNS.length - 1 ? COLUMNS[idx + 1] : null;
}

function prevColumn(col) {
  const idx = COLUMNS.indexOf(col);
  return idx > 0 ? COLUMNS[idx - 1] : null;
}

async function moveCardKeyboard(element, col, direction) {
  const target = direction === 'right' ? nextColumn(col) : prevColumn(col);
  if (!target) return;
  playWhoosh();
  const { error } = await moveToColumn(element.id, target, 0);
  if (error) {
    toast('Move failed', { message: error.message, type: 'error' });
    return;
  }
  if (target === 'done') {
    celebrate();
    playSuccess();
    recordProgress();
  }

  liveMessage.value = `${element.client_name} moved to ${columnLabels[target]}`;
}

function openProject(project) {
  selectedProject.value = project;
}

function closeProject() {
  selectedProject.value = null;
  load();
}
</script>

<template>
  <div class="kanban-wrapper">
    <!-- Streak bar -->
    <div v-if="streakCount > 0" class="streak-bar">
      <i class="ph-thin ph-fire"></i>
      <span><strong>{{ streakCount }}</strong> day{{ streakCount !== 1 ? 's' : '' }} streak</span>
    </div>

    <div aria-live="polite" aria-atomic="true" class="sr-only">{{ liveMessage }}</div>

    <div class="kanban">
      <div v-for="col in COLUMNS" :key="col" class="kanban-column" role="group" :aria-label="columnLabels[col] + ' — ' + columnLists[col].length + ' projects'">
        <div class="kanban-column__header">
          <i :class="columnIcons[col]" aria-hidden="true"></i>
          <span class="kanban-column__title">{{ columnLabels[col] }}</span>
          <ProgressRing
            v-if="totalProjects > 0"
            :value="columnLists[col].length"
            :total="totalProjects"
            :size="24"
            :stroke-width="2.5"
            :color="col === 'done' ? 'var(--color-success-text)' : 'var(--color-gold)'"
          />
          <span class="kanban-column__count">{{ columnLists[col].length }}</span>
        </div>
        <draggable
          class="kanban-column__body"
          :list="columnLists[col]"
          group="kanban"
          item-key="id"
          :animation="200"
          ghost-class="kanban-card--ghost"
          drag-class="kanban-card--dragging"
          @change="(e) => onColumnChange(col, e)"
        >
          <template #item="{ element }">
            <div
              :class="['kanban-card', { 'kanban-card--next': col !== 'done' && oldestInColumn(col) === element.id, 'kanban-card--done': col === 'done' }]"
              tabindex="0"
              role="button"
              :aria-label="`${element.client_name}${element.style ? ', ' + element.style : ''}. Press Enter to open, Arrow Left or Right to move between columns.`"
              aria-roledescription="draggable project card"
              @click="openProject(element)"
              @keydown.enter.prevent="openProject(element)"
              @keydown.space.prevent="openProject(element)"
              @keydown.right.prevent="moveCardKeyboard(element, col, 'right')"
              @keydown.left.prevent="moveCardKeyboard(element, col, 'left')"
            >
              <div v-if="primaryImage(element)" class="kanban-card__thumb">
                <img :src="primaryImage(element)" alt="" loading="lazy" />
              </div>
              <div class="kanban-card__body">
                <div class="kanban-card__name">{{ element.client_name }}</div>
                <div class="kanban-card__row">
                  <span v-if="element.style" class="kanban-card__badge" :class="'badge--' + element.style">
                    {{ element.style }}
                  </span>
                  <span v-if="element.size" class="kanban-card__size">{{ element.size }}</span>
                  <span v-if="col !== 'done' && timeSince(element.created_at)" class="kanban-card__age">{{ timeSince(element.created_at) }}</span>
                </div>
              </div>
            </div>
          </template>
        </draggable>
        <div v-if="columnLists[col].length === 0" class="kanban-column__empty">
          No projects yet — drag one here or use Quick Add
        </div>
      </div>
    </div>

    <!-- Quick add FAB -->
    <button class="fab" @click="showQuickAdd = true" aria-label="Add project">
      <i class="ph-thin ph-plus" aria-hidden="true"></i>
    </button>

    <!-- Modals -->
    <QuickAdd v-model="showQuickAdd" @created="load" />
    <ProjectModal :project="selectedProject" @close="closeProject" />
  </div>
</template>

<style scoped>
.kanban-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* Streak */
.streak-bar {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0;
  font-size: 0.8rem;
  color: var(--color-gold);
}
.streak-bar i { font-size: 1.1rem; }
.streak-bar strong { font-weight: 600; }

.kanban {
  display: flex;
  gap: 0.75rem;
  flex: 1;
  overflow-x: auto;
  padding: 0.25rem 0 1rem;
}

.kanban-column {
  min-width: 230px;
  width: 230px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  max-height: calc(100vh - 120px);
}
@media (min-width: 1200px) {
  .kanban-column {
    flex: 1;
    min-width: 0;
    width: auto;
  }
}

.kanban-column__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid var(--color-border);
  font-family: var(--font-heading);
  font-size: 0.95rem;
  color: var(--color-cream);
  flex-shrink: 0;
}
.kanban-column__count {
  margin-left: auto;
  font-family: var(--font-body);
  font-size: 0.75rem;
  background: var(--color-surface-2);
  color: var(--color-muted);
  padding: 0.1rem 0.5rem;
  border-radius: 10px;
}
.kanban-column__body {
  flex: 1;
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  min-height: 60px;
}
.kanban-column__empty {
  text-align: center;
  padding: 1.5rem 0.5rem;
  font-size: 0.8rem;
  color: var(--color-muted);
  opacity: 0.5;
}

/* Cards */
.kanban-card {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  cursor: grab;
  transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s;
}
.kanban-card:hover {
  border-color: var(--color-gold-dim);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
}
.kanban-card--ghost {
  opacity: 0.4;
  border-color: var(--color-gold);
}
.kanban-card--dragging {
  transform: rotate(2deg);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}

/* Next-action pulsing glow — the longest-waiting card */
.kanban-card--next {
  border-color: var(--color-gold-dim);
  animation: pulse-glow 2.5s ease-in-out infinite;
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0); }
  50% { box-shadow: 0 0 12px 2px rgba(201,168,76,0.18); }
}
@media (prefers-reduced-motion: reduce) {
  .kanban-card--next { animation: none; }
}

.kanban-card__thumb {
  height: 90px;
  overflow: hidden;
}
.kanban-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.kanban-card__body {
  padding: 0.55rem 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.kanban-card__name {
  font-family: var(--font-heading);
  font-size: 0.95rem;
  color: var(--color-cream);
  line-height: 1.3;
}
.kanban-card__row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.kanban-card__badge {
  display: inline-block;
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  text-transform: capitalize;
  background: var(--color-gold-badge-bg);
  color: var(--color-gold);
  border: 1px solid var(--color-gold-badge-border);
}
.badge--traditional { color: var(--color-danger-text); background: var(--color-danger-dim); border-color: var(--color-danger-badge-border); }
.badge--fineline { color: var(--color-cream); background: var(--color-surface-3); border-color: var(--color-border); }
.badge--realism { color: var(--color-success-text); background: var(--color-success-badge-bg); border-color: var(--color-success-badge-border); }
.badge--blackwork { color: var(--color-cream); background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.15); }
.badge--watercolor { color: var(--color-blue); background: var(--color-blue-dim); border-color: var(--color-blue-badge-border); }
.badge--japanese { color: var(--color-danger-text); background: var(--color-danger-dim); border-color: var(--color-danger-badge-border); }
.badge--dotwork { color: var(--color-muted); background: var(--color-surface-3); border-color: var(--color-border); }
.badge--geometric { color: var(--color-gold); background: var(--color-gold-badge-bg); border-color: var(--color-gold-badge-border); }

.kanban-card__size {
  font-size: 0.7rem;
  color: var(--color-muted);
}
.kanban-card__age {
  font-size: 0.65rem;
  color: var(--color-muted);
  margin-left: auto;
  opacity: 0.7;
}

/* Done column cards: visually de-emphasised */
.kanban-card--done {
  opacity: 0.55;
  border-color: var(--color-border);
}
.kanban-card--done:hover {
  opacity: 0.8;
}

/* FAB */
.fab {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--color-gold);
  color: var(--color-bg);
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(201,168,76,0.35);
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 50;
}
.fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(201,168,76,0.45);
}
</style>
