(() => {
  'use strict';

  const API = 'http://localhost:5258';

  let userId = null;

  // ── Auth helpers ──────────────────────────────────────────────────────────
  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  function toast(msg, type = 'success') {
    const container = document.getElementById('pfToasts');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `pf-toast ${type}`;
    el.innerHTML = `
      <ion-icon name="${type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}" class="pf-toast-icon"></ion-icon>
      <span>${msg}</span>`;

    container.appendChild(el);

    setTimeout(() => {
      el.classList.add('leaving');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, 3000);
  }

  // ── Field error helpers ───────────────────────────────────────────────────
  function showErr(errId, inputId, msg) {
    const errEl = document.getElementById(errId);
    const inpEl = document.getElementById(inputId);
    if (errEl) { errEl.textContent = msg; errEl.classList.add('visible'); }
    if (inpEl) inpEl.classList.add('error');
  }

  function clearErr(errId, inputId) {
    const errEl = document.getElementById(errId);
    const inpEl = document.getElementById(inputId);
    if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
    if (inpEl) inpEl.classList.remove('error');
  }

  function clearErrs(...pairs) {
    for (const [errId, inputId] of pairs) clearErr(errId, inputId);
  }

  // ── Load profile ──────────────────────────────────────────────────────────
  async function loadProfile() {
    try {
      let res = await fetch(`${API}/api/auth/me`, { headers: authHeaders() });

      if (res.status === 401) {
        const refreshed = await window.CPI?.silentRefresh?.();
        if (refreshed) res = await fetch(`${API}/api/auth/me`, { headers: authHeaders() });
        if (res.status === 401) { window.CPI?.sessionLogout?.(); return; }
      }

      if (!res.ok) throw new Error();
      const user = await res.json();

      userId = parseInt(user.id ?? user.Id, 10);

      const username = user.username ?? user.Username ?? '';
      const email    = user.email    ?? user.Email    ?? '';
      const role     = user.role     ?? user.Role     ?? '';

      // Avatar initials (up to 2 chars, strip non-alpha from start)
      const clean    = username.replace(/[^a-zA-Z]/g, '') || username;
      const initials = clean.slice(0, 2).toUpperCase() || '?';
      document.getElementById('pfAvatar').textContent = initials;

      document.getElementById('pfName').textContent         = username;
      document.getElementById('pfEmailDisplay').textContent = email;

      const badge = document.getElementById('pfRoleBadge');
      badge.textContent = role;
      badge.className   = `pf-role-badge pf-role-${role.toLowerCase()}`;

      document.getElementById('inpUsername').value = username;
      document.getElementById('inpEmail').value    = email;

    } catch {
      toast('Could not load profile data.', 'error');
    }
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  function initTabs() {
    document.querySelectorAll('.pf-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.pf-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.pf-panel').forEach(p => p.classList.add('hidden'));
        btn.classList.add('active');
        document.getElementById(`tab-${tab}`)?.classList.remove('hidden');
      });
    });
  }

  // ── Show/hide password toggles ────────────────────────────────────────────
  function initEyeToggles() {
    document.querySelectorAll('.pf-eye').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = document.getElementById(btn.dataset.target);
        if (!inp) return;
        const showing = inp.type === 'text';
        inp.type = showing ? 'password' : 'text';
        const icon = btn.querySelector('ion-icon');
        if (icon) icon.name = showing ? 'eye-outline' : 'eye-off-outline';
      });
    });
  }

  // ── Password strength ─────────────────────────────────────────────────────
  function calcStrength(pw) {
    let score = 0;
    if (pw.length >= 8)              score++;
    if (/[A-Z]/.test(pw))            score++;
    if (/[0-9]/.test(pw))            score++;
    if (/[^A-Za-z0-9]/.test(pw))     score++;
    return score;
  }

  function updateStrength(pw) {
    const score  = pw ? calcStrength(pw) : 0;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', 'weak', 'fair', 'good', 'strong'];

    for (let i = 0; i < 4; i++) {
      const bar = document.getElementById(`sb${i}`);
      if (!bar) continue;
      bar.className = (i < score && score > 0) ? colors[score] : '';
    }
    const lbl = document.getElementById('pwStrengthLabel');
    if (lbl) lbl.textContent = pw ? labels[score] : '';
  }

  // ── Save Username ─────────────────────────────────────────────────────────
  async function saveUsername() {
    clearErrs(['errUsername', 'inpUsername']);
    const username = document.getElementById('inpUsername').value.trim();

    if (!username) { showErr('errUsername', 'inpUsername', 'Username is required.'); return; }
    if (username.length < 3) { showErr('errUsername', 'inpUsername', 'Minimum 3 characters.'); return; }

    const btn = document.getElementById('btnSaveUsername');
    btn.disabled    = true;
    btn.textContent = 'Saving…';

    try {
      const res = await fetch(`${API}/api/users/${userId}/username`, {
        method:  'PUT',
        headers: authHeaders(),
        body:    JSON.stringify({ username })
      });

      if (res.status === 401) { window.CPI?.sessionLogout?.(); return; }
      if (res.status === 403) { showErr('errUsername', 'inpUsername', 'Not allowed.'); return; }
      if (res.status === 409) { showErr('errUsername', 'inpUsername', 'Username already taken.'); return; }
      if (!res.ok)            { showErr('errUsername', 'inpUsername', 'Failed to update. Try again.'); return; }

      // Update hero display and localStorage
      document.getElementById('pfName').textContent = username;
      const clean    = username.replace(/[^a-zA-Z]/g, '') || username;
      document.getElementById('pfAvatar').textContent = clean.slice(0, 2).toUpperCase();
      updateLocalUser({ username });
      toast('Username updated successfully!');

    } catch {
      showErr('errUsername', 'inpUsername', 'Network error. Try again.');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Save Username';
    }
  }

  // ── Save Email ────────────────────────────────────────────────────────────
  async function saveEmail() {
    clearErrs(
      ['errEmail', 'inpEmail'],
      ['errEmailPass', 'inpEmailPass']
    );

    const email    = document.getElementById('inpEmail').value.trim();
    const password = document.getElementById('inpEmailPass').value;

    if (!email) { showErr('errEmail', 'inpEmail', 'Email is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showErr('errEmail', 'inpEmail', 'Enter a valid email address.');
      return;
    }
    if (!password) { showErr('errEmailPass', 'inpEmailPass', 'Password is required.'); return; }

    const btn = document.getElementById('btnSaveEmail');
    btn.disabled    = true;
    btn.textContent = 'Saving…';

    try {
      const res = await fetch(`${API}/api/users/${userId}/email`, {
        method:  'PUT',
        headers: authHeaders(),
        body:    JSON.stringify({ email, password })
      });

      if (res.status === 401) { showErr('errEmailPass', 'inpEmailPass', 'Wrong password.'); return; }
      if (res.status === 403) { showErr('errEmail', 'inpEmail', 'Not allowed.'); return; }
      if (res.status === 409) { showErr('errEmail', 'inpEmail', 'Email already taken.'); return; }
      if (!res.ok)            { showErr('errEmail', 'inpEmail', 'Failed to update. Try again.'); return; }

      document.getElementById('pfEmailDisplay').textContent = email;
      document.getElementById('inpEmailPass').value = '';
      updateLocalUser({ email });
      toast('Email updated successfully!');

    } catch {
      showErr('errEmail', 'inpEmail', 'Network error. Try again.');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Update Email';
    }
  }

  // ── Save Password ─────────────────────────────────────────────────────────
  async function savePassword() {
    clearErrs(
      ['errCurrentPass', 'inpCurrentPass'],
      ['errNewPass',     'inpNewPass'],
      ['errConfirmPass', 'inpConfirmPass']
    );

    const currentPw = document.getElementById('inpCurrentPass').value;
    const newPw     = document.getElementById('inpNewPass').value;
    const confirmPw = document.getElementById('inpConfirmPass').value;

    if (!currentPw) { showErr('errCurrentPass', 'inpCurrentPass', 'Current password is required.'); return; }
    if (!newPw)     { showErr('errNewPass',     'inpNewPass',     'New password is required.');     return; }
    if (newPw.length < 8) { showErr('errNewPass', 'inpNewPass', 'Minimum 8 characters.'); return; }
    if (newPw !== confirmPw) {
      showErr('errConfirmPass', 'inpConfirmPass', 'Passwords do not match.');
      return;
    }

    const btn = document.getElementById('btnSavePassword');
    btn.disabled    = true;
    btn.textContent = 'Saving…';

    try {
      const res = await fetch(`${API}/api/users/${userId}/password`, {
        method:  'PUT',
        headers: authHeaders(),
        body:    JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
      });

      if (res.status === 401) { showErr('errCurrentPass', 'inpCurrentPass', 'Wrong current password.'); return; }
      if (res.status === 403) { showErr('errCurrentPass', 'inpCurrentPass', 'Not allowed.'); return; }
      if (!res.ok)            { showErr('errCurrentPass', 'inpCurrentPass', 'Failed to update. Try again.'); return; }

      document.getElementById('inpCurrentPass').value = '';
      document.getElementById('inpNewPass').value     = '';
      document.getElementById('inpConfirmPass').value = '';
      updateStrength('');
      toast('Password changed successfully!');

    } catch {
      showErr('errCurrentPass', 'inpCurrentPass', 'Network error. Try again.');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Change Password';
    }
  }

  // ── Update localStorage user object ───────────────────────────────────────
  function updateLocalUser(patch) {
    try {
      const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, ...patch }));
    } catch { /* ignore */ }
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    initTabs();
    initEyeToggles();

    document.getElementById('btnSaveUsername')?.addEventListener('click', saveUsername);
    document.getElementById('btnSaveEmail')   ?.addEventListener('click', saveEmail);
    document.getElementById('btnSavePassword')?.addEventListener('click', savePassword);

    // Live strength meter
    document.getElementById('inpNewPass')?.addEventListener('input', e => {
      updateStrength(e.target.value);
      clearErr('errNewPass', 'inpNewPass');
    });

    // Clear errors on input
    const pairs = [
      ['inpUsername', 'errUsername'],
      ['inpEmail',    'errEmail'],
      ['inpEmailPass','errEmailPass'],
      ['inpCurrentPass','errCurrentPass'],
      ['inpConfirmPass','errConfirmPass'],
    ];
    pairs.forEach(([inputId, errId]) => {
      document.getElementById(inputId)?.addEventListener('input', () => {
        clearErr(errId, inputId);
      });
    });
  });
})();
