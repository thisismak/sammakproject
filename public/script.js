document.addEventListener('DOMContentLoaded', () => {
  const taskForm = document.getElementById('taskForm');
  const taskList = document.getElementById('taskList');
  const searchInput = document.getElementById('search');

  // Fetch and display tasks
  async function loadTasks(query = '') {
    const url = query ? `/api/tasks/search?q=${encodeURIComponent(query)}` : '/api/tasks';
    const response = await fetch(url);
    const tasks = await response.json();
    taskList.innerHTML = '';
    tasks.forEach(task => {
      const taskCard = document.createElement('div');
      taskCard.className = 'bg-white p-4 rounded-md shadow flex justify-between items-center';
      taskCard.innerHTML = `
        <div>
          <h3 class="text-lg font-semibold">${task.title}</h3>
          <p>${task.description}</p>
          <p class="text-sm text-gray-600">狀態: ${task.status}</p>
          <p class="text-sm text-gray-600">截止日期: ${task.due_date}</p>
        </div>
        <div>
          <button onclick="editTask(${task.id})" class="text-blue-500 mr-2">編輯</button>
          <button onclick="deleteTask(${task.id})" class="text-red-500">刪除</button>
        </div>
      `;
      taskList.appendChild(taskCard);
    });
  }

  // Form submission
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('taskId').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const status = document.getElementById('status').value;
    const dueDate = document.getElementById('dueDate').value;

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/tasks/${id}` : '/api/tasks';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, status, due_date: dueDate })
    });
    taskForm.reset();
    document.getElementById('taskId').value = '';
    loadTasks();
  });

  // Edit task
  window.editTask = async (id) => {
    const response = await fetch(`/api/tasks/${id}`);
    const task = await response.json();
    document.getElementById('taskId').value = task.id;
    document.getElementById('title').value = task.title;
    document.getElementById('description').value = task.description;
    document.getElementById('status').value = task.status;
    document.getElementById('dueDate').value = task.due_date;
  };

  // Delete task
  window.deleteTask = async (id) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    loadTasks();
  };

  // Search tasks
  searchInput.addEventListener('input', (e) => {
    loadTasks(e.target.value);
  });

  // Initial load
  loadTasks();
});