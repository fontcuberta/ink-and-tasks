import { supabase } from './supabase.js';

// ============================================================
// DOM REFERENCES
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
// UTILITIES
// ============================================================

function formatDate(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-');
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const date = formatDate(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

function showError(message) {
  console.error('[Ink & Tasks]', message);
}

// ============================================================
// RENDER
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
           <i class="ph-thin ph-flag"></i>
           ${task.priority}
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
// DATABASE OPERATIONS
// ============================================================

async function loadTasks() {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) { showError(error.message); return; }
  renderTasks(data);
}

async function addTask({ text, dueDate, priority, notes }) {
  const { error } = await supabase.from('todos').insert({
    text,
    completed: false,
    due_date:  dueDate   || null,
    priority:  priority  || null,
    notes:     notes     || null,
  });

  if (error) { showError(error.message); return; }
  await loadTasks();
}

async function completeTask(id, currentValue) {
  const { error } = await supabase
    .from('todos')
    .update({ completed: !currentValue })
    .eq('id', id);

  if (error) { showError(error.message); return; }
  await loadTasks();
}

async function deleteTask(id) {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);

  if (error) { showError(error.message); return; }
  await loadTasks();
}

// ============================================================
// EVENT LISTENERS
// ============================================================

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) { taskInput.focus(); return; }

  const btn = addForm.querySelector('.btn--primary');
  btn.disabled = true;

  await addTask({
    text,
    dueDate:  dueDateInput.value       || null,
    priority: priorityInput.value      || null,
    notes:    notesInput.value.trim()  || null,
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

  if (action === 'complete') {
    const isCompleted = item.classList.contains('completed');
    await completeTask(id, isCompleted);
  }
  if (action === 'delete') {
    await deleteTask(id);
  }
});

// ============================================================
// INIT
// ============================================================

loadTasks();
