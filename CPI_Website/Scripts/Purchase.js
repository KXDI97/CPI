// ==================== CONFIGURACIÓN API ====================
const API_CONFIG = {
  purchaseOrderService: 'http://localhost:5300',
  catalogService:       'http://localhost:5131'
};

const handleResponse = async (r) => {
  if (!r.ok) { const e = await r.text(); throw new Error(e || `Error: ${r.status}`); }
  if (r.status === 204) return null;
  return r.json();
};

// ==================== APIs ====================
const suppliersAPI = {
  getAll:   async ()     => handleResponse(await fetch(`${API_CONFIG.catalogService}/api/Suppliers`)),
  create:   async (data) => handleResponse(await fetch(`${API_CONFIG.catalogService}/api/Suppliers`, {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data)
  }))
};

const productsAPI = {
  getAll: async () => handleResponse(await fetch(`${API_CONFIG.catalogService}/api/Products`))
};

const purchaseOrdersAPI = {
  create: async (data) => handleResponse(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrders`, {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data)
  }))
};

// ==================== ESTADO ====================
let cart = [], allProducts = [], filteredProducts = [], suppliers = [];

// ==================== HELPERS ====================
function getCategoryIcon(cat) {
  const m = { Cartuchos:'🖨️', Tintas:'🎨', Papelería:'📄', Computers:'💻',
              Accessories:'🖱️', Tecnología:'⌨️', default:'📦' };
  return m[cat] || m.default;
}

function fmt(n) { return Number(n).toLocaleString('es-CO', {minimumFractionDigits:2}); }

function showToast(msg) {
  let t = document.getElementById('cpi-toast');
  if (!t) {
    t = document.createElement('div'); t.id = 'cpi-toast';
    t.style.cssText = `position:fixed;bottom:110px;left:50%;transform:translateX(-50%);
      background:#1a2035;border:1px solid rgba(144,105,249,0.3);color:#fff;
      padding:10px 22px;border-radius:100px;font-size:13px;font-family:'Poppins',sans-serif;
      z-index:99999;opacity:0;transition:opacity 0.3s;white-space:nowrap;
      box-shadow:0 4px 20px rgba(0,0,0,0.4);pointer-events:none;`;
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2400);
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const total = cart.reduce((s, i) => s + i.qty, 0);
  badge.textContent = total;
  badge.style.display = total > 0 ? 'flex' : 'none';
}

// ==================== SUPPLIERS ====================
async function loadSuppliers() {
  try { suppliers = await suppliersAPI.getAll(); renderSupplierSelect(); }
  catch(e) { console.error('Error loading suppliers:', e); }
}

function renderSupplierSelect() {
  const sel = document.getElementById("supplier-select");
  if (!sel) return;
  sel.innerHTML = '<option value="">Select a supplier</option>';
  suppliers.forEach(s => {
    const o = document.createElement("option");
    o.value = s.supplierId ?? s.id;
    o.textContent = `${s.name}${s.contact ? ' — '+s.contact : ''}`;
    sel.appendChild(o);
  });
}

window.abrirModalProveedor = () => { const m = document.getElementById("modal-nuevo-proveedor"); if(m) m.style.display="flex"; };
window.cerrarModalProveedor = () => { const m = document.getElementById("modal-nuevo-proveedor"); if(m){ m.style.display="none"; document.getElementById("form-nuevo-proveedor").reset(); } };

// ==================== PRODUCTS ====================
async function loadProducts() {
  try {
    allProducts = await productsAPI.getAll();
    filteredProducts = [...allProducts];
    renderCarousel(filteredProducts);
  } catch(e) {
    console.error(e);
    const c = document.getElementById("product-carousel");
    if (c) c.innerHTML = `<div class="swiper-slide"><div class="card" style="align-items:center;justify-content:center;min-height:200px">
      <div style="font-size:2rem;margin-bottom:12px">⚠️</div>
      <p style="color:#f87171;font-size:13px;text-align:center">Could not load products.<br>Check CatalogService on port 5131.</p>
    </div></div>`;
  }
}

function renderCarousel(products) {
  const container = document.getElementById("product-carousel");
  if (!container) return;
  container.innerHTML = "";

  if (!products.length) {
    container.innerHTML = '<div class="swiper-slide"><div class="card" style="align-items:center;padding:40px;justify-content:center"><p style="color:rgba(255,255,255,0.4)">No products found</p></div></div>';
    if (window.swiperInstance) { window.swiperInstance.update(); }
    return;
  }

  products.forEach(p => {
    const price    = p.value ?? p.price ?? 0;
    const stock    = p.stock ?? p.quantityInventory ?? 0;
    const category = p.category ?? p.categoryName ?? '';
    const icon     = getCategoryIcon(category);
    const stockClass = stock === 0 ? 'empty' : stock < 10 ? 'low' : '';
    const stockLabel = stock === 0 ? '❌ Out of stock' : stock < 10 ? `⚠️ Low: ${stock}` : `✅ Stock: ${stock}`;
    const pid = String(p.productId ?? p.id ?? '').replace(/'/g, "\\'");
    const pname = String(p.name ?? '').replace(/'/g, "\\'");

    const slide = document.createElement("div");
    slide.classList.add("swiper-slide");
    slide.innerHTML = `
      <div class="card">
        <div class="card-img">${icon}</div>
        <div class="card-info">
          ${category ? `<span class="card-category">${category}</span>` : ''}
          <h3>${p.name}</h3>
          <div class="card-price">$${fmt(price)}</div>
          <div class="card-stock ${stockClass}">${stockLabel}</div>
        </div>
        <button onclick="addToCart('${pid}','${pname}',${price})" ${stock===0 ? 'disabled style="opacity:0.35;cursor:not-allowed"' : ''}>
          <ion-icon name="cart-outline"></ion-icon> Add to cart
        </button>
      </div>`;
    container.appendChild(slide);
  });

  if (window.swiperInstance) { window.swiperInstance.destroy(true, true); window.swiperInstance = null; }
  window.swiperInstance = new Swiper(".mySwiper", {
    spaceBetween: 20,
    navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
    breakpoints: {
      320:  { slidesPerView: 1,   spaceBetween: 12 },
      600:  { slidesPerView: 2,   spaceBetween: 16 },
      900:  { slidesPerView: 3,   spaceBetween: 20 },
      1200: { slidesPerView: 4,   spaceBetween: 20 }
    }
  });
}

// ==================== CARRITO ====================
window.addToCart = function(id, name, price) {
  const ex = cart.find(i => i.id === id);
  if (ex) { ex.qty += 1; } else { cart.push({ id, name, price: Number(price), qty: 1 }); }
  renderCart();
  updateCartBadge();
  showToast(`✅ ${name} added to cart`);
};

window.removeFromCart = function(id) {
  cart = cart.filter(i => i.id !== id);
  renderCart();
  updateCartBadge();
};

function renderCart() {
  const table = document.getElementById("tabla-carrito");
  const totalSpan = document.getElementById("total-carrito");
  if (!table || !totalSpan) return;
  table.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    const sub = item.price * item.qty;
    const iva = sub * 0.19;
    const ttl = sub + iva;
    total += ttl;
    table.innerHTML += `
      <tr>
        <td>${item.id}</td>
        <td style="text-align:left">${item.name}</td>
        <td>${item.qty}</td>
        <td>$${fmt(item.price)}</td>
        <td>19%</td>
        <td>$0.00</td>
        <td><strong>$${fmt(ttl)}</strong></td>
        <td><button onclick="removeFromCart('${item.id}')" class="btn-eliminar">❌</button></td>
      </tr>`;
  });
  totalSpan.textContent = fmt(total);
}

// ==================== MODALES ====================
window.abrirCarrito     = () => { const m=document.getElementById("carrito-modal"); if(m) m.style.display="flex"; };
window.cerrarCarrito    = () => { const m=document.getElementById("carrito-modal"); if(m) m.style.display="none"; };
window.cerrarModalCompra= () => { const m=document.getElementById("modal-registro"); if(m) m.style.display="none"; };
window.cerrarFactura    = () => { const m=document.getElementById("factura-modal"); if(m) m.style.display="none"; };

window.abrirModalCompra = function(opciones={}) {
  const { requiereCarrito = true } = opciones;
  if (requiereCarrito && cart.length === 0) { showToast("⚠️ The cart is empty"); return; }

  const modal = document.getElementById("modal-registro");
  if (!modal) return;
  modal.style.display = "flex";

  const orderNum = document.getElementById("order-number");
  if (orderNum && !orderNum.value) orderNum.value = 'ORD-' + Date.now();

  const totalModal   = document.getElementById("total-final-modal");
  const totalCarrito = document.getElementById("total-carrito");
  if (totalModal) totalModal.textContent = cart.length > 0 && totalCarrito ? totalCarrito.textContent : "0.00";

  const dateInput = document.getElementById("purchase-date");
  if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().split('T')[0];

  if (suppliers.length === 0) loadSuppliers();
};

// ==================== FORM PROVEEDOR ====================
document.addEventListener('DOMContentLoaded', () => {
  const fp = document.getElementById("form-nuevo-proveedor");
  if (fp) fp.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      name:    document.getElementById("supplier-name").value,
      contact: document.getElementById("supplier-document").value,
      email:   document.getElementById("supplier-email").value,
      phone:   document.getElementById("supplier-phone").value,
      address: document.getElementById("supplier-address").value
    };
    try {
      const ns = await suppliersAPI.create(data);
      showToast("✅ Supplier created!");
      suppliers.push(ns);
      renderSupplierSelect();
      const sel = document.getElementById("supplier-select");
      if (sel) sel.value = ns.supplierId ?? ns.id;
      cerrarModalProveedor();
    } catch(err) { showToast("❌ " + err.message); }
  });
});

// ==================== FORM COMPRA ====================
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById("form-compra");
  if (form) form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const supplierId = document.getElementById("supplier-select").value;
    const date       = document.getElementById("purchase-date").value;
    const method     = document.getElementById("payment-method").value;

    if (!supplierId || !date || !method) { showToast("⚠️ Please complete all fields"); return; }
    if (cart.length === 0) { showToast("⚠️ The cart is empty"); return; }

    try {
      const order = await purchaseOrdersAPI.create({
        supplierId: parseInt(supplierId),
        details: cart.map(i => ({ productId: i.id, quantity: i.qty, unitPrice: i.price }))
      });
      const supplier = suppliers.find(s => (s.supplierId??s.id) == supplierId);
      const snapshot = [...cart];
      showInvoice(order.purchaseOrderId, supplier?.name || supplierId, date, snapshot);
      cart = []; renderCart(); updateCartBadge(); cerrarModalCompra();
    } catch(err) { showToast("❌ " + err.message); }
  });
});

// ==================== FACTURA ====================
function showInvoice(orderId, supplierName, date, snapshot) {
  document.getElementById("factura-orden").textContent   = orderId;
  document.getElementById("factura-cliente").textContent = supplierName;
  document.getElementById("factura-fecha").textContent   = date;

  const tbody = document.getElementById("factura-productos");
  tbody.innerHTML = "";
  let total = 0;
  snapshot.forEach(item => {
    const sub = item.price * item.qty;
    const iva = sub * 0.19;
    const ttl = sub + iva;
    total += ttl;
    tbody.innerHTML += `<tr>
      <td>${item.name}</td><td>${item.qty}</td>
      <td>$${fmt(item.price)}</td><td>19%</td>
      <td>$${fmt(ttl)}</td></tr>`;
  });
  document.getElementById("factura-total").textContent = fmt(total);
  document.getElementById("factura-modal").style.display = "flex";
}

// ==================== BÚSQUEDA ====================
window.buscarProducto = function() {
  const q = (document.getElementById("search-input")?.value || "").toLowerCase().trim();
  filteredProducts = q === "" ? [...allProducts]
    : allProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)));
  renderCarousel(filteredProducts);
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("search-input")?.addEventListener('keypress', e => { if(e.key==='Enter') buscarProducto(); });
});

// ==================== FILTROS ====================
window.aplicarFiltros = function() {
  const cat      = document.getElementById("filtro-categoria")?.value || "";
  const maxPrice = parseFloat(document.getElementById("filtro-precio")?.value) || Infinity;
  const desde    = document.getElementById("filtro-fecha-inicio")?.value || "";
  const hasta    = document.getElementById("filtro-fecha-fin")?.value || "";

  filteredProducts = allProducts.filter(p => {
    const price = p.value ?? p.price ?? 0;
    if (cat && p.category !== cat) return false;
    if (price > maxPrice) return false;
    if (desde && p.createdDate && p.createdDate < desde) return false;
    if (hasta && p.createdDate && p.createdDate > hasta) return false;
    return true;
  });
  renderCarousel(filteredProducts);
  showToast(`✅ ${filteredProducts.length} products found`);
};

document.addEventListener('DOMContentLoaded', () => {
  const btn   = document.getElementById('filter-toggle-btn');
  const panel = document.getElementById('filtro-panel');
  if (btn && panel) {
    btn.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    });
  }
});

// ==================== INIT ====================
window.addEventListener('load', () => { loadProducts(); loadSuppliers(); });