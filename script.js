// DOM Elements
const darkModeToggle = document.getElementById('darkModeToggle');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const clearAllBtn = document.getElementById('clearAllBtn');
const taskCount = document.getElementById('taskCount');
const emptyState = document.getElementById('emptyState');
const confirmModal = document.getElementById('confirmModal');
const closeModal = document.getElementById('closeModal');
const cancelAction = document.getElementById('cancelAction');
const confirmAction = document.getElementById('confirmAction');
const modalMessage = document.getElementById('modalMessage');

// Check for saved dark mode preference
if (localStorage.getItem('darkMode') === 'enabled') {
  document.documentElement.classList.add('dark');
  darkModeToggle.innerHTML = '<i class="fas fa-sun text-white"></i>';
}

// Initialize tasks from localStorage
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let currentAction = null;
let currentIndex = null;

// Initialize the app
renderTasks();

// Dark Mode Toggle
darkModeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  
  if (document.documentElement.classList.contains('dark')) {
    localStorage.setItem('darkMode', 'enabled');
    darkModeToggle.innerHTML = '<i class="fas fa-sun text-white"></i>';
  } else {
    localStorage.setItem('darkMode', 'disabled');
    darkModeToggle.innerHTML = '<i class="fas fa-moon text-white"></i>';
  }
});

// Add Ripple Effect to Buttons
document.querySelectorAll('.ripple').forEach(button => {
  button.addEventListener('click', function(e) {
    e.preventDefault();
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.classList.add('ripple-effect');
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    this.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
});

// Add Task
addTaskBtn.addEventListener('click', addTask);

function addTask() {
  const name = document.getElementById('taskName').value.trim();
  const priority = document.getElementById('priority').value;
  const deadline = document.getElementById('deadline').value;
  const important = document.getElementById('important').checked;

  if (!name || !deadline) {
    showAlert('Please enter both task name and deadline.', 'error');
    return;
  }

  const task = {
    id: Date.now().toString(),
    name,
    priority,
    deadline: new Date(deadline).toISOString(),
    important,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(task); // Add to beginning of array
  saveTasks();
  renderTasks();
  
  // Reset form
  document.getElementById('taskName').value = '';
  document.getElementById('deadline').value = '';
  document.getElementById('important').checked = false;
  
  // Show success message
  showAlert('Task added successfully!', 'success');
}

// Delete Task
function deleteTask(id) {
  currentAction = 'delete';
  currentIndex = tasks.findIndex(task => task.id === id);
  modalMessage.textContent = 'Are you sure you want to delete this task?';
  showModal();
}

// Toggle Task Completion
function toggleComplete(id) {
  const taskIndex = tasks.findIndex(task => task.id === id);
  if (taskIndex !== -1) {
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    saveTasks();
    renderTasks();
  }
}

// Clear All Tasks
clearAllBtn.addEventListener('click', () => {
  if (tasks.length === 0) return;
  
  currentAction = 'clearAll';
  modalMessage.textContent = 'Are you sure you want to delete all tasks? This cannot be undone.';
  showModal();
});

// Modal Functions
function showModal() {
  confirmModal.classList.remove('hidden');
  setTimeout(() => {
    confirmModal.querySelector('div').classList.remove('scale-95', 'opacity-0');
    confirmModal.querySelector('div').classList.add('scale-100', 'opacity-100');
  }, 10);
}

function hideModal() {
  confirmModal.querySelector('div').classList.remove('scale-100', 'opacity-100');
  confirmModal.querySelector('div').classList.add('scale-95', 'opacity-0');
  setTimeout(() => {
    confirmModal.classList.add('hidden');
  }, 300);
}

closeModal.addEventListener('click', hideModal);
cancelAction.addEventListener('click', hideModal);

confirmAction.addEventListener('click', () => {
  if (currentAction === 'delete' && currentIndex !== null) {
    tasks.splice(currentIndex, 1);
    saveTasks();
    renderTasks();
    showAlert('Task deleted successfully!', 'success');
  } else if (currentAction === 'clearAll') {
    tasks = [];
    saveTasks();
    renderTasks();
    showAlert('All tasks cleared!', 'success');
  }
  
  hideModal();
  currentAction = null;
  currentIndex = null;
});

// Save Tasks to localStorage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Render Tasks
function renderTasks() {
  if (tasks.length === 0) {
    taskList.innerHTML = `
      <div id="emptyState" class="empty-state text-center py-10">
        <i class="fas fa-tasks text-5xl text-gray-300 mb-4"></i>
        <h3 class="text-xl font-medium text-gray-500 dark:text-gray-400">No tasks yet</h3>
        <p class="text-gray-400 dark:text-gray-500 mt-1">Add your first task to get started!</p>
      </div>
    `;
    taskCount.textContent = '0 tasks';
    return;
  }

  // Sort tasks: important first, then by deadline, then by creation date
  tasks.sort((a, b) => {
    // Important tasks first
    if (a.important && !b.important) return -1;
    if (!a.important && b.important) return 1;
    
    // Then by deadline (earlier first)
    const deadlineA = new Date(a.deadline);
    const deadlineB = new Date(b.deadline);
    if (deadlineA < deadlineB) return -1;
    if (deadlineA > deadlineB) return 1;
    
    // Then by creation date (newer first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  let html = '';
  let completedCount = 0;

  tasks.forEach(task => {
    if (task.completed) completedCount++;
    
    const deadlineDate = new Date(task.deadline);
    const now = new Date();
    const isOverdue = !task.completed && deadlineDate < now;
    
    html += `
      <div class="task-card ${task.completed ? 'completed-task' : ''} ${isOverdue ? 'border-red-500' : ''} 
           bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-all duration-300 
           priority-${task.priority.toLowerCase()} ${task.important ? 'ring-2 ring-blue-500' : ''}">
        <div class="flex items-start justify-between">
          <div class="flex items-start space-x-3 flex-grow">
            <div class="checkbox-container mt-1">
              <input type="checkbox" id="complete-${task.id}" ${task.completed ? 'checked' : ''} 
                     onchange="toggleComplete('${task.id}')" class="form-checkbox">
              <span class="checkbox-custom"></span>
            </div>
            <div class="flex-grow">
              <h3 class="task-name font-medium ${task.completed ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-800 dark:text-white'}">
                ${task.name}
                ${task.important ? '<span class="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">Important</span>' : ''}
              </h3>
              <div class="flex flex-wrap items-center mt-1 text-sm text-gray-600 dark:text-gray-400 space-x-3">
                <span class="flex items-center">
                  <i class="fas fa-${getPriorityIcon(task.priority)} mr-1 text-${getPriorityColor(task.priority)}-500"></i>
                  ${task.priority} Priority
                </span>
                <span class="flex items-center ${isOverdue ? 'text-red-500' : ''}">
                  <i class="fas fa-calendar-day mr-1"></i>
                  ${formatDate(deadlineDate)}
                  ${isOverdue ? '<span class="ml-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-1.5 py-0.5 rounded">Overdue</span>' : ''}
                </span>
              </div>
            </div>
          </div>
          <button onclick="deleteTask('${task.id}')" class="btn-danger p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  });

  taskList.innerHTML = html;
  taskCount.textContent = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} (${completedCount} completed)`;
}

// Helper Functions
function getPriorityIcon(priority) {
  switch (priority) {
    case 'High': return 'exclamation-circle';
    case 'Medium': return 'minus-circle';
    case 'Low': return 'arrow-down';
    default: return 'circle';
  }
}

function getPriorityColor(priority) {
  switch (priority) {
    case 'High': return 'red';
    case 'Medium': return 'yellow';
    case 'Low': return 'green';
    default: return 'gray';
  }
}

function formatDate(date) {
  const options = { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('en-US', options);
}

function showAlert(message, type) {
  const alert = document.createElement('div');
  alert.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 transform transition-all duration-300 translate-x-8 opacity-0 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  }`;
  alert.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
    ${message}
  `;
  document.body.appendChild(alert);
  
  setTimeout(() => {
    alert.classList.remove('translate-x-8', 'opacity-0');
    alert.classList.add('translate-x-0', 'opacity-100');
  }, 10);
  
  setTimeout(() => {
    alert.classList.remove('translate-x-0', 'opacity-100');
    alert.classList.add('translate-x-8', 'opacity-0');
    setTimeout(() => {
      alert.remove();
    }, 300);
  }, 3000);
}

// Allow adding task with Enter key
document.getElementById('taskName').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addTask();
  }
});
