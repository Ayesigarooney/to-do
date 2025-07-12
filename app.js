const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoDate = document.getElementById('todo-date');
const todoTime = document.getElementById('todo-time');
const todoPriority = document.getElementById('todo-priority');
const todoList = document.getElementById('todo-list');
const filterButtons = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sort-by');
const summary = document.getElementById('summary');

let todos = [];
let currentFilter = 'all';
let sortBy = 'none';

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadTodos();
  renderTodos();
  checkNotificationPermission();
  setInterval(checkDueTasks, 60000); // Check every minute for due tasks
});

todoForm.addEventListener('submit', addTodo);
todoList.addEventListener('click', handleListClick);
todoList.addEventListener('change', handleCheckbox);
filterButtons.forEach(btn => btn.addEventListener('click', applyFilter));
sortSelect.addEventListener('change', e => {
  sortBy = e.target.value;
  renderTodos();
});

function addTodo(e) {
  e.preventDefault();
  const text = todoInput.value.trim();
  const date = todoDate.value;
  const time = todoTime.value;
  const priority = todoPriority.value;
  if (!text || !date || !time) return;

  const dueDateTime = new Date(`${date}T${time}`);
  if (isNaN(dueDateTime.getTime())) {
    alert('Invalid date or time');
    return;
  }

  todos.push({ id: Date.now(), text, completed: false, dueDateTime, priority });
  saveAndRender();
  todoInput.value = '';
  todoDate.value = '';
  todoTime.value = '';
  todoPriority.value = 'Low';
}

function handleCheckbox(e) {
  if (e.target.type === 'checkbox') {
    const li = e.target.closest('li');
    const id = Number(li.dataset.id);
    todos = todos.map(t => t.id === id ? { ...t, completed: e.target.checked } : t);
    saveAndRender();
  }
}

function handleListClick(e) {
  const li = e.target.closest('li');
  if (!li) return;
  const id = Number(li.dataset.id);

  if (e.target.classList.contains('remove-btn')) {
    todos = todos.filter(t => t.id !== id);
    saveAndRender();
  }
}

function applyFilter(e) {
  filterButtons.forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  currentFilter = e.target.dataset.filter;
  renderTodos();
}

function saveAndRender() {
  saveTodos();
  renderTodos();
}

function renderTodos() {
  todoList.innerHTML = '';
  let filtered = todos.filter(t =>
    currentFilter === 'all' ||
    (currentFilter === 'active' && !t.completed) ||
    (currentFilter === 'completed' && t.completed)
  );

  if (sortBy === 'due') {
    filtered.sort((a, b) => a.dueDateTime - b.dueDateTime);
  } else if (sortBy === 'priority') {
    const order = { High: 1, Medium: 2, Low: 3 };
    filtered.sort((a, b) => order[a.priority] - order[b.priority]);
  }

  filtered.forEach(todo => {
    const li = document.createElement('li');
    li.dataset.id = todo.id;
    if (todo.completed) li.classList.add('completed');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.className = 'checkbox';

    const textSpan = document.createElement('span');
    textSpan.textContent = todo.text;

    const meta = document.createElement('span');
    meta.className = `todo-meta priority-${todo.priority}`;
    meta.textContent = `Due: ${todo.dueDateTime.toLocaleString()} | Priority: ${todo.priority}`;

    const btn = document.createElement('button');
    btn.textContent = 'Delete';
    btn.className = 'remove-btn';

    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(meta);
    li.appendChild(btn);
    todoList.appendChild(li);
  });

  updateSummary();
}

function updateSummary() {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const active = total - completed;
  summary.textContent = `Total: ${total}, Completed: ${completed}, Remaining: ${active}`;
}

function saveTodos() {
  const todosToSave = todos.map(todo => ({
    ...todo,
    dueDateTime: todo.dueDateTime.toISOString()
  }));
  localStorage.setItem('todos', JSON.stringify(todosToSave));
}

function loadTodos() {
  const stored = localStorage.getItem('todos');
  if (stored) {
    todos = JSON.parse(stored).map(todo => ({
      ...todo,
      dueDateTime: new Date(todo.dueDateTime)
    }));
  }
}

// Notification functions
function checkNotificationPermission() {
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notifications");
    return false;
  }
  if (Notification.permission === "granted") {
    return true;
  }
  if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        return true;
      } else {
        alert("Notification permission denied");
        return false;
      }
    });
  }
  return false;
}

function checkDueTasks() {
  const now = new Date();
  todos.forEach(todo => {
    if (!todo.completed && todo.dueDateTime <= now) {
      showNotification(todo);
    }
  });
}

function showNotification(todo) {
  if (Notification.permission === "granted") {
    const notification = new Notification("Task Due", {
      body: `Your task "${todo.text}" is due now!`,
      icon: 'path/to/icon.png' // Optional: Replace with your icon path
    });
    notification.onclick = () => {
      // Optional: Handle click, e.g., focus the app
      window.focus();
    };
  }
}