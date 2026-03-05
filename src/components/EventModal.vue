<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useCalendar } from '../composables/useCalendar.js';
import { useProjects } from '../composables/useProjects.js';
import { useToast } from '../composables/useToast.js';
import { trapFocus } from '../utils/trapFocus.js';

const props = defineProps({
  modelValue: Boolean,
  initialDate: String,
  editEvent: Object,
});
const emit = defineEmits(['update:modelValue', 'saved']);

const { create, update, remove } = useCalendar();
const { projects } = useProjects();
const { show: toast } = useToast();

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
});

const isEdit = computed(() => !!props.editEvent);

const form = ref(defaultForm());
const submitting = ref(false);
const titleInput = ref(null);

function defaultForm() {
  const now = new Date();
  const start = props.initialDate ?? now.toISOString().slice(0, 16);
  const end = new Date(new Date(start).getTime() + 3600000).toISOString().slice(0, 16);
  return {
    title: '',
    event_type: 'tattoo_session',
    project_id: '',
    start_time: start,
    end_time: end,
    notes: '',
  };
}

watch(visible, v => {
  if (v) {
    if (props.editEvent) {
      const e = props.editEvent;
      form.value = {
        title: e.title,
        event_type: e.event_type,
        project_id: e.project_id ?? '',
        start_time: e.start_time?.slice(0, 16) ?? '',
        end_time: e.end_time?.slice(0, 16) ?? '',
        notes: e.notes ?? '',
      };
    } else {
      form.value = defaultForm();
    }
    nextTick(() => titleInput.value?.focus());
  }
});

function close() {
  visible.value = false;
}

const eventTypeColors = {
  tattoo_session: '#c9a84c',
  drawing_block: '#5b8fb9',
  personal: '#8a7d6b',
};

async function submit() {
  if (!form.value.title.trim() || submitting.value) return;
  submitting.value = true;

  const payload = {
    title: form.value.title.trim(),
    event_type: form.value.event_type,
    project_id: form.value.project_id || null,
    start_time: new Date(form.value.start_time).toISOString(),
    end_time: new Date(form.value.end_time).toISOString(),
    color: eventTypeColors[form.value.event_type],
    notes: form.value.notes || null,
  };

  let result;
  if (isEdit.value) {
    result = await update(props.editEvent.id, payload);
  } else {
    result = await create(payload);
  }

  if (result.error) {
    toast('Could not save event', { message: result.error.message, type: 'error' });
  } else {
    toast(isEdit.value ? 'Event updated' : 'Event created', { type: 'success' });
    emit('saved');
    close();
  }
  submitting.value = false;
}

async function handleDelete() {
  if (!confirm('Delete this event?')) return;
  submitting.value = true;
  const { error } = await remove(props.editEvent.id);
  if (error) toast('Delete failed', { type: 'error' });
  else {
    toast('Event deleted', { type: 'info' });
    emit('saved');
    close();
  }
  submitting.value = false;
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="event-overlay"
        @mousedown.self="close"
        @keydown.esc="close"
        @keydown="trapFocus"
      >
        <div class="event-modal" role="dialog" aria-modal="true" aria-label="Calendar event">
          <h3 class="event-modal__title">{{ isEdit ? 'Edit Event' : 'New Event' }}</h3>

          <form class="event-form" @submit.prevent="submit">
            <div class="form-group">
              <label class="form-label" for="ev-title">Title</label>
              <input ref="titleInput" id="ev-title" v-model="form.title" class="input" required />
            </div>

            <div class="event-form__row">
              <div class="form-group">
                <label class="form-label" for="ev-type">Type</label>
                <select id="ev-type" v-model="form.event_type" class="input input--select">
                  <option value="tattoo_session">Tattoo Session</option>
                  <option value="drawing_block">Drawing Block</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="ev-project">Project</label>
                <select id="ev-project" v-model="form.project_id" class="input input--select">
                  <option value="">— none —</option>
                  <option v-for="p in projects" :key="p.id" :value="p.id">
                    {{ p.client_name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="event-form__row">
              <div class="form-group">
                <label class="form-label" for="ev-start">Start</label>
                <input id="ev-start" v-model="form.start_time" type="datetime-local" class="input" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="ev-end">End</label>
                <input id="ev-end" v-model="form.end_time" type="datetime-local" class="input" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="ev-notes">Notes</label>
              <textarea id="ev-notes" v-model="form.notes" class="input input--textarea" rows="2"></textarea>
            </div>

            <div class="event-form__actions">
              <button
                v-if="isEdit"
                type="button"
                class="btn btn--ghost btn--danger"
                @click="handleDelete"
                :disabled="submitting"
              >
                <i class="ph-thin ph-trash"></i> Delete
              </button>
              <span v-else></span>
              <div class="event-form__right">
                <button type="button" class="btn btn--ghost" @click="close">Cancel</button>
                <button type="submit" class="btn btn--gold" :disabled="submitting">
                  {{ submitting ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.event-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.event-modal {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: 460px;
}
.event-modal__title {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  color: var(--color-cream);
  margin-bottom: 1.25rem;
}
.event-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.event-form__row {
  display: flex;
  gap: 0.85rem;
}
.event-form__row .form-group { flex: 1; }
.event-form__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}
.event-form__right {
  display: flex;
  gap: 0.5rem;
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .event-modal, .modal-leave-active .event-modal { transition: transform 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .event-modal { transform: scale(0.95) translateY(8px); }
.modal-leave-to .event-modal { transform: scale(0.95) translateY(8px); }
</style>
