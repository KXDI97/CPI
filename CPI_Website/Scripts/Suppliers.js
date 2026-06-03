// ====== CONFIG ======
const CATALOG_API  = 'http://localhost:5131';
const SUPPLIERS_URL = `${CATALOG_API}/api/Suppliers`;
const PRODUCTS_URL  = `${CATALOG_API}/api/Products`;

// ====== HELPERS ======
const initials = (name='S') => name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');

const GRADIENTS = [
  'linear-gradient(135deg,#9069F9,#54F1B7)',
  'linear-gradient(135deg,#3b82f6,#0ea5e9)',
  'linear-gradient(135deg,#8b5cf6,#ec4899)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#6366f1,#a78bfa)',
];
const avatarGradient = name => {
  const h = [...(name||'')].reduce((acc,c)=>(acc*31+c.charCodeAt(0))&0xffff, 7);
  return GRADIENTS[h % GRADIENTS.length];
};

// ====== API ======
const api = {
  getSuppliers: async () => {
    const r = await fetch(SUPPLIERS_URL);
    if (!r.ok) throw new Error(`GET suppliers -> ${r.status}`);
    return r.json();
  },
  createSupplier: async (dto) => {
    const r = await fetch(SUPPLIERS_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(dto) });
    if (!r.ok) throw new Error(await r.text() || `POST supplier -> ${r.status}`);
    return r.json();
  },
  updateSupplier: async (id, dto) => {
    const r = await fetch(`${SUPPLIERS_URL}/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(dto) });
    if (!r.ok) throw new Error(await r.text() || `PUT supplier -> ${r.status}`);
    return r.json();
  },
  deleteSupplier: async (id) => {
    const r = await fetch(`${SUPPLIERS_URL}/${id}`, { method:'DELETE' });
    if (!r.ok) throw new Error(await r.text() || `DELETE supplier -> ${r.status}`);
  },
  getProducts: async () => {
    const r = await fetch(PRODUCTS_URL);
    if (!r.ok) throw new Error(`GET products -> ${r.status}`);
    return r.json();
  },
  createProduct: async (dto) => {
    const r = await fetch(PRODUCTS_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(dto) });
    if (!r.ok) throw new Error(await r.text() || `POST product -> ${r.status}`);
    return r.status === 204 ? null : r.json();
  },
  deleteProduct: async (id) => {
    const r = await fetch(`${PRODUCTS_URL}/${id}`, { method:'DELETE' });
    if (!r.ok) throw new Error(await r.text() || `DELETE product -> ${r.status}`);
  }
};

// ====== RENDER CARD ======
const supplierCard = (s) => `
  <div class="cliente-card" data-id="${s.supplierId}">
    <div class="cliente-header">
      <div class="cliente-avatar" style="background:${avatarGradient(s.name)}">${initials(s.name)}</div>
      <div>
        <h3>${s.name}</h3>
        <p style="color:rgba(255,255,255,0.5);font-size:13px">${s.contact||'—'}</p>
      </div>
      <div class="menu-container">
        <button class="menu-btn" aria-label="Options"><ion-icon name="ellipsis-vertical"></ion-icon></button>
        <ul class="menu-options hidden">
          <li class="opt-products">📦 Products</li>
          <li class="opt-edit">✏️ Edit</li>
          <li class="opt-delete">🗑️ Delete</li>
        </ul>
      </div>
    </div>
    <p><strong>Email:</strong> ${s.email||'—'}</p>
    <p><strong>Phone:</strong> ${s.phone||'—'}</p>
    <p><strong>Address:</strong> ${s.address||'—'}</p>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn-1 opt-edit" style="flex:1;justify-content:center">✏️ Edit</button>
      <button class="btn-2 opt-products" style="flex:1;justify-content:center">📦 Products</button>
    </div>
  </div>`;

// ====== MAIN ======
document.addEventListener('DOMContentLoaded', () => {
  const grid         = document.getElementById('suppliersGrid');
  const searchInput  = document.getElementById('search-supplier');
  const backdrop     = document.getElementById('modalBackdrop');

  // Supplier modal
  const supModal     = document.getElementById('supplierModal');
  const supTitle     = document.getElementById('supplier-modal-title');
  const supError     = document.getElementById('supplier-error');
  const openBtn      = document.getElementById('openSupplierModal');
  const saveSupBtn   = document.getElementById('btn-save-supplier');
  const cancelSupBtn = document.getElementById('btn-cancel-supplier');
  const closeSupBtn  = document.getElementById('btn-close-supplier');

  // Products modal
  const prodModal    = document.getElementById('productsModal');
  const prodTitle    = document.getElementById('prod-supplier-name');
  const prodList     = document.getElementById('products-list');
  const prodError    = document.getElementById('product-error');
  const saveProdBtn  = document.getElementById('btn-save-product');
  const closeProdBtn = document.getElementById('btn-close-products');
  const closeProdFooter = document.getElementById('btn-close-products-footer');

  let allSuppliers = [];
  let allProducts  = [];
  let editingId    = null;
  let activeSupplierId = null;

  // ── Modal helpers ──────────────────────────────────────────────────
  const openSupModal = () => { supModal.classList.remove('hidden'); backdrop.classList.remove('hidden'); supError.style.display='none'; };
  const closeSupModal = () => { supModal.classList.add('hidden'); backdrop.classList.add('hidden'); editingId=null; clearSupForm(); };
  const openProdModal = () => { prodModal.classList.remove('hidden'); backdrop.classList.remove('hidden'); prodError.style.display='none'; };
  const closeProdModal = () => { prodModal.classList.add('hidden'); backdrop.classList.add('hidden'); activeSupplierId=null; clearProdForm(); };

  const clearSupForm = () => {
    ['sup-name','sup-contact','sup-person','sup-phone','sup-email','sup-address'].forEach(id => {
      const el = document.getElementById(id); if(el) el.value = '';
    });
  };
  const clearProdForm = () => {
    ['np-id','np-name','np-value','np-description'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    const cat=document.getElementById('np-category'); if(cat) cat.value='';
    const stk=document.getElementById('np-stock'); if(stk) stk.value='0';
  };

  openBtn?.addEventListener('click', () => { editingId=null; clearSupForm(); supTitle.textContent='Add Supplier'; openSupModal(); });
  cancelSupBtn?.addEventListener('click', closeSupModal);
  closeSupBtn?.addEventListener('click', closeSupModal);
  closeProdBtn?.addEventListener('click', closeProdModal);
  closeProdFooter?.addEventListener('click', closeProdModal);
  backdrop?.addEventListener('click', () => { closeSupModal(); closeProdModal(); });

  // ── Render suppliers ───────────────────────────────────────────────
  const renderSuppliers = (list) => {
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = `<p style="color:rgba(255,255,255,0.4);padding:20px">No suppliers found.</p>`;
      return;
    }
    grid.innerHTML = list.map(supplierCard).join('');

    grid.querySelectorAll('.cliente-card').forEach(card => {
      const id = card.dataset.id;

      // Toggle menú
      card.querySelector('.menu-btn')?.addEventListener('click', e => {
        e.stopPropagation();
        document.querySelectorAll('.menu-options').forEach(m => m.classList.add('hidden'));
        card.querySelector('.menu-options')?.classList.toggle('hidden');
      });

      // Products — todos los botones con clase opt-products
      card.querySelectorAll('.opt-products').forEach(btn => {
        btn.addEventListener('click', () => {
          card.querySelector('.menu-options')?.classList.add('hidden');
          const sup = allSuppliers.find(s => s.supplierId == id);
          openProductsModal(sup);
        });
      });

      // Edit — todos los botones con clase opt-edit
      card.querySelectorAll('.opt-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          card.querySelector('.menu-options')?.classList.add('hidden');
          const sup = allSuppliers.find(s => s.supplierId == id);
          if (!sup) return;
          editingId = id;
          document.getElementById('sup-name').value    = sup.name    || '';
          document.getElementById('sup-contact').value = sup.contact || '';
          document.getElementById('sup-person').value  = sup.contactPerson || '';
          document.getElementById('sup-phone').value   = sup.phone   || '';
          document.getElementById('sup-email').value   = sup.email   || '';
          document.getElementById('sup-address').value = sup.address || '';
          supTitle.textContent = 'Edit Supplier';
          openSupModal();
        });
      });

      // Delete
      card.querySelector('.opt-delete')?.addEventListener('click', async () => {
        if (!confirm('Delete this supplier?')) return;
        try { await api.deleteSupplier(id); await loadAll(); }
        catch(e) { alert(e.message); }
        card.querySelector('.menu-options')?.classList.add('hidden');
      });
    });
  };

  // Cerrar menús al clic fuera
  document.addEventListener('click', e => {
    if (!e.target.closest('.menu-container'))
      document.querySelectorAll('.menu-options').forEach(m => m.classList.add('hidden'));
  });

  // ── Render lista de productos dentro del modal ─────────────────────
  const renderProductsList = (supplierId) => {
    const list = allProducts.filter(p => p.supplierId == supplierId);
    if (!list.length) {
      prodList.innerHTML = `<p style="color:rgba(255,255,255,0.4);font-size:13px">No products linked to this supplier yet.</p>`;
      return;
    }
    prodList.innerHTML = list.map(p => `
      <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.03);
        border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:10px 14px">
        <div>
          <span style="font-weight:700;color:#e2e8f0;font-size:13px">${p.name}</span>
          <span style="margin-left:10px;font-size:11px;color:rgba(255,255,255,0.4)">${p.category||''}</span>
          <br/>
          <span style="font-size:12px;color:#54F1B8;font-weight:700">$${Number(p.value||0).toLocaleString('es-CO',{minimumFractionDigits:2})}</span>
          <span style="margin-left:10px;font-size:12px;color:rgba(255,255,255,0.4)">Stock: ${p.stock||0}</span>
        </div>
        <button onclick="deleteProductFromSupplier('${p.productId}')"
          style="background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.25);color:#f87171;
          padding:5px 10px;border-radius:7px;cursor:pointer;font-size:12px;font-family:'Poppins',sans-serif">
          ✕ Remove
        </button>
      </div>`).join('');
  };

  window.deleteProductFromSupplier = async (productId) => {
    if (!confirm('Remove this product?')) return;
    try {
      await api.deleteProduct(productId);
      showToastLocal('✅ Product removed', 'success');
      await loadAll();
      renderProductsList(activeSupplierId);
    } catch(e) { showToastLocal('❌ ' + e.message, 'error'); }
  };

  // ── Abrir modal de productos ───────────────────────────────────────
  const openProductsModal = (sup) => {
    if (!sup) return;
    activeSupplierId = sup.supplierId;
    prodTitle.textContent = sup.name;
    clearProdForm();
    renderProductsList(sup.supplierId);
    openProdModal();
  };

  // ── Guardar supplier ───────────────────────────────────────────────
  saveSupBtn?.addEventListener('click', async () => {
    const dto = {
      name:    document.getElementById('sup-name').value.trim(),
      contact: document.getElementById('sup-contact').value.trim(),
      phone:   document.getElementById('sup-phone').value.trim()   || null,
      email:   document.getElementById('sup-email').value.trim()   || null,
      address: document.getElementById('sup-address').value.trim() || null,
    };
    if (!dto.name) { supError.textContent='Name is required.'; supError.style.display='block'; return; }
    try {
      if (editingId) await api.updateSupplier(editingId, dto);
      else await api.createSupplier(dto);
      closeSupModal();
      await loadAll();
    } catch(e) { supError.textContent=e.message; supError.style.display='block'; }
  });

  // ── Guardar producto ───────────────────────────────────────────────
  saveProdBtn?.addEventListener('click', async () => {
    const pid   = document.getElementById('np-id').value.trim();
    const pname = document.getElementById('np-name').value.trim();
    const pval  = parseFloat(document.getElementById('np-value').value || 0);
    if (!pid || !pname || !pval) {
      prodError.textContent='ID, Name and Value are required.'; prodError.style.display='block'; return;
    }
    const dto = {
      productId:   pid,
      name:        pname,
      category:    document.getElementById('np-category').value || null,
      description: document.getElementById('np-description').value.trim() || null,
      value:       pval,
      stock:       parseFloat(document.getElementById('np-stock').value || 0),
      supplierId:  activeSupplierId
    };
    try {
      await api.createProduct(dto);
      showToastLocal('✅ Product created!', 'success');
      clearProdForm();
      prodError.style.display = 'none';
      await loadAll();
      renderProductsList(activeSupplierId);
    } catch(e) { prodError.textContent=e.message; prodError.style.display='block'; }
  });

  // ── Load & search ──────────────────────────────────────────────────
  const loadAll = async () => {
    try {
      [allSuppliers, allProducts] = await Promise.all([api.getSuppliers(), api.getProducts()]);
      filterAndRender(searchInput?.value || '');
    } catch(e) {
      if (grid) grid.innerHTML = `<p style="color:#f87171;padding:20px">Cannot connect to CatalogService on port 5131.</p>`;
    }
  };

  const filterAndRender = (q) => {
    const query = q.toLowerCase().trim();
    const filtered = !query ? allSuppliers : allSuppliers.filter(s =>
      s.name?.toLowerCase().includes(query) ||
      s.contact?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query)
    );
    renderSuppliers(filtered);
  };

  let debounce;
  searchInput?.addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => filterAndRender(e.target.value || ''), 300);
  });

  // ── Toast ──────────────────────────────────────────────────────────
  function showToastLocal(msg, type='info') {
    let t = document.getElementById('sup-toast');
    if (!t) {
      t = document.createElement('div'); t.id='sup-toast';
      t.style.cssText=`position:fixed;bottom:30px;left:50%;transform:translateX(-50%);
        padding:10px 22px;border-radius:100px;font-size:13px;font-family:'Poppins',sans-serif;
        z-index:99999;opacity:0;transition:opacity 0.3s;white-space:nowrap;pointer-events:none;
        box-shadow:0 4px 20px rgba(0,0,0,0.4);`;
      document.body.appendChild(t);
    }
    const c = { info:'background:#1a2035;border:1px solid rgba(144,105,249,0.3);color:#fff',
      success:'background:#0f2a1e;border:1px solid rgba(84,241,184,0.4);color:#54F1B8',
      error:'background:#2a0f0f;border:1px solid rgba(248,113,113,0.4);color:#f87171' };
    t.style.cssText += c[type]||c.info;
    t.textContent=msg; t.style.opacity='1';
    clearTimeout(t._t); t._t=setTimeout(()=>{ t.style.opacity='0'; }, 2600);
  }

  // Boot
  loadAll();
});