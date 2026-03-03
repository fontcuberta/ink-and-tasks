// ============================================================
// STATE
// ============================================================

let tasks = [];
let nextId = 1;

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

// ============================================================
// RENDER
// ============================================================

function renderTasks() {
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

    // Priority badge HTML
    const priorityBadge = task.priority
      ? `<span class="badge badge--${task.priority}">
           <i class="ph-thin ph-flag"></i>
           ${task.priority}
         </span>`
      : '';

    // Due date HTML
    let dueDateHtml = '';
    if (task.dueDate) {
      const overdue = !task.completed && isOverdue(task.dueDate);
      dueDateHtml = `<span class="todo-due${overdue ? ' overdue' : ''}">
        <i class="ph-thin ph-calendar-blank"></i>
        ${formatDateDisplay(task.dueDate)}${overdue ? ' · overdue' : ''}
      </span>`;
    }

    // Notes HTML
    const notesHtml = task.notes
      ? `<p class="todo-notes">${escapeHtml(task.notes)}</p>`
      : '';

    // Checkbox icon
    const checkIcon = task.completed
      ? 'ph-check-circle'
      : 'ph-circle';

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

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ============================================================
// ACTIONS
// ============================================================

function addTask({ text, dueDate, priority, notes }) {
  tasks.push({
    id: nextId++,
    text,
    completed: false,
    dueDate:   dueDate   || null,
    priority:  priority  || null,
    notes:     notes     || null,
    createdAt: new Date().toISOString(),
  });
  renderTasks();
}

function completeTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    renderTasks();
  }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
}

// ============================================================
// EVENT LISTENERS
// ============================================================

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.focus();
    return;
  }
  addTask({
    text,
    dueDate:  dueDateInput.value  || null,
    priority: priorityInput.value || null,
    notes:    notesInput.value.trim() || null,
  });
  addForm.reset();
  taskInput.focus();
});

todoList.addEventListener('click', (e) => {
  const item   = e.target.closest('.todo-item');
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (!item || !action) return;

  const id = Number(item.dataset.id);
  if (action === 'complete') completeTask(id);
  if (action === 'delete')   deleteTask(id);
});

// ============================================================
// INIT
// ============================================================

renderTasks();
