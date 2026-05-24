// Storage.js — Controlador de la página Storage.

const API_BASE = 'http://localhost:5258';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token') ?? ''}`
  };
}

// ── Botones de la tabla ────────────────────────────────────────────────────────
function setupTableActions() {
  const tbody = document.querySelector('.content-Storage table tbody');
  if (!tbody) return;

  tbody.addEventListener('click', e => {
    const row = e.target.closest('tr');
    if (!row) return;

    if (e.target.closest('.edit')) {
      openEditRow(row);
      return;
    }

    if (e.target.closest('.delete')) {
      const productName = row.querySelector('td')?.textContent?.trim() ?? 'this item';
      showDeleteConfirm(
        `Delete "${productName}" from storage?`,
        () => {
          row.remove();
          console.log('Item removed (demo — no backend call yet)');
        }
      );
    }
  });
}

// ── Editar fila inline ────────────────────────────────────────────────────────
function openEditRow(row) {
  if (row.classList.contains('editing')) return;
  row.classList.add('editing');

  const cells = row.querySelectorAll('td');
  // cells: Product, Category, Provider, Quantity, Amount, Actions
  const original = Array.from(cells).map(c => c.textContent.trim());

  // Convertir celdas editables (todas menos Actions)
  [1, 2, 3, 4, 5].forEach(i => {
    if (!cells[i]) return;
    const val = cells[i].textContent.trim();
    cells[i].innerHTML = `<input value="${val}" style="width:90%;padding:2px 4px;background:#374151;color:#f9fafb;border:1px solid #6366f1;border-radius:4px;">`;
  });

  // Cambiar icono de edición a guardar/cancelar
  const actionCell = cells[cells.length - 1];
  actionCell.innerHTML = `
    <ion-icon name="checkmark-outline" class="icon save" title="Save" style="color:#22c55e;cursor:pointer;font-size:1.2rem;"></ion-icon>
    <ion-icon name="close-outline" class="icon cancel-edit" title="Cancel" style="color:#ef4444;cursor:pointer;font-size:1.2rem;"></ion-icon>
  `;

  actionCell.querySelector('.save').onclick = () => {
    const inputs = row.querySelectorAll('input');
    [1, 2, 3, 4, 5].forEach((colIdx, i) => {
      if (cells[colIdx]) cells[colIdx].textContent = inputs[i]?.value ?? original[colIdx];
    });
    restoreActions(actionCell);
    row.classList.remove('editing');
  };

  actionCell.querySelector('.cancel-edit').onclick = () => {
    [1, 2, 3, 4, 5].forEach(i => {
      if (cells[i]) cells[i].textContent = original[i];
    });
    restoreActions(actionCell);
    row.classList.remove('editing');
  };
}

function restoreActions(cell) {
  cell.innerHTML = `
    <ion-icon name="pencil-outline" class="icon edit"></ion-icon>
    <ion-icon name="trash-outline" class="icon delete"></ion-icon>
  `;
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupTableActions();
});
