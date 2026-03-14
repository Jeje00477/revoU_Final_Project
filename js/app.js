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

/* ═══════════════════════════════════════════════════════════════════════
   THEME TOGGLE
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Applies or removes the dark-mode class on <body> and updates the toggle
 * button label. Pure DOM side-effect — no localStorage access.
 * @param {boolean} isDark
 */
function applyTheme(isDark) {
  if (typeof document === 'undefined') return;
  if (isDark) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  const btn = document.querySelector('.theme-toggle-btn');
  if (btn) {
    btn.textContent = isDark ? 'Light mode' : 'Dark mode';
  }
}

const ThemeToggle = {
  init() {
    if (typeof document === 'undefined') return;

    const main = document.querySelector('main.dashboard');
    if (!main) {
      console.error('ThemeToggle: <main class="dashboard"> not found');
      return;
    }

    // Inject enhancements stylesheet (idempotent — skip if already present)
    if (!document.querySelector('link[href="css/enhancements.css"]')) {
      const link = document.createElement('link');
      link.rel  = 'stylesheet';
      link.href = 'css/enhancements.css';
      document.head.appendChild(link);
    }

    // Inject toolbar + button at the top of <main class="dashboard">
    const toolbar = document.createElement('div');
    toolbar.className = 'theme-toolbar';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle-btn';
    btn.textContent = 'Dark mode'; // default label (light mode active)
    btn.addEventListener('click', () => ThemeToggle.toggle());

    toolbar.appendChild(btn);
    main.insertBefore(toolbar, main.firstChild);

    // Read stored theme and apply it
    let stored = 'light';
    try {
      const raw = localStorage.getItem('dashboard_theme');
      if (raw === 'dark' || raw === 'light') {
        stored = raw;
      }
    } catch (e) {
      console.warn('ThemeToggle: could not read localStorage', e);
    }

    applyTheme(stored === 'dark');
  },

  toggle() {
    if (typeof document === 'undefined') return;
    const isDark = document.body.classList.contains('dark-mode');
    const next = !isDark;
    applyTheme(next);
    try {
      localStorage.setItem('dashboard_theme', next ? 'dark' : 'light');
    } catch (e) {
      console.warn('ThemeToggle: could not write to localStorage', e);
    }
  },
};

/* ── ThemeToggle exports ─────────────────────────────────────────────── */
_exports.applyTheme   = applyTheme;
_exports.ThemeToggle  = ThemeToggle;

/* ═══════════════════════════════════════════════════════════════════════
   GREETING NAME EXTENSION (NameStore + GreetingNameUI)
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Validates a custom name for the greeting.
 * Returns an error string if invalid, or null if valid.
 * Rejects: empty, whitespace-only, trimmed length > 50.
 * @param {string} name
 * @returns {string|null}
 */
function validateName(name) {
  if (typeof name !== 'string' || name.trim() === '') {
    return 'Name cannot be empty.';
  }
  if (name.trim().length > 50) {
    return 'Name must be 50 characters or fewer.';
  }
  return null;
}

/**
 * Builds a greeting string, optionally including a name.
 * @param {string} greetingBase - e.g. "Good morning"
 * @param {string|null|undefined} name - optional name to append
 * @returns {string} e.g. "Good morning, Alex" or "Good morning"
 */
function buildGreeting(greetingBase, name) {
  if (name && name.trim().length > 0) {
    return `${greetingBase}, ${name.trim()}`;
  }
  return greetingBase;
}

const NameStore = {
  _key: 'dashboard_user_name',

  /**
   * Persists the trimmed name to localStorage.
   * @param {string} name
   */
  save(name) {
    try {
      localStorage.setItem(this._key, name.trim());
    } catch (e) {
      console.warn('NameStore: could not write to localStorage', e);
    }
  },

  /**
   * Reads the stored name from localStorage.
   * @returns {string|null}
   */
  load() {
    try {
      return localStorage.getItem(this._key);
    } catch (e) {
      console.warn('NameStore: could not read from localStorage', e);
      return null;
    }
  },

  /**
   * Removes the stored name from localStorage.
   */
  clear() {
    try {
      localStorage.removeItem(this._key);
    } catch (e) {
      console.warn('NameStore: could not clear localStorage', e);
    }
  },
};

const GreetingNameUI = {
  init() {
    if (typeof document === 'undefined') return;

    const greetingSection = document.getElementById('greeting');
    const msgEl = document.getElementById('greeting-message');

    if (!greetingSection || !msgEl) {
      console.error('GreetingNameUI: required DOM elements not found');
      return;
    }

    // Inject form: input + Save button
    const form = document.createElement('form');
    form.className = 'name-store-form';
    form.setAttribute('aria-label', 'Set greeting name');

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'name-store-input';
    input.placeholder = 'Your name';
    input.maxLength = 51; // allow typing up to 51 so validation can catch > 50
    input.setAttribute('aria-label', 'Enter your name');

    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'name-store-btn';
    saveBtn.textContent = 'Save';

    // Error element
    const errorEl = document.createElement('p');
    errorEl.className = 'name-store-error';
    errorEl.setAttribute('role', 'alert');
    errorEl.hidden = true;

    form.appendChild(input);
    form.appendChild(saveBtn);
    form.appendChild(errorEl);
    greetingSection.appendChild(form);

    // Helper: update greeting-message text using current base greeting
    const applyName = (name) => {
      const base = getGreeting(new Date().getHours());
      msgEl.textContent = buildGreeting(base, name);
    };

    // On load: apply stored name if present
    const stored = NameStore.load();
    if (stored) {
      input.value = stored;
      applyName(stored);
    }

    // On form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = input.value;

      // Empty / whitespace-only submit → clear stored name, revert greeting
      if (value.trim() === '') {
        NameStore.clear();
        const base = getGreeting(new Date().getHours());
        msgEl.textContent = base;
        errorEl.hidden = true;
        errorEl.textContent = '';
        return;
      }

      const err = validateName(value);
      if (err) {
        errorEl.textContent = err;
        errorEl.hidden = false;
        return;
      }

      errorEl.hidden = true;
      errorEl.textContent = '';
      NameStore.save(value);
      applyName(value);
    });
  },
};

/* ── GreetingNameUI exports ──────────────────────────────────────────── */
_exports.validateName  = validateName;
_exports.buildGreeting = buildGreeting;
_exports.NameStore     = NameStore;
_exports.GreetingNameUI = GreetingNameUI;

/* ═══════════════════════════════════════════════════════════════════════
   TIMER CONFIG (configurable Pomodoro duration)
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Validates a Pomodoro duration value.
 * Returns an error string if invalid, or null if valid.
 * Accepts only integers in the closed interval [1, 120].
 * @param {*} value
 * @returns {string|null}
 */
function validateDuration(value) {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return 'Duration must be a number between 1 and 120.';
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 'Duration must be a number between 1 and 120.';
  }
  if (!Number.isInteger(n)) {
    return 'Duration must be a whole number.';
  }
  if (n < 1 || n > 120) {
    return 'Duration must be between 1 and 120 minutes.';
  }
  return null;
}

/**
 * Parses a duration value to an integer, or returns null if invalid.
 * @param {*} value
 * @returns {number|null}
 */
function parseDuration(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  return n;
}

const TimerConfig = {
  _inputEl: null,
  _setBtnEl: null,
  _errorEl: null,

  init() {
    if (typeof document === 'undefined') return;

    const timerSection = document.getElementById('timer');
    if (!timerSection) {
      console.error('TimerConfig: #timer element not found');
      return;
    }

    // Inject form: numeric input + Set button
    const form = document.createElement('form');
    form.className = 'timer-config-form';
    form.setAttribute('aria-label', 'Set timer duration');

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'timer-config-input';
    input.min = '1';
    input.max = '120';
    input.placeholder = '25';
    input.setAttribute('aria-label', 'Duration in minutes');

    const setBtn = document.createElement('button');
    setBtn.type = 'submit';
    setBtn.className = 'timer-config-btn';
    setBtn.textContent = 'Set';

    // Error element
    const errorEl = document.createElement('p');
    errorEl.className = 'timer-config-error';
    errorEl.setAttribute('role', 'alert');
    errorEl.hidden = true;

    form.appendChild(input);
    form.appendChild(setBtn);
    form.appendChild(errorEl);
    timerSection.appendChild(form);

    this._inputEl  = input;
    this._setBtnEl = setBtn;
    this._errorEl  = errorEl;

    // Read stored duration and initialise timer if valid
    try {
      const raw = localStorage.getItem('dashboard_timer_duration');
      if (raw !== null) {
        const parsed = parseDuration(raw);
        if (parsed !== null && validateDuration(parsed) === null) {
          input.value = String(parsed);
          if (FocusTimerWidget._state) {
            FocusTimerWidget._state.remaining = parsed * 60;
            FocusTimerWidget._state.running   = false;
            if (typeof FocusTimerWidget.render === 'function') {
              FocusTimerWidget.render();
            }
          }
        }
      }
    } catch (e) {
      console.warn('TimerConfig: could not read localStorage', e);
    }

    // On form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = input.value;
      const parsed = parseDuration(value);
      const err = validateDuration(parsed !== null ? parsed : value);
      if (err) {
        errorEl.textContent = err;
        errorEl.hidden = false;
        return;
      }
      errorEl.hidden = true;
      errorEl.textContent = '';
      this.setDuration(parsed);
    });

    this.syncButtonState();
  },

  /**
   * Validates and applies a new duration (in minutes) to the timer.
   * Persists the value to localStorage.
   * @param {number} minutes
   */
  setDuration(minutes) {
    const err = validateDuration(minutes);
    if (err) return;

    if (FocusTimerWidget._state) {
      FocusTimerWidget._state.remaining = minutes * 60;
      FocusTimerWidget._state.running   = false;
      if (typeof FocusTimerWidget.render === 'function') {
        FocusTimerWidget.render();
      }
    }

    try {
      localStorage.setItem('dashboard_timer_duration', String(minutes));
    } catch (e) {
      console.warn('TimerConfig: could not write to localStorage', e);
    }

    this.syncButtonState();
  },

  /**
   * Disables the Set button when the timer is running; enables it otherwise.
   */
  syncButtonState() {
    if (!this._setBtnEl) return;
    const running = FocusTimerWidget._state ? FocusTimerWidget._state.running : false;
    this._setBtnEl.disabled = running;
  },
};

/* ── TimerConfig exports ─────────────────────────────────────────────── */
_exports.validateDuration = validateDuration;
_exports.parseDuration    = parseDuration;
_exports.TimerConfig      = TimerConfig;
_exports.FocusTimerWidget = FocusTimerWidget;

/* ── Wire TimerConfig into FocusTimerWidget start/stop/reset ─────────── */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    TimerConfig.init();

    // Wrap start/stop/reset to keep the Set button in sync
    const _origStart = FocusTimerWidget.start.bind(FocusTimerWidget);
    FocusTimerWidget.start = function () {
      _origStart();
      TimerConfig.syncButtonState();
    };

    const _origStop = FocusTimerWidget.stop.bind(FocusTimerWidget);
    FocusTimerWidget.stop = function () {
      _origStop();
      TimerConfig.syncButtonState();
    };

    const _origReset = FocusTimerWidget.reset.bind(FocusTimerWidget);
    FocusTimerWidget.reset = function () {
      _origReset();
      TimerConfig.syncButtonState();
    };
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   DUPLICATE TASK PREVENTION (TodoEnhancements)
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Normalises a task label for duplicate comparison: trim + lowercase.
 * @param {string} label
 * @returns {string}
 */
function normaliseLabel(label) {
  return label.trim().toLowerCase();
}

/**
 * Returns true if any task in the array (excluding the task with excludeId,
 * if provided) has the same normalised label as the given label.
 * @param {Array<{id: string, label: string, done: boolean}>} tasks
 * @param {string} label
 * @param {string} [excludeId]
 * @returns {boolean}
 */
function isDuplicate(tasks, label, excludeId) {
  const norm = normaliseLabel(label);
  return tasks.some(t => {
    if (excludeId !== undefined && t.id === excludeId) return false;
    return normaliseLabel(t.label) === norm;
  });
}

const TodoEnhancements = {
  _errorEl: null,

  /**
   * Shows the duplicate error message in the inline error element.
   * @param {string} msg
   */
  _showError(msg) {
    const errorEl = document.getElementById('todo-error');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.hidden = false;
    }
  },

  /**
   * Initialises duplicate prevention by:
   * 1. Adding a submit listener (runs before the existing one) that blocks
   *    duplicate add submissions via stopImmediatePropagation.
   * 2. Monkey-patching TodoWidget.render to wrap each edit button's click
   *    handler with a duplicate check (using excludeId = task being edited).
   */
  init() {
    if (typeof document === 'undefined') return;

    const formEl = document.getElementById('todo-add-form');
    const inputEl = document.getElementById('todo-input');

    if (!formEl || !inputEl) {
      console.error('TodoEnhancements: required DOM elements not found');
      return;
    }

    // --- Intercept add submissions ---
    // This listener is registered BEFORE the existing TodoWidget submit listener
    // (TodoWidget.init() has already run, but we use capture phase to run first,
    // or we rely on the fact that we call stopImmediatePropagation to block it).
    // We use capture: true so our handler fires before the bubbling-phase handler.
    formEl.addEventListener('submit', (e) => {
      const label = inputEl.value;
      if (isDuplicate(TodoWidget._tasks, label)) {
        e.stopImmediatePropagation();
        e.preventDefault();
        this._showError('A task with this name already exists.');
      }
    }, true); // capture phase — runs before the existing bubbling-phase listener

    // --- Intercept edit submissions via monkey-patching TodoWidget.render ---
    const _origRender = TodoWidget.render.bind(TodoWidget);
    TodoWidget.render = function () {
      // Call the original render first to populate the DOM
      _origRender();

      // Now wrap each edit button's click handler
      const listEl = document.getElementById('todo-list');
      if (!listEl) return;

      const errorEl = document.getElementById('todo-error');

      listEl.querySelectorAll('li').forEach((li, index) => {
        const task = TodoWidget._tasks[index];
        if (!task) return;

        const editBtn = li.querySelector('button[aria-label^="Edit task"]');
        if (!editBtn) return;

        // Clone the button to remove the original listener, then re-attach
        const newEditBtn = editBtn.cloneNode(true);
        editBtn.parentNode.replaceChild(newEditBtn, editBtn);

        newEditBtn.addEventListener('click', () => {
          const newLabel = prompt('Edit task:', task.label);
          if (newLabel === null) return; // cancelled

          // Validate basic task label
          const basicErr = validateTask(newLabel);
          if (basicErr) {
            if (errorEl) {
              errorEl.textContent = basicErr;
              errorEl.hidden = false;
            }
            return;
          }

          // Duplicate check (exclude the task being edited)
          if (isDuplicate(TodoWidget._tasks, newLabel, task.id)) {
            if (errorEl) {
              errorEl.textContent = 'A task with this name already exists.';
              errorEl.hidden = false;
            }
            return;
          }

          if (errorEl) {
            errorEl.hidden = true;
            errorEl.textContent = '';
          }

          TodoWidget._tasks = editTask(TodoWidget._tasks, task.id, newLabel);
          TodoWidget.persist();
          TodoWidget.render();
        });
      });
    };
  },
};

/* ── TodoEnhancements exports ────────────────────────────────────────── */
_exports.normaliseLabel    = normaliseLabel;
_exports.isDuplicate       = isDuplicate;
_exports.TodoEnhancements  = TodoEnhancements;

/* ── Wire TodoEnhancements into DOMContentLoaded ─────────────────────── */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    TodoEnhancements.init();
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   SORT CONTROL
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Returns a new array of tasks sorted by the given option.
 * Never mutates the input array. Uses a stable comparator.
 *
 * @param {Array<{id: string, label: string, done: boolean}>} tasks
 * @param {"default"|"az"|"za"|"incomplete-first"|"complete-first"} option
 * @returns {Array}
 */
function sortTasks(tasks, option) {
  // Shallow-copy to avoid mutating the original
  const copy = tasks.slice();

  switch (option) {
    case 'az':
      copy.sort((a, b) => a.label.localeCompare(b.label));
      break;
    case 'za':
      copy.sort((a, b) => b.label.localeCompare(a.label));
      break;
    case 'incomplete-first':
      // false (0) < true (1), so incomplete (done=false) sorts before complete (done=true)
      copy.sort((a, b) => Number(a.done) - Number(b.done));
      break;
    case 'complete-first':
      // true (1) > false (0), so complete (done=true) sorts before incomplete (done=false)
      copy.sort((a, b) => Number(b.done) - Number(a.done));
      break;
    case 'default':
    default:
      // Insertion order — no sort needed; copy already preserves original order
      break;
  }

  return copy;
}

const VALID_SORT_OPTIONS = ['default', 'az', 'za', 'incomplete-first', 'complete-first'];

const SortControl = {
  /** The currently active sort option */
  _option: 'default',

  /**
   * Returns a new sorted array without mutating the input.
   * @param {Array} tasks
   * @param {string} option
   * @returns {Array}
   */
  sort(tasks, option) {
    return sortTasks(tasks, option);
  },

  /**
   * Persists the sort option to localStorage.
   * @param {string} option
   */
  persist(option) {
    try {
      localStorage.setItem('dashboard_todo_sort', option);
    } catch (e) {
      console.warn('SortControl: failed to persist sort option', e);
    }
  },

  /**
   * Injects the sort <select> into #todo before #todo-list,
   * reads the stored sort option, monkey-patches TodoWidget.render,
   * and wires up the change listener.
   */
  init() {
    if (typeof document === 'undefined') return;

    const todoSection = document.getElementById('todo');
    const todoList    = document.getElementById('todo-list');

    if (!todoSection || !todoList) {
      console.error('SortControl: required DOM elements not found');
      return;
    }

    // --- Read stored sort option ---
    let storedOption = 'default';
    try {
      const raw = localStorage.getItem('dashboard_todo_sort');
      if (raw !== null && VALID_SORT_OPTIONS.includes(raw)) {
        storedOption = raw;
      }
    } catch (e) {
      console.warn('SortControl: failed to read sort option from localStorage', e);
    }
    this._option = storedOption;

    // --- Inject the sort control UI ---
    const wrapper = document.createElement('div');
    wrapper.className = 'sort-control';

    const label = document.createElement('label');
    label.setAttribute('for', 'sort-control-select');
    label.textContent = 'Sort: ';

    const select = document.createElement('select');
    select.id = 'sort-control-select';
    select.className = 'sort-control-select';

    const optionDefs = [
      { value: 'default',         text: 'Default' },
      { value: 'az',              text: 'A → Z' },
      { value: 'za',              text: 'Z → A' },
      { value: 'incomplete-first', text: 'Incomplete first' },
      { value: 'complete-first',  text: 'Complete first' },
    ];

    optionDefs.forEach(({ value, text }) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = text;
      if (value === this._option) opt.selected = true;
      select.appendChild(opt);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(select);

    // Insert before #todo-list
    todoSection.insertBefore(wrapper, todoList);

    // --- Monkey-patch TodoWidget.render ---
    const _origRender = TodoWidget.render.bind(TodoWidget);
    const self = this;

    TodoWidget.render = function () {
      // Save the original _tasks reference
      const originalTasks = TodoWidget._tasks;

      // Temporarily replace _tasks with the sorted version
      TodoWidget._tasks = sortTasks(originalTasks, self._option);

      // Call the original render (which reads TodoWidget._tasks)
      _origRender();

      // Restore the original unsorted _tasks
      TodoWidget._tasks = originalTasks;
    };

    // --- Wire up the change listener ---
    select.addEventListener('change', () => {
      this._option = select.value;
      this.persist(this._option);
      TodoWidget.render();
    });

    // Apply the initial sort by re-rendering
    TodoWidget.render();
  },
};

/* ── SortControl exports ─────────────────────────────────────────────── */
_exports.sortTasks   = sortTasks;
_exports.SortControl = SortControl;

/* ── Wire SortControl into DOMContentLoaded ──────────────────────────── */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    SortControl.init();
  });
}

/* ── Wire ThemeToggle + GreetingNameUI into DOMContentLoaded ─────────── */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    ThemeToggle.init();
    GreetingNameUI.init();
  });
}
