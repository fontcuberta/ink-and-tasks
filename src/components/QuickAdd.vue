<script setup>
import { ref, computed, nextTick, watch } from 'vue';
import { useProjects } from '../composables/useProjects.js';
import { useToast } from '../composables/useToast.js';
import { useAuth } from '../composables/useAuth.js';
import { supabase } from '../supabase.js';
import { trapFocus } from '../utils/trapFocus.js';

const props = defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue', 'created']);

const { create } = useProjects();
const { show: toast } = useToast();
const { user } = useAuth();

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
});

const clientName = ref('');
const style = ref('');
const file = ref(null);
const submitting = ref(false);
const nameInput = ref(null);

watch(visible, v => {
  if (v) nextTick(() => nameInput.value?.focus());
});

function close() {
  visible.value = false;
  clientName.value = '';
  style.value = '';
  file.value = null;
}

function onFileChange(e) {
  file.value = e.target.files?.[0] ?? null;
}

async function submit() {
  if (!clientName.value.trim() || submitting.value) return;
  submitting.value = true;

  try {
    const { data, error } = await create({
      client_name: clientName.value.trim(),
      style: style.value || null,
    });

    if (error) {
      toast('Could not create project', { message: error.message, type: 'error' });
      return;
    }

    if (file.value && data) {
      const path = `${user.value.id}/${data.id}/${Date.now()}-${file.value.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('reference-images')
        .upload(path, file.value);

      if (!uploadErr) {
        await supabase.from('project_images').insert({
          project_id: data.id,
          storage_path: path,
          is_primary: true,
        });
      }
    }

    toast('Project created', { type: 'success' });
    emit('created');
    close();
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="quick-overlay"
        @mousedown.self="close"
        @keydown.esc="close"
        @keydown="trapFocus"
      >
        <div class="quick-modal" role="dialog" aria-modal="true" aria-label="Quick add project">
          <h3 class="quick-modal__title">New Project</h3>

          <form class="quick-form" @submit.prevent="submit">
            <div class="form-group">
              <label class="form-label" for="qa-name">Client name</label>
              <input
                ref="nameInput"
                id="qa-name"
                v-model="clientName"
                type="text"
                class="input"
                placeholder="e.g. Sarah M."
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="qa-style">Style</label>
              <select id="qa-style" v-model="style" class="input input--select">
                <option value="">— choose —</option>
                <option value="traditional">Traditional</option>
                <option value="fineline">Fineline</option>
                <option value="realism">Realism</option>
                <option value="watercolor">Watercolor</option>
                <option value="japanese">Japanese</option>
                <option value="blackwork">Blackwork</option>
                <option value="dotwork">Dotwork</option>
                <option value="geometric">Geometric</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Reference photo</label>
              <label class="file-drop">
                <input type="file" accept="image/*" class="file-drop__input" @change="onFileChange" />
                <i class="ph-thin ph-image"></i>
                <span v-if="file">{{ file.name }}</span>
                <span v-else>Drop or click to add</span>
              </label>
            </div>

            <div class="quick-form__actions">
              <button type="button" class="btn btn--ghost" @click="close">Cancel</button>
              <button type="submit" class="btn btn--gold" :disabled="submitting || !clientName.trim()">
                {{ submitting ? 'Creating...' : 'Add to Inbox' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.quick-overlay {
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
.quick-modal {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: 380px;
}
.quick-modal__title {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  color: var(--color-cream);
  margin-bottom: 1.25rem;
}
.quick-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.quick-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/* File drop zone */
.file-drop {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface-2);
  color: var(--color-muted);
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color 0.2s;
}
.file-drop:hover {
  border-color: var(--color-gold-dim);
}
.file-drop i {
  font-size: 1.2rem;
}
.file-drop__input {
  display: none;
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .quick-modal, .modal-leave-active .quick-modal { transition: transform 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .quick-modal { transform: scale(0.95) translateY(8px); }
.modal-leave-to .quick-modal { transform: scale(0.95) translateY(8px); }
</style>
