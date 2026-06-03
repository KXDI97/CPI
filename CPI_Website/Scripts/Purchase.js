// ==================== CONFIG ====================
const API_CONFIG = {
  purchaseOrderService: 'http://localhost:5300',
  catalogService:       'http://localhost:5131'
};
const hr = async (r) => {
  if (!r.ok) { const e=await r.text(); throw new Error(e||`Error: ${r.status}`); }
  if (r.status===204) return null;
  return r.json();
};

// ==================== APIs ====================
const suppliersAPI  = { getAll: async()=>hr(await fetch(`${API_CONFIG.catalogService}/api/Suppliers`)) };
const productsAPI   = { getAll: async()=>hr(await fetch(`${API_CONFIG.catalogService}/api/Products`)) };
const ordersAPI = {
  getAll:  async()=>hr(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrders`)),
  getById: async(id)=>hr(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrders/${id}`)),
  create:  async(d)=>hr(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrders`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})),
  update:  async(id,d)=>hr(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrders/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})),
  delete:  async(id)=>hr(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrders/${id}`,{method:'DELETE'}))
};
const orderDetailsAPI = {
  getByOrder: async(oid)=>hr(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrderDetails/order/${oid}`)),
  create:     async(d)=>hr(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrderDetails`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})),
  update:     async(id,d)=>hr(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrderDetails/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})),
  delete:     async(id)=>hr(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseOrderDetails/${id}`,{method:'DELETE'}))
};
const receiptsAPI = {
  create: async(d)=>hr(await fetch(`${API_CONFIG.purchaseOrderService}/api/PurchaseReceipts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}))
};
const transactionsAPI = {
  create: async(d)=>hr(await fetch(`${API_CONFIG.purchaseOrderService}/api/Transaction`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}))
};
const logicalCostsAPI = {
  getByOrder: async(n)=>hr(await fetch(`${API_CONFIG.purchaseOrderService}/api/LogicalCosts/${n}`)),
  create:     async(d)=>hr(await fetch(`${API_CONFIG.purchaseOrderService}/api/LogicalCosts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})),
  update:     async(n,d)=>hr(await fetch(`${API_CONFIG.purchaseOrderService}/api/LogicalCosts/${n}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}))
};

// ==================== ESTADO ====================
let allProducts=[], suppliers=[], allOrders=[], cart=[], filteredProducts=[];
let checkoutOrderId=null, checkoutLC=null, checkoutPayMethod='card';

// ==================== PANEL HELPERS (definidas primero) ====================
window.cerrarOrdersList = function() {
  document.getElementById('orders-panel')?.classList.remove('open');
  document.getElementById('orders-panel-overlay')?.classList.remove('show');
};
window.cerrarOrderDetail = function() {
  document.getElementById('order-detail-panel')?.classList.remove('open');
};
window.cerrarOrdersPanel = function() {
  window.cerrarOrdersList();
  window.cerrarOrderDetail();
};

// ==================== HELPERS ====================
function getCategoryIcon(c){const m={Cartuchos:'🖨️',Tintas:'🎨',Papelería:'📄',Computers:'💻',Accessories:'🖱️',default:'📦'};return m[c]||m.default;}
function fmt(n){return Number(n||0).toLocaleString('es-CO',{minimumFractionDigits:2});}

function showToast(msg,type='info'){
  let t=document.getElementById('cpi-toast');
  if(!t){t=document.createElement('div');t.id='cpi-toast';document.body.appendChild(t);}
  const c={info:'background:#1a2035;border:1px solid rgba(144,105,249,0.3);color:#fff',
    success:'background:#0f2a1e;border:1px solid rgba(84,241,184,0.4);color:#54F1B8',
    error:'background:#2a0f0f;border:1px solid rgba(248,113,113,0.4);color:#f87171'};
  t.style.cssText=`position:fixed;bottom:110px;left:50%;transform:translateX(-50%);
    padding:10px 22px;border-radius:100px;font-size:13px;font-family:'Poppins',sans-serif;
    z-index:99999;opacity:1;transition:opacity 0.3s;white-space:nowrap;pointer-events:none;
    box-shadow:0 4px 20px rgba(0,0,0,0.4);${c[type]||c.info}`;
  t.textContent=msg;
  clearTimeout(t._t);t._t=setTimeout(()=>{t.style.opacity='0';},2600);
}

function updateCartBadge(){
  const b=document.getElementById('cart-badge');if(!b)return;
  const n=cart.reduce((s,i)=>s+i.qty,0);b.textContent=n;b.style.display=n>0?'flex':'none';
}

function getLCTotal(){
  return ['internationalTransport','localTransport','nationalization','cargoInsurance','storage','others']
    .reduce((s,f)=>s+parseFloat(document.getElementById('lc-'+f)?.value||0),0);
}

function updateLCTotals(){
  const sub=checkoutOrderId?0:cart.reduce((s,i)=>s+(i.price*i.qty),0);
  const lct=getLCTotal();
  ['co-sub-2','co-sub-3'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='$'+fmt(sub);});
  const el3=document.getElementById('co-lc-total');if(el3)el3.textContent='$'+fmt(lct);
  ['co-grand-2','co-grand-3'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='$'+fmt(sub+lct);});
  const el4=document.getElementById('co-lc-3');if(el4)el4.textContent='$'+fmt(lct);
  const bd=document.getElementById('lc-breakdown');
  if(bd){
    const labels=['🚢 Intl Transport','🚛 Local Transport','🏛️ Nationalization','🛡️ Cargo Insurance','🏭 Storage','📦 Others'];
    const fields=['internationalTransport','localTransport','nationalization','cargoInsurance','storage','others'];
    bd.innerHTML=fields.map((f,i)=>{const v=parseFloat(document.getElementById('lc-'+f)?.value||0);
      return v>0?`<div style="display:flex;justify-content:space-between;width:100%;font-size:11px;color:rgba(255,255,255,0.3)">${labels[i]}<span>$${fmt(v)}</span></div>`:'';}).join('');
  }
}

// ==================== SUPPLIERS ====================
async function loadSuppliers(){
  try{
    suppliers=await suppliersAPI.getAll();
    const fs=document.getElementById('f-supplier');
    if(fs){fs.innerHTML='<option value="">All suppliers</option>';
      suppliers.forEach(s=>{const o=document.createElement('option');o.value=s.supplierId??s.id;o.textContent=s.name;fs.appendChild(o);});}
    const ss=document.getElementById('supplier-select');
    if(ss){ss.innerHTML='<option value="">Select a supplier</option>';
      suppliers.forEach(s=>{const o=document.createElement('option');o.value=s.supplierId??s.id;o.textContent=s.name;ss.appendChild(o);});}
  }catch(e){console.error(e);}
}

// ==================== PRODUCTS ====================
async function loadProducts(){
  try{
    allProducts=await productsAPI.getAll();
    filteredProducts=[...allProducts];
    renderCarousel(filteredProducts);renderCartSelect();
    updateProductsCount(filteredProducts.length);
  }catch(e){
    const c=document.getElementById('product-carousel');
    if(c)c.innerHTML=`<div class="swiper-slide"><div class="card" style="align-items:center;justify-content:center;min-height:200px;padding:30px"><p style="color:#f87171;font-size:13px;text-align:center">⚠️ Could not load products.</p></div></div>`;
  }
}

function updateProductsCount(n){
  const el=document.getElementById('products-count');
  if(el)el.textContent=`${n} product${n!==1?'s':''} found`;
}

function renderCartSelect(){
  const sel=document.getElementById('cart-product-select');if(!sel)return;
  sel.innerHTML='<option value="">Select product</option>';
  allProducts.forEach(p=>{
    const o=document.createElement('option');
    o.value=p.productId??p.id;o.dataset.price=p.value??p.price??0;
    o.textContent=p.name;sel.appendChild(o);
  });
  sel.addEventListener('change',function(){
    const pi=document.getElementById('cart-price');
    if(pi)pi.value=this.options[this.selectedIndex]?.dataset?.price||0;
  });
}

function renderCarousel(products){
  const container=document.getElementById('product-carousel');if(!container)return;
  container.innerHTML='';
  if(!products.length){
    container.innerHTML='<div class="swiper-slide"><div class="card" style="align-items:center;justify-content:center;min-height:260px;padding:40px"><p style="color:rgba(255,255,255,0.4)">No products match your filters</p></div></div>';
    window.swiperInstance?.update();return;
  }
  products.forEach(p=>{
    const price=p.value??p.price??0,stock=p.stock??0,cat=p.category??'';
    const sup=suppliers.find(s=>(s.supplierId??s.id)==p.supplierId);
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
        ${sup?`<div class="card-supplier">🏢 ${sup.name}</div>`:''}
        <div class="card-price">$${fmt(price)}</div>
        <div class="card-stock ${stockClass}">${stockLabel}</div>
      </div>
      <button onclick="addToCart('${pid}','${pname}',${price})" ${stock===0?'disabled style="opacity:0.35;cursor:not-allowed"':''}>
        <ion-icon name="cart-outline"></ion-icon> Add to cart
      </button></div>`;
    container.appendChild(slide);
  });
  if(window.swiperInstance){window.swiperInstance.destroy(true,true);window.swiperInstance=null;}
  window.swiperInstance=new Swiper('.mySwiper',{
    spaceBetween:24,navigation:{nextEl:'.swiper-button-next',prevEl:'.swiper-button-prev'},
    breakpoints:{320:{slidesPerView:1,spaceBetween:14},600:{slidesPerView:2,spaceBetween:18},
      900:{slidesPerView:2.5,spaceBetween:22},1200:{slidesPerView:3.2,spaceBetween:24},1600:{slidesPerView:4,spaceBetween:24}}
  });
}

// ==================== FILTROS ====================
window.aplicarFiltros=function(){
  const cat=document.getElementById('f-category')?.value||'';
  const sup=document.getElementById('f-supplier')?.value||'';
  const min=parseFloat(document.getElementById('f-min')?.value)||0;
  const max=parseFloat(document.getElementById('f-max')?.value)||Infinity;
  const stk=document.getElementById('f-stock')?.value||'';
  const q=(document.getElementById('search-input')?.value||'').toLowerCase().trim();
  filteredProducts=allProducts.filter(p=>{
    const price=p.value??p.price??0,stock=p.stock??0;
    if(cat&&p.category!==cat)return false;
    if(sup&&(p.supplierId??'')!=sup)return false;
    if(price<min||price>max)return false;
    if(stk==='in'&&stock<=0)return false;
    if(stk==='low'&&(stock<=0||stock>=10))return false;
    if(stk==='out'&&stock>0)return false;
    if(q&&!p.name.toLowerCase().includes(q)&&!(p.description||'').toLowerCase().includes(q))return false;
    return true;
  });
  renderCarousel(filteredProducts);updateProductsCount(filteredProducts.length);
  sortProducts(document.getElementById('sort-select')?.value||'name');
};
window.limpiarFiltros=function(){
  ['f-category','f-supplier','f-stock','f-min','f-max'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const si=document.getElementById('search-input');if(si)si.value='';
  filteredProducts=[...allProducts];renderCarousel(filteredProducts);updateProductsCount(filteredProducts.length);
};
window.sortProducts=function(by){
  const sorted=[...filteredProducts];
  if(by==='name')sorted.sort((a,b)=>a.name.localeCompare(b.name));
  else if(by==='price-asc')sorted.sort((a,b)=>(a.value??a.price??0)-(b.value??b.price??0));
  else if(by==='price-desc')sorted.sort((a,b)=>(b.value??b.price??0)-(a.value??a.price??0));
  else if(by==='stock')sorted.sort((a,b)=>(b.stock??0)-(a.stock??0));
  filteredProducts=sorted;renderCarousel(filteredProducts);
};
window.buscarProducto=function(){aplicarFiltros();};

// ==================== CARRITO ====================
window.addToCart=function(id,name,price){
  const ex=cart.find(i=>i.id===id);
  if(ex)ex.qty+=1;else cart.push({id,name,price:Number(price),qty:1});
  renderCartPanel();updateCartBadge();showToast(`✅ ${name} added`,'success');
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
  renderCartPanel();updateCartBadge();showToast(`✅ ${name} added`,'success');
  sel.value='';const cq=document.getElementById('cart-qty');if(cq)cq.value=1;
  const cp=document.getElementById('cart-price');if(cp)cp.value='';
};
window.changeQty=function(id,delta){const item=cart.find(i=>i.id===id);if(!item)return;item.qty=Math.max(1,item.qty+delta);renderCartPanel();updateCartBadge();};
window.removeFromCart=function(id){cart=cart.filter(i=>i.id!==id);renderCartPanel();updateCartBadge();};

function renderCartPanel(){
  const list=document.getElementById('cart-items-list');if(!list)return;
  if(!cart.length){list.innerHTML='<div class="cart-empty">Your cart is empty</div>';updateCartTotals();return;}
  list.innerHTML=cart.map(item=>{
    const ttl=item.price*item.qty;
    return`<div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">$${fmt(item.price)} each</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="changeQty('${item.id}',-1)">−</button>
        <span class="cart-item-qty">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty('${item.id}',1)">+</button>
      </div>
      <div class="cart-item-total">$${fmt(ttl)}</div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">✕</button>
    </div>`;
  }).join('');
  updateCartTotals();
}

function updateCartTotals(){
  const sub=cart.reduce((s,i)=>s+(i.price*i.qty),0);
  const iva=sub*0.19,total=sub+iva;
  const el1=document.getElementById('cart-subtotal');if(el1)el1.textContent=fmt(sub);
  const el2=document.getElementById('cart-iva');if(el2)el2.textContent=fmt(iva);
  const el3=document.getElementById('cart-total');if(el3)el3.textContent=fmt(total);
  const tf=document.getElementById('total-final-modal');if(tf)tf.textContent=fmt(total);
}

// ==================== MODALES ====================
window.abrirCarrito=function(){
  document.getElementById('cart-panel')?.classList.add('open');
  document.getElementById('cart-overlay')?.classList.add('show');
};
window.cerrarCarrito=function(){
  document.getElementById('cart-panel')?.classList.remove('open');
  document.getElementById('cart-overlay')?.classList.remove('show');
};
window.abrirModalCompra=function(opts={}){
  const{requiereCarrito=true}=opts;
  if(requiereCarrito&&cart.length===0){showToast('⚠️ The cart is empty');return;}
  const m=document.getElementById('modal-registro');if(!m)return;m.style.display='flex';

  // Fechas
  const now=new Date();
  const dateStr=now.toISOString().split('T')[0];
  const orderNum='ORD-'+Date.now();
  const pd=document.getElementById('purchase-date');if(pd)pd.value=dateStr;
  const on=document.getElementById('order-number');if(on)on.value=orderNum;
  document.getElementById('order-number-display').textContent=orderNum;
  document.getElementById('order-date-display').textContent=now.toLocaleDateString('es-CO');

  // Supplier automático del primer producto del carrito
  const firstProduct=allProducts.find(p=>(p.productId??p.id)===cart[0]?.id);
  const ss=document.getElementById('supplier-select');
  if(ss&&firstProduct?.supplierId)ss.value=firstProduct.supplierId;

  // Resumen del carrito
  const summaryList=document.getElementById('cart-summary-list');
  if(summaryList){
    summaryList.innerHTML=cart.map(item=>`
      <div style="display:flex;justify-content:space-between;align-items:center;
        background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);
        border-radius:8px;padding:8px 12px">
        <div>
          <span style="font-size:13px;font-weight:600;color:#e2e8f0">${item.name}</span>
          <span style="font-size:12px;color:rgba(255,255,255,0.35);margin-left:8px">× ${item.qty}</span>
        </div>
        <span style="font-size:13px;font-weight:700;color:#54F1B8">$${fmt(item.price*item.qty)}</span>
      </div>`).join('');
  }

  // Totales
  const sub=cart.reduce((s,i)=>s+(i.price*i.qty),0);
  const iva=sub*0.19;
  const el1=document.getElementById('modal-subtotal');if(el1)el1.textContent=fmt(sub);
  const el2=document.getElementById('modal-iva');if(el2)el2.textContent=fmt(iva);
  const tf=document.getElementById('total-final-modal');if(tf)tf.textContent=fmt(sub+iva);
};
window.cerrarModalCompra=()=>{const m=document.getElementById('modal-registro');if(m)m.style.display='none';};
window.cerrarFactura=()=>{const m=document.getElementById('factura-modal');if(m)m.style.display='none';};
window.cerrarReceipt=()=>{const m=document.getElementById('modal-receipt');if(m)m.style.display='none';};

// ==================== ORDERS PANEL ====================
window.abrirOrdersList=async function(){
  document.getElementById('orders-panel')?.classList.add('open');
  document.getElementById('orders-panel-overlay')?.classList.add('show');
  await loadOrdersList();
};

async function loadOrdersList(){
  const tbody=document.getElementById('orders-list-tbody');if(!tbody)return;
  tbody.innerHTML=`<tr><td colspan="4" style="text-align:center;padding:20px;color:rgba(255,255,255,0.4)">Loading...</td></tr>`;
  try{allOrders=await ordersAPI.getAll();renderOrdersTable(allOrders);}
  catch(e){tbody.innerHTML=`<tr><td colspan="4" style="text-align:center;color:#f87171">Error loading orders</td></tr>`;}
}

function renderOrdersTable(orders){
  const tbody=document.getElementById('orders-list-tbody');if(!tbody)return;
  const count=document.getElementById('orders-count');
  if(!orders.length){
    tbody.innerHTML=`<tr><td colspan="4" style="text-align:center;padding:24px;color:rgba(255,255,255,0.3)">No orders found</td></tr>`;
    if(count)count.textContent='';return;
  }
  const statusColors={'Pendiente':'#f59e0b','Pending':'#f59e0b','Confirmed':'#60a5fa',
    'Received':'#34d399','Partial':'#a78bfa','Completed':'#54F1B8','Cancelled':'#f87171'};
  tbody.innerHTML=orders.map(o=>{
    const sup=suppliers.find(s=>(s.supplierId??s.id)==o.supplierId);
    const sc=statusColors[o.status]||'#9ca3af';
    return`<tr class="order-row" onclick="verOrden(${o.purchaseOrderId})" style="cursor:pointer">
      <td><strong>#${o.purchaseOrderId}</strong></td>
      <td>${sup?.name||'Supplier #'+o.supplierId}</td>
      <td>${new Date(o.orderDate).toLocaleDateString('es-CO')}</td>
      <td><span style="color:${sc};background:${sc}22;padding:4px 12px;border-radius:100px;font-size:11px;font-weight:700">${o.status}</span></td>
    </tr>`;
  }).join('');
  if(count)count.textContent=`${orders.length} order${orders.length!==1?'s':''} found`;
}

window.filtrarOrdenes=function(query){
  const status=document.getElementById('order-status-filter')?.value||'';
  const q=(query||'').toLowerCase().trim();
  const filtered=allOrders.filter(o=>{
    const sup=suppliers.find(s=>(s.supplierId??s.id)==o.supplierId);
    return(!q||String(o.purchaseOrderId).includes(q)||(sup?.name||'').toLowerCase().includes(q))&&
      (!status||o.status===status);
  });
  renderOrdersTable(filtered);
};

// ==================== VER ORDEN (panel detalle) ====================
window.verOrden=async function(id){
  const panel=document.getElementById('order-detail-panel');
  const body=document.getElementById('order-detail-panel-body');
  if(!panel||!body)return;
  body.innerHTML=`<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.3)">Loading...</div>`;
  panel.classList.add('open');
  try{
    const[order,details]=await Promise.all([ordersAPI.getById(id),orderDetailsAPI.getByOrder(id)]);
    let lc=null;try{lc=await logicalCostsAPI.getByOrder(id);}catch(e){}
    const sup=suppliers.find(s=>(s.supplierId??s.id)==order.supplierId);
    const subtotal=details.reduce((s,d)=>s+(d.quantity*d.unitPrice),0);
    const lcTotal=lc?['internationalTransport','localTransport','nationalization','cargoInsurance','storage','others'].reduce((s,f)=>s+(lc[f]||0),0):0;
    const grand=subtotal+lcTotal;
    const canEdit=order.status==='Pendiente'||order.status==='Pending';
    const statusColors={'Pendiente':'#f59e0b','Pending':'#f59e0b','Confirmed':'#60a5fa',
      'Received':'#34d399','Partial':'#a78bfa','Completed':'#54F1B8','Cancelled':'#f87171'};
    const sc=statusColors[order.status]||'#9ca3af';

    body.innerHTML=`
      <div class="odp-header">
        <div class="odp-order-num">Order #${order.purchaseOrderId}</div>
        <div class="odp-status-badge" style="color:${sc};background:${sc}22">${order.status}</div>
      </div>
      <div class="odp-info-grid">
        <div class="odp-info-item"><span>Supplier</span><strong>${sup?.name||'#'+order.supplierId}</strong></div>
        <div class="odp-info-item"><span>Date</span><strong>${new Date(order.orderDate).toLocaleDateString('es-CO')}</strong></div>
      </div>
      <div class="odp-section-title">🛍️ Products</div>
      <div class="odp-products">
        ${details.length?details.map(d=>{
          const prod=allProducts.find(p=>(p.productId??p.id)===d.productId);
          return`<div class="odp-product-row">
            <div class="odp-product-info">
              <span class="odp-product-name">${prod?.name||d.productId}</span>
              <span class="odp-product-meta">× ${d.quantity} · $${fmt(d.unitPrice)} c/u</span>
            </div>
            <div class="odp-product-total">$${fmt(d.quantity*d.unitPrice)}</div>
            ${canEdit?`<div class="odp-product-actions">
              <button onclick="editDetailQty(${d.purchaseOrderDetailId},${d.quantity-1},${d.unitPrice},${id})" class="qty-btn">−</button>
              <button onclick="editDetailQty(${d.purchaseOrderDetailId},${d.quantity+1},${d.unitPrice},${id})" class="qty-btn">+</button>
              <button onclick="eliminarDetalle(${d.purchaseOrderDetailId},${id})" class="odp-remove-btn">✕</button>
            </div>`:''}
          </div>`;
        }).join(''):`<p class="odp-empty">No products in this order yet.</p>`}
        ${canEdit?`<div class="odp-add-product">
          <select id="odp-product-sel" class="odp-select">
            <option value="">+ Add product...</option>
            ${allProducts.map(p=>`<option value="${p.productId??p.id}" data-price="${p.value??p.price??0}">${p.name}</option>`).join('')}
          </select>
          <div class="odp-add-row">
            <input id="odp-qty" type="number" min="1" value="1" class="odp-input-sm"/>
            <input id="odp-price" type="number" step="0.01" placeholder="Price" class="odp-input-sm"/>
            <button onclick="odp_agregarDetalle(${id})" class="odp-add-btn">Add</button>
          </div>
        </div>`:''}
      </div>
      <div class="odp-totals">
        <div class="odp-total-row"><span>Products</span><span>$${fmt(subtotal)}</span></div>
        <div class="odp-total-row"><span>Logical Costs</span><span>$${fmt(lcTotal)}</span></div>
        <div class="odp-total-row odp-grand"><span>Grand Total</span><span>$${fmt(grand)}</span></div>
      </div>
      <div class="odp-actions">
        ${canEdit?`
          <button onclick="odp_confirmar(${id})" class="odp-action-btn odp-action-confirm">
            <span class="odp-action-icon">✔</span>
            <div><div class="odp-action-label">Confirm Order</div><div class="odp-action-sub">Mark as confirmed and lock products</div></div>
          </button>
          <button onclick="odp_cancelar(${id})" class="odp-action-btn odp-action-cancel">
            <span class="odp-action-icon">✖</span>
            <div><div class="odp-action-label">Cancel Order</div><div class="odp-action-sub">This action cannot be undone</div></div>
          </button>`:''}
        ${order.status==='Confirmed'?`
          <button onclick="odp_receipt(${id})" class="odp-action-btn odp-action-receive">
            <span class="odp-action-icon">📦</span>
            <div><div class="odp-action-label">Register Receipt</div><div class="odp-action-sub">Enter quantities received</div></div>
          </button>`:''}
        ${order.status==='Received'||order.status==='Partial'?`
          <button onclick="odp_completar(${id})" class="odp-action-btn odp-action-complete">
            <span class="odp-action-icon">✅</span>
            <div><div class="odp-action-label">Complete Order</div><div class="odp-action-sub">Move to Completed status</div></div>
          </button>`:''}
        ${order.status==='Completed'?`
          <button onclick="cerrarOrdersPanel();abrirCheckout(${id})" class="odp-action-btn odp-action-pay">
            <span class="odp-action-icon">💳</span>
            <div><div class="odp-action-label">Register Payment</div><div class="odp-action-sub">Open checkout — add costs & pay</div></div>
          </button>`:''}
        ${order.status==='Pendiente'||order.status==='Pending'||order.status==='Cancelled'?`
          <button onclick="odp_eliminar(${id})" class="odp-action-btn odp-action-delete">
            <span class="odp-action-icon">🗑️</span>
            <div><div class="odp-action-label">Delete Order</div><div class="odp-action-sub">Permanently remove this order</div></div>
          </button>`:''}
      </div>`;

    document.getElementById('odp-product-sel')?.addEventListener('change',function(){
      const pi=document.getElementById('odp-price');
      if(pi)pi.value=this.options[this.selectedIndex]?.dataset?.price||0;
    });
  }catch(e){body.innerHTML=`<p style="color:#f87171;padding:20px">Error: ${e.message}</p>`;}
};

// ==================== ACCIONES PANEL ====================
window.odp_agregarDetalle=async function(orderId){
  const pid=document.getElementById('odp-product-sel')?.value;
  const qty=parseFloat(document.getElementById('odp-qty')?.value||0);
  const price=parseFloat(document.getElementById('odp-price')?.value||0);
  if(!pid||!qty||!price){showToast('⚠️ Fill all fields','error');return;}
  try{await orderDetailsAPI.create({purchaseOrderId:orderId,productId:pid,quantity:qty,unitPrice:price});
    showToast('✅ Product added','success');await verOrden(orderId);}
  catch(e){showToast('❌ '+e.message,'error');}
};
window.odp_confirmar=async function(id){
  try{const o=await getO(id);await ordersAPI.update(id,{status:'Confirmed',supplierId:o.supplierId,orderDate:o.orderDate});
    showToast('✅ Order confirmed','success');await verOrden(id);await loadOrdersList();}
  catch(e){showToast('❌ '+e.message,'error');}
};
window.odp_cancelar=async function(id){
  if(!confirm('Cancel this order?'))return;
  try{const o=await getO(id);await ordersAPI.update(id,{status:'Cancelled',supplierId:o.supplierId,orderDate:o.orderDate});
    showToast('✅ Cancelled','success');cerrarOrderDetail();await loadOrdersList();}
  catch(e){showToast('❌ '+e.message,'error');}
};
window.odp_completar=async function(id){
  try{const o=await getO(id);await ordersAPI.update(id,{status:'Completed',supplierId:o.supplierId,orderDate:o.orderDate});
    showToast('✅ Completed','success');await verOrden(id);await loadOrdersList();}
  catch(e){showToast('❌ '+e.message,'error');}
};
window.odp_eliminar=async function(id){
  if(!confirm(`Delete order #${id}?`))return;
  try{await ordersAPI.delete(id);showToast('✅ Deleted','success');cerrarOrderDetail();await loadOrdersList();}
  catch(e){showToast('❌ '+e.message,'error');}
};
window.odp_receipt=function(id){
  cerrarOrdersList();
  abrirRecepcion(id);
};

// ==================== EDIT DETAILS ====================
window.editDetailQty=async function(detailId,newQty,unitPrice,orderId){
  if(newQty<1)return;
  try{await orderDetailsAPI.update(detailId,{purchaseOrderId:orderId,quantity:newQty,unitPrice});await verOrden(orderId);}
  catch(e){showToast('❌ '+e.message,'error');}
};
window.eliminarDetalle=async function(detailId,orderId){
  if(!confirm('Remove this product?'))return;
  try{await orderDetailsAPI.delete(detailId);showToast('✅ Removed','success');await verOrden(orderId);}
  catch(e){showToast('❌ '+e.message,'error');}
};

// ==================== CAMBIOS DE ESTADO ====================
async function getO(id){return allOrders.find(o=>o.purchaseOrderId===id)||await ordersAPI.getById(id);}

// ==================== RECEPCIÓN ====================
window.abrirRecepcion=async function(orderId){
  let details=[];try{details=await orderDetailsAPI.getByOrder(orderId);}catch(e){}
  const rows=details.length?details.map(d=>`<tr>
    <td style="padding:9px 8px;font-size:13px">${allProducts.find(p=>(p.productId??p.id)===d.productId)?.name||d.productId}</td>
    <td style="padding:9px 8px;text-align:center">${d.quantity}</td>
    <td style="padding:9px 8px;text-align:center">
      <input type="number" min="0" max="${d.quantity}" value="${d.quantity}" id="recv-${d.purchaseOrderDetailId}"
        style="width:76px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;padding:6px 10px;border-radius:8px;font-family:'Poppins',sans-serif;font-size:13px;outline:none;text-align:center"/>
    </td>
    <td style="padding:9px 8px;text-align:center">
      <input type="number" min="0" step="0.01" value="${d.unitPrice}" id="cost-${d.purchaseOrderDetailId}"
        style="width:96px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;padding:6px 10px;border-radius:8px;font-family:'Poppins',sans-serif;font-size:13px;outline:none;text-align:center"/>
    </td></tr>`).join('')
    :`<tr><td colspan="4" style="text-align:center;padding:20px;color:rgba(255,255,255,0.3)">No products found.</td></tr>`;

  document.getElementById('receipt-form-body').innerHTML=`
    <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0 0 14px;text-transform:uppercase;letter-spacing:.05em;font-weight:700">Order #${orderId} — Enter quantities received</p>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:rgba(144,105,249,0.08)">
        ${['Product','Ordered','Received Qty','Unit Cost'].map(h=>`<th style="padding:9px 8px;font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;text-align:center">${h}</th>`).join('')}
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${details.length?`<div style="display:flex;gap:10px;margin-top:16px">
      <button onclick="registrarRecepcion(${orderId},'Received')" style="flex:1;padding:11px;background:linear-gradient(135deg,#9069F9,#54F1B8);color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;font-size:13px">✅ Full Receipt</button>
      <button onclick="registrarRecepcion(${orderId},'Partial')" style="flex:1;padding:11px;background:transparent;color:#a78bfa;border:1.5px solid #a78bfa;border-radius:10px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;font-size:13px">◑ Partial Receipt</button>
    </div>`:''}`;
  document.getElementById('modal-receipt')._orderId=orderId;
  document.getElementById('modal-receipt')._details=details;
  document.getElementById('modal-receipt').style.display='flex';
};

window.registrarRecepcion=async function(orderId,tipo){
  const details=document.getElementById('modal-receipt')._details||[];
  const rd=details.map(d=>({productId:d.productId,
    quantityReceived:parseFloat(document.getElementById(`recv-${d.purchaseOrderDetailId}`)?.value||0),
    unitCost:parseFloat(document.getElementById(`cost-${d.purchaseOrderDetailId}`)?.value||0)
  })).filter(d=>d.quantityReceived>0);
  if(!rd.length){showToast('⚠️ Enter at least one quantity','error');return;}
  try{
    await receiptsAPI.create({purchaseOrderId:orderId,details:rd});
    const o=await getO(orderId);
    await ordersAPI.update(orderId,{status:tipo,supplierId:o.supplierId,orderDate:o.orderDate});
    showToast(`✅ Receipt registered (${tipo})`,'success');
    document.getElementById('modal-receipt').style.display='none';
    await loadOrdersList();
  }catch(e){showToast('❌ '+e.message,'error');}
};

// ==================== CHECKOUT ====================
window.abrirCheckout=async function(orderId){
  checkoutOrderId=orderId;
  try{
    const[order,details]=await Promise.all([ordersAPI.getById(orderId),orderDetailsAPI.getByOrder(orderId)]);
    checkoutLC=null;try{checkoutLC=await logicalCostsAPI.getByOrder(orderId);}catch(e){}
    const sup=suppliers.find(s=>(s.supplierId??s.id)==order.supplierId);
    const sub=details.reduce((s,d)=>s+(d.quantity*d.unitPrice),0);
    const lcT=checkoutLC?['internationalTransport','localTransport','nationalization','cargoInsurance','storage','others'].reduce((s,f)=>s+(checkoutLC[f]||0),0):0;

    document.getElementById('co-order-info').innerHTML=`
      <div class="co-info-item"><span>Order #</span><strong>${order.purchaseOrderId}</strong></div>
      <div class="co-info-item"><span>Status</span><strong>${order.status}</strong></div>
      <div class="co-info-item"><span>Supplier</span><strong>${sup?.name||'#'+order.supplierId}</strong></div>
      <div class="co-info-item"><span>Date</span><strong>${new Date(order.orderDate).toLocaleDateString('es-CO')}</strong></div>`;
    document.getElementById('co-products-body').innerHTML=details.map(d=>{
      const prod=allProducts.find(p=>(p.productId??p.id)===d.productId);
      return`<tr><td>${prod?.name||d.productId}</td><td>${d.quantity}</td><td>$${fmt(d.unitPrice)}</td><td style="color:#54F1B8;font-weight:700">$${fmt(d.quantity*d.unitPrice)}</td></tr>`;
    }).join('');
    const el1=document.getElementById('co-sub');if(el1)el1.textContent='$'+fmt(sub);
    const el2=document.getElementById('co-lc-preview');if(el2)el2.textContent='$'+fmt(lcT);
    const el3=document.getElementById('co-grand');if(el3)el3.textContent='$'+fmt(sub+lcT);
    ['internationalTransport','localTransport','nationalization','cargoInsurance','storage','others'].forEach(f=>{
      const el=document.getElementById('lc-'+f);if(el)el.value=checkoutLC?checkoutLC[f]||0:0;
    });
    document.getElementById('co-final-products').innerHTML=details.map(d=>{
      const prod=allProducts.find(p=>(p.productId??p.id)===d.productId);
      return`<div style="display:flex;justify-content:space-between"><span>${prod?.name||d.productId} ×${d.quantity}</span><span>$${fmt(d.quantity*d.unitPrice)}</span></div>`;
    }).join('');
    document.getElementById('co-sub-3').textContent='$'+fmt(sub);
    document.getElementById('co-lc-3').textContent='$'+fmt(lcT);
    document.getElementById('co-grand-3').textContent='$'+fmt(sub+lcT);
    const inv=document.getElementById('invoice-number-input');if(inv)inv.value='INV-'+orderId+'-'+Date.now().toString().slice(-6);
    const pd=document.getElementById('payment-date-input');if(pd)pd.value=new Date().toISOString().split('T')[0];
    ['internationalTransport','localTransport','nationalization','cargoInsurance','storage','others'].forEach(f=>{
      document.getElementById('lc-'+f)?.addEventListener('input',updateLCTotals);
    });
    checkoutNext(1);
    document.getElementById('checkout-screen').style.display='block';
    initCardPreview();
  }catch(e){showToast('❌ '+e.message,'error');}
};
window.cerrarCheckout=function(){document.getElementById('checkout-screen').style.display='none';checkoutOrderId=null;};
window.checkoutNext=function(step){
  document.querySelectorAll('.checkout-step').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.step').forEach(s=>s.classList.remove('active'));
  const target=document.getElementById('checkout-step-'+step);if(target)target.classList.add('active');
  const stepEl=document.querySelector(`.step[data-step="${step}"]`);if(stepEl)stepEl.classList.add('active');
};
window.guardarLC=async function(){
  const fields=['internationalTransport','localTransport','nationalization','cargoInsurance','storage','others'];
  const data={orderNumber:checkoutOrderId};
  fields.forEach(f=>{data[f]=parseFloat(document.getElementById('lc-'+f)?.value||0);});
  try{
    if(checkoutLC)await logicalCostsAPI.update(checkoutOrderId,data);
    else{await logicalCostsAPI.create(data);checkoutLC=data;}
    showToast('✅ Logical costs saved','success');
  }catch(e){showToast('❌ '+e.message,'error');}
};
window.selectPayMethod=function(method,btn){
  checkoutPayMethod=method;
  document.querySelectorAll('.pay-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const cf=document.getElementById('card-fields');
  const cp=document.getElementById('card-preview');
  if(cf)cf.style.display=method==='card'?'block':'none';
  if(cp)cp.style.display=method==='card'?'block':'none';
};
function initCardPreview(){
  const cn=document.getElementById('card-number-input');
  const ch=document.getElementById('card-holder-input');
  const ce=document.getElementById('card-expiry-input');
  const cv=document.getElementById('card-cvv-input');
  cn?.addEventListener('input',function(){
    this.value=this.value.replace(/\D/g,'').slice(0,16);
    const f=this.value.replace(/(.{4})/g,'$1 ').trim();
    const el=document.getElementById('preview-card-number');if(el)el.textContent=f||'•••• •••• •••• ••••';
    const b=document.getElementById('card-brand-icon');
    if(b){if(/^4/.test(this.value))b.textContent='VISA';else if(/^5[1-5]/.test(this.value))b.textContent='MC';else if(/^3[47]/.test(this.value))b.textContent='AMEX';else b.textContent='💳';}
  });
  ch?.addEventListener('input',function(){const el=document.getElementById('preview-card-holder');if(el)el.textContent=this.value.toUpperCase()||'CARD HOLDER NAME';});
  ce?.addEventListener('input',function(){
    this.value=this.value.replace(/\D/g,'').slice(0,4);
    if(this.value.length>=2)this.value=this.value.slice(0,2)+'/'+this.value.slice(2);
    const el=document.getElementById('preview-card-expiry');if(el)el.textContent=this.value||'MM/YY';
  });
  cv?.addEventListener('focus',()=>document.getElementById('card-preview')?.classList.add('flipped'));
  cv?.addEventListener('blur',()=>document.getElementById('card-preview')?.classList.remove('flipped'));
  cv?.addEventListener('input',function(){this.value=this.value.replace(/\D/g,'').slice(0,4);const el=document.getElementById('preview-cvv');if(el)el.textContent=this.value||'•••';});
}
window.procesarPago=async function(){
  const invoice=document.getElementById('invoice-number-input')?.value;
  if(!invoice){showToast('⚠️ Invoice number required','error');return;}
  if(checkoutPayMethod==='card'){
    const cn=document.getElementById('card-number-input')?.value.replace(/\s/g,'');
    const ch=document.getElementById('card-holder-input')?.value;
    const ce=document.getElementById('card-expiry-input')?.value;
    const cv=document.getElementById('card-cvv-input')?.value;
    if((cn||'').length<16||!ch||!ce||(cv||'').length<3){showToast('⚠️ Complete card details','error');return;}
  }
  try{
    await guardarLC();
    await transactionsAPI.create({purchaseOrderId:checkoutOrderId,invoiceNumber:invoice,
      transactionStatus:'Pagado',paymentDate:document.getElementById('payment-date-input')?.value||null,
      reminder:document.getElementById('payment-reminder')?.value||null});
    showToast('✅ Payment registered!','success');
    cerrarCheckout();await loadOrdersList();
  }catch(e){showToast('❌ '+e.message,'error');}
};

// ==================== FORM COMPRA RÁPIDA ====================
document.addEventListener('DOMContentLoaded',()=>{
  const form=document.getElementById('form-compra');
  if(form)form.addEventListener('submit',async(e)=>{
    e.preventDefault();
    const supplierId=document.getElementById('supplier-select').value||
  allProducts.find(p=>(p.productId??p.id)===cart[0]?.id)?.supplierId||3;
    const date=document.getElementById('purchase-date').value;
    if(!supplierId||!date){showToast('⚠️ Complete all fields','error');return;}
    if(!cart.length){showToast('⚠️ Cart is empty','error');return;}
    try{
      const order=await ordersAPI.create({supplierId:parseInt(supplierId),orderDate:new Date(date).toISOString(),
        details:cart.map(i=>({purchaseOrderId:0,productId:i.id,quantity:i.qty,unitPrice:i.price}))});
      const sup=suppliers.find(s=>(s.supplierId??s.id)==supplierId);
      const snapshot=[...cart];
      showInvoice(order.purchaseOrderId,sup?.name||supplierId,date,snapshot);
      cart=[];renderCartPanel();updateCartBadge();cerrarModalCompra();
    }catch(err){showToast('❌ '+err.message,'error');}
  });
  document.getElementById('search-input')?.addEventListener('input',()=>aplicarFiltros());
  document.getElementById('search-input')?.addEventListener('keypress',e=>{if(e.key==='Enter')aplicarFiltros();});
  const btn=document.getElementById('filter-toggle-btn'),bar=document.getElementById('filter-bar');
  if(btn&&bar)btn.addEventListener('click',()=>{
    const open=bar.style.display==='flex';
    bar.style.display=open?'none':'flex';
    btn.style.borderColor=open?'rgba(144,105,249,0.2)':'#9069F9';
    btn.style.color=open?'rgba(255,255,255,0.7)':'#9069F9';
  });
});

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

window.addEventListener('load',()=>{loadProducts();loadSuppliers();});