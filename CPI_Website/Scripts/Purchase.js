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
  getAll:  async ()  => handleResponse(await fetch(`${API_CONFIG.catalogService}/api/Suppliers`)),
  create:  async (d) => handleResponse(await fetch(`${API_CONFIG.catalogService}/api/Suppliers`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}))
};
const productsAPI = {
  getAll: async () => handleResponse(await fetch(`${API_CONFIG.catalogService}/api/Products`))
};
const ordersAPI = {
  getAll:  async ()     => handleResponse(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrders`)),
  getById: async (id)   => handleResponse(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrders/${id}`)),
  create:  async (d)    => handleResponse(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrders`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})),
  update:  async (id,d) => handleResponse(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrders/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})),
  delete:  async (id)   => handleResponse(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrders/${id}`,{method:'DELETE'}))
};
const orderDetailsAPI = {
  getByOrder: async (oid) => handleResponse(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrderDetails/order/${oid}`)),
  create:     async (d)   => handleResponse(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrderDetails`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})),
  update:     async (id,d)=> handleResponse(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrderDetails/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})),
  delete:     async (id)  => handleResponse(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrderDetails/${id}`,{method:'DELETE'}))
};
const receiptsAPI = {
  create: async (d)    => handleResponse(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseReceipts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})),
  update: async (id,d) => handleResponse(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseReceipts/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}))
};
const transactionsAPI = {
  create: async (d)    => handleResponse(await fetch(`${API_CONFIG.purchaseOrderService}/api/Transaction`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})),
  update: async (id,d) => handleResponse(await fetch(`${API_CONFIG.purchaseOrderService}/api/Transaction/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}))
};
const logicalCostsAPI = {
  getByOrder: async (n)   => handleResponse(await fetch(`${API_CONFIG.purchaseOrderService}/api/LogicalCosts/${n}`)),
  create:     async (d)   => handleResponse(await fetch(`${API_CONFIG.purchaseOrderService}/api/LogicalCosts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})),
  update:     async (n,d) => handleResponse(await fetch(`${API_CONFIG.purchaseOrderService}/api/LogicalCosts/${n}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}))
};

// ==================== ESTADO ====================
let allProducts=[], suppliers=[], allOrders=[], cart=[], filteredProducts=[];

// ==================== HELPERS ====================
function getCategoryIcon(c){const m={Cartuchos:'🖨️',Tintas:'🎨',Papelería:'📄',Computers:'💻',Accessories:'🖱️',default:'📦'};return m[c]||m.default;}
function fmt(n){return Number(n||0).toLocaleString('es-CO',{minimumFractionDigits:2});}

function showToast(msg,type='info'){
  let t=document.getElementById('cpi-toast');
  if(!t){t=document.createElement('div');t.id='cpi-toast';
    t.style.cssText=`position:fixed;bottom:110px;left:50%;transform:translateX(-50%);padding:10px 22px;
      border-radius:100px;font-size:13px;font-family:'Poppins',sans-serif;z-index:99999;opacity:0;
      transition:opacity 0.3s;white-space:nowrap;pointer-events:none;box-shadow:0 4px 20px rgba(0,0,0,0.4);`;
    document.body.appendChild(t);}
  const c={info:'background:#1a2035;border:1px solid rgba(144,105,249,0.3);color:#fff',
    success:'background:#0f2a1e;border:1px solid rgba(84,241,184,0.4);color:#54F1B8',
    error:'background:#2a0f0f;border:1px solid rgba(248,113,113,0.4);color:#f87171'};
  t.style.cssText+=c[type]||c.info;
  t.textContent=msg;t.style.opacity='1';
  clearTimeout(t._t);t._t=setTimeout(()=>{t.style.opacity='0';},2600);
}

function statusBadge(s){
  const m={'Pendiente':{c:'#f59e0b',bg:'rgba(245,158,11,0.12)',l:'● Pendiente'},
    'Pending':{c:'#f59e0b',bg:'rgba(245,158,11,0.12)',l:'● Pending'},
    'Confirmed':{c:'#60a5fa',bg:'rgba(96,165,250,0.12)',l:'✔ Confirmed'},
    'Received':{c:'#34d399',bg:'rgba(52,211,153,0.12)',l:'✔ Received'},
    'Partial':{c:'#a78bfa',bg:'rgba(167,139,250,0.12)',l:'◑ Partial'},
    'Completed':{c:'#54F1B8',bg:'rgba(84,241,184,0.12)',l:'✅ Completed'},
    'Cancelled':{c:'#f87171',bg:'rgba(248,113,113,0.12)',l:'✖ Cancelled'}};
  const v=m[s]||{c:'#9ca3af',bg:'rgba(156,163,175,0.1)',l:s};
  return `<span style="color:${v.c};background:${v.bg};padding:3px 10px;border-radius:100px;font-size:11px;font-weight:700">${v.l}</span>`;
}

function updateCartBadge(){
  const b=document.getElementById('cart-badge');if(!b)return;
  const n=cart.reduce((s,i)=>s+i.qty,0);b.textContent=n;b.style.display=n>0?'flex':'none';
}

// ==================== SUPPLIERS ====================
async function loadSuppliers(){
  try{suppliers=await suppliersAPI.getAll();renderSupplierSelects();}catch(e){console.error(e);}
}
function renderSupplierSelects(){
  ['supplier-select'].forEach(id=>{
    const s=document.getElementById(id);if(!s)return;
    const cur=s.value;s.innerHTML='<option value="">Select a supplier</option>';
    suppliers.forEach(x=>{const o=document.createElement('option');o.value=x.supplierId??x.id;
      o.textContent=`${x.name}${x.contact?' — '+x.contact:''}`;s.appendChild(o);});
    if(cur)s.value=cur;
  });
}
window.abrirModalProveedor=()=>{const m=document.getElementById('modal-nuevo-proveedor');if(m)m.style.display='flex';};
window.cerrarModalProveedor=()=>{const m=document.getElementById('modal-nuevo-proveedor');if(m){m.style.display='none';document.getElementById('form-nuevo-proveedor').reset();}};

// ==================== PRODUCTS ====================
async function loadProducts(){
  try{
    allProducts=await productsAPI.getAll();filteredProducts=[...allProducts];
    renderCarousel(filteredProducts);renderCartProductSelect();
  }catch(e){
    const c=document.getElementById('product-carousel');
    if(c)c.innerHTML=`<div class="swiper-slide"><div class="card" style="align-items:center;justify-content:center;min-height:200px;padding:30px"><p style="color:#f87171;font-size:13px;text-align:center">⚠️ Could not load products.</p></div></div>`;
  }
}

function renderCartProductSelect(){
  const sel=document.getElementById('cart-product-select');if(!sel)return;
  sel.innerHTML='<option value="">Select product</option>';
  allProducts.forEach(p=>{
    const o=document.createElement('option');
    o.value=p.productId??p.id;o.dataset.price=p.value??p.price??0;
    o.textContent=p.name;sel.appendChild(o);
  });
  sel.addEventListener('change',function(){
    const pi=document.getElementById('cart-price');
    if(pi)pi.value=this.options[this.selectedIndex].dataset.price||0;
  });
}

function renderCarousel(products){
  const container=document.getElementById('product-carousel');if(!container)return;
  container.innerHTML='';
  if(!products.length){container.innerHTML='<div class="swiper-slide"><div class="card" style="align-items:center;padding:40px;justify-content:center"><p style="color:rgba(255,255,255,0.4)">No products found</p></div></div>';window.swiperInstance?.update();return;}
  products.forEach(p=>{
    const price=p.value??p.price??0,stock=p.stock??0,cat=p.category??'';
    const stockClass=stock===0?'empty':stock<10?'low':'';
    const stockLabel=stock===0?'❌ Out of stock':stock<10?`⚠️ Low: ${stock}`:`✅ Stock: ${stock}`;
    const pid=String(p.productId??p.id??'').replace(/'/g,"\\'");
    const pname=String(p.name??'').replace(/'/g,"\\'");
    const slide=document.createElement('div');slide.classList.add('swiper-slide');
    slide.innerHTML=`<div class="card">
      <div class="card-img">${getCategoryIcon(cat)}</div>
      <div class="card-info">
        ${cat?`<span class="card-category">${cat}</span>`:''}
        <h3>${p.name}</h3>
        <div class="card-price">$${fmt(price)}</div>
        <div class="card-stock ${stockClass}">${stockLabel}</div>
      </div>
      <button onclick="addToCart('${pid}','${pname}',${price})" ${stock===0?'disabled style="opacity:0.35;cursor:not-allowed"':''}>
        <ion-icon name="cart-outline"></ion-icon> Add to cart
      </button></div>`;
    container.appendChild(slide);
  });
  if(window.swiperInstance){window.swiperInstance.destroy(true,true);window.swiperInstance=null;}
  window.swiperInstance=new Swiper('.mySwiper',{spaceBetween:20,
    navigation:{nextEl:'.swiper-button-next',prevEl:'.swiper-button-prev'},
    breakpoints:{320:{slidesPerView:1,spaceBetween:12},600:{slidesPerView:2,spaceBetween:16},900:{slidesPerView:3,spaceBetween:20},1200:{slidesPerView:4,spaceBetween:20}}});
}

// ==================== CARRITO ====================
window.addToCart=function(id,name,price){
  const ex=cart.find(i=>i.id===id);
  if(ex)ex.qty+=1;else cart.push({id,name,price:Number(price),qty:1});
  renderCart();updateCartBadge();showToast(`✅ ${name} added to cart`,'success');
};

window.addToCartFromSelect=function(){
  const sel=document.getElementById('cart-product-select');
  const qty=parseFloat(document.getElementById('cart-qty')?.value||1);
  const price=parseFloat(document.getElementById('cart-price')?.value||0);
  if(!sel.value){showToast('⚠️ Select a product','error');return;}
  if(!price){showToast('⚠️ Enter a price','error');return;}
  const name=sel.options[sel.selectedIndex].textContent;
  const ex=cart.find(i=>i.id===sel.value);
  if(ex)ex.qty+=qty;else cart.push({id:sel.value,name,price,qty});
  renderCart();updateCartBadge();
  showToast(`✅ ${name} added`,'success');
  sel.value='';document.getElementById('cart-qty').value=1;document.getElementById('cart-price').value='';
};

window.removeFromCart=function(id){cart=cart.filter(i=>i.id!==id);renderCart();updateCartBadge();};
window.changeQty=function(id,delta){const item=cart.find(i=>i.id===id);if(!item)return;item.qty=Math.max(1,item.qty+delta);renderCart();updateCartBadge();};
window.setQty=function(id,val){const item=cart.find(i=>i.id===id);if(!item)return;const n=parseInt(val);item.qty=n>0?n:1;renderCart();updateCartBadge();};

function renderCart(){
  const table=document.getElementById('tabla-carrito'),ts=document.getElementById('total-carrito');
  if(!table||!ts)return;table.innerHTML='';let total=0;
  cart.forEach(item=>{
    const sub=item.price*item.qty,iva=sub*0.19,ttl=sub+iva;total+=ttl;
    table.innerHTML+=`<tr>
      <td style="font-size:11px;color:rgba(255,255,255,0.5)">${item.id}</td>
      <td style="text-align:left;font-weight:600">${item.name}</td>
      <td><div style="display:flex;align-items:center;gap:5px;justify-content:center">
        <button onclick="changeQty('${item.id}',-1)" class="qty-btn">−</button>
        <input type="number" value="${item.qty}" min="1" onchange="setQty('${item.id}',this.value)"
          style="width:44px;text-align:center;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
          color:#fff;border-radius:6px;padding:4px;font-family:'Poppins',sans-serif;font-size:12px;outline:none"/>
        <button onclick="changeQty('${item.id}',1)" class="qty-btn">+</button>
      </div></td>
      <td>$${fmt(item.price)}</td>
      <td style="color:rgba(255,255,255,0.5)">19%</td>
      <td><strong style="color:#54F1B8">$${fmt(ttl)}</strong></td>
      <td><button onclick="removeFromCart('${item.id}')" class="btn-eliminar">✕</button></td></tr>`;
  });
  ts.textContent=fmt(total);
}

// ==================== MODALES ====================
window.abrirCarrito=()=>{const m=document.getElementById('carrito-modal');if(m)m.style.display='flex';};
window.cerrarCarrito=()=>{const m=document.getElementById('carrito-modal');if(m)m.style.display='none';};
window.cerrarModalCompra=()=>{const m=document.getElementById('modal-registro');if(m)m.style.display='none';};
window.cerrarFactura=()=>{const m=document.getElementById('factura-modal');if(m)m.style.display='none';};
window.cerrarOrdersList=()=>{const m=document.getElementById('modal-orders-list');if(m)m.style.display='none';};
window.cerrarOrderDetail=()=>{document.getElementById('modal-order-detail').style.display='none';};
window.cerrarReceipt=()=>{document.getElementById('modal-receipt').style.display='none';};
window.cerrarPayment=()=>{document.getElementById('modal-payment').style.display='none';};

window.abrirModalCompra=function(opts={}){
  const{requiereCarrito=true}=opts;
  if(requiereCarrito&&cart.length===0){showToast('⚠️ The cart is empty');return;}
  const m=document.getElementById('modal-registro');if(!m)return;m.style.display='flex';
  const on=document.getElementById('order-number');if(on&&!on.value)on.value='ORD-'+Date.now();
  const tm=document.getElementById('total-final-modal'),tc=document.getElementById('total-carrito');
  if(tm)tm.textContent=cart.length>0&&tc?tc.textContent:'0.00';
  const di=document.getElementById('purchase-date');if(di&&!di.value)di.value=new Date().toISOString().split('T')[0];
  if(suppliers.length===0)loadSuppliers();
};

// ==================== ORDERS LIST ====================
window.abrirOrdersList=async function(){
  const m=document.getElementById('modal-orders-list');if(!m)return;
  m.style.display='flex';await loadOrdersList();
};

async function loadOrdersList(){
  const tbody=document.getElementById('orders-list-tbody');if(!tbody)return;
  tbody.innerHTML=`<tr><td colspan="5" style="text-align:center;padding:20px;color:rgba(255,255,255,0.4)">Loading...</td></tr>`;
  try{
    allOrders=await ordersAPI.getAll();
    renderOrdersTable(allOrders);
  }catch(e){tbody.innerHTML=`<tr><td colspan="5" style="text-align:center;color:#f87171">Error loading orders</td></tr>`;}
}

function renderOrdersTable(orders){
  const tbody=document.getElementById('orders-list-tbody');if(!tbody)return;
  const count=document.getElementById('orders-count');
  if(!orders.length){
    tbody.innerHTML=`<tr><td colspan="5" style="text-align:center;padding:20px;color:rgba(255,255,255,0.4)">No orders found</td></tr>`;
    if(count)count.textContent='';return;
  }
  tbody.innerHTML=orders.map(o=>{
    const sup=suppliers.find(s=>(s.supplierId??s.id)==o.supplierId);
    return`<tr style="border-bottom:1px solid rgba(255,255,255,0.05);transition:background 0.2s" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
      <td style="padding:11px 10px;font-size:13px;color:#e2e8f0"><strong>#${o.purchaseOrderId}</strong></td>
      <td style="padding:11px 10px;font-size:13px;color:#e2e8f0">${sup?.name||'Supplier #'+o.supplierId}</td>
      <td style="padding:11px 10px;font-size:13px;color:#e2e8f0">${new Date(o.orderDate).toLocaleDateString('es-CO')}</td>
      <td style="padding:11px 10px">${statusBadge(o.status)}</td>
      <td style="padding:11px 10px">
        <button class="order-action-btn" onclick="verOrden(${o.purchaseOrderId})" title="View">👁️</button>
        ${o.status==='Pendiente'||o.status==='Pending'?`<button class="order-action-btn" onclick="confirmarOrden(${o.purchaseOrderId})" title="Confirm">✔️</button>`:''}
        ${o.status==='Confirmed'?`<button class="order-action-btn" onclick="abrirRecepcion(${o.purchaseOrderId})" title="Receive">📦</button>`:''}
        ${o.status==='Received'||o.status==='Partial'?`<button class="order-action-btn" onclick="completarOrden(${o.purchaseOrderId})" title="Complete">✅</button>`:''}
        ${o.status==='Completed'?`<button class="order-action-btn" onclick="abrirPago(${o.purchaseOrderId})" title="Pay">💳</button>`:''}
        ${o.status==='Pendiente'||o.status==='Pending'||o.status==='Cancelled'?`<button class="order-action-btn" onclick="eliminarOrden(${o.purchaseOrderId})" title="Delete" style="color:#f87171">🗑️</button>`:''}
      </td></tr>`;
  }).join('');
  if(count)count.textContent=`${orders.length} order${orders.length!==1?'s':''} found`;
}

window.filtrarOrdenes=function(query){
  const status=document.getElementById('order-status-filter')?.value||'';
  const q=(query||'').toLowerCase().trim();
  const filtered=allOrders.filter(o=>{
    const sup=suppliers.find(s=>(s.supplierId??s.id)==o.supplierId);
    const matchQ=!q||String(o.purchaseOrderId).includes(q)||(sup?.name||'').toLowerCase().includes(q);
    const matchS=!status||o.status===status;
    return matchQ&&matchS;
  });
  renderOrdersTable(filtered);
};

window.eliminarOrden=async function(id){
  if(!confirm(`Delete order #${id}? This cannot be undone.`))return;
  try{
    await ordersAPI.delete(id);
    showToast('✅ Order deleted','success');
    await loadOrdersList();
  }catch(e){showToast('❌ '+e.message,'error');}
};

// ==================== VER ORDEN ====================
window.verOrden=async function(id){
  try{
    const[order,details]=await Promise.all([ordersAPI.getById(id),orderDetailsAPI.getByOrder(id)]);
    let lc=null;try{lc=await logicalCostsAPI.getByOrder(id);}catch(e){}
    const sup=suppliers.find(s=>(s.supplierId??s.id)==order.supplierId);
    const subtotal=details.reduce((s,d)=>s+(d.quantity*d.unitPrice),0);
    const lcTotal=lc?[(lc.internationalTransport||0),(lc.localTransport||0),(lc.nationalization||0),(lc.cargoInsurance||0),(lc.storage||0),(lc.others||0)].reduce((a,b)=>a+b,0):0;
    const grand=subtotal+lcTotal;
    const canEdit=order.status==='Pendiente'||order.status==='Pending';

    const detailRows=details.map(d=>{
      const prod=allProducts.find(p=>(p.productId??p.id)===d.productId);
      return`<tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
        <td style="padding:8px;font-size:11px;color:rgba(255,255,255,0.45)">${d.productId}</td>
        <td style="padding:8px;font-weight:600">${prod?.name||d.productId}</td>
        <td style="padding:8px;text-align:center">
          ${canEdit?`<div style="display:flex;align-items:center;gap:5px;justify-content:center">
            <button onclick="editDetailQty(${d.purchaseOrderDetailId},${d.quantity-1},${d.unitPrice},${id})" class="qty-btn">−</button>
            <span style="min-width:28px;text-align:center;font-size:13px">${d.quantity}</span>
            <button onclick="editDetailQty(${d.purchaseOrderDetailId},${d.quantity+1},${d.unitPrice},${id})" class="qty-btn">+</button>
          </div>`:d.quantity}
        </td>
        <td style="padding:8px;text-align:center">
          ${canEdit?`<input type="number" value="${d.unitPrice}" step="0.01" min="0"
            onchange="editDetailPrice(${d.purchaseOrderDetailId},this.value,${d.quantity},${id})"
            style="width:85px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;
            padding:5px 8px;border-radius:6px;font-family:'Poppins',sans-serif;font-size:12px;outline:none;text-align:center"/>`:
            `$${fmt(d.unitPrice)}`}
        </td>
        <td style="padding:8px;text-align:right;color:#54F1B8;font-weight:700">$${fmt(d.quantity*d.unitPrice)}</td>
        ${canEdit?`<td style="padding:8px;text-align:center"><button onclick="eliminarDetalle(${d.purchaseOrderDetailId},${id})" class="btn-eliminar">✕</button></td>`:'<td></td>'}
      </tr>`;
    }).join('');

    const lcFields=[
      {key:'internationalTransport',label:'🚢 International Transport'},
      {key:'localTransport',label:'🚛 Local Transport'},
      {key:'nationalization',label:'🏛️ Nationalization'},
      {key:'cargoInsurance',label:'🛡️ Cargo Insurance'},
      {key:'storage',label:'🏭 Storage'},
      {key:'others',label:'📦 Others'}
    ];

    document.getElementById('order-detail-body').innerHTML=`
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:20px">
        <div class="od-field"><span>Order #</span><strong>${order.purchaseOrderId}</strong></div>
        <div class="od-field"><span>Status</span>${statusBadge(order.status)}</div>
        <div class="od-field"><span>Supplier</span><strong>${sup?.name||'#'+order.supplierId}</strong></div>
        <div class="od-field"><span>Date</span><strong>${new Date(order.orderDate).toLocaleDateString('es-CO')}</strong></div>
        ${order.shippingCountry?`<div class="od-field"><span>Country</span><strong>${order.shippingCountry}</strong></div>`:''}
        ${order.shippingRegion?`<div class="od-field"><span>Region</span><strong>${order.shippingRegion}</strong></div>`:''}
        ${order.shippingAddress?`<div class="od-field" style="grid-column:span 2"><span>Shipping Address</span><strong>${order.shippingAddress}</strong></div>`:''}
      </div>

      <h4 style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin:0 0 10px">Products</h4>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead><tr style="background:rgba(144,105,249,0.08)">
          ${['Code','Product','Qty','Unit Price','Subtotal',''].map(h=>`<th style="padding:8px;font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;text-align:left">${h}</th>`).join('')}
        </tr></thead>
        <tbody>${detailRows||`<tr><td colspan="6" style="text-align:center;padding:16px;color:rgba(255,255,255,0.3)">No products in this order</td></tr>`}</tbody>
      </table>

      ${canEdit?`
      <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px;margin-bottom:16px">
        <p style="font-size:11px;color:rgba(255,255,255,0.4);margin:0 0 10px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">➕ Add Product</p>
        <div style="display:grid;grid-template-columns:1fr auto auto auto;gap:8px;align-items:end">
          <select id="new-detail-product" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;padding:8px 10px;border-radius:8px;font-family:'Poppins',sans-serif;font-size:13px;outline:none">
            <option value="">Select product</option>
            ${allProducts.map(p=>`<option value="${p.productId??p.id}" data-price="${p.value??p.price??0}">${p.name}</option>`).join('')}
          </select>
          <input id="new-detail-qty" type="number" min="1" value="1"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;padding:8px 10px;border-radius:8px;font-family:'Poppins',sans-serif;font-size:13px;outline:none;width:72px"/>
          <input id="new-detail-price" type="number" min="0" step="0.01" placeholder="Cost"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;padding:8px 10px;border-radius:8px;font-family:'Poppins',sans-serif;font-size:13px;outline:none;width:110px"/>
          <button onclick="agregarDetalle(${id})"
            style="background:linear-gradient(135deg,#9069F9,#54F1B8);color:#fff;border:none;padding:9px 14px;border-radius:8px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;font-size:13px">
            + Add
          </button>
        </div>
      </div>`:''}

      <!-- Logical Costs -->
      <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px;margin-bottom:16px">
        <p style="font-size:11px;color:rgba(255,255,255,0.4);margin:0 0 12px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">🧮 Logical Costs</p>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          ${lcFields.map(f=>`
            <label style="font-size:11px;color:rgba(255,255,255,0.4);display:flex;flex-direction:column;gap:5px;text-transform:uppercase;letter-spacing:.04em">
              ${f.label}
              <input id="lc-${f.key}" type="number" min="0" step="0.01" value="${lc?lc[f.key]||0:0}"
                style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;padding:8px 10px;border-radius:8px;font-family:'Poppins',sans-serif;font-size:13px;outline:none"/>
            </label>`).join('')}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px">
          <span style="font-size:13px;color:rgba(255,255,255,0.5)">Logical costs total: <strong style="color:#a78bfa">$${fmt(lcTotal)}</strong></span>
          <button onclick="guardarLogicalCosts(${id},${!!lc})"
            style="background:transparent;color:#9069F9;border:1.5px solid #9069F9;padding:7px 18px;border-radius:8px;font-weight:600;cursor:pointer;font-family:'Poppins',sans-serif;font-size:13px"
            onmouseover="this.style.background='rgba(144,105,249,0.12)'" onmouseout="this.style.background='transparent'">
            💾 Save Costs
          </button>
        </div>
      </div>

      <!-- Grand Total -->
      <div style="background:rgba(144,105,249,0.06);border:1px solid rgba(144,105,249,0.15);border-radius:10px;padding:16px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;color:rgba(255,255,255,0.55)">
          <span>Products subtotal</span><span>$${fmt(subtotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;color:rgba(255,255,255,0.55)">
          <span>Logical costs</span><span>$${fmt(lcTotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:800;color:#54F1B8;border-top:1px solid rgba(255,255,255,0.08);padding-top:10px">
          <span>Grand Total</span><span>$${fmt(grand)}</span>
        </div>
      </div>

      <!-- Action buttons -->
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${canEdit?`
          <button onclick="confirmarOrden(${id})"
            style="flex:1;padding:11px;background:linear-gradient(135deg,#60a5fa,#3b82f6);color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;font-size:13px">
            ✔ Confirm Order
          </button>
          <button onclick="cancelarOrden(${id})"
            style="padding:11px 18px;background:rgba(248,113,113,0.08);color:#f87171;border:1px solid rgba(248,113,113,0.3);border-radius:10px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;font-size:13px">
            ✖ Cancel
          </button>`:''}
        ${order.status==='Confirmed'?`
          <button onclick="abrirRecepcion(${id})"
            style="flex:1;padding:11px;background:linear-gradient(135deg,#9069F9,#54F1B8);color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;font-size:13px">
            📦 Register Receipt
          </button>`:''}
        ${order.status==='Received'||order.status==='Partial'?`
          <button onclick="completarOrden(${id})"
            style="flex:1;padding:11px;background:linear-gradient(135deg,#34d399,#059669);color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;font-size:13px">
            ✅ Complete Order
          </button>`:''}
        ${order.status==='Completed'?`
          <button onclick="abrirPago(${id})"
            style="flex:1;padding:11px;background:linear-gradient(135deg,#9069F9,#54F1B8);color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;font-size:13px">
            💳 Register Payment
          </button>`:''}
      </div>`;

    document.getElementById('new-detail-product')?.addEventListener('change',function(){
      const pi=document.getElementById('new-detail-price');
      if(pi)pi.value=this.options[this.selectedIndex].dataset.price||0;
    });
    document.getElementById('modal-order-detail').style.display='flex';
  }catch(e){showToast('❌ Error: '+e.message,'error');}
};
window.cerrarOrderDetail=()=>{document.getElementById('modal-order-detail').style.display='none';};

// ==================== EDIT DETAIL ====================
window.editDetailQty=async function(detailId,newQty,unitPrice,orderId){
  if(newQty<1)return;
  try{await orderDetailsAPI.update(detailId,{purchaseOrderId:orderId,quantity:newQty,unitPrice});await verOrden(orderId);}
  catch(e){showToast('❌ '+e.message,'error');}
};
window.editDetailPrice=async function(detailId,newPrice,qty,orderId){
  try{await orderDetailsAPI.update(detailId,{purchaseOrderId:orderId,quantity:qty,unitPrice:parseFloat(newPrice)});await verOrden(orderId);}
  catch(e){showToast('❌ '+e.message,'error');}
};
window.agregarDetalle=async function(orderId){
  const pid=document.getElementById('new-detail-product')?.value;
  const qty=parseFloat(document.getElementById('new-detail-qty')?.value||0);
  const price=parseFloat(document.getElementById('new-detail-price')?.value||0);
  if(!pid||!qty||!price){showToast('⚠️ Fill all fields','error');return;}
  try{await orderDetailsAPI.create({purchaseOrderId:orderId,productId:pid,quantity:qty,unitPrice:price});showToast('✅ Product added','success');await verOrden(orderId);}
  catch(e){showToast('❌ '+e.message,'error');}
};
window.eliminarDetalle=async function(detailId,orderId){
  if(!confirm('Remove this product?'))return;
  try{await orderDetailsAPI.delete(detailId);showToast('✅ Removed','success');await verOrden(orderId);}
  catch(e){showToast('❌ '+e.message,'error');}
};

// ==================== LOGICAL COSTS ====================
window.guardarLogicalCosts=async function(orderId,exists){
  const fields=['internationalTransport','localTransport','nationalization','cargoInsurance','storage','others'];
  const data={orderNumber:orderId};
  fields.forEach(f=>{data[f]=parseFloat(document.getElementById('lc-'+f)?.value||0);});
  try{
    if(exists)await logicalCostsAPI.update(orderId,data);else await logicalCostsAPI.create(data);
    showToast('✅ Logical costs saved','success');await verOrden(orderId);
  }catch(e){showToast('❌ '+e.message,'error');}
};

// ==================== CAMBIOS DE ESTADO ====================
async function getOrderForUpdate(id){return allOrders.find(o=>o.purchaseOrderId===id)||await ordersAPI.getById(id);}

window.confirmarOrden=async function(id){
  try{const o=await getOrderForUpdate(id);await ordersAPI.update(id,{status:'Confirmed',supplierId:o.supplierId,orderDate:o.orderDate});
    showToast('✅ Order confirmed','success');document.getElementById('modal-order-detail').style.display='none';await loadOrdersList();}
  catch(e){showToast('❌ '+e.message,'error');}
};
window.cancelarOrden=async function(id){
  if(!confirm('Cancel this order?'))return;
  try{const o=await getOrderForUpdate(id);await ordersAPI.update(id,{status:'Cancelled',supplierId:o.supplierId,orderDate:o.orderDate});
    showToast('✅ Cancelled','success');document.getElementById('modal-order-detail').style.display='none';await loadOrdersList();}
  catch(e){showToast('❌ '+e.message,'error');}
};
window.completarOrden=async function(id){
  try{const o=await getOrderForUpdate(id);await ordersAPI.update(id,{status:'Completed',supplierId:o.supplierId,orderDate:o.orderDate});
    showToast('✅ Order completed','success');document.getElementById('modal-order-detail').style.display='none';await loadOrdersList();}
  catch(e){showToast('❌ '+e.message,'error');}
};

// ==================== RECEPCIÓN ====================
window.abrirRecepcion=async function(orderId){
  document.getElementById('modal-order-detail').style.display='none';
  let details=[];try{details=await orderDetailsAPI.getByOrder(orderId);}catch(e){}
  const rows=details.length?details.map(d=>`<tr>
    <td style="padding:9px 8px;font-size:13px">${allProducts.find(p=>(p.productId??p.id)===d.productId)?.name||d.productId}</td>
    <td style="padding:9px 8px;text-align:center;font-size:13px">${d.quantity}</td>
    <td style="padding:9px 8px;text-align:center">
      <input type="number" min="0" max="${d.quantity}" value="${d.quantity}" id="recv-${d.purchaseOrderDetailId}"
        style="width:76px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;padding:6px 10px;border-radius:8px;font-family:'Poppins',sans-serif;font-size:13px;outline:none;text-align:center"/>
    </td>
    <td style="padding:9px 8px;text-align:center">
      <input type="number" min="0" step="0.01" value="${d.unitPrice}" id="cost-${d.purchaseOrderDetailId}"
        style="width:96px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;padding:6px 10px;border-radius:8px;font-family:'Poppins',sans-serif;font-size:13px;outline:none;text-align:center"/>
    </td></tr>`).join('')
    :`<tr><td colspan="4" style="text-align:center;padding:20px;color:rgba(255,255,255,0.3)">This order has no products. Add products first from the order detail view.</td></tr>`;

  document.getElementById('receipt-form-body').innerHTML=`
    <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0 0 14px;text-transform:uppercase;letter-spacing:.05em;font-weight:700">Order #${orderId} — Enter quantities received</p>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:rgba(144,105,249,0.08)">
        ${['Product','Ordered','Received','Unit Cost'].map(h=>`<th style="padding:9px 8px;font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;text-align:center">${h}</th>`).join('')}
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${details.length?`<div style="display:flex;gap:10px;margin-top:16px">
      <button onclick="registrarRecepcion(${orderId},'Received')"
        style="flex:1;padding:11px;background:linear-gradient(135deg,#9069F9,#54F1B8);color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;font-size:13px">
        ✅ Full Receipt
      </button>
      <button onclick="registrarRecepcion(${orderId},'Partial')"
        style="flex:1;padding:11px;background:transparent;color:#a78bfa;border:1.5px solid #a78bfa;border-radius:10px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;font-size:13px">
        ◑ Partial Receipt
      </button>
    </div>`:''}`;

  document.getElementById('modal-receipt')._orderId=orderId;
  document.getElementById('modal-receipt')._details=details;
  document.getElementById('modal-receipt').style.display='flex';
};

window.registrarRecepcion=async function(orderId,tipoStatus){
  const details=document.getElementById('modal-receipt')._details||[];
  const receiptDetails=details.map(d=>({
    productId:d.productId,
    quantityReceived:parseFloat(document.getElementById(`recv-${d.purchaseOrderDetailId}`)?.value||0),
    unitCost:parseFloat(document.getElementById(`cost-${d.purchaseOrderDetailId}`)?.value||0)
  })).filter(d=>d.quantityReceived>0);
  if(!receiptDetails.length){showToast('⚠️ Enter at least one received quantity','error');return;}
  try{
    await receiptsAPI.create({purchaseOrderId:orderId,details:receiptDetails});
    const o=await getOrderForUpdate(orderId);
    await ordersAPI.update(orderId,{status:tipoStatus,supplierId:o.supplierId,orderDate:o.orderDate});
    showToast(`✅ Receipt registered (${tipoStatus})`,'success');
    document.getElementById('modal-receipt').style.display='none';await loadOrdersList();
  }catch(e){showToast('❌ '+e.message,'error');}
};

// ==================== PAYMENT ====================
window.abrirPago=async function(orderId){
  document.getElementById('modal-order-detail').style.display='none';
  let grand=0;
  try{
    const[details,lc]=await Promise.all([orderDetailsAPI.getByOrder(orderId),logicalCostsAPI.getByOrder(orderId).catch(()=>null)]);
    const sub=details.reduce((s,d)=>s+(d.quantity*d.unitPrice),0);
    const lcT=lc?[(lc.internationalTransport||0),(lc.localTransport||0),(lc.nationalization||0),(lc.cargoInsurance||0),(lc.storage||0),(lc.others||0)].reduce((a,b)=>a+b,0):0;
    grand=sub+lcT;
  }catch(e){}
  document.getElementById('payment-order-id').textContent='#'+orderId;
  document.getElementById('payment-amount').textContent='$'+fmt(grand);
  document.getElementById('payment-date-display').textContent=new Date().toLocaleDateString('es-CO');
  document.getElementById('invoice-number-input').value='INV-'+orderId+'-'+Date.now().toString().slice(-6);
  document.getElementById('payment-date-input').value=new Date().toISOString().split('T')[0];
  document.getElementById('modal-payment')._orderId=orderId;
  document.getElementById('modal-payment').style.display='flex';
  initCardPreview();
};

function initCardPreview(){
  const cn=document.getElementById('card-number-input');
  const ch=document.getElementById('card-holder-input');
  const ce=document.getElementById('card-expiry-input');
  const cv=document.getElementById('card-cvv-input');
  if(cn)cn.addEventListener('input',function(){
    this.value=this.value.replace(/\D/g,'').slice(0,16);
    const f=this.value.replace(/(.{4})/g,'$1 ').trim();
    const el=document.getElementById('preview-card-number');if(el)el.textContent=f||'•••• •••• •••• ••••';
    const b=document.getElementById('card-brand-icon');
    if(b){if(/^4/.test(this.value))b.textContent='VISA';else if(/^5[1-5]/.test(this.value))b.textContent='MC';else if(/^3[47]/.test(this.value))b.textContent='AMEX';else b.textContent='💳';}
  });
  if(ch)ch.addEventListener('input',function(){const el=document.getElementById('preview-card-holder');if(el)el.textContent=this.value.toUpperCase()||'CARD HOLDER NAME';});
  if(ce)ce.addEventListener('input',function(){
    this.value=this.value.replace(/\D/g,'').slice(0,4);
    if(this.value.length>=2)this.value=this.value.slice(0,2)+'/'+this.value.slice(2);
    const el=document.getElementById('preview-card-expiry');if(el)el.textContent=this.value||'MM/YY';
  });
  if(cv){
    cv.addEventListener('focus',()=>document.getElementById('card-preview')?.classList.add('flipped'));
    cv.addEventListener('blur',()=>document.getElementById('card-preview')?.classList.remove('flipped'));
    cv.addEventListener('input',function(){this.value=this.value.replace(/\D/g,'').slice(0,4);const el=document.getElementById('preview-cvv');if(el)el.textContent=this.value||'•••';});
  }
}

window.procesarPago=async function(){
  const orderId=document.getElementById('modal-payment')._orderId;
  const invoice=document.getElementById('invoice-number-input').value;
  const method=document.getElementById('payment-method-select').value;
  const reminder=document.getElementById('payment-reminder').value;
  const payDate=document.getElementById('payment-date-input').value;
  if(!invoice||!method){showToast('⚠️ Fill required fields','error');return;}
  if(method==='card'){
    const cn=document.getElementById('card-number-input').value.replace(/\s/g,'');
    const ch=document.getElementById('card-holder-input').value;
    const ce=document.getElementById('card-expiry-input').value;
    const cv=document.getElementById('card-cvv-input').value;
    if(cn.length<16||!ch||!ce||cv.length<3){showToast('⚠️ Complete card details','error');return;}
  }
  try{
    await transactionsAPI.create({purchaseOrderId:orderId,invoiceNumber:invoice,transactionStatus:'Pagado',
      paymentDate:payDate||null,reminder:reminder||null});
    showToast('✅ Payment registered!','success');
    document.getElementById('modal-payment').style.display='none';
    await loadOrdersList();
  }catch(e){showToast('❌ '+e.message,'error');}
};

// ==================== FORM PROVEEDOR ====================
document.addEventListener('DOMContentLoaded',()=>{
  const fp=document.getElementById('form-nuevo-proveedor');
  if(fp)fp.addEventListener('submit',async(e)=>{
    e.preventDefault();
    const data={name:document.getElementById('supplier-name').value,
      contact:document.getElementById('supplier-contact-person')?.value||document.getElementById('supplier-document').value,
      email:document.getElementById('supplier-email').value,
      phone:document.getElementById('supplier-phone').value,
      address:document.getElementById('supplier-address').value};
    try{const ns=await suppliersAPI.create(data);showToast('✅ Supplier created!','success');
      suppliers.push(ns);renderSupplierSelects();
      const sel=document.getElementById('supplier-select');if(sel)sel.value=ns.supplierId??ns.id;
      cerrarModalProveedor();}
    catch(err){showToast('❌ '+err.message,'error');}
  });
});

// ==================== FORM COMPRA ====================
document.addEventListener('DOMContentLoaded',()=>{
  const form=document.getElementById('form-compra');
  if(form)form.addEventListener('submit',async(e)=>{
    e.preventDefault();
    const supplierId=document.getElementById('supplier-select').value;
    const date=document.getElementById('purchase-date').value;
    if(!supplierId||!date){showToast('⚠️ Complete required fields','error');return;}
    if(!cart.length){showToast('⚠️ Cart is empty','error');return;}
    try{
      const order=await ordersAPI.create({
        supplierId:parseInt(supplierId),
        orderDate:new Date(date).toISOString(),
        shippingCountry:document.getElementById('shipping-country')?.value||null,
        shippingRegion:document.getElementById('shipping-region')?.value||null,
        shippingAddress:document.getElementById('shipping-address')?.value||null,
        details:cart.map(i=>({purchaseOrderId:0,productId:i.id,quantity:i.qty,unitPrice:i.price}))
      });
      const sup=suppliers.find(s=>(s.supplierId??s.id)==supplierId);
      const snapshot=[...cart];
      showInvoice(order.purchaseOrderId,sup?.name||supplierId,date,snapshot);
      cart=[];renderCart();updateCartBadge();cerrarModalCompra();
    }catch(err){showToast('❌ '+err.message,'error');}
  });
});

// ==================== FACTURA ====================
function showInvoice(orderId,supplierName,date,snapshot){
  document.getElementById('factura-orden').textContent=orderId;
  document.getElementById('factura-cliente').textContent=supplierName;
  document.getElementById('factura-fecha').textContent=date;
  const tbody=document.getElementById('factura-productos');tbody.innerHTML='';let total=0;
  snapshot.forEach(item=>{const sub=item.price*item.qty,iva=sub*0.19,ttl=sub+iva;total+=ttl;
    tbody.innerHTML+=`<tr><td>${item.name}</td><td>${item.qty}</td><td>$${fmt(item.price)}</td><td>19%</td><td>$${fmt(ttl)}</td></tr>`;});
  document.getElementById('factura-total').textContent=fmt(total);
  document.getElementById('factura-modal').style.display='flex';
}

// ==================== BÚSQUEDA Y FILTROS ====================
window.buscarProducto=function(){
  const q=(document.getElementById('search-input')?.value||'').toLowerCase().trim();
  filteredProducts=q===''?[...allProducts]:allProducts.filter(p=>
    p.name.toLowerCase().includes(q)||(p.description&&p.description.toLowerCase().includes(q))||(p.category&&p.category.toLowerCase().includes(q)));
  renderCarousel(filteredProducts);
};
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('search-input')?.addEventListener('keypress',e=>{if(e.key==='Enter')buscarProducto();});
  const btn=document.getElementById('filter-toggle-btn'),panel=document.getElementById('filtro-panel');
  if(btn&&panel)btn.addEventListener('click',()=>{panel.style.display=panel.style.display==='none'?'flex':'none';});
});
window.aplicarFiltros=function(){
  const cat=document.getElementById('filtro-categoria')?.value||'';
  const max=parseFloat(document.getElementById('filtro-precio')?.value)||Infinity;
  filteredProducts=allProducts.filter(p=>{const price=p.value??p.price??0;
    if(cat&&p.category!==cat)return false;if(price>max)return false;return true;});
  renderCarousel(filteredProducts);showToast(`✅ ${filteredProducts.length} products found`,'success');
};


// ==================== NUEVO PRODUCTO ====================
const productsCatalogAPI = {
  create: async (d) => {
    const r = await fetch(`${API_CONFIG.catalogService}/api/Products`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(d)
    });
    if (!r.ok) { const e = await r.text(); throw new Error(e || `Error: ${r.status}`); }
    return r.status === 204 ? null : r.json();
  }
};

window.abrirModalProducto = function() {
  // Poblar el select de suppliers en el modal de producto
  const sel = document.getElementById('prod-supplier');
  if (sel) {
    sel.innerHTML = '<option value="">Select supplier (optional)</option>';
    suppliers.forEach(s => {
      const o = document.createElement('option');
      o.value = s.supplierId ?? s.id;
      o.textContent = s.name;
      sel.appendChild(o);
    });
  }
  const m = document.getElementById('modal-nuevo-producto');
  if (m) m.style.display = 'flex';
};

window.cerrarModalProducto = function() {
  const m = document.getElementById('modal-nuevo-producto');
  if (m) { m.style.display = 'none'; document.getElementById('form-nuevo-producto').reset(); }
};

document.addEventListener('DOMContentLoaded', () => {
  const fp = document.getElementById('form-nuevo-producto');
  if (fp) fp.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      productId:   document.getElementById('prod-id').value,
      name:        document.getElementById('prod-name').value,
      category:    document.getElementById('prod-category').value,
      description: document.getElementById('prod-description').value,
      value:       parseFloat(document.getElementById('prod-value').value || 0),
      stock:       parseFloat(document.getElementById('prod-stock').value || 0),
      supplierId:  parseInt(document.getElementById('prod-supplier').value) || null
    };
    if (!data.productId || !data.name || !data.value) {
      showToast('⚠️ Fill required fields (ID, Name, Value)', 'error'); return;
    }
    try {
      await productsCatalogAPI.create(data);
      showToast('✅ Product created! Refreshing carousel...', 'success');
      cerrarModalProducto();
      await loadProducts(); // recargar carrusel
    } catch(err) { showToast('❌ ' + err.message, 'error'); }
  });
});

// ==================== INIT ====================
window.addEventListener('load',()=>{loadProducts();loadSuppliers();});