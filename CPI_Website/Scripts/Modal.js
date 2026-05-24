// Modal.js — Confirm dialog reutilizable para páginas internas.
// Reutiliza #global-modal de GlobalModal.js si ya está en el DOM,
// o crea uno propio como fallback.

function showDeleteConfirm(message, onConfirm) {
  const existingModal = document.getElementById('global-modal');

  if (existingModal) {
    document.getElementById('modal-message').innerText = message;
    document.getElementById('confirm-btn').onclick = () => {
      closeModal();
      onConfirm();
    };
    existingModal.style.display = 'flex';
    return;
  }

  // Fallback: crear modal propio si GlobalModal aún no cargó
  if (document.getElementById('cpi-confirm-modal')) {
    document.getElementById('cpi-confirm-msg').innerText = message;
    document.getElementById('cpi-confirm-ok').onclick = () => {
      document.getElementById('cpi-confirm-modal').style.display = 'none';
      onConfirm();
    };
    document.getElementById('cpi-confirm-modal').style.display = 'flex';
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'cpi-confirm-modal';
  overlay.style.cssText = `
    display:flex; position:fixed; inset:0; z-index:99998;
    background:rgba(0,0,0,.6); align-items:center; justify-content:center;
  `;
  overlay.innerHTML = `
    <div style="background:#1f2937;border:1px solid #374151;border-radius:12px;
                padding:2rem;max-width:380px;width:90%;color:#f9fafb;text-align:center;">
      <p id="cpi-confirm-msg" style="margin:0 0 1.5rem;font-size:1rem;">${message}</p>
      <div style="display:flex;gap:.75rem;justify-content:center;">
        <button id="cpi-confirm-ok"
          style="padding:.6rem 1.4rem;background:#ef4444;color:#fff;border:none;
                 border-radius:8px;cursor:pointer;font-weight:600;">Confirm</button>
        <button id="cpi-confirm-cancel"
          style="padding:.6rem 1.4rem;background:#374151;color:#f9fafb;border:none;
                 border-radius:8px;cursor:pointer;font-weight:600;">Cancel</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  document.getElementById('cpi-confirm-ok').onclick = () => {
    overlay.style.display = 'none';
    onConfirm();
  };
  document.getElementById('cpi-confirm-cancel').onclick = () => {
    overlay.style.display = 'none';
  };
}
