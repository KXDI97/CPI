// Scripts/Storage.js

const CATALOG_API = "http://localhost:5131/api";

// ===== Helpers =====
function fmtMoney(n) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0
  }).format(Number(n || 0));
}

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" }, ...opts
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.status === 204 ? null : res.json();
}

// ===== Estado =====
let allProducts  = [];
let allSuppliers = [];
let filtered     = [];
let currentPage  = 1;
const PAGE_SIZE  = 8;

// ===== Ícono por categoría =====
function iconForCategory(cat) {
  const map = {
    "Electrónica": "desktop-outline",
    "Electronics": "desktop-outline",
    "Accesorios":  "headset-outline",
    "Ropa":        "shirt-outline",
    "Calzado":     "footsteps-outline",
    "Ink":         "color-fill-outline",
    "Tape":        "radio-outline",
    "Additive":    "infinite-outline",
    "Device":      "desktop-outline"
  };
  return map[cat] || "cube-outline";
}

// ===== Cargar datos =====
async function loadData() {
  try {
    const [prodRes, suppRes] = await Promise.all([
      apiFetch(`${CATALOG_API}/products`),
      apiFetch(`${CATALOG_API}/suppliers`)
    ]);
    allProducts  = Array.isArray(prodRes) ? prodRes : (prodRes.items  ?? []);
    allSuppliers = Array.isArray(suppRes) ? suppRes : (suppRes.items  ?? []);
    filtered = [...allProducts];
    renderTable();
    renderPagination();
  } catch (e) {
    console.error("Error cargando storage:", e);
    document.querySelector(".table-container tbody").innerHTML =
      `<tr><td colspan="6" style="text-align:center;color:red">Error cargando productos</td></tr>`;
  }
}

// ===== Renderizar tabla =====
function renderTable() {
  const tbody = document.querySelector(".table-container tbody");
  if (!tbody) return;

  const start = (currentPage - 1) * PAGE_SIZE;
  const page  = filtered.slice(start, start + PAGE_SIZE);

  if (!page.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;opacity:.5">Sin productos</td></tr>`;
    return;
  }

  tbody.innerHTML = page.map(p => {
    const supplier     = allSuppliers.find(s => s.supplierId === p.supplierId);
    const supplierName = supplier ? supplier.name : `#${p.supplierId}`;
    const icon         = iconForCategory(p.category);
    const stockClass   = p.stock <= 0 ? "stock-empty" : p.stock < 5 ? "stock-low" : "";
    return `
      <tr>
        <td><ion-icon name="${icon}"></ion-icon> ${p.name}</td>
        <td>${p.category}</td>
        <td class="${stockClass}">${p.stock}</td>
        <td>${supplierName}</td>
        <td>${fmtMoney(p.value)}</td>
        <td>
          <ion-icon name="pencil-outline" class="icon edit" data-id="${p.productId}"></ion-icon>
          <ion-icon name="trash-outline"  class="icon delete" data-id="${p.productId}"></ion-icon>
        </td>
      </tr>`;
  }).join("");

  tbody.querySelectorAll(".edit").forEach(btn =>
    btn.addEventListener("click", () => openEditModal(btn.dataset.id))
  );
  tbody.querySelectorAll(".delete").forEach(btn =>
    btn.addEventListener("click", () => deleteProduct(btn.dataset.id))
  );
}

// ===== Paginación =====
function renderPagination() {
  const total = Math.ceil(filtered.length / PAGE_SIZE);
  const pag   = document.querySelector(".pagination");
  if (!pag) return;

  let html = `<a href="#" data-page="prev">«</a>`;
  for (let i = 1; i <= total; i++) {
    html += `<a href="#" data-page="${i}" class="${i === currentPage ? 'active' : ''}">${i}</a>`;
  }
  html += `<a href="#" data-page="next">»</a>`;
  pag.innerHTML = html;

  pag.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", e => {
      e.preventDefault();
      const p     = a.dataset.page;
      const total = Math.ceil(filtered.length / PAGE_SIZE);
      if      (p === "prev" && currentPage > 1)    currentPage--;
      else if (p === "next" && currentPage < total) currentPage++;
      else if (!isNaN(p))                           currentPage = Number(p);
      renderTable();
      renderPagination();
    });
  });
}

// ===== Búsqueda =====
function handleSearch(e) {
  const q = e.target.value.toLowerCase().trim();
  filtered = q
    ? allProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.productId.toLowerCase().includes(q)
      )
    : [...allProducts];
  currentPage = 1;
  renderTable();
  renderPagination();
}

// ===== Eliminar =====
async function deleteProduct(id) {
  if (!confirm(`¿Eliminar el producto "${id}"?`)) return;
  try {
    await apiFetch(`${CATALOG_API}/products/${id}`, { method: "DELETE" });
    await loadData();
  } catch (e) {
    alert("Error eliminando producto: " + e.message);
  }
}

// ===== Modal Edición =====
function buildEditModal() {
  if (document.getElementById("editProductModal")) return;

  document.body.insertAdjacentHTML("beforeend", `
    <div id="editBackdrop"></div>
    <div id="editProductModal">
      <div class="ep-header">
        <h3>Editar Producto</h3>
        <button class="ep-close-btn" id="ep-close">×</button>
      </div>
      <input type="hidden" id="ep-id">
      <div class="ep-field">
        <label>Nombre</label>
        <input id="ep-name" type="text">
      </div>
      <div class="ep-field">
        <label>Categoría</label>
        <input id="ep-category" type="text">
      </div>
      <div class="ep-field">
        <label>Proveedor</label>
        <select id="ep-supplier"></select>
      </div>
      <div class="ep-actions">
        <button class="ep-btn-cancel" id="ep-cancel">Cancelar</button>
        <button class="ep-btn-save"   id="ep-save">Guardar</button>
      </div>
    </div>
  `);

  document.getElementById("ep-close") .addEventListener("click", closeEditModal);
  document.getElementById("ep-cancel").addEventListener("click", closeEditModal);
  document.getElementById("editBackdrop").addEventListener("click", closeEditModal);
  document.getElementById("ep-save")  .addEventListener("click", saveProduct);
}

function openEditModal(id) {
  buildEditModal();
  const p = allProducts.find(x => x.productId === id);
  if (!p) return;

  document.getElementById("ep-id").value       = p.productId;
  document.getElementById("ep-name").value      = p.name;
  document.getElementById("ep-category").value  = p.category;

  document.getElementById("ep-supplier").innerHTML = allSuppliers.map(s =>
    `<option value="${s.supplierId}" ${s.supplierId === p.supplierId ? "selected" : ""}>${s.name}</option>`
  ).join("");

  document.getElementById("editBackdrop").style.display     = "block";
  document.getElementById("editProductModal").style.display = "block";
}

function closeEditModal() {
  document.getElementById("editBackdrop").style.display     = "none";
  document.getElementById("editProductModal").style.display = "none";
}

async function saveProduct() {
  const id         = document.getElementById("ep-id").value;
  const name       = document.getElementById("ep-name").value.trim();
  const category   = document.getElementById("ep-category").value.trim();
  const supplierId = Number(document.getElementById("ep-supplier").value);

  if (!name || !category || !supplierId) { alert("Completa todos los campos"); return; }

  const current = allProducts.find(x => x.productId === id);

  try {
    await apiFetch(`${CATALOG_API}/products/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name,
        value:       current.value,
        category,
        description: current.description,
        supplierId
      })
    });
    closeEditModal();
    await loadData();
  } catch (e) {
    alert("Error guardando: " + e.message);
  }
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  loadData();
  document.querySelector(".search-bar input")?.addEventListener("input", handleSearch);
});