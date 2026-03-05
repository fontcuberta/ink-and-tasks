<script setup>
import { ref, computed, watch } from 'vue';
import { useProjects } from '../composables/useProjects.js';
import { useCalendar } from '../composables/useCalendar.js';
import { useToast } from '../composables/useToast.js';
import { useAuth } from '../composables/useAuth.js';
import { supabase } from '../supabase.js';
import { trapFocus } from '../utils/trapFocus.js';
import EventModal from './EventModal.vue';

const props = defineProps({ project: Object });
const emit = defineEmits(['close']);

const { update, remove } = useProjects();
const { loadForProject } = useCalendar();
const { show: toast } = useToast();
const { user } = useAuth();

const visible = computed(() => !!props.project);

const form = ref({});
const saving = ref(false);
const deleting = ref(false);
const imageUploading = ref(false);
const projectEvents = ref([]);
const showSchedule = ref(false);

watch(() => props.project, async (p) => {
  if (!p) return;
  form.value = {
    client_name: p.client_name ?? '',
    client_email: p.client_email ?? '',
    client_phone: p.client_phone ?? '',
    description: p.description ?? '',
    placement: p.placement ?? '',
    size: p.size ?? '',
    style: p.style ?? '',
    budget: p.budget ?? '',
    notes: p.notes ?? '',
    status: p.status ?? 'inbox',
  };
  const { data } = await loadForProject(p.id);
  projectEvents.value = data;
}, { immediate: true });

function formatEventDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

async function refreshProjectEvents() {
  if (!props.project) return;
  const { data } = await loadForProject(props.project.id);
  projectEvents.value = data;
}

const images = computed(() => props.project?.project_images ?? []);

const imageUrls = ref({});

async function resolveImageUrl(path) {
  if (!path || imageUrls.value[path]) return;
  const { data } = await supabase.storage.from('reference-images').createSignedUrl(path, 3600);
  if (data?.signedUrl) imageUrls.value[path] = data.signedUrl;
}

function getImageUrl(path) {
  if (!path) return '';
  resolveImageUrl(path);
  return imageUrls.value[path] ?? '';
}

async function save() {
  saving.value = true;
  const changes = { ...form.value };
  if (changes.budget) changes.budget = parseFloat(changes.budget);
  else delete changes.budget;

  const { error } = await update(props.project.id, changes);
  if (error) toast('Save failed', { message: error.message, type: 'error' });
  else toast('Saved', { type: 'success' });
  saving.value = false;
}

async function handleDelete() {
  if (!confirm('Delete this project and all its data?')) return;
  deleting.value = true;
  const { error } = await remove(props.project.id);
  if (error) toast('Delete failed', { message: error.message, type: 'error' });
  else toast('Project deleted', { type: 'info' });
  deleting.value = false;
  emit('close');
}

async function uploadImage(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  imageUploading.value = true;

  const path = `${user.value.id}/${props.project.id}/${Date.now()}-${file.name}`;
  const { error: uploadErr } = await supabase.storage
    .from('reference-images')
    .upload(path, file);

  if (uploadErr) {
    toast('Upload failed', { message: uploadErr.message, type: 'error' });
    imageUploading.value = false;
    return;
  }

  const isPrimary = images.value.length === 0;
  const { error: insertErr } = await supabase.from('project_images').insert({
    project_id: props.project.id,
    storage_path: path,
    is_primary: isPrimary,
  });

  if (insertErr) {
    toast('Image uploaded but record failed', { message: insertErr.message, type: 'error' });
    imageUploading.value = false;
    return;
  }

  toast('Image uploaded', { type: 'success' });
  imageUploading.value = false;
  emit('close');
}

async function deleteImage(img) {
  const { error: storageErr } = await supabase.storage.from('reference-images').remove([img.storage_path]);
  if (storageErr) {
    toast('Could not remove file', { message: storageErr.message, type: 'error' });
    return;
  }
  const { error: dbErr } = await supabase.from('project_images').delete().eq('id', img.id);
  if (dbErr) {
    toast('Could not remove image record', { message: dbErr.message, type: 'error' });
    return;
  }
  toast('Image removed', { type: 'info' });
  emit('close');
}

async function setPrimary(img) {
  const { error: clearErr } = await supabase.from('project_images')
    .update({ is_primary: false })
    .eq('project_id', props.project.id);
  if (clearErr) {
    toast('Could not update images', { message: clearErr.message, type: 'error' });
    return;
  }
  const { error: setErr } = await supabase.from('project_images')
    .update({ is_primary: true })
    .eq('id', img.id);
  if (setErr) {
    toast('Could not set primary', { message: setErr.message, type: 'error' });
    return;
  }
  toast('Primary image updated', { type: 'success' });
  emit('close');
}

const statusOptions = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'deposit', label: 'Awaiting Deposit' },
  { value: 'drawing', label: 'Drawing' },
  { value: 'ready', label: 'Ready to Tattoo' },
  { value: 'done', label: 'Done & Healing' },
];

const styleOptions = [
  'traditional', 'fineline', 'realism', 'watercolor',
  'japanese', 'blackwork', 'dotwork', 'geometric', 'other',
];
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="project-overlay"
        @mousedown.self="$emit('close')"
        @keydown.esc="$emit('close')"
        @keydown="trapFocus"
      >
        <div class="project-modal" role="dialog" aria-modal="true" aria-label="Project details">
          <div class="project-modal__header">
            <h2 class="project-modal__title">{{ form.client_name || 'Project' }}</h2>
            <button class="project-modal__close" @click="$emit('close')" aria-label="Close">
              <i class="ph-thin ph-x"></i>
            </button>
          </div>

          <div class="project-modal__scroll">
            <!-- Images -->
            <section class="pm-section">
              <h3 class="pm-section__title">
                <i class="ph-thin ph-images"></i> Reference Images
              </h3>
              <div class="pm-images">
                <div v-for="img in images" :key="img.id" class="pm-image">
                  <img :src="getImageUrl(img.storage_path)" alt="Reference" loading="lazy" />
                  <div class="pm-image__actions">
                    <button
                      v-if="!img.is_primary"
                      class="pm-image__btn"
                      @click="setPrimary(img)"
                      aria-label="Set as primary image"
                    ><i class="ph-thin ph-star"></i></button>
                    <button
                      class="pm-image__btn pm-image__btn--danger"
                      @click="deleteImage(img)"
                      aria-label="Delete image"
                    ><i class="ph-thin ph-trash"></i></button>
                  </div>
                  <span v-if="img.is_primary" class="pm-image__primary">Primary</span>
                </div>
                <label class="pm-image-add">
                  <input type="file" accept="image/*" class="pm-image-add__input" @change="uploadImage" />
                  <i class="ph-thin ph-plus"></i>
                  <span>{{ imageUploading ? 'Uploading...' : 'Add photo' }}</span>
                </label>
              </div>
            </section>

            <!-- Client details -->
            <section class="pm-section">
              <h3 class="pm-section__title">
                <i class="ph-thin ph-user"></i> Client Details
              </h3>
              <div class="pm-grid">
                <div class="form-group">
                  <label class="form-label" for="pm-name">Name</label>
                  <input id="pm-name" v-model="form.client_name" class="input" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="pm-email">Email</label>
                  <input id="pm-email" v-model="form.client_email" type="email" class="input" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="pm-phone">Phone</label>
                  <input id="pm-phone" v-model="form.client_phone" type="tel" class="input" />
                </div>
              </div>
            </section>

            <!-- Tattoo info -->
            <section class="pm-section">
              <h3 class="pm-section__title">
                <i class="ph-thin ph-paint-brush"></i> Tattoo Details
              </h3>
              <div class="pm-grid">
                <div class="form-group">
                  <label class="form-label" for="pm-style">Style</label>
                  <select id="pm-style" v-model="form.style" class="input input--select">
                    <option value="">—</option>
                    <option v-for="s in styleOptions" :key="s" :value="s">{{ s }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="pm-placement">Placement</label>
                  <input id="pm-placement" v-model="form.placement" class="input" placeholder="e.g. forearm" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="pm-size">Size</label>
                  <input id="pm-size" v-model="form.size" class="input" placeholder="e.g. 4×6 inches" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="pm-budget">Budget</label>
                  <input id="pm-budget" v-model="form.budget" type="number" class="input" />
                </div>
              </div>
              <div class="form-group" style="margin-top: 0.75rem">
                <label class="form-label" for="pm-desc">Description</label>
                <textarea id="pm-desc" v-model="form.description" class="input input--textarea" rows="3" placeholder="Design concept, reference notes..."></textarea>
              </div>
            </section>

            <!-- Status & notes -->
            <section class="pm-section">
              <h3 class="pm-section__title">
                <i class="ph-thin ph-kanban"></i> Status
              </h3>
              <div class="pm-grid">
                <div class="form-group">
                  <label class="form-label" for="pm-status">Column</label>
                  <select id="pm-status" v-model="form.status" class="input input--select">
                    <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </div>
              </div>
              <div class="form-group" style="margin-top: 0.75rem">
                <label class="form-label" for="pm-notes">Notes</label>
                <textarea id="pm-notes" v-model="form.notes" class="input input--textarea" rows="3"></textarea>
              </div>
            </section>

            <!-- Scheduled events -->
            <section class="pm-section">
              <div class="pm-section__title">
                <i class="ph-thin ph-calendar-blank"></i> Scheduled
                <button
                  type="button"
                  class="pm-schedule-btn"
                  @click="showSchedule = true"
                  aria-label="Schedule new appointment"
                >
                  <i class="ph-thin ph-plus" aria-hidden="true"></i> Add
                </button>
              </div>
              <div v-if="projectEvents.length === 0" class="pm-events-empty">
                No upcoming appointments
              </div>
              <ul v-else class="pm-events">
                <li v-for="ev in projectEvents" :key="ev.id" class="pm-event">
                  <span class="pm-event__dot" :style="{ background: ev.color || '#c9a84c' }"></span>
                  <span class="pm-event__title">{{ ev.title }}</span>
                  <span class="pm-event__date">{{ formatEventDate(ev.start_time) }}</span>
                </li>
              </ul>
            </section>
          </div>

          <div class="project-modal__footer">
            <button class="btn btn--ghost btn--danger" @click="handleDelete" :disabled="deleting">
              <i class="ph-thin ph-trash"></i>
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
            <button class="btn btn--gold" @click="save" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save changes' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <EventModal
    v-model="showSchedule"
    :initialProject="project?.id"
    @saved="refreshProjectEvents"
  />
</template>

<style scoped>
.project-overlay {
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
.project-modal {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.project-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
.project-modal__title {
  font-family: var(--font-heading);
  font-size: 1.3rem;
  color: var(--color-cream);
}
.project-modal__close {
  background: none;
  border: none;
  color: var(--color-muted);
  font-size: 1.3rem;
  cursor: pointer;
  padding: 0.3rem;
  transition: color 0.2s;
}
.project-modal__close:hover { color: var(--color-cream); }

.project-modal__scroll {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
}

.project-modal__footer {
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

/* Sections */
.pm-section {
  margin-bottom: 1.5rem;
}
.pm-section__title {
  font-family: var(--font-heading);
  font-size: 1rem;
  color: var(--color-cream);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
}
.pm-section__title i {
  color: var(--color-gold);
  font-size: 1.1rem;
}
.pm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.85rem;
}

/* Images */
.pm-images {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.pm-image {
  position: relative;
  width: 100px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}
.pm-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.pm-image__actions {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}
.pm-image:hover .pm-image__actions,
.pm-image:focus-within .pm-image__actions { opacity: 1; }
.pm-image__btn {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: none;
  background: rgba(0,0,0,0.7);
  color: var(--color-cream);
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pm-image__btn--danger:hover { color: var(--color-danger-text); }
.pm-image__primary {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 0.6rem;
  padding: 1px 0;
  background: rgba(201,168,76,0.85);
  color: var(--color-bg);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.pm-image-add {
  width: 100px;
  height: 80px;
  border: 1px dashed var(--color-border);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  font-size: 0.7rem;
  color: var(--color-muted);
  cursor: pointer;
  transition: border-color 0.2s;
}
.pm-image-add:hover { border-color: var(--color-gold-dim); }
.pm-image-add i { font-size: 1.2rem; }
.pm-image-add__input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Scheduled events */
.pm-schedule-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-gold);
  font-family: var(--font-body);
  font-size: 0.72rem;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.pm-schedule-btn:hover {
  border-color: var(--color-gold-dim);
  background: var(--color-surface-2);
}
.pm-events-empty {
  font-size: 0.8rem;
  color: var(--color-muted);
  opacity: 0.6;
}
.pm-events {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.pm-event {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: var(--color-cream);
  padding: 0.35rem 0.5rem;
  background: var(--color-surface-2);
  border-radius: 6px;
}
.pm-event__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.pm-event__title {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pm-event__date {
  font-size: 0.72rem;
  color: var(--color-muted);
  flex-shrink: 0;
}

/* Transition */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .project-modal, .modal-leave-active .project-modal { transition: transform 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .project-modal { transform: translateY(12px); }
.modal-leave-to .project-modal { transform: translateY(12px); }
</style>
