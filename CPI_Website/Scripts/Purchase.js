// ==================== CONFIGURACIÓN API ====================
const API_CONFIG = {
  purchaseOrderService: 'http://localhost:5116', 
  purchaseReceiptService: 'http://localhost:5002',
  inventoryService: 'http://localhost:5166',
  supplierService: 'http://localhost:5062'
};

// ==================== UTILIDAD PARA MANEJAR RESPUESTAS ====================
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Error: ${response.status}`);
  }
  
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
};

// ==================== SUPPLIERS API ====================
const suppliersAPI = {
  getAll: async () => {
    const response = await fetch(`${API_CONFIG.supplierService}`);
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_CONFIG.supplierService}/${id}`);
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${API_CONFIG.supplierService}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_CONFIG.supplierService}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_CONFIG.supplierService}/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  }
};

// ==================== PRODUCTS API ====================
const productsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_CONFIG.inventoryService}/api/Products`);
    return handleResponse(response);
  },
  
  getById: async (id) => {
    const response = await fetch(`${API_CONFIG.inventoryService}/api/Products/${id}`);
    return handleResponse(response);
  }
};

// ==================== PURCHASE ORDERS API ====================
const purchaseOrdersAPI = {
  getAll: async () => {
    const response = await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrders`);
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrders/${id}`);
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrders/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  }
};

// ==================== PURCHASE ORDER DETAILS API ====================
const purchaseOrderDetailsAPI = {
  getAllByOrder: async (orderId) => {
    const response = await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrderDetails/order/${orderId}`);
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrderDetails/${id}`);
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrderDetails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrderDetails/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrderDetails/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  }
};

// ==================== ESTADO GLOBAL ====================
let cart = [];
let allProducts = [];
let filteredProducts = [];
let suppliers = [];

// ==================== CARGAR PROVEEDORES ====================
async function loadSuppliers() {
  try {
    suppliers = await suppliersAPI.getAll();
    renderSupplierSelect();
  } catch (error) {
    console.error('Error loading suppliers:', error);
  }
}

// ==================== RENDERIZAR SELECT DE PROVEEDORES ====================
function renderSupplierSelect() {
  const select = document.getElementById("supplier-select");
  if (!select) return;
  
  select.innerHTML = '<option value="">Select a supplier</option>';
  
  suppliers.forEach(s => {
    const option = document.createElement("option");
    option.value = s.supplierId || s.id;
    option.textContent = `${s.name} - ${s.document || s.nit || ''}`;
    select.appendChild(option);
  });
}

// ==================== CREAR NUEVO PROVEEDOR ====================
window.abrirModalProveedor = function() {
  const modal = document.getElementById("modal-nuevo-proveedor");
  if (modal) {
    modal.style.display = "block";
  }
};

window.cerrarModalProveedor = function() {
  const modal = document.getElementById("modal-nuevo-proveedor");
  if (modal) {
    modal.style.display = "none";
    document.getElementById("form-nuevo-proveedor").reset();
  }
};

// ==================== CARGAR PRODUCTOS ====================
async function loadProducts() {
  try {
    allProducts = await productsAPI.getAll();
    filteredProducts = [...allProducts];
    renderCarousel(filteredProducts);
  } catch (error) {
    console.error('Error loading products:', error);
    alert('❌ Error loading products');
  }
}

// ==================== RENDERIZAR CARRUSEL ====================
function renderCarousel(products) {
  const container = document.getElementById("product-carousel");
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = '<div class="swiper-slide"><p>No products found</p></div>';
    return;
  }

  products.forEach(p => {
    const slide = document.createElement("div");
    slide.classList.add("swiper-slide");
    slide.innerHTML = `
      <div class="card">
        <h3>${p.name}</h3>
        <p><strong>$${p.price}</strong></p>
        <p>Stock: ${p.stock || 0}</p>
        <button onclick="addToCart('${p.productId}', '${p.name}', ${p.price})">Add to cart</button>
      </div>
    `;
    container.appendChild(slide);
  });

  if (window.swiperInstance) {
    window.swiperInstance.update();
  } else {
    window.swiperInstance = new Swiper(".mySwiper", {
      slidesPerView: 3,
      spaceBetween: 20,
      navigation: { 
        nextEl: ".swiper-button-next", 
        prevEl: ".swiper-button-prev" 
      },
      breakpoints: {
        320: { slidesPerView: 1, spaceBetween: 10 },
        768: { slidesPerView: 2, spaceBetween: 15 },
        1024: { slidesPerView: 3, spaceBetween: 20 }
      }
    });
  }
}

// ==================== FUNCIONES DEL CARRITO ====================
window.addToCart = function(id, name, price) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, qty: 1 });
  }
  renderCart();
  alert(`✅ ${name} added to cart`);
};

window.removeFromCart = function(id) {
  cart = cart.filter(item => item.id !== id);
  renderCart();
};

function renderCart() {
  const table = document.getElementById("tabla-carrito");
  const totalSpan = document.getElementById("total-carrito");
  
  if (!table || !totalSpan) return;
  
  table.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    const subtotal = item.price * item.qty;
    const iva = subtotal * 0.19;
    const totalConIva = subtotal + iva;
    total += totalConIva;

    table.innerHTML += `
      <tr>
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>$${item.price.toFixed(2)}</td>
        <td>19%</td>
        <td>$0.00</td>
        <td>$${totalConIva.toFixed(2)}</td>
        <td><button onclick="removeFromCart('${item.id}')" class="btn-eliminar">❌</button></td>
      </tr>
    `;
  });

  totalSpan.textContent = total.toFixed(2);
}

// ==================== MODALES ====================
window.abrirCarrito = function() {
  const modal = document.getElementById("carrito-modal");
  if (modal) {
    modal.style.display = "block";
  }
};

window.cerrarCarrito = function() {
  const modal = document.getElementById("carrito-modal");
  if (modal) {
    modal.style.display = "none";
  }
};

window.abrirModalCompra = function() {
  if (cart.length === 0) {
    alert("⚠️ The cart is empty");
    return;
  }
  
  const modal = document.getElementById("modal-registro");
  const totalModal = document.getElementById("total-final-modal");
  const totalCarrito = document.getElementById("total-carrito");
  
  if (modal && totalModal && totalCarrito) {
    modal.style.display = "block";
    totalModal.textContent = totalCarrito.textContent;
    
    const dateInput = document.getElementById("purchase-date");
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
  }
};

window.cerrarModalCompra = function() {
  const modal = document.getElementById("modal-registro");
  if (modal) {
    modal.style.display = "none";
  }
};

window.cerrarFactura = function() {
  const modal = document.getElementById("factura-modal");
  if (modal) {
    modal.style.display = "none";
  }
};

// ==================== FORMULARIO NUEVO PROVEEDOR ====================
document.addEventListener('DOMContentLoaded', function() {
  const formProveedor = document.getElementById("form-nuevo-proveedor");
  
  if (formProveedor) {
    formProveedor.addEventListener("submit", async (e) => {
      e.preventDefault();

      const supplierData = {
        name: document.getElementById("supplier-name").value,
        document: document.getElementById("supplier-document").value,
        email: document.getElementById("supplier-email").value,
        phone: document.getElementById("supplier-phone").value,
        address: document.getElementById("supplier-address").value
      };

      try {
        const newSupplier = await suppliersAPI.create(supplierData);
        alert("✅ Supplier created successfully!");
        
        suppliers.push(newSupplier);
        renderSupplierSelect();
        
        const select = document.getElementById("supplier-select");
        if (select) {
          select.value = newSupplier.supplierId || newSupplier.id;
        }
        
        cerrarModalProveedor();
      } catch (error) {
        console.error('Error creating supplier:', error);
        alert("❌ Error creating supplier: " + error.message);
      }
    });
  }
});

// ==================== PROCESAR COMPRA ====================
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById("form-compra");
  
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const supplierId = document.getElementById("supplier-select").value;
      const date = document.getElementById("purchase-date").value;
      const method = document.getElementById("payment-method").value;

      if (!supplierId || !date || !method) {
        alert("⚠️ Please complete all fields");
        return;
      }

      if (cart.length === 0) {
        alert("⚠️ The cart is empty");
        return;
      }

      try {
        const order = await purchaseOrdersAPI.create({
          supplierId: supplierId,
          orderDate: date,
          status: "Pending",
          paymentMethod: method
        });

        for (let item of cart) {
          await purchaseOrderDetailsAPI.create({
            purchaseOrderId: order.purchaseOrderId,
            productId: item.id,
            quantity: item.qty,
            unitPrice: item.price
          });
        }

        const supplier = suppliers.find(s => (s.supplierId || s.id) == supplierId);
        showInvoice(order.purchaseOrderId, supplier?.name || supplierId, date);
        
        cart = [];
        renderCart();
        cerrarModalCompra();

      } catch (error) {
        console.error('Error processing purchase:', error);
        alert("❌ Error processing purchase: " + error.message);
      }
    });
  }
});

// ==================== MOSTRAR FACTURA ====================
function showInvoice(orderId, supplierName, date) {
  document.getElementById("factura-orden").textContent = orderId;
  document.getElementById("factura-cliente").textContent = supplierName;
  document.getElementById("factura-fecha").textContent = date;

  const tbody = document.getElementById("factura-productos");
  tbody.innerHTML = "";

  let total = 0;

  cart.forEach(item => {
    const subtotal = item.price * item.qty;
    const iva = subtotal * 0.19;
    const totalConIva = subtotal + iva;
    total += totalConIva;

    tbody.innerHTML += `
      <tr>
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>$${item.price.toFixed(2)}</td>
        <td>19%</td>
        <td>$${totalConIva.toFixed(2)}</td>
      </tr>
    `;
  });

  document.getElementById("factura-total").textContent = total.toFixed(2);
  document.getElementById("factura-modal").style.display = "block";
}

// ==================== BÚSQUEDA DE PRODUCTOS ====================
window.buscarProducto = function() {
  const input = document.getElementById("search-input");
  if (!input) return;
  
  const query = input.value.toLowerCase().trim();
  
  if (query === "") {
    filteredProducts = [...allProducts];
  } else {
    filteredProducts = allProducts.filter(p => 
      p.name.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query))
    );
  }
  
  renderCarousel(filteredProducts);
};

document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        buscarProducto();
      }
    });
  }
});

// ==================== FILTROS ====================
window.aplicarFiltros = function() {
  const categoria = document.getElementById("filtro-categoria")?.value || "";
  const precioMax = parseFloat(document.getElementById("filtro-precio")?.value) || Infinity;
  const fechaInicio = document.getElementById("filtro-fecha-inicio")?.value || "";
  const fechaFin = document.getElementById("filtro-fecha-fin")?.value || "";

  filteredProducts = allProducts.filter(p => {
    if (categoria && p.category !== categoria) return false;
    if (p.price > precioMax) return false;
    if (fechaInicio && p.createdDate && p.createdDate < fechaInicio) return false;
    if (fechaFin && p.createdDate && p.createdDate > fechaFin) return false;
    return true;
  });

  renderCarousel(filteredProducts);
  alert(`✅ Filters applied: ${filteredProducts.length} products found`);
};

document.addEventListener('DOMContentLoaded', function() {
  const filterBtn = document.querySelector('.filter-btn');
  const filterPanel = document.getElementById('filtro-panel');
  
  if (filterBtn && filterPanel) {
    filterBtn.addEventListener('click', function() {
      filterPanel.style.display = filterPanel.style.display === 'none' ? 'block' : 'none';
    });
  }
});

// ==================== INICIALIZACIÓN ====================
window.addEventListener('load', () => {
  loadProducts();
  loadSuppliers();
});