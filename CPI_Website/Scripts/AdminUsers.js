(() => {
  'use strict';

  const API_URL   = 'http://localhost:5258';
  const PAGE_SIZE = 10;

  let allUsers          = [];
  let currentEditId     = null;
  let currentDeleteId   = null;
  let currentPage       = 1;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function showErr(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
  }

  function hideErr(id) {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // ── Fetch & render ────────────────────────────────────────────────────────
  function showTableError(msg) {
    document.getElementById('adminUsersTableBody').innerHTML =
      `<tr><td colspan="5" style="text-align:center;color:#f87171;padding:20px;">${msg}</td></tr>`;
  }

  async function fetchUsers() {
    try {
      let res = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.status === 401) {
        // Try a silent token refresh once before giving up
        const refreshed = await window.CPI?.silentRefresh?.();
        if (refreshed) {
          res = await fetch(`${API_URL}/api/users`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
        }
        if (res.status === 401) {
          showTableError('Session expired. Please <a href="../Landing Page/Login.html" style="color:#9069F9;">log in again</a>.');
          return;
        }
      }

      if (res.status === 403) {
        showTableError('Access denied — Admin only.');
        return;
      }
      if (!res.ok) throw new Error('Server error');
      allUsers = await res.json();
    } catch {
      showTableError('Failed to load users. Is the API running?');
      return;
    }
    renderTable();
  }

  function filteredUsers() {
    const q = (document.getElementById('userSearch')?.value ?? '').toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(u =>
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  }

  function renderTable() {
    const list  = filteredUsers();
    const tbody = document.getElementById('adminUsersTableBody');
    const empty = document.getElementById('usersEmptyMsg');

    if (list.length === 0) {
      tbody.innerHTML   = '';
      empty.style.display = 'block';
      document.getElementById('usersPagination').innerHTML = '';
      return;
    }

    empty.style.display = 'none';
    const start = (currentPage - 1) * PAGE_SIZE;
    const page  = list.slice(start, start + PAGE_SIZE);

    tbody.innerHTML = page.map(u => `
      <tr>
        <td>${escapeHtml(u.username)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td><span class="role-badge role-${u.role.toLowerCase()}">${escapeHtml(u.role)}</span></td>
        <td>${formatDate(u.createdAt)}</td>
        <td>
          <ion-icon name="pencil-outline" class="icon edit"
            data-id="${u.id}" data-username="${escapeHtml(u.username)}" data-role="${escapeHtml(u.role)}"
            title="Edit role"></ion-icon>
          <ion-icon name="trash-outline" class="icon delete"
            data-id="${u.id}" data-username="${escapeHtml(u.username)}"
            title="Delete user"></ion-icon>
        </td>
      </tr>`).join('');

    renderPagination(list.length);
  }

  function renderPagination(total) {
    const container  = document.getElementById('usersPagination');
    const totalPages = Math.ceil(total / PAGE_SIZE);

    if (totalPages <= 1) { container.innerHTML = ''; return; }

    let html = `<a href="#" data-page="prev">«</a> `;
    for (let i = 1; i <= totalPages; i++) {
      const active = i === currentPage ? ' style="font-weight:700;color:#9069F9;"' : '';
      html += `<a href="#" data-page="${i}"${active}>${i}</a> `;
    }
    html += `<a href="#" data-page="next">»</a>`;
    container.innerHTML = html;

    container.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', e => {
        e.preventDefault();
        const p = e.target.dataset.page;
        const max = Math.ceil(filteredUsers().length / PAGE_SIZE);
        if      (p === 'prev') currentPage = Math.max(1, currentPage - 1);
        else if (p === 'next') currentPage = Math.min(max, currentPage + 1);
        else                   currentPage = parseInt(p, 10);
        renderTable();
      })
    );
  }

  // ── Add User Modal ────────────────────────────────────────────────────────
  function openAddModal() {
    ['newUsername', 'newEmail', 'newPassword'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('newRole').value = 'Viewer';
    hideErr('addUserError');
    show('addUserBackdrop');
    show('addUserModal');
  }

  function closeAddModal() {
    hide('addUserBackdrop');
    hide('addUserModal');
  }

  async function handleAddUser() {
    const username = document.getElementById('newUsername').value.trim();
    const email    = document.getElementById('newEmail').value.trim();
    const password = document.getElementById('newPassword').value;
    const role     = document.getElementById('newRole').value;

    if (!username || !email || !password) {
      showErr('addUserError', 'All fields are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showErr('addUserError', 'Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      showErr('addUserError', 'Password must be at least 6 characters.');
      return;
    }

    const btn = document.getElementById('confirmAddUser');
    btn.disabled    = true;
    btn.textContent = 'Creating…';

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, email, password, role })
      });

      if (res.status === 409) { showErr('addUserError', 'Username or email already exists.'); return; }
      if (!res.ok)            { showErr('addUserError', 'Failed to create user.'); return; }

      closeAddModal();
      await fetchUsers();
    } catch {
      showErr('addUserError', 'Network error. Please try again.');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Add User';
    }
  }

  // ── Edit Role Modal ───────────────────────────────────────────────────────
  function openEditModal(id, username, role) {
    currentEditId = id;
    document.getElementById('editRoleSubtitle').textContent = username;
    document.querySelectorAll('#editRoleCards .erm-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.role === role);
    });
    hideErr('editRoleError');
    show('editRoleBackdrop');
    show('editRoleModal');
  }

  function closeEditModal() {
    hide('editRoleBackdrop');
    hide('editRoleModal');
  }

  async function handleEditRole() {
    const selected = document.querySelector('#editRoleCards .erm-card.selected');
    if (!selected) { showErr('editRoleError', 'Please select a role.'); return; }
    const role = selected.dataset.role;
    const btn  = document.getElementById('confirmEditRole');
    btn.disabled    = true;
    btn.textContent = 'Saving…';

    try {
      const res = await fetch(`${API_URL}/api/users/${currentEditId}/role`, {
        method:  'PUT',
        headers: authHeaders(),
        body:    JSON.stringify({ role })
      });

      if (res.status === 401) { CPI.sessionLogout(); return; }
      if (res.status === 403) { showErr('editRoleError', 'Permission denied.'); return; }
      if (!res.ok)            { showErr('editRoleError', 'Failed to update role.'); return; }

      closeEditModal();
      await fetchUsers();
    } catch {
      showErr('editRoleError', 'Network error. Please try again.');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Save';
    }
  }

  // ── Delete Modal ──────────────────────────────────────────────────────────
  function openDeleteModal(id, username) {
    currentDeleteId = id;
    document.getElementById('deleteMsg').textContent =
      `Are you sure you want to delete "${username}"? This action cannot be undone.`;
    show('deleteBackdrop');
    show('deleteModal');
  }

  function closeDeleteModal() {
    hide('deleteBackdrop');
    hide('deleteModal');
  }

  async function handleDelete() {
    const btn = document.getElementById('confirmDelete');
    btn.disabled    = true;
    btn.textContent = 'Deleting…';

    try {
      const res = await fetch(`${API_URL}/api/users/${currentDeleteId}`, {
        method:  'DELETE',
        headers: authHeaders()
      });

      if (res.status === 401) { CPI.sessionLogout(); return; }
      if (!res.ok && res.status !== 404) {
        alert('Failed to delete user. Please try again.');
        return;
      }

      closeDeleteModal();
      await fetchUsers();
    } catch {
      alert('Network error. Please try again.');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Delete';
    }
  }

  // ── DOM helpers ───────────────────────────────────────────────────────────
  function show(id) { document.getElementById(id)?.classList.remove('hidden'); }
  function hide(id) { document.getElementById(id)?.classList.add('hidden');    }

  // ── Boot ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    fetchUsers();

    document.getElementById('addUserBtn')     ?.addEventListener('click', openAddModal);
    document.getElementById('confirmAddUser') ?.addEventListener('click', handleAddUser);
    document.getElementById('cancelAddUser')  ?.addEventListener('click', closeAddModal);
    document.getElementById('addUserBackdrop')?.addEventListener('click', closeAddModal);

    document.getElementById('confirmEditRole') ?.addEventListener('click', handleEditRole);
    document.getElementById('cancelEditRole')  ?.addEventListener('click', closeEditModal);
    document.getElementById('editRoleBackdrop')?.addEventListener('click', closeEditModal);

    document.getElementById('editRoleCards')?.addEventListener('click', e => {
      const card = e.target.closest('.erm-card');
      if (!card) return;
      document.querySelectorAll('#editRoleCards .erm-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      hideErr('editRoleError');
    });

    document.getElementById('confirmDelete') ?.addEventListener('click', handleDelete);
    document.getElementById('cancelDelete')  ?.addEventListener('click', closeDeleteModal);
    document.getElementById('deleteBackdrop')?.addEventListener('click', closeDeleteModal);

    document.getElementById('userSearch')?.addEventListener('input', () => {
      currentPage = 1;
      renderTable();
    });

    document.getElementById('adminUsersTableBody')?.addEventListener('click', e => {
      const icon = e.target.closest('ion-icon');
      if (!icon) return;
      const { id, username, role } = icon.dataset;
      if (icon.classList.contains('edit'))   openEditModal(id, username, role);
      if (icon.classList.contains('delete')) openDeleteModal(id, username);
    });
  });
})();
