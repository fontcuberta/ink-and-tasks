<script setup>
import { ref, onMounted, computed } from 'vue';
import { useConsent } from '../composables/useConsent.js';
import { useProjects } from '../composables/useProjects.js';
import { useToast } from '../composables/useToast.js';
import { supabase } from '../supabase.js';
import { trapFocus } from '../utils/trapFocus.js';
import SignaturePadComponent from '../components/SignaturePad.vue';

const { forms, loading, load, create } = useConsent();
const { projects, load: loadProjects } = useProjects();
const { show: toast } = useToast();

const showForm = ref(false);
const submitting = ref(false);
const sigPad = ref(null);
const signatureData = ref('');

const ACKNOWLEDGEMENTS = [
  'I confirm I am at least 18 years of age.',
  'I am not under the influence of alcohol or drugs.',
  'I have disclosed all known allergies and medical conditions.',
  'I understand that tattoos are permanent and that removal is expensive and not guaranteed.',
  'I understand the aftercare instructions provided to me.',
  'I consent to the tattooing procedure and release the artist from liability for any adverse reactions.',
];

const form = ref(defaultForm());

function defaultForm() {
  return {
    project_id: '',
    client_name: '',
    client_dob: '',
    allergies: '',
    medical_conditions: '',
    skin_conditions: '',
    acknowledgements: ACKNOWLEDGEMENTS.map(text => ({ text, checked: false })),
  };
}

function resetForm() {
  form.value = defaultForm();
  signatureData.value = '';
  sigPad.value?.clear();
}

onMounted(async () => {
  const [cResult, pResult] = await Promise.all([load(), loadProjects()]);
  if (cResult?.error) toast('Could not load consent forms', { type: 'error' });
  if (pResult?.error) toast('Could not load projects', { type: 'error' });
});

function fillFromProject() {
  const p = projects.value.find(pr => pr.id === form.value.project_id);
  if (p?.client_name) form.value.client_name = p.client_name;
}

const allChecked = computed(() => form.value.acknowledgements.every(a => a.checked));

async function submit() {
  if (submitting.value || !form.value.client_name.trim() || !allChecked.value || !signatureData.value) return;
  submitting.value = true;

  const blob = await (await fetch(signatureData.value)).blob();

  const { error } = await create({
    project_id: form.value.project_id || null,
    client_name: form.value.client_name.trim(),
    client_dob: form.value.client_dob || null,
    allergies: form.value.allergies || null,
    medical_conditions: form.value.medical_conditions || null,
    skin_conditions: form.value.skin_conditions || null,
    acknowledgements: form.value.acknowledgements,
  }, blob);

  if (error) {
    toast('Could not save form', { message: error.message, type: 'error' });
  } else {
    toast('Consent form saved', { type: 'success' });
    resetForm();
    showForm.value = false;
  }
  submitting.value = false;
}

function getSignatureUrl(path) {
  if (!path) return '';
  const { data } = supabase.storage.from('signatures').getPublicUrl(path);
  return data?.publicUrl ?? '';
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const viewForm = ref(null);

function printForm(f) {
  viewForm.value = f;
}
</script>

<template>
  <div class="view-consent">
    <!-- Header -->
    <div class="consent-header">
      <div>
        <h2 class="consent-title">Consent Forms</h2>
        <p class="consent-subtitle">{{ forms.length }} form{{ forms.length !== 1 ? 's' : '' }} on file</p>
      </div>
      <button class="btn btn--gold" @click="showForm = !showForm">
        <i class="ph-thin ph-plus"></i>
        New Form
      </button>
    </div>

    <!-- New form -->
    <Transition name="slide">
      <div v-if="showForm" class="consent-form-wrap">
        <form class="consent-form" @submit.prevent="submit">
          <!-- Link to project -->
          <section class="cf-section">
            <h3 class="cf-section__title">
              <i class="ph-thin ph-link"></i> Link to Project
            </h3>
            <label class="form-label" for="cf-project">Project</label>
            <select id="cf-project" v-model="form.project_id" class="input input--select" @change="fillFromProject">
              <option value="">— none —</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.client_name }}</option>
            </select>
          </section>

          <!-- Client info -->
          <section class="cf-section">
            <h3 class="cf-section__title">
              <i class="ph-thin ph-user"></i> Client Information
            </h3>
            <div class="cf-grid">
              <div class="form-group">
                <label class="form-label" for="cf-name">Full Name</label>
                <input id="cf-name" v-model="form.client_name" class="input" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="cf-dob">Date of Birth</label>
                <input id="cf-dob" v-model="form.client_dob" type="date" class="input" />
              </div>
            </div>
          </section>

          <!-- Medical -->
          <section class="cf-section">
            <h3 class="cf-section__title">
              <i class="ph-thin ph-first-aid-kit"></i> Medical Information
            </h3>
            <div class="cf-grid">
              <div class="form-group">
                <label class="form-label" for="cf-allergies">Allergies</label>
                <textarea id="cf-allergies" v-model="form.allergies" class="input input--textarea" rows="2" placeholder="List any known allergies..."></textarea>
              </div>
              <div class="form-group">
                <label class="form-label" for="cf-medical">Medical Conditions</label>
                <textarea id="cf-medical" v-model="form.medical_conditions" class="input input--textarea" rows="2" placeholder="Diabetes, blood disorders, etc."></textarea>
              </div>
              <div class="form-group">
                <label class="form-label" for="cf-skin">Skin Conditions</label>
                <textarea id="cf-skin" v-model="form.skin_conditions" class="input input--textarea" rows="2" placeholder="Eczema, psoriasis, etc."></textarea>
              </div>
            </div>
          </section>

          <!-- Acknowledgements -->
          <section class="cf-section">
            <h3 class="cf-section__title">
              <i class="ph-thin ph-checks"></i> Acknowledgements
            </h3>
            <div class="cf-checks">
              <label
                v-for="(ack, i) in form.acknowledgements"
                :key="i"
                class="cf-check"
              >
                <input type="checkbox" v-model="ack.checked" class="cf-check__input" />
                <span class="cf-check__text">{{ ack.text }}</span>
              </label>
            </div>
          </section>

          <!-- Signature -->
          <section class="cf-section">
            <h3 class="cf-section__title">
              <i class="ph-thin ph-pen-nib"></i> Signature
            </h3>
            <p class="cf-hint">Sign in the box below with your finger or mouse.</p>
            <SignaturePadComponent ref="sigPad" v-model="signatureData" />
          </section>

          <div class="cf-actions">
            <button type="button" class="btn btn--ghost" @click="showForm = false; resetForm()">Cancel</button>
            <button
              type="submit"
              class="btn btn--gold"
              :disabled="submitting || !form.client_name.trim() || !allChecked || !signatureData"
            >
              {{ submitting ? 'Saving...' : 'Submit & Save' }}
            </button>
          </div>
        </form>
      </div>
    </Transition>

    <!-- Existing forms list -->
    <div v-if="loading" class="consent-loading">
      <i class="ph-thin ph-circle-notch spin"></i> Loading forms...
    </div>

    <div v-else-if="forms.length === 0 && !showForm" class="consent-empty">
      <i class="ph-thin ph-file-text consent-empty__icon"></i>
      <p class="consent-empty__title">No consent forms yet</p>
      <p class="consent-empty__text">Click "New Form" to get started.</p>
    </div>

    <div v-else class="consent-list">
      <div
        v-for="f in forms"
        :key="f.id"
        class="consent-card"
        tabindex="0"
        role="button"
        :aria-label="`View consent form for ${f.client_name}`"
        @click="printForm(f)"
        @keydown.enter.prevent="printForm(f)"
        @keydown.space.prevent="printForm(f)"
      >
        <div class="consent-card__icon">
          <i class="ph-thin ph-file-text"></i>
        </div>
        <div class="consent-card__body">
          <div class="consent-card__name">{{ f.client_name }}</div>
          <div class="consent-card__meta">
            Signed {{ formatDate(f.signed_at) }}
            <span v-if="f.projects?.client_name"> · {{ f.projects.client_name }}</span>
          </div>
        </div>
        <i class="ph-thin ph-caret-right consent-card__arrow"></i>
      </div>
    </div>

    <!-- View/Print overlay -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="viewForm"
          class="print-overlay"
          @mousedown.self="viewForm = null"
          @keydown.esc="viewForm = null"
          @keydown="trapFocus"
        >
          <div class="print-modal" role="dialog" aria-modal="true" aria-label="Consent record">
            <div class="print-modal__header">
              <h3 class="print-modal__title">Consent Record</h3>
              <button class="print-modal__close" @click="viewForm = null" aria-label="Close">
                <i class="ph-thin ph-x"></i>
              </button>
            </div>
            <div class="print-modal__body">
              <dl class="print-dl">
                <dt>Client</dt><dd>{{ viewForm.client_name }}</dd>
                <dt>DOB</dt><dd>{{ formatDate(viewForm.client_dob) }}</dd>
                <dt>Allergies</dt><dd>{{ viewForm.allergies || 'None reported' }}</dd>
                <dt>Medical</dt><dd>{{ viewForm.medical_conditions || 'None reported' }}</dd>
                <dt>Skin</dt><dd>{{ viewForm.skin_conditions || 'None reported' }}</dd>
                <dt>Signed</dt><dd>{{ formatDate(viewForm.signed_at) }}</dd>
              </dl>
              <h4 class="print-sub">Acknowledgements</h4>
              <ul class="print-acks">
                <li v-for="(ack, i) in (viewForm.acknowledgements || [])" :key="i">
                  <i :class="ack.checked ? 'ph-fill ph-check-square' : 'ph-thin ph-square'" :style="{color: ack.checked ? 'var(--color-success-text)' : 'var(--color-muted)'}"></i>
                  {{ ack.text }}
                </li>
              </ul>
              <div v-if="viewForm.signature_path" class="print-sig">
                <h4 class="print-sub">Signature</h4>
                <img :src="getSignatureUrl(viewForm.signature_path)" alt="Client signature" class="print-sig__img" />
              </div>
            </div>
            <div class="print-modal__footer">
              <button class="btn btn--ghost" @click="window.print()">
                <i class="ph-thin ph-printer"></i> Print
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.view-consent {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  overflow-y: auto;
}

/* Header */
.consent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.consent-title {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  color: var(--color-cream);
}
.consent-subtitle {
  font-size: 0.8rem;
  color: var(--color-muted);
  margin-top: 0.1rem;
}

/* Form */
.consent-form-wrap {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
}
.consent-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.cf-section__title {
  font-family: var(--font-heading);
  font-size: 1rem;
  color: var(--color-cream);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.cf-section__title i { color: var(--color-gold); font-size: 1.1rem; }
.cf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.85rem;
}
.cf-hint {
  font-size: 0.78rem;
  color: var(--color-muted);
  margin-bottom: 0.5rem;
}
.cf-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* Checkboxes */
.cf-checks {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.cf-check {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--color-cream);
  line-height: 1.5;
}
.cf-check__input {
  margin-top: 0.25rem;
  accent-color: var(--color-gold);
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* List */
.consent-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.consent-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.consent-card:hover {
  border-color: var(--color-gold-dim);
}
.consent-card__icon {
  font-size: 1.5rem;
  color: var(--color-gold);
  opacity: 0.5;
}
.consent-card__body { flex: 1; min-width: 0; }
.consent-card__name {
  font-family: var(--font-heading);
  font-size: 1rem;
  color: var(--color-cream);
}
.consent-card__meta {
  font-size: 0.78rem;
  color: var(--color-muted);
  margin-top: 0.1rem;
}
.consent-card__arrow {
  color: var(--color-muted);
  font-size: 1rem;
}

/* Empty */
.consent-empty {
  text-align: center;
  padding: 4rem 1rem;
}
.consent-empty__icon {
  font-size: 3rem;
  color: var(--color-gold);
  opacity: 0.35;
  display: block;
  margin-bottom: 1rem;
}
.consent-empty__title {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  color: var(--color-cream);
  margin-bottom: 0.3rem;
}
.consent-empty__text {
  font-size: 0.85rem;
  color: var(--color-muted);
}

/* Loading */
.consent-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 3rem;
  color: var(--color-muted);
  font-size: 0.9rem;
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Print modal */
.print-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.print-modal {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}
.print-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}
.print-modal__title {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  color: var(--color-cream);
}
.print-modal__close {
  background: none;
  border: none;
  color: var(--color-muted);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.3rem;
}
.print-modal__close:hover { color: var(--color-cream); }
.print-modal__body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
}
.print-modal__footer {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.print-dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.4rem 1rem;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}
.print-dl dt {
  color: var(--color-muted);
  font-weight: 500;
  text-transform: uppercase;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
}
.print-dl dd { color: var(--color-cream); }

.print-sub {
  font-family: var(--font-heading);
  font-size: 0.95rem;
  color: var(--color-cream);
  margin-bottom: 0.5rem;
}
.print-acks {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: var(--color-cream);
  margin-bottom: 1rem;
}
.print-acks li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}
.print-sig__img {
  max-width: 200px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface-2);
}

/* Transitions */
.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; max-height: 0; overflow: hidden; }
.slide-enter-to { max-height: 2000px; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
