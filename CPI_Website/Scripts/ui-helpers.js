(() => {
  'use strict';

  // ── Configuración ────────────────────────────────────────────────────────────
  const API_URL      = 'http://localhost:5258';
  const LOGIN_URL    = '../Landing Page/Login.html';
  const WARN_AFTER   = 10 * 60 * 1000;
  const GRACE_PERIOD =  5 * 60 * 1000;

  // ── Password Toggle ──────────────────────────────────────────────────────────
  function initPasswordToggles() {
    document.querySelectorAll('.input-box').forEach(box => {
      const input = box.querySelector('input[type="password"]');
      const icon  = box.querySelector('i.bx');
      if (!input || !icon) return;

      icon.style.cursor     = 'pointer';
      icon.style.userSelect = 'none';
      icon.title = 'Mostrar / Ocultar contraseña';

      icon.addEventListener('click', () => {
        const isHidden = input.type === 'password';
        input.type     = isHidden ? 'text' : 'password';
        icon.className = isHidden ? 'bx bx-show' : 'bx bxs-lock-alt';
      });
    });
  }

  // ── JWT helpers ──────────────────────────────────────────────────────────────
  // .NET serializes ClaimTypes.Role with this full URI in the JWT payload
  const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

  function parsePayload(token) {
    try {
      const b64 = (token.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(b64));
    } catch { return null; }
  }

  function isTokenExpired(token) {
    const p = parsePayload(token);
    return !p || p.exp * 1000 < Date.now();
  }

  function getTokenPayload() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return parsePayload(token);
  }

  function getTokenRole() {
    const payload = getTokenPayload();
    if (!payload) return null;
    return payload[ROLE_CLAIM] || payload.role || null;
  }

  // ── Estilos del modal ────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('cpi-ui-styles')) return;
    const s = document.createElement('style');
    s.id = 'cpi-ui-styles';
    s.textContent = `
      #cpi-overlay {
        display: none; position: fixed; inset: 0;
        background: rgba(0,0,0,.65); backdrop-filter: blur(5px);
        z-index: 99999; align-items: center; justify-content: center;
      }
      #cpi-overlay.visible { display: flex; }
      #cpi-modal {
        background: #1f2937; border: 1px solid #374151; border-radius: 14px;
        padding: 2.25rem 2.5rem; max-width: 400px; width: 90%;
        text-align: center; color: #f9fafb;
        box-shadow: 0 24px 64px rgba(0,0,0,.6);
        animation: cpi-pop .25s ease;
      }
      @keyframes cpi-pop {
        from { transform: scale(.9); opacity: 0; }
        to   { transform: scale(1);  opacity: 1; }
      }
      #cpi-modal h2 { margin: 0 0 .6rem; font-size: 1.3rem; }
      #cpi-modal p  { margin: 0 0 .35rem; color: #9ca3af; font-size: .95rem; }
      #cpi-countdown { font-weight: 700; color: #f97316; font-size: 1.1rem; }
      #cpi-keep-btn {
        margin-top: 1.5rem; width: 100%; padding: .8rem 1.5rem;
        background: #6366f1; color: #fff; border: none; border-radius: 8px;
        font-size: 1rem; font-weight: 600; cursor: pointer;
        transition: background .2s;
      }
      #cpi-keep-btn:hover { background: #4f46e5; }
    `;
    document.head.appendChild(s);
  }

  function buildModal() {
    injectStyles();
    const el = document.createElement('div');
    el.id = 'cpi-overlay';
    el.innerHTML = `
      <div id="cpi-modal">
        <h2>⏳ Are you still active?</h2>
        <p>Your session will end due to inactivity.</p>
        <p>Time remaining: <span id="cpi-countdown">5:00</span></p>
        <button id="cpi-keep-btn">Yes, keep me logged in</button>
      </div>`;
    document.body.appendChild(el);
    return el;
  }

  // ── Timers ───────────────────────────────────────────────────────────────────
  let warnTimer, graceTimer, countdownTick, refreshInterval, overlay;

  // Retorna true si el refresh fue exitoso, false si el server lo rechazó,
  // null si hubo error de red (no cerrar sesión en ese caso).
  async function silentRefresh() {
    const rt = localStorage.getItem('refreshToken');
    if (!rt) return false;
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt })
      });
      if (res.ok) {
        const d = await res.json();
        localStorage.setItem('token', d.token || d.Token);
        localStorage.setItem('refreshToken', d.refreshToken || d.RefreshToken);
        // Mantiene user sincronizado con el rol actualizado
        try {
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          stored.username = d.username || d.Username || stored.username;
          stored.email    = d.email    || d.Email    || stored.email;
          stored.role     = d.role     || d.Role     || stored.role;
          localStorage.setItem('user', JSON.stringify(stored));
        } catch { /* best-effort */ }
        return true;
      }
      return false;
    } catch {
      return null; // error de red — no cerrar sesión agresivamente
    }
  }

  async function sessionLogout() {
    clearTimeout(warnTimer);
    clearTimeout(graceTimer);
    clearInterval(countdownTick);
    clearInterval(refreshInterval);

    const rt = localStorage.getItem('refreshToken');
    if (rt) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt })
        });
      } catch { /* best-effort */ }
    }

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = LOGIN_URL;
  }

  function hideModal() {
    overlay?.classList.remove('visible');
    clearTimeout(graceTimer);
    clearInterval(countdownTick);
  }

  function showWarningModal() {
    if (!overlay) return;
    overlay.classList.add('visible');

    const deadline = Date.now() + GRACE_PERIOD;

    function tick() {
      const ms  = Math.max(0, deadline - Date.now());
      const sec = Math.ceil(ms / 1000);
      const el  = document.getElementById('cpi-countdown');
      if (el) el.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
      if (ms <= 0) { clearInterval(countdownTick); sessionLogout(); }
    }

    tick();
    countdownTick = setInterval(tick, 1000);
    graceTimer    = setTimeout(sessionLogout, GRACE_PERIOD);
  }

  function resetInactivityTimer() {
    clearTimeout(warnTimer);
    hideModal();
    warnTimer = setTimeout(showWarningModal, WARN_AFTER);
  }

  // ── initSession — llamar en páginas protegidas ────────────────────────────────
  async function initSession() {
    const token = localStorage.getItem('token');

    // Sin token o token expirado → intentar refresh primero
    if (!token || isTokenExpired(token)) {
      const refreshed = await silentRefresh();
      if (!refreshed) {
        // false = server rechazó; null = red caída pero tampoco hay token válido
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = LOGIN_URL;
        return;
      }
    }

    document.body.style.visibility = 'visible';

    overlay = buildModal();

    document.getElementById('cpi-keep-btn')?.addEventListener('click', async () => {
      hideModal();
      resetInactivityTimer();
      const res = await silentRefresh();
      if (res === false) sessionLogout();
    });

    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt =>
      document.addEventListener(evt, resetInactivityTimer, { passive: true })
    );

    resetInactivityTimer();

    // Refresh periódico cada 14 min; logout si el server lo rechaza
    refreshInterval = setInterval(async () => {
      const ok = await silentRefresh();
      if (ok === false) sessionLogout();
    }, 14 * 60 * 1000);

    initPasswordToggles();
  }

  // ── checkAuth — guard síncrono, llamar como primer script en páginas protegidas
  function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) { location.replace(LOGIN_URL); return; }

    const payload = parsePayload(token);
    if (!payload || (payload.exp * 1000) < Date.now()) {
      localStorage.removeItem('token');
      location.replace(LOGIN_URL);
    }
  }

  // ── checkAdminAccess — guard síncrono para páginas exclusivas de Admin
  function checkAdminAccess() {
    checkAuth();                          // primero verifica token válido
    const role = getTokenRole();
    if (role !== 'Admin') location.replace('Dashboard.html');
  }

  // ── API pública ──────────────────────────────────────────────────────────────
  window.checkAuth        = checkAuth;
  window.checkAdminAccess = checkAdminAccess;
  window.getTokenRole     = getTokenRole;
  window.getTokenPayload  = getTokenPayload;
  window.CPI = { initPasswordToggles, initSession, silentRefresh, sessionLogout, checkAuth, checkAdminAccess, getTokenRole, getTokenPayload };
})();
