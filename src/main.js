import { supabase } from './supabase.js';
import {
  initAuth,
  isAnonymous,
  signUpWithEmail,
  signInWithEmail,
  signOut,
  currentUser,
} from './auth.js';

// ============================================================
// DOM REFERENCES — tasks
// ============================================================

const addForm       = document.getElementById('add-form');
const taskInput     = document.getElementById('task-input');
const dueDateInput  = document.getElementById('due-date-input');
const priorityInput = document.getElementById('priority-input');
const notesInput    = document.getElementById('notes-input');
const todoList      = document.getElementById('todo-list');
const emptyState    = document.getElementById('empty-state');
const taskCount     = document.getElementById('task-count');

// ============================================================
// DOM REFERENCES — auth
// ============================================================

const authBar       = document.getElementById('auth-bar');
const authBarBtn    = document.getElementById('auth-bar-btn');
const authOverlay   = document.getElementById('auth-overlay');
const authCloseBtn  = document.getElementById('auth-close-btn');
const authTabs      = document.querySelectorAll('.auth-tab');
const authForm      = document.getElementById('auth-form');
const authEmail     = document.getElementById('auth-email');
const authPassword  = document.getElementById('auth-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authError     = document.getElementById('auth-error');
const authSubtitle  = document.getElementById('auth-subtitle');
const authStatus       = document.getElementById('auth-status');
const toastContainer   = document.getElementById('toast-container');

// ============================================================
// UTILITIES
// ============================================================

function formatDate(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-');
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  return formatDate(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const due = formatDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ============================================================
// TOASTS
// ============================================================

const TOAST_ICONS = {
  success: 'ph-check-circle',
  error:   'ph-warning-circle',
  info:    'ph-info',
};

function showToast(title, { message = '', type = 'info', duration = 4000 } = {}) {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <i class="ph-thin ${TOAST_ICONS[type]} toast__icon"></i>
    <div class="toast__body">
      <p class="toast__title">${escapeHtml(title)}</p>
      ${message ? `<p class="toast__message">${escapeHtml(message)}</p>` : ''}
    </div>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast--exit');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

// ============================================================
// RENDER — tasks
// ============================================================

function renderTasks(tasks) {
  todoList.innerHTML = '';

  const remaining = tasks.filter(t => !t.completed).length;
  const total     = tasks.length;

  if (total === 0) {
    emptyState.hidden = false;
    taskCount.textContent = '';
    return;
  }

  emptyState.hidden = true;
  taskCount.textContent = `${remaining} of ${total} remaining`;

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `todo-item${task.completed ? ' completed' : ''}`;
    li.dataset.id = task.id;

    const priorityBadge = task.priority
      ? `<span class="badge badge--${task.priority}">
           <i class="ph-thin ph-flag"></i>${task.priority}
         </span>`
      : '';

    let dueDateHtml = '';
    if (task.due_date) {
      const overdue = !task.completed && isOverdue(task.due_date);
      dueDateHtml = `<span class="todo-due${overdue ? ' overdue' : ''}">
        <i class="ph-thin ph-calendar-blank"></i>
        ${formatDateDisplay(task.due_date)}${overdue ? ' · overdue' : ''}
      </span>`;
    }

    const notesHtml = task.notes
      ? `<p class="todo-notes">${escapeHtml(task.notes)}</p>`
      : '';

    const checkIcon = task.completed ? 'ph-check-circle' : 'ph-circle';

    li.innerHTML = `
      <button class="todo-check" aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}" data-action="complete">
        <i class="ph-thin ${checkIcon}"></i>
      </button>
      <div class="todo-body">
        <p class="todo-text">${escapeHtml(task.text)}</p>
        ${(priorityBadge || dueDateHtml) ? `<div class="todo-meta">${priorityBadge}${dueDateHtml}</div>` : ''}
        ${notesHtml}
      </div>
      <button class="btn btn--ghost todo-delete" aria-label="Delete task" data-action="delete">
        <i class="ph-thin ph-trash"></i>
      </button>
    `;

    todoList.appendChild(li);
  });
}

// ============================================================
// RENDER — auth UI
// ============================================================

function renderAuthUI(user) {
  const anon = isAnonymous(user);

  // Close modal the moment a real (non-anonymous) user is confirmed
  if (user && !anon && !authOverlay.hidden) {
    closeModal();
    showToast('Welcome back!', { type: 'success' });
  }

  // Auth bar — only show for anonymous users
  authBar.hidden = !anon;

  // Footer auth status
  if (!user || anon) {
    authStatus.innerHTML = '';
  } else {
    const email = user.email || user.user_metadata?.full_name || 'Signed in';
    authStatus.innerHTML = `
      <i class="ph-thin ph-user-circle"></i>
      <span class="auth-status__email">${escapeHtml(email)}</span>
      <button class="btn--signout" id="sign-out-btn">Sign out</button>
    `;
    document.getElementById('sign-out-btn')?.addEventListener('click', handleSignOut);
  }
}

// ============================================================
// DATABASE OPERATIONS
// ============================================================

async function loadTasks() {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) { console.error('[Ink & Tasks]', error.message); return; }
  renderTasks(data ?? []);
}

async function addTask({ text, dueDate, priority, notes }) {
  const { error } = await supabase.from('todos').insert({
    text,
    completed: false,
    due_date:  dueDate   || null,
    priority:  priority  || null,
    notes:     notes     || null,
    user_id:   currentUser?.id ?? null,
  });

  if (error) { console.error('[Ink & Tasks]', error.message); return; }
  await loadTasks();
}

async function completeTask(id, currentValue) {
  const { error } = await supabase
    .from('todos')
    .update({ completed: !currentValue })
    .eq('id', id);

  if (error) { console.error('[Ink & Tasks]', error.message); return; }
  await loadTasks();
}

async function deleteTask(id) {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);

  if (error) { console.error('[Ink & Tasks]', error.message); return; }
  await loadTasks();
}

// ============================================================
// AUTH MODAL HELPERS
// ============================================================

let activeTab = 'signup';

function openModal() {
  authOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  authEmail.focus();
}

function closeModal() {
  authOverlay.hidden = true;
  document.body.style.overflow = '';
  authError.hidden = true;
  authForm.reset();
}

function setTab(tab) {
  activeTab = tab;
  authTabs.forEach(t => t.classList.toggle('auth-tab--active', t.dataset.tab === tab));

  if (tab === 'signup') {
    authSubmitBtn.textContent = 'Create account';
    authSubtitle.textContent = 'Save your tasks and access them anywhere.';
  } else {
    authSubmitBtn.textContent = 'Sign in';
    authSubtitle.textContent = 'Welcome back. Sign in to see your tasks.';
  }
}

function showAuthError(message) {
  authError.textContent = message;
  authError.hidden = false;
}

// ============================================================
// AUTH ACTION HANDLERS
// ============================================================

async function handleEmailSubmit(e) {
  e.preventDefault();
  authError.hidden = true;

  const email    = authEmail.value.trim();
  const password = authPassword.value;

  if (!email || !password) return;

  authSubmitBtn.disabled = true;
  authSubmitBtn.textContent = 'Please wait…';

  let result;
  if (activeTab === 'signup') {
    result = await signUpWithEmail(email, password);
  } else {
    result = await signInWithEmail(email, password);
  }

  authSubmitBtn.disabled = false;
  setTab(activeTab);

  if (result.error) {
    const msg = result.error.message;
    // Surface friendly messages for known error types
    if (msg.toLowerCase().includes('email not confirmed')) {
      showAuthError('Please confirm your email address before signing in.');
    } else if (msg.toLowerCase().includes('invalid login credentials')) {
      showAuthError('Incorrect email or password.');
    } else {
      showAuthError(msg);
    }
    return;
  }

  // Sign-up: modal stays open so the user sees the confirmation message
  if (activeTab === 'signup') {
    closeModal();
    showToast('Check your inbox', {
      message: 'We sent you a confirmation email. Click the link to activate your account.',
      type: 'info',
      duration: 7000,
    });
  }
  // Sign-in: modal closes automatically when onAuthStateChange confirms the session
}

async function handleSignOut() {
  await signOut();
  showToast('Signed out', { message: 'Your tasks are safe. Sign in anytime to return.', type: 'info' });
}

// ============================================================
// EVENT LISTENERS — tasks
// ============================================================

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) { taskInput.focus(); return; }

  const btn = addForm.querySelector('.btn--primary');
  btn.disabled = true;

  await addTask({
    text,
    dueDate:  dueDateInput.value      || null,
    priority: priorityInput.value     || null,
    notes:    notesInput.value.trim() || null,
  });

  addForm.reset();
  btn.disabled = false;
  taskInput.focus();
});

todoList.addEventListener('click', async (e) => {
  const item   = e.target.closest('.todo-item');
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (!item || !action) return;

  const id = item.dataset.id;
  if (action === 'complete') await completeTask(id, item.classList.contains('completed'));
  if (action === 'delete')   await deleteTask(id);
});

// ============================================================
// EVENT LISTENERS — auth
// ============================================================

authBarBtn.addEventListener('click', () => { setTab('signup'); openModal(); });
authCloseBtn.addEventListener('click', closeModal);
authOverlay.addEventListener('click', (e) => { if (e.target === authOverlay) closeModal(); });
authTabs.forEach(tab => tab.addEventListener('click', () => setTab(tab.dataset.tab)));
authForm.addEventListener('submit', handleEmailSubmit);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !authOverlay.hidden) closeModal();
});

// ============================================================
// INIT
// ============================================================

async function init() {
  const user = await initAuth((updatedUser) => {
    renderAuthUI(updatedUser);
    loadTasks();
  });

  renderAuthUI(user);
  await loadTasks();
}

init();
