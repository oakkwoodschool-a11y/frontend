const API_BASE = 'https://server-zt4j.onrender.com';
const TOKEN_KEY = 'ows_admin_token';

const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const refreshAppsBtn = document.getElementById('refreshAppsBtn');
const admissionsOpenEl = document.getElementById('admissionsOpen');
const sessionLabelEl = document.getElementById('sessionLabel');
const settingsMessage = document.getElementById('settingsMessage');
const admissionsStateText = document.getElementById('admissionsStateText');
const appsBody = document.getElementById('appsBody');

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

function showLogin(message) {
  dashboardScreen.hidden = true;
  loginScreen.hidden = false;
  if (message) {
    loginError.hidden = false;
    loginError.textContent = message;
  }
}

function showDashboard() {
  loginScreen.hidden = true;
  dashboardScreen.hidden = false;
}

async function api(path, options = {}) {
  const { skipAuthRedirect, ...fetchOptions } = options;
  const headers = { 'Content-Type': 'application/json', ...(fetchOptions.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401 && !skipAuthRedirect) {
    clearToken();
    showLogin(data.message || 'Session expired. Please log in again.');
    throw new Error('unauthorized');
  }

  return { response, data };
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const { response, data } = await api('/admin/login', {
      method: 'POST',
      skipAuthRedirect: true,
      body: JSON.stringify({ username, password })
    });

    if (!response.ok || !data.token) {
      loginError.hidden = false;
      loginError.textContent = data.message || 'Invalid username or password.';
      return;
    }

    setToken(data.token);
    showDashboard();
    await loadDashboard();
  } catch (err) {
    if (err.message !== 'unauthorized') {
      loginError.hidden = false;
      loginError.textContent = 'Unable to connect to the server. Please try again.';
    }
  }
});

logoutBtn.addEventListener('click', () => {
  clearToken();
  showLogin();
});

function updateAdmissionsStateText() {
  admissionsStateText.textContent = admissionsOpenEl.checked ? 'Enabled' : 'Disabled';
}

let saveTimer;
function scheduleSave() {
  updateAdmissionsStateText();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveSettings, 150);
}

async function saveSettings() {
  settingsMessage.hidden = true;
  admissionsOpenEl.disabled = true;
  sessionLabelEl.disabled = true;

  try {
    const { response, data } = await api('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({
        admissionsOpen: admissionsOpenEl.checked,
        sessionLabel: sessionLabelEl.value.trim()
      })
    });

    settingsMessage.hidden = false;
    if (response.ok && data.success) {
      settingsMessage.className = 'settings-message ok';
      settingsMessage.textContent = admissionsOpenEl.checked
        ? 'Admissions enabled.'
        : 'Admissions disabled.';
      admissionsOpenEl.checked = data.admissionsOpen;
      sessionLabelEl.value = data.sessionLabel;
      updateAdmissionsStateText();
      setTimeout(() => { settingsMessage.hidden = true; }, 2500);
    } else {
      settingsMessage.className = 'settings-message err';
      settingsMessage.textContent = data.message || 'Could not save settings.';
    }
  } catch (err) {
    if (err.message !== 'unauthorized') {
      settingsMessage.hidden = false;
      settingsMessage.className = 'settings-message err';
      settingsMessage.textContent = 'Unable to save settings. Please try again.';
    }
  } finally {
    admissionsOpenEl.disabled = false;
    sessionLabelEl.disabled = false;
  }
}

admissionsOpenEl.addEventListener('change', scheduleSave);

sessionLabelEl.addEventListener('change', scheduleSave);
sessionLabelEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sessionLabelEl.blur();
  }
});

refreshAppsBtn.addEventListener('click', loadApplications);

async function loadDashboard() {
  await Promise.all([loadSettings(), loadApplications()]);
}

async function loadSettings() {
  const { data } = await api('/settings');
  admissionsOpenEl.checked = Boolean(data.admissionsOpen);
  sessionLabelEl.value = data.sessionLabel || '';
  updateAdmissionsStateText();
}

function formatClass(value) {
  const map = {
    nursery: 'Nursery',
    lkg: 'LKG',
    ukg: 'UKG',
    class1: 'Class I',
    class2: 'Class II',
    class3: 'Class III',
    class4: 'Class IV',
    class5: 'Class V',
    class6: 'Class VI',
    class7: 'Class VII',
    class8: 'Class VIII'
  };
  return map[value] || value || '—';
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

async function loadApplications() {
  appsBody.innerHTML = '<tr><td colspan="7">Loading applications…</td></tr>';
  try {
    const { data } = await api('/admissions');
    const rows = data.data || [];
    if (!rows.length) {
      appsBody.innerHTML = '<tr><td colspan="7">No applications yet.</td></tr>';
      return;
    }

    appsBody.innerHTML = rows.map((row) => {
      const isContact = row.inquiryType === 'contact';
      return `
      <tr>
        <td>${row.applicationId || '—'}</td>
        <td>${escapeHtml(isContact ? row.parentName : row.studentName)}</td>
        <td>${isContact ? 'Contact' : formatClass(row.classApplied)}</td>
        <td>${escapeHtml(row.parentName)}</td>
        <td>${escapeHtml(row.parentPhone)}</td>
        <td>${formatDate(row.submittedAt)}</td>
        <td>
          <select class="status-select" data-id="${row._id}">
            ${['pending', 'reviewed', 'accepted', 'rejected'].map((status) => `
              <option value="${status}" ${row.status === status ? 'selected' : ''}>${status}</option>
            `).join('')}
          </select>
        </td>
      </tr>
    `;
    }).join('');
  } catch (err) {
    if (err.message !== 'unauthorized') {
      appsBody.innerHTML = '<tr><td colspan="7">Could not load applications.</td></tr>';
    }
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

appsBody.addEventListener('change', async (e) => {
  const select = e.target.closest('.status-select');
  if (!select) return;

  try {
    await api(`/admissions/${select.dataset.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: select.value })
    });
  } catch (err) {
    if (err.message !== 'unauthorized') {
      alert('Could not update status.');
    }
  }
});

if (getToken()) {
  showDashboard();
  loadDashboard().catch(() => showLogin('Please log in again.'));
}
