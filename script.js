/* ═══════════════════════════════════════════════════
   State
═══════════════════════════════════════════════════ */
let tasks = JSON.parse(localStorage.getItem('taskmaster-tasks') || '[]');
let currentFilter = 'all';

/* ═══════════════════════════════════════════════════
   DOM refs
═══════════════════════════════════════════════════ */
const form          = document.getElementById('todo-form');
const input         = document.getElementById('todo-input');
const pendingList   = document.getElementById('pending-list');
const completedList = document.getElementById('completed-list');
const counter       = document.getElementById('task-counter');
const clock         = document.getElementById('digital-clock');
const dateEl        = document.getElementById('current-date');
const filterBtns    = document.querySelectorAll('.filter-btn');
const clearBtn      = document.getElementById('clear-completed');
const progressFill  = document.getElementById('progress-fill');
const pendingSection   = document.getElementById('pending-section');
const completedSection = document.getElementById('completed-section');

/* ═══════════════════════════════════════════════════
   Clock & Date
═══════════════════════════════════════════════════ */
function updateTime() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString('en-US', { hour12: false });
  dateEl.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });
}
setInterval(updateTime, 1000);
updateTime();

/* ═══════════════════════════════════════════════════
   Persistence
═══════════════════════════════════════════════════ */
function saveTasks() {
  localStorage.setItem('taskmaster-tasks', JSON.stringify(tasks));
  render();
}

/* ═══════════════════════════════════════════════════
   Task actions
═══════════════════════════════════════════════════ */
function addTask(text) {
  if (!text.trim()) return;
  tasks.unshift({
    id: Date.now(),
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  });
  input.value = '';
  saveTasks();
}

function toggleTask(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTasks();
}

function deleteTask(id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (!el) return;
  el.classList.add('task-exit');
  setTimeout(() => {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
  }, 200);
}

function editTask(id, newText) {
  if (!newText.trim()) return;
  tasks = tasks.map(t => t.id === id ? { ...t, text: newText.trim() } : t);
  localStorage.setItem('taskmaster-tasks', JSON.stringify(tasks));
  // no full re-render needed; text is already live in DOM
}

/* ═══════════════════════════════════════════════════
   Build task <li>
═══════════════════════════════════════════════════ */
function createTaskEl(task) {
  const li = document.createElement('li');
  li.className = 'task-item task-enter';
  li.dataset.id = task.id;
  li.setAttribute('role', 'listitem');

  const done = task.completed;

  // Checkbox
  const checkBtn = document.createElement('button');
  checkBtn.className = 'task-check' + (done ? ' checked' : '');
  checkBtn.setAttribute('aria-label', done ? 'Mark as active' : 'Mark as completed');
  checkBtn.setAttribute('aria-pressed', String(done));
  checkBtn.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">check</span>';
  checkBtn.addEventListener('click', () => toggleTask(task.id));

  // Text
  const span = document.createElement('span');
  span.className = 'task-text' + (done ? ' completed-text' : '');
  span.textContent = task.text;
  span.setAttribute('contenteditable', done ? 'false' : 'true');
  span.setAttribute('aria-label', 'Task: ' + task.text);
  span.setAttribute('role', 'textbox');
  span.setAttribute('aria-multiline', 'false');
  span.addEventListener('blur', () => editTask(task.id, span.textContent));
  span.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); span.blur(); }
  });

  const left = document.createElement('div');
  left.className = 'task-left';
  left.append(checkBtn, span);

  // Delete
  const delBtn = document.createElement('button');
  delBtn.className = 'task-delete';
  delBtn.setAttribute('aria-label', 'Delete task');
  delBtn.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">delete</span>';
  delBtn.addEventListener('click', () => deleteTask(task.id));

  const actions = document.createElement('div');
  actions.className = 'task-actions';
  actions.append(delBtn);

  li.append(left, actions);
  return li;
}

/* ═══════════════════════════════════════════════════
   Render
═══════════════════════════════════════════════════ */
function render() {
  pendingList.innerHTML = '';
  completedList.innerHTML = '';

  let filtered = tasks;
  if (currentFilter === 'active')    filtered = tasks.filter(t => !t.completed);
  if (currentFilter === 'completed') filtered = tasks.filter(t =>  t.completed);

  const pending   = filtered.filter(t => !t.completed);
  const completed = filtered.filter(t =>  t.completed);

  pending.forEach(t   => pendingList.appendChild(createTaskEl(t)));
  completed.forEach(t => completedList.appendChild(createTaskEl(t)));

  // Empty states
  if (pendingList.children.length === 0 && currentFilter !== 'completed') {
    const p = document.createElement('p');
    p.className = 'empty-state';
    p.textContent = 'No active focus points.';
    pendingList.appendChild(p);
  }
  if (completedList.children.length === 0 && currentFilter !== 'active') {
    const p = document.createElement('p');
    p.className = 'empty-state';
    p.textContent = 'Archive empty.';
    completedList.appendChild(p);
  }

  // Visibility of sections
  pendingSection.style.display   = (currentFilter === 'completed') ? 'none' : '';
  completedSection.style.display = (currentFilter === 'active')    ? 'none' : '';

  // Counter
  const total = tasks.length;
  const done  = tasks.filter(t => t.completed).length;
  counter.textContent = `${done} of ${total} task${total !== 1 ? 's' : ''} completed`;

  // Progress
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  progressFill.style.width = pct + '%';
  progressFill.setAttribute('aria-valuenow', pct);
}

/* ═══════════════════════════════════════════════════
   Event listeners
═══════════════════════════════════════════════════ */
form.addEventListener('submit', e => {
  e.preventDefault();
  addTask(input.value);
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    currentFilter = btn.dataset.filter;
    render();
  });
});

clearBtn.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
});

/* ═══════════════════════════════════════════════════
   View Switcher (SPA routing)
═══════════════════════════════════════════════════ */
const views   = { tasks: 'view-tasks', calendar: 'view-calendar', analytics: 'view-analytics' };
const navLinks = document.querySelectorAll('.main-nav a[data-view]');
let activeView = 'tasks';

function switchView(name) {
  if (!views[name]) return;
  activeView = name;

  // hide / show view panels
  Object.values(views).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', id === views[name]);
  });

  // update nav links
  navLinks.forEach(a => {
    const isActive = a.dataset.view === name;
    a.classList.toggle('active', isActive);
    a.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  // render the chosen view
  if (name === 'calendar')  renderCalendar();
  if (name === 'analytics') renderAnalytics();
}

navLinks.forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    switchView(a.dataset.view);
  });
});

/* ═══════════════════════════════════════════════════
   Boot
═══════════════════════════════════════════════════ */
render();

/* ═══════════════════════════════════════════════════
   Profile Feature
═══════════════════════════════════════════════════ */
const AVATAR_COLORS = [
  '#2563eb','#7c3aed','#db2777','#dc2626',
  '#d97706','#16a34a','#0891b2','#9333ea'
];

// Default profile
const DEFAULT_PROFILE = {
  name: '',
  role: '',
  bio: '',
  avatarColor: AVATAR_COLORS[0],
  avatarImg: '',
  joinedAt: new Date().toISOString()
};

let profile = Object.assign({}, DEFAULT_PROFILE,
  JSON.parse(localStorage.getItem('taskmaster-profile') || '{}'));

// If no joinedAt, set now
if (!profile.joinedAt) {
  profile.joinedAt = new Date().toISOString();
  saveProfile();
}

function saveProfile() {
  localStorage.setItem('taskmaster-profile', JSON.stringify(profile));
}

function getInitials(name) {
  if (!name || !name.trim()) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/* ─── Sync UI from profile state ─────────────────── */
function applyProfileToUI() {
  const initials = getInitials(profile.name);

  // Header avatar
  const headerAvatar = document.getElementById('header-avatar-initials');
  const openBtn = document.getElementById('open-profile');
  if (profile.avatarImg) {
    headerAvatar.innerHTML = `<img src="${profile.avatarImg}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`;
  } else {
    headerAvatar.textContent = initials;
    openBtn.style.background = profile.avatarColor;
  }

  // Panel large avatar
  const avatarLargeEl = document.getElementById('avatar-large');
  const initialsLarge = document.getElementById('avatar-initials-large');
  if (profile.avatarImg) {
    initialsLarge.innerHTML = `<img src="${profile.avatarImg}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`;
  } else {
    initialsLarge.textContent = initials;
    avatarLargeEl.style.background = profile.avatarColor;
  }

  // Form fields
  document.getElementById('profile-name').value = profile.name;
  document.getElementById('profile-role').value = profile.role;
  document.getElementById('profile-bio').value  = profile.bio;

  // Joined date
  const joined = new Date(profile.joinedAt);
  document.getElementById('profile-joined').textContent =
    'Member since ' + joined.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Color swatches
  const swatchContainer = document.getElementById('color-swatches');
  swatchContainer.innerHTML = '';
  AVATAR_COLORS.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'color-swatch' + (c === profile.avatarColor ? ' selected' : '');
    btn.style.background = c;
    btn.setAttribute('aria-label', 'Avatar color ' + c);
    btn.title = c;
    btn.addEventListener('click', () => {
      profile.avatarColor = c;
      profile.avatarImg = '';  // clear custom photo when picking color
      applyProfileToUI();
    });
    swatchContainer.appendChild(btn);
  });

  // Stats
  const total = tasks.length;
  const done  = tasks.filter(t => t.completed).length;
  const rate  = total === 0 ? 0 : Math.round((done / total) * 100);
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-done').textContent  = done;
  document.getElementById('stat-rate').textContent  = rate + '%';
}

/* ─── Panel open / close ─────────────────────────── */
const profileOverlay = document.getElementById('profile-overlay');
const profilePanel   = document.getElementById('profile-panel');

function openProfile() {
  applyProfileToUI();
  profilePanel.classList.add('open');
  profileOverlay.classList.add('open');
  profilePanel.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  document.getElementById('profile-name').focus();
}

function closeProfile() {
  profilePanel.classList.remove('open');
  profileOverlay.classList.remove('open');
  profilePanel.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.getElementById('open-profile').addEventListener('click', openProfile);
document.getElementById('close-profile').addEventListener('click', closeProfile);
profileOverlay.addEventListener('click', closeProfile);

// Esc key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && profilePanel.classList.contains('open')) closeProfile();
});

/* ─── Save profile ───────────────────────────────── */
document.getElementById('profile-save').addEventListener('click', () => {
  profile.name = document.getElementById('profile-name').value.trim();
  profile.role = document.getElementById('profile-role').value.trim();
  profile.bio  = document.getElementById('profile-bio').value.trim();
  saveProfile();
  applyProfileToUI();
  showToast('✓ Profile saved!');
});

/* ─── Avatar photo upload ────────────────────────── */
document.getElementById('avatar-upload').addEventListener('change', function() {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    profile.avatarImg = e.target.result;
    applyProfileToUI();
  };
  reader.readAsDataURL(file);
});

/* ─── Reset / danger ────────────────────────────── */
document.getElementById('reset-data').addEventListener('click', () => {
  if (!confirm('Delete ALL tasks permanently? This cannot be undone.')) return;
  tasks = [];
  saveTasks();
  showToast('All tasks deleted.');
});

/* ─── Toast helper ───────────────────────────────── */
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ─── Boot profile ───────────────────────────────── */
applyProfileToUI();

/* ═══════════════════════════════════════════════════
   CALENDAR
═══════════════════════════════════════════════════ */
let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-based
let calSelectedDate = null; // 'YYYY-MM-DD'

function dateKey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

// Build a map: 'YYYY-MM-DD' -> { added: n, done: n }
function buildDayMap() {
  const map = {};
  tasks.forEach(t => {
    if (!t.createdAt) return;
    const d = new Date(t.createdAt);
    const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
    if (!map[key]) map[key] = { tasks: [] };
    map[key].tasks.push(t);
  });
  return map;
}

function renderCalendar() {
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const today = new Date();
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  document.getElementById('cal-month-label').textContent = `${MONTHS[calMonth]} ${calYear}`;

  const dayMap = buildDayMap();
  const container = document.getElementById('cal-days');
  container.innerHTML = '';

  // First day of month (0=Sun)
  const firstDow = new Date(calYear, calMonth, 1).getDay();
  // Days in month
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  // Days in prev month
  const daysInPrev = new Date(calYear, calMonth, 0).getDate();

  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell';

    let day, month, year, isOther = false;
    if (i < firstDow) {
      day = daysInPrev - firstDow + i + 1;
      month = calMonth - 1; year = calYear;
      if (month < 0) { month = 11; year--; }
      isOther = true;
    } else if (i >= firstDow + daysInMonth) {
      day = i - firstDow - daysInMonth + 1;
      month = calMonth + 1; year = calYear;
      if (month > 11) { month = 0; year++; }
      isOther = true;
    } else {
      day = i - firstDow + 1;
      month = calMonth; year = calYear;
    }

    const key = dateKey(year, month, day);
    if (isOther) cell.classList.add('other-month');
    if (key === todayKey) cell.classList.add('today');
    if (key === calSelectedDate) cell.classList.add('selected');

    const numEl = document.createElement('div');
    numEl.className = 'cal-day-num';
    numEl.textContent = day;
    cell.appendChild(numEl);

    // Dots
    if (dayMap[key] && !isOther) {
      const dotsEl = document.createElement('div');
      dotsEl.className = 'cal-dots';
      const list = dayMap[key].tasks;
      const show = Math.min(list.length, 7);
      for (let k = 0; k < show; k++) {
        const dot = document.createElement('span');
        dot.className = 'cal-dot' + (list[k].completed ? ' done' : '');
        dotsEl.appendChild(dot);
      }
      cell.appendChild(dotsEl);
    }

    if (!isOther) {
      cell.addEventListener('click', () => {
        calSelectedDate = key;
        renderCalendar();
        renderDayDetail(key, dayMap);
      });
    }

    container.appendChild(cell);
  }

  // If a date was selected, re-render detail
  if (calSelectedDate) renderDayDetail(calSelectedDate, dayMap);
}

function renderDayDetail(key, dayMap) {
  const detail = document.getElementById('cal-detail');
  const [y, m, d] = key.split('-').map(Number);
  const label = new Date(y, m-1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const taskList = (dayMap[key] || {}).tasks || [];
  let html = `<p class="cal-detail-heading">${label}</p>`;
  if (taskList.length === 0) {
    html += `<p class="cal-detail-empty">No tasks on this day.</p>`;
  } else {
    taskList.forEach(t => {
      html += `<div class="cal-detail-task${t.completed ? ' done-task' : ''}">
        <span class="material-symbols-outlined" style="font-size:16px;color:${t.completed ? 'var(--color-on-secondary-fixed-variant)' : 'var(--color-primary)'}">${t.completed ? 'check_circle' : 'radio_button_unchecked'}</span>
        ${t.text}
      </div>`;
    });
  }
  detail.innerHTML = html;
}

document.getElementById('cal-prev').addEventListener('click', () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
});
document.getElementById('cal-next').addEventListener('click', () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
});

/* ═══════════════════════════════════════════════════
   ANALYTICS
═══════════════════════════════════════════════════ */
function renderAnalytics() {
  const total  = tasks.length;
  const done   = tasks.filter(t => t.completed).length;
  const active = total - done;
  const rate   = total === 0 ? 0 : Math.round((done / total) * 100);

  document.getElementById('kpi-total').textContent  = total;
  document.getElementById('kpi-done').textContent   = done;
  document.getElementById('kpi-active').textContent = active;
  document.getElementById('kpi-rate').textContent   = rate + '%';

  drawDonut(done, active);
  drawBar();
  drawRecentList();
}

/* ── Donut chart ── */
function drawDonut(done, active) {
  const canvas = document.getElementById('chart-donut');
  const W = canvas.parentElement.clientWidth || 300;
  canvas.width  = W;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, 200);

  const cx = W / 2, cy = 100, r = 72, thick = 22;
  const total = done + active || 1;
  const doneAngle    = (done    / total) * Math.PI * 2;
  const activeAngle  = (active  / total) * Math.PI * 2;

  const drawArc = (start, end, color) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, start - Math.PI/2, end - Math.PI/2, false);
    ctx.lineWidth = thick;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  // Track
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.lineWidth = thick;
  ctx.strokeStyle = 'rgba(67,70,85,0.35)';
  ctx.stroke();

  // Done arc
  if (done > 0)    drawArc(0, doneAngle, '#b4c5ff');
  // Active arc
  if (active > 0)  drawArc(doneAngle, doneAngle + activeAngle, '#5e6e85');

  // Centre text
  const pct = total === 1 && done === 0 ? 0 : Math.round((done / total) * 100);
  ctx.fillStyle = '#e0e3e5';
  ctx.font      = 'bold 28px Inter, system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pct + '%', cx, cy - 8);
  ctx.fillStyle = '#8d90a0';
  ctx.font      = '12px Inter, system-ui';
  ctx.fillText('completed', cx, cy + 18);
}

/* ── Bar chart (last 7 days) ── */
function drawBar() {
  const canvas = document.getElementById('chart-bar');
  const W = canvas.parentElement.clientWidth || 300;
  canvas.width  = W;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, 200);

  // Build last-7-days counts
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    const count = tasks.filter(t => {
      if (!t.createdAt) return false;
      const td = new Date(t.createdAt);
      return dateKey(td.getFullYear(), td.getMonth(), td.getDate()) === key;
    }).length;
    days.push({ label, count });
  }

  const maxVal = Math.max(...days.map(d => d.count), 1);
  const padL = 8, padR = 8, padT = 16, padB = 36;
  const chartW = W - padL - padR;
  const chartH = 200 - padT - padB;
  const barW = (chartW / days.length) * 0.55;
  const gap  = (chartW / days.length);

  // Grid lines
  ctx.strokeStyle = 'rgba(67,70,85,0.25)';
  ctx.lineWidth = 1;
  [0, 0.5, 1].forEach(frac => {
    const y = padT + chartH * (1 - frac);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
  });

  // Bars
  days.forEach((day, i) => {
    const x = padL + gap * i + (gap - barW) / 2;
    const barH = (day.count / maxVal) * chartH;
    const y = padT + chartH - barH;

    // Gradient
    const grad = ctx.createLinearGradient(0, y, 0, padT + chartH);
    grad.addColorStop(0,   'rgba(180,197,255,0.85)');
    grad.addColorStop(1,   'rgba(37,99,235,0.35)');

    const radius = Math.min(6, barW / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + barW - radius, y);
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
    ctx.lineTo(x + barW, padT + chartH);
    ctx.lineTo(x, padT + chartH);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fillStyle = day.count > 0 ? grad : 'rgba(67,70,85,0.2)';
    ctx.fill();

    // Count label on bar
    if (day.count > 0) {
      ctx.fillStyle = '#b4c5ff';
      ctx.font = 'bold 11px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(day.count, x + barW/2, y - 5);
    }

    // Day label
    ctx.fillStyle = '#8d90a0';
    ctx.font = '11px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(day.label, x + barW/2, padT + chartH + 16);
  });
}

/* ── Recent tasks list ── */
function drawRecentList() {
  const container = document.getElementById('ana-recent-list');
  const sorted = [...tasks].sort((a, b) => b.id - a.id).slice(0, 8);
  if (sorted.length === 0) {
    container.innerHTML = '<p style="font-size:14px;font-style:italic;color:rgba(195,198,215,0.4);">No tasks yet.</p>';
    return;
  }
  container.innerHTML = sorted.map(t => {
    const d = new Date(t.createdAt || t.id);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `<div class="ana-task-row">
      <span class="ana-task-badge" style="background:${t.completed ? 'var(--color-on-secondary-fixed-variant)' : 'var(--color-primary)'}"></span>
      <span style="${t.completed ? 'text-decoration:line-through;color:var(--color-on-surface-variant)' : ''}">${t.text}</span>
      <span class="ana-task-date">${label}</span>
    </div>`;
  }).join('');
}

/* Re-render analytics charts on window resize */
window.addEventListener('resize', () => {
  if (activeView === 'analytics') renderAnalytics();
});
