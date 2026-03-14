/**
 * Personal Dashboard — app.js
 *
 * Pure logic functions are exported (CommonJS) so they can be imported
 * in Node for Vitest / fast-check testing without a DOM.
 *
 * In the browser the exports object is unused; the widgets are wired
 * via the DOMContentLoaded listener at the bottom of this file.
 */

/* ── CommonJS export shim (no-op in browser) ─────────────────────────── */
const _exports = (typeof module !== 'undefined' && module.exports) ? module.exports : {};

/* ═══════════════════════════════════════════════════════════════════════
   GREETING WIDGET
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Returns a time-based greeting string for the given hour (0–23).
 * @param {number} h - Hour of the day (0–23)
 * @returns {string}
 */
function getGreeting(h) {
  if (h >= 5 && h <= 11) return 'Good morning';
  if (h >= 12 && h <= 17) return 'Good afternoon';
  if (h >= 18 && h <= 21) return 'Good evening';
  return 'Good night';
}

/**
 * Formats a Date as HH:MM (zero-padded, 24-hour).
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Formats a Date as a human-readable string, e.g. "Monday, July 14, 2025".
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const GreetingWidget = {
  init() {
    const timeEl = document.getElementById('greeting-time');
    const dateEl = document.getElementById('greeting-date');
    const msgEl  = document.getElementById('greeting-message');
    if (!timeEl || !dateEl || !msgEl) {
      console.error('GreetingWidget: required DOM elements not found');
      return;
    }
    this._timeEl = timeEl;
    this._dateEl = dateEl;
    this._msgEl  = msgEl;
    this.render();
    setInterval(() => this.render(), 60_000);
  },

  render() {
    const now = new Date();
    this._timeEl.textContent = formatTime(now);
    this._dateEl.textContent = formatDate(now);
    this._msgEl.textContent  = getGreeting(now.getHours());
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   FOCUS TIMER WIDGET
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Formats seconds as MM:SS (zero-padded).
 * @param {number} seconds - Integer in [0, 1500]
 * @returns {string}
 */
function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Creates a pure timer state machine (no DOM, no intervals).
 * @returns {{ remaining: number, running: boolean, start: Function, stop: Function, reset: Function, tick: Function }}
 */
function createTimerState() {
  return {
    remaining: 1500,
    running: false,

    start() {
      if (!this.running) {
        this.running = true;
      }
    },

    stop() {
      this.running = false;
    },

    reset() {
      this.running = false;
      this.remaining = 1500;
    },

    tick() {
      if (this.remaining > 0) {
        this.remaining -= 1;
      }
      if (this.remaining === 0) {
        this.running = false;
      }
    },
  };
}

const FocusTimerWidget = {
  _state: null,
  _intervalId: null,

  init() {
    const displayEl  = document.getElementById('timer-display');
    const completeEl = document.getElementById('timer-complete');
    const startBtn   = document.getElementById('timer-start');
    const stopBtn    = document.getElementById('timer-stop');
    const resetBtn   = document.getElementById('timer-reset');

    if (!displayEl || !completeEl || !startBtn || !stopBtn || !resetBtn) {
      console.error('FocusTimerWidget: required DOM elements not found');
      return;
    }

    this._displayEl  = displayEl;
    this._completeEl = completeEl;
    this._state      = createTimerState();

    startBtn.addEventListener('click', () => this.start());
    stopBtn.addEventListener('click',  () => this.stop());
    resetBtn.addEventListener('click', () => this.reset());

    this.render();
  },

  start() {
    if (this._state.running) return; // idempotent guard (Requirement 2.7)
    this._state.start();
    this._intervalId = setInterval(() => this.tick(), 1000);
  },

  stop() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._state.stop();
    this.render();
  },

  reset() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._state.reset();
    this.render();
  },

  tick() {
    this._state.tick();
    this.render();
    if (this._state.remaining === 0) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  },

  render() {
    this._displayEl.textContent = formatTimer(this._state.remaining);
    this._completeEl.hidden = this._state.remaining !== 0;
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   TODO WIDGET
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Validates a task label. Returns an error string or null (null = valid).
 * Rejects empty or whitespace-only labels.
 * @param {string} label
 * @returns {string|null}
 */
function validateTask(label) {
  if (typeof label !== 'string' || label.trim() === '') {
    return 'Task label cannot be empty.';
  }
  return null;
}

/**
 * Creates a new Task object with a unique id.
 * @param {string} label
 * @returns {{ id: string, label: string, done: boolean }}
 */
function createTask(label) {
  return { id: Date.now().toString(), label: label.trim(), done: false };
}

/**
 * Adds a new task to the array. Returns the same array if label is invalid,
 * otherwise returns a new array with the task appended.
 * @param {Array} tasks
 * @param {string} label
 * @returns {Array}
 */
function addTask(tasks, label) {
  if (validateTask(label) !== null) return tasks;
  return [...tasks, createTask(label)];
}

/**
 * Returns a new array with the matching task's label updated.
 * @param {Array} tasks
 * @param {string} id
 * @param {string} newLabel
 * @returns {Array}
 */
function editTask(tasks, id, newLabel) {
  return tasks.map(t => t.id === id ? { ...t, label: newLabel } : t);
}

/**
 * Returns a new array with the matching task's done field flipped.
 * @param {Array} tasks
 * @param {string} id
 * @returns {Array}
 */
function toggleTask(tasks, id) {
  return tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
}

/**
 * Returns a new array with the matching task removed.
 * @param {Array} tasks
 * @param {string} id
 * @returns {Array}
 */
function deleteTask(tasks, id) {
  return tasks.filter(t => t.id !== id);
}

const TodoWidget = {
  _tasks: [],

  load() {
    try {
      const raw = localStorage.getItem('dashboard_todos');
      if (raw === null) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.warn('TodoWidget: failed to load tasks from localStorage', e);
      return [];
    }
  },

  persist() {
    try {
      localStorage.setItem('dashboard_todos', JSON.stringify(this._tasks));
    } catch (e) {
      console.warn('TodoWidget: failed to persist tasks to localStorage', e);
    }
  },

  render() {
    const listEl = document.getElementById('todo-list');
    const errorEl = document.getElementById('todo-error');
    if (!listEl) {
      console.error('TodoWidget: #todo-list element not found');
      return;
    }

    listEl.innerHTML = '';

    this._tasks.forEach(task => {
      const li = document.createElement('li');
      if (task.done) li.classList.add('done');

      // Toggle button
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.textContent = task.done ? '✓' : '○';
      toggleBtn.setAttribute('aria-label', task.done ? 'Mark incomplete' : 'Mark complete');
      toggleBtn.addEventListener('click', () => {
        this._tasks = toggleTask(this._tasks, task.id);
        this.persist();
        this.render();
      });

      // Task label
      const labelSpan = document.createElement('span');
      labelSpan.className = 'task-label';
      labelSpan.textContent = task.label;

      // Edit button
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('aria-label', `Edit task: ${task.label}`);
      editBtn.addEventListener('click', () => {
        const newLabel = prompt('Edit task:', task.label);
        if (newLabel === null) return; // cancelled
        const err = validateTask(newLabel);
        if (err) {
          if (errorEl) {
            errorEl.textContent = err;
            errorEl.hidden = false;
          }
          return;
        }
        this._tasks = editTask(this._tasks, task.id, newLabel);
        this.persist();
        this.render();
      });

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', `Delete task: ${task.label}`);
      deleteBtn.addEventListener('click', () => {
        this._tasks = deleteTask(this._tasks, task.id);
        this.persist();
        this.render();
      });

      li.appendChild(toggleBtn);
      li.appendChild(labelSpan);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      listEl.appendChild(li);
    });
  },

  init() {
    const formEl  = document.getElementById('todo-add-form');
    const inputEl = document.getElementById('todo-input');
    const errorEl = document.getElementById('todo-error');
    const listEl  = document.getElementById('todo-list');

    if (!formEl || !inputEl || !errorEl || !listEl) {
      console.error('TodoWidget: required DOM elements not found');
      return;
    }

    this._tasks = this.load();
    this.render();

    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const label = inputEl.value;
      const err = validateTask(label);
      if (err) {
        errorEl.textContent = err;
        errorEl.hidden = false;
        return;
      }
      errorEl.hidden = true;
      errorEl.textContent = '';
      this._tasks = addTask(this._tasks, label);
      this.persist();
      this.render();
      inputEl.value = '';
    });
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   QUICK LINKS WIDGET
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Validates a link label and URL.
 * Rejects empty/whitespace label, empty/whitespace URL, or URL not starting
 * with "http://" or "https://".
 * @param {string} label
 * @param {string} url
 * @returns {string|null} Error string, or null if valid.
 */
function validateLink(label, url) {
  if (typeof label !== 'string' || label.trim() === '') {
    return 'Link label cannot be empty.';
  }
  if (typeof url !== 'string' || url.trim() === '') {
    return 'URL cannot be empty.';
  }
  if (!url.trim().startsWith('http://') && !url.trim().startsWith('https://')) {
    return 'URL must start with "http://" or "https://".';
  }
  return null;
}

/**
 * Creates a new Link object with a unique id.
 * @param {string} label
 * @param {string} url
 * @returns {{ id: string, label: string, url: string }}
 */
function createLink(label, url) {
  return { id: Date.now().toString(), label: label.trim(), url: url.trim() };
}

/**
 * Adds a new link to the array. Returns the same array if input is invalid,
 * otherwise returns a new array with the link appended.
 * @param {Array} links
 * @param {string} label
 * @param {string} url
 * @returns {Array}
 */
function addLink(links, label, url) {
  if (validateLink(label, url) !== null) return links;
  return [...links, createLink(label, url)];
}

/**
 * Returns a new array with the matching link removed.
 * @param {Array} links
 * @param {string} id
 * @returns {Array}
 */
function deleteLink(links, id) {
  return links.filter(l => l.id !== id);
}

const QuickLinksWidget = {
  _links: [],

  load() {
    try {
      const raw = localStorage.getItem('dashboard_links');
      if (raw === null) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.warn('QuickLinksWidget: failed to load links from localStorage', e);
      return [];
    }
  },

  persist() {
    try {
      localStorage.setItem('dashboard_links', JSON.stringify(this._links));
    } catch (e) {
      console.warn('QuickLinksWidget: failed to persist links to localStorage', e);
    }
  },

  render() {
    const panelEl = document.getElementById('links-panel');
    if (!panelEl) {
      console.error('QuickLinksWidget: #links-panel element not found');
      return;
    }

    panelEl.innerHTML = '';

    this._links.forEach(link => {
      const wrapper = document.createElement('div');
      wrapper.className = 'link-item';

      // Link button — opens URL in new tab
      const linkBtn = document.createElement('button');
      linkBtn.type = 'button';
      linkBtn.textContent = link.label;
      linkBtn.setAttribute('aria-label', `Open ${link.label}`);
      linkBtn.addEventListener('click', () => {
        window.open(link.url, '_blank');
      });

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', `Delete link: ${link.label}`);
      deleteBtn.addEventListener('click', () => {
        this._links = deleteLink(this._links, link.id);
        this.persist();
        this.render();
      });

      wrapper.appendChild(linkBtn);
      wrapper.appendChild(deleteBtn);
      panelEl.appendChild(wrapper);
    });
  },

  init() {
    const formEl     = document.getElementById('links-add-form');
    const labelInput = document.getElementById('links-label-input');
    const urlInput   = document.getElementById('links-url-input');
    const errorEl    = document.getElementById('links-error');
    const panelEl    = document.getElementById('links-panel');

    if (!formEl || !labelInput || !urlInput || !errorEl || !panelEl) {
      console.error('QuickLinksWidget: required DOM elements not found');
      return;
    }

    this._links = this.load();
    this.render();

    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const label = labelInput.value;
      const url   = urlInput.value;
      const err   = validateLink(label, url);
      if (err) {
        errorEl.textContent = err;
        errorEl.hidden = false;
        return;
      }
      errorEl.hidden = true;
      errorEl.textContent = '';
      this._links = addLink(this._links, label, url);
      this.persist();
      this.render();
      labelInput.value = '';
      urlInput.value   = '';
    });
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   STARTUP
   ═══════════════════════════════════════════════════════════════════════ */

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    GreetingWidget.init();
    FocusTimerWidget.init();
    TodoWidget.init();
    QuickLinksWidget.init();
  });
}

/* ── Exports for Node / Vitest ────────────────────────────────────────── */
_exports.getGreeting    = getGreeting;
_exports.formatTime     = formatTime;
_exports.formatDate     = formatDate;
_exports.formatTimer    = formatTimer;
_exports.createTimerState = createTimerState;
_exports.validateTask   = validateTask;
_exports.createTask     = createTask;
_exports.addTask        = addTask;
_exports.editTask       = editTask;
_exports.toggleTask     = toggleTask;
_exports.deleteTask     = deleteTask;
_exports.TodoWidget     = TodoWidget;
_exports.validateLink      = validateLink;
_exports.createLink        = createLink;
_exports.addLink           = addLink;
_exports.deleteLink        = deleteLink;
_exports.QuickLinksWidget  = QuickLinksWidget;
