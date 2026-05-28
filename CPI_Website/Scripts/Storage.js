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

// ===== Modal helpers =====
function buildModals() {
  if (document.getElementById("sp-edit-modal")) return;

  document.body.insertAdjacentHTML("beforeend", `
    <!-- Shared backdrop -->
    <div id="sp-backdrop" class="backdrop hidden"></div>

    <!-- ── Edit Product Modal ── -->
    <div id="sp-edit-modal" class="edit-role-modal hidden" style="width:500px">
      <div class="erm-header">
        <div class="erm-icon-wrap"><ion-icon name="pencil-outline"></ion-icon></div>
        <h2>Edit Product</h2>
        <p class="erm-subtitle" id="sp-edit-subtitle">Update product details</p>
        <button class="erm-close-btn" id="sp-edit-close">×</button>
      </div>
      <div class="erm-body">
        <input type="hidden" id="sp-edit-id">
        <div class="aum-grid" style="grid-template-columns:1fr 1fr;gap:12px 16px">
          <div class="aum-col aum-col--full">
            <p class="erm-label">Product Name</p>
            <input class="aum-input" id="sp-edit-name" placeholder="Product name" type="text">
          </div>
          <div class="aum-col">
            <p class="erm-label">Category</p>
            <select class="aum-select" id="sp-edit-category">
              <option value="Ink">Ink</option>
              <option value="Additives">Additives</option>
              <option value="Tapes">Tapes</option>
              <option value="Devices">Devices</option>
            </select>
          </div>
          <div class="aum-col">
            <p class="erm-label">Supplier</p>
            <select class="aum-select" id="sp-edit-supplier"></select>
          </div>
          <div class="aum-col">
            <p class="erm-label">Unit Price (USD)</p>
            <input class="aum-input" id="sp-edit-price" type="number" min="0" step="0.01" placeholder="0.00">
          </div>
          <div class="aum-col">
            <p class="erm-label">Description</p>
            <input class="aum-input" id="sp-edit-desc" type="text" placeholder="Optional">
          </div>
        </div>
        <p class="erm-muted" id="sp-edit-error" style="color:#f87171;display:none"></p>
      </div>
      <div class="erm-footer">
        <button class="erm-btn-save" id="sp-edit-save">Save Changes</button>
        <button class="erm-btn-cancel" id="sp-edit-cancel">Cancel</button>
      </div>
    </div>

    <!-- ── Add Product Modal ── -->
    <div id="sp-add-modal" class="edit-role-modal hidden" style="width:500px">
      <div class="erm-header">
        <div class="erm-icon-wrap" style="background:linear-gradient(135deg,#059669,#10b981);box-shadow:0 8px 26px rgba(16,185,129,0.4)">
          <ion-icon name="add-circle-outline"></ion-icon>
        </div>
        <h2>Add Product</h2>
        <p class="erm-subtitle" style="color:#34d399">New item to inventory</p>
        <button class="erm-close-btn" id="sp-add-close">×</button>
      </div>
      <div class="erm-body">
        <div class="aum-grid" style="grid-template-columns:1fr 1fr;gap:12px 16px">
          <div class="aum-col aum-col--full">
            <p class="erm-label">Product ID</p>
            <input class="aum-input" id="sp-add-id" placeholder="e.g. INK-001" type="text">
          </div>
          <div class="aum-col aum-col--full">
            <p class="erm-label">Product Name</p>
            <input class="aum-input" id="sp-add-name" placeholder="Full product name" type="text">
          </div>
          <div class="aum-col">
            <p class="erm-label">Category</p>
            <select class="aum-select" id="sp-add-category">
              <option value="Ink">Ink</option>
              <option value="Additives">Additives</option>
              <option value="Tapes">Tapes</option>
              <option value="Devices">Devices</option>
            </select>
          </div>
          <div class="aum-col">
            <p class="erm-label">Supplier</p>
            <select class="aum-select" id="sp-add-supplier"></select>
          </div>
          <div class="aum-col">
            <p class="erm-label">Unit Price (USD)</p>
            <input class="aum-input" id="sp-add-price" type="number" min="0" step="0.01" placeholder="0.00">
          </div>
          <div class="aum-col">
            <p class="erm-label">Description</p>
            <input class="aum-input" id="sp-add-desc" type="text" placeholder="Optional">
          </div>
        </div>
        <p class="erm-muted" id="sp-add-error" style="color:#f87171;display:none"></p>
      </div>
      <div class="erm-footer">
        <button class="erm-btn-save" id="sp-add-save" style="background:linear-gradient(135deg,#059669,#10b981);box-shadow:0 4px 18px rgba(16,185,129,0.35)">Add Product</button>
        <button class="erm-btn-cancel" id="sp-add-cancel">Cancel</button>
      </div>
    </div>

    <!-- ── Delete Confirm Modal ── -->
    <div id="sp-del-modal" class="edit-role-modal hidden" style="width:380px;text-align:center">
      <div class="erm-header del-header" style="padding-bottom:22px">
        <div class="erm-icon-wrap del-icon-wrap"><ion-icon name="trash-outline"></ion-icon></div>
        <h2 style="color:#fca5a5">Delete Product</h2>
        <p class="del-username" id="sp-del-name"></p>
        <button class="erm-close-btn" id="sp-del-close">×</button>
      </div>
      <div class="erm-body" style="padding-top:14px">
        <p class="del-confirm-msg">This action is permanent. The product will be removed from inventory and all references.</p>
      </div>
      <div class="erm-footer">
        <button class="del-btn-confirm" id="sp-del-confirm">Delete</button>
        <button class="erm-btn-cancel" id="sp-del-cancel">Cancel</button>
      </div>
    </div>
  `);

  // Close handlers
  ["sp-edit-close","sp-edit-cancel"].forEach(id =>
    document.getElementById(id).addEventListener("click", closeAllModals));
  ["sp-add-close","sp-add-cancel"].forEach(id =>
    document.getElementById(id).addEventListener("click", closeAllModals));
  ["sp-del-close","sp-del-cancel"].forEach(id =>
    document.getElementById(id).addEventListener("click", closeAllModals));
  document.getElementById("sp-backdrop").addEventListener("click", closeAllModals);

  document.getElementById("sp-edit-save").addEventListener("click", saveEditProduct);
  document.getElementById("sp-add-save").addEventListener("click", saveAddProduct);
}

function closeAllModals() {
  ["sp-edit-modal","sp-add-modal","sp-del-modal"].forEach(id =>
    document.getElementById(id)?.classList.add("hidden"));
  document.getElementById("sp-backdrop")?.classList.add("hidden");
}

function fillSupplierSelect(selId, selectedId = null) {
  document.getElementById(selId).innerHTML = allSuppliers.map(s =>
    `<option value="${s.supplierId}" ${s.supplierId === selectedId ? "selected" : ""}>${s.name}</option>`
  ).join("");
}

// ===== Eliminar =====
async function deleteProduct(id) {
  buildModals();
  const p = allProducts.find(x => x.productId === id);
  document.getElementById("sp-del-name").textContent = p ? p.name : id;
  document.getElementById("sp-del-modal").classList.remove("hidden");
  document.getElementById("sp-backdrop").classList.remove("hidden");

  // Replace button to clear stale listeners
  const oldBtn = document.getElementById("sp-del-confirm");
  const btn = oldBtn.cloneNode(true);
  btn.id = "sp-del-confirm";
  oldBtn.replaceWith(btn);
  btn.disabled = false;
  btn.textContent = "Delete";

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Deleting…";
    try {
      await apiFetch(`${CATALOG_API}/products/${id}`, { method: "DELETE" });
      closeAllModals();
      await loadData();
    } catch (e) {
      btn.disabled = false;
      btn.textContent = "Delete";
      alert("Error: " + e.message);
    }
  });
}

// ===== Edit Modal =====
function openEditModal(id) {
  buildModals();
  const p = allProducts.find(x => x.productId === id);
  if (!p) return;

  document.getElementById("sp-edit-id").value       = p.productId;
  document.getElementById("sp-edit-name").value      = p.name;
  document.getElementById("sp-edit-category").value  = p.category;
  document.getElementById("sp-edit-price").value     = p.value || "";
  document.getElementById("sp-edit-desc").value      = p.description || "";
  document.getElementById("sp-edit-subtitle").textContent = p.productId;
  document.getElementById("sp-edit-error").style.display = "none";
  fillSupplierSelect("sp-edit-supplier", p.supplierId);

  document.getElementById("sp-edit-modal").classList.remove("hidden");
  document.getElementById("sp-backdrop").classList.remove("hidden");
}

async function saveEditProduct() {
  const id         = document.getElementById("sp-edit-id").value;
  const name       = document.getElementById("sp-edit-name").value.trim();
  const category   = document.getElementById("sp-edit-category").value;
  const supplierId = Number(document.getElementById("sp-edit-supplier").value);
  const value      = parseFloat(document.getElementById("sp-edit-price").value) || 0;
  const description = document.getElementById("sp-edit-desc").value.trim();
  const errEl      = document.getElementById("sp-edit-error");

  if (!name || !supplierId) {
    errEl.textContent = "Name and supplier are required.";
    errEl.style.display = "block";
    return;
  }

  const btn = document.getElementById("sp-edit-save");
  btn.disabled = true;
  btn.textContent = "Saving…";

  try {
    await apiFetch(`${CATALOG_API}/products/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, value, category, description, supplierId })
    });
    closeAllModals();
    await loadData();
  } catch (e) {
    errEl.textContent = "Error saving: " + e.message;
    errEl.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Save Changes";
  }
}

// ===== Add Product Modal =====
function openAddModal() {
  buildModals();
  ["sp-add-id","sp-add-name","sp-add-price","sp-add-desc"].forEach(id =>
    document.getElementById(id).value = "");
  document.getElementById("sp-add-error").style.display = "none";
  document.getElementById("sp-add-category").value = "Ink";
  fillSupplierSelect("sp-add-supplier");

  document.getElementById("sp-add-modal").classList.remove("hidden");
  document.getElementById("sp-backdrop").classList.remove("hidden");
  document.getElementById("sp-add-id").focus();
}

async function saveAddProduct() {
  const productId   = document.getElementById("sp-add-id").value.trim();
  const name        = document.getElementById("sp-add-name").value.trim();
  const category    = document.getElementById("sp-add-category").value;
  const supplierId  = Number(document.getElementById("sp-add-supplier").value);
  const value       = parseFloat(document.getElementById("sp-add-price").value) || 0;
  const description = document.getElementById("sp-add-desc").value.trim();
  const errEl       = document.getElementById("sp-add-error");

  if (!productId || !name || !supplierId) {
    errEl.textContent = "Product ID, name, and supplier are required.";
    errEl.style.display = "block";
    return;
  }

  const btn = document.getElementById("sp-add-save");
  btn.disabled = true;
  btn.textContent = "Adding…";

  try {
    await apiFetch(`${CATALOG_API}/products`, {
      method: "POST",
      body: JSON.stringify({ productId, name, value, category, description, supplierId, stock: 0 })
    });
    closeAllModals();
    await loadData();
  } catch (e) {
    errEl.textContent = "Error creating product: " + e.message;
    errEl.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Add Product";
  }
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  loadData();
  document.querySelector(".search-bar input")?.addEventListener("input", handleSearch);
  document.getElementById("btn-add-product")?.addEventListener("click", openAddModal);
});