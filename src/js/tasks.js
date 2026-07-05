/**
 * tasks.js - 任务管理
 */
const Tasks = (() => {
  let tasks = [];
  let activeTaskId = null;

  function init() {
    loadTasks();
    render();
    bindEvents();
  }

  function loadTasks() {
    const saved = localStorage.getItem('pomodoro-tasks');
    if (saved) {
      tasks = JSON.parse(saved);
    }
  }

  function saveTasks() {
    localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks));
  }

  function addTask(name, tag) {
    if (!name.trim()) return false;
    const task = {
      id: Date.now().toString(),
      name: name.trim(),
      tag: tag || '其他',
      done: false,
      pomodoros: 0,
      createdAt: Date.now(),
    };
    tasks.unshift(task);
    saveTasks();
    render();
    return true;
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    if (activeTaskId === id) activeTaskId = null;
    saveTasks();
    render();
    updateCurrentTaskDisplay();
  }

  function toggleDone(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.done = !task.done;
      saveTasks();
      render();
    }
  }

  function setActive(id) {
    activeTaskId = id;
    render();
    updateCurrentTaskDisplay();
  }

  function incrementPomodoro() {
    if (!activeTaskId) return;
    const task = tasks.find(t => t.id === activeTaskId);
    if (task) {
      task.pomodoros++;
      saveTasks();
      render();
    }
  }

  function getActiveTask() {
    return tasks.find(t => t.id === activeTaskId) || null;
  }

  function updateCurrentTaskDisplay() {
    const el = document.getElementById('current-task-name');
    const task = getActiveTask();
    el.textContent = task ? `${getTagEmoji(task.tag)} ${task.name}` : '点击右侧选择任务';
  }

  function getTagEmoji(tag) {
    const emojis = { '工作': '💼', '学习': '📚', '阅读': '📖', '运动': '🏃', '创作': '🎨', '其他': '📌' };
    return emojis[tag] || '📌';
  }

  function render() {
    const list = document.getElementById('task-list');

    if (tasks.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-text">还没有任务<br>添加一个任务开始专注吧</div>
        </div>
      `;
      return;
    }

    list.innerHTML = tasks.map(task => `
      <div class="task-item ${task.done ? 'done' : ''} ${task.id === activeTaskId ? 'active' : ''}"
           data-id="${task.id}">
        <div class="task-check ${task.done ? 'checked' : ''}" data-action="toggle" data-id="${task.id}">
          ${task.done ? '✓' : ''}
        </div>
        <div class="task-info" data-action="select" data-id="${task.id}">
          <div class="task-name">${escapeHtml(task.name)}</div>
          <div class="task-meta">
            <span class="task-tag">${getTagEmoji(task.tag)} ${task.tag}</span>
            <span class="task-pomodoros">🍅 ${task.pomodoros}</span>
          </div>
        </div>
        <button class="task-delete" data-action="delete" data-id="${task.id}">✕</button>
      </div>
    `).join('');
  }

  function bindEvents() {
    const input = document.getElementById('task-input');
    const tagSelect = document.getElementById('task-tag-select');
    const addBtn = document.getElementById('task-add-btn');
    const list = document.getElementById('task-list');

    function submitTask() {
      if (addTask(input.value, tagSelect.value)) {
        input.value = '';
      } else {
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 300);
      }
    }

    addBtn.addEventListener('click', submitTask);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitTask(); });

    // 任务列表操作（事件委托）
    list.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;
      const id = target.dataset.id;

      switch (action) {
        case 'toggle': toggleDone(id); break;
        case 'select': setActive(id); break;
        case 'delete': deleteTask(id); break;
      }
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // 获取统计数据
  function getStats() {
    return {
      totalPomodoros: tasks.reduce((sum, t) => sum + t.pomodoros, 0),
      tasks: tasks.map(t => ({ name: t.name, tag: t.tag, pomodoros: t.pomodoros })),
    };
  }

  return {
    init,
    addTask,
    deleteTask,
    toggleDone,
    setActive,
    incrementPomodoro,
    getActiveTask,
    getStats,
    getTagEmoji,
    render,
  };
})();
