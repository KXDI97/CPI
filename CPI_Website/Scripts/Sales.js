// Scripts/Sales.js

const CATALOG_API = "http://localhost:5131/api";
const SALES_API   = "http://localhost:5215/api";

const COMPANY = {
  name:    "CPI - Control de Producción e Importaciones",
  nit:     "900.000.000-0",
  address: "Bogotá, Colombia",
  email:   "contacto@cpi.com.co",
  logo:    "../Images/logo.png"
};

// ===== Helpers =====
function fmtMoney(n) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0
  }).format(Number(n || 0));
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric", month: "short", day: "2-digit"
  });
}

function todayISODate() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10);
}

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" }, ...opts
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.status === 204 ? null : res.json();
}

// ===== Estado global =====
let allClients  = [];
let allProducts = [];
let allSales    = [];

// ===== Cargar datos iniciales =====
async function loadInitialData() {
  try {
    const [clientsRes, productsRes] = await Promise.all([
      apiFetch(`${CATALOG_API}/clients`),
      apiFetch(`${CATALOG_API}/products`)
    ]);
    allClients  = Array.isArray(clientsRes)  ? clientsRes  : (clientsRes.items  ?? []);
    allProducts = Array.isArray(productsRes) ? productsRes : (productsRes.items ?? []);
  } catch (e) {
    console.error("Error cargando catálogo:", e);
  }
}

// ===== Sales Summary =====
async function loadSalesSummary() {
  const tbody = document.getElementById("sales-summary-rows");
  if (!tbody) return;

  try {
    allSales = await apiFetch(`${SALES_API}/sales`);

    if (!allSales.length) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;opacity:.5">Sin ventas</td></tr>`;
      return;
    }

    tbody.innerHTML = allSales.map(s => {
      const client = allClients.find(c => c.clientId === s.clientId);
      const name   = client ? client.name : `Cliente #${s.clientId}`;
      const cls    = s.status === "Paid" ? "status-paid"
                   : s.status === "Emitida" ? "status-emitida"
                   : s.status === "Overdue" ? "status-overdue"
                   : "status-pending";
      return `<tr class="sale-row" data-id="${s.invoiceId}" style="cursor:pointer">
        <td>${fmtDate(s.invoiceDate)}</td>
        <td>${name}</td>
        <td class="ta-right">${fmtMoney(s.total)}</td>
        <td><span class="badge ${cls}">${s.status}</span></td>
      </tr>`;
    }).join("");

    tbody.querySelectorAll(".sale-row").forEach(row =>
      row.addEventListener("click", () => loadSaleDetail(Number(row.dataset.id)))
    );
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:red">Error cargando ventas</td></tr>`;
  }
}

// ===== Detalle de venta =====
async function loadSaleDetail(invoiceId) {
  try {
    const sale   = await apiFetch(`${SALES_API}/sales/${invoiceId}`);
    const client = allClients.find(c => c.clientId === sale.clientId);

    document.getElementById("cd-doc").textContent     = client ? `${client.documentType} ${client.documentID}` : `ID ${sale.clientId}`;
    document.getElementById("cd-name").textContent    = client ? client.name : `Cliente #${sale.clientId}`;
    document.getElementById("cd-date").textContent    = fmtDate(sale.invoiceDate);
    document.getElementById("cd-amount").textContent  = fmtMoney(sale.total);
    document.getElementById("cd-invoiceId").value     = sale.invoiceId;
    document.getElementById("cd-clientId").value      = sale.clientId;

    // Total histórico del cliente
    const clientTotal = allSales
      .filter(s => s.clientId === sale.clientId)
      .reduce((sum, s) => sum + (s.total || 0), 0);
    const elClientTotal = document.getElementById("cd-client-total");
    if (elClientTotal) elClientTotal.textContent = fmtMoney(clientTotal);
    const elClientCount = document.getElementById("cd-client-count");
    if (elClientCount) {
      const count = allSales.filter(s => s.clientId === sale.clientId).length;
      elClientCount.textContent = count + (count === 1 ? " venta" : " ventas");
    }

    document.getElementById("se-customer-txt").textContent = client ? client.name : `Cliente #${sale.clientId}`;
    document.getElementById("se-date-txt").textContent     = fmtDate(sale.invoiceDate);
    document.getElementById("se-exr-txt").textContent      = sale.exchangeRate ? fmtMoney(sale.exchangeRate) : "—";
    document.getElementById("se-total-txt").textContent    = fmtMoney(sale.total);
    document.getElementById("se-status").value             = sale.status;

    document.getElementById("iv-invoiceId").textContent = `#${sale.invoiceId}`;
    document.getElementById("iv-subtotal").textContent  = fmtMoney(sale.subtotal);
    document.getElementById("iv-tax").textContent       = fmtMoney(sale.tax);
    document.getElementById("iv-total").textContent     = fmtMoney(sale.total);

    // guardar sale completa para PDF y edición
    document.getElementById("iv-save").dataset.sale   = JSON.stringify(sale);
    document.getElementById("iv-edit").dataset.sale   = JSON.stringify(sale);
  } catch (e) {
    console.error("Error cargando detalle:", e);
  }
}

// ===== Cambiar estado =====
async function handleStatusUpdate(e) {
  e.preventDefault();
  const invoiceId = document.getElementById("cd-invoiceId").value;
  const status    = document.getElementById("se-status").value;
  if (!invoiceId) { alert("Selecciona una venta primero"); return; }
  try {
    await apiFetch(`${SALES_API}/sales/${invoiceId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
    alert(`Estado actualizado a "${status}"`);
    await loadSalesSummary();
  } catch (e) {
    // intentar PATCH si PUT falla
    try {
      await apiFetch(`${SALES_API}/sales/${invoiceId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      alert(`Estado actualizado a "${status}"`);
      await loadSalesSummary();
    } catch(e2) {
      alert("Error: " + e2.message);
    }
  }
}

// ===== PDF =====
async function generatePDF(sale) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const client = allClients.find(c => c.clientId === sale.clientId);
  const clientName = client ? client.name : `Cliente #${sale.clientId}`;
  const clientDoc  = client ? `${client.documentType} ${client.documentID}` : "";

  // Logo
  try {
    const img = await loadImageAsBase64(COMPANY.logo);
    doc.addImage(img, "PNG", 14, 10, 30, 15);
  } catch(_) {}

  // Encabezado empresa
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(COMPANY.name,    50, 15);
  doc.text(`NIT: ${COMPANY.nit}`, 50, 20);
  doc.text(COMPANY.address, 50, 25);
  doc.text(COMPANY.email,   50, 30);

  // Título factura
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text(`FACTURA #${sale.invoiceId}`, 14, 50);

  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Fecha: ${fmtDate(sale.invoiceDate)}`, 14, 58);
  doc.text(`Estado: ${sale.status}`,              14, 64);
  if (sale.exchangeRate) doc.text(`TRM: ${sale.exchangeRate}`, 14, 70);

  // Datos cliente
  doc.setFontSize(11);
  doc.setTextColor(40);
  doc.text("Cliente", 14, 82);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(clientName, 14, 88);
  if (clientDoc) doc.text(clientDoc, 14, 94);

  // Línea divisoria
  doc.setDrawColor(200);
  doc.line(14, 100, 196, 100);

  // Tabla de productos
  doc.setFontSize(10);
  doc.setTextColor(40);
  doc.setFont(undefined, "bold");
  doc.text("Producto",   14,  110);
  doc.text("Cant.",     110,  110);
  doc.text("Precio",    135,  110);
  doc.text("Total",     170,  110);
  doc.setFont(undefined, "normal");
  doc.line(14, 112, 196, 112);

  let y = 120;
  (sale.details || []).forEach(d => {
    const prod = allProducts.find(p => p.productId === d.productId);
    const name = prod ? prod.name : d.productId;
    doc.setTextColor(60);
    doc.text(name,                    14,  y);
    doc.text(String(d.quantity),     110,  y);
    doc.text(fmtMoney(d.unitPrice),  130,  y);
    doc.text(fmtMoney(d.lineTotal),  165,  y);
    y += 8;
  });

  // Totales
  doc.line(14, y + 2, 196, y + 2);
  y += 10;
  doc.setFont(undefined, "bold");
  doc.text("Subtotal:", 130, y);
  doc.text(fmtMoney(sale.subtotal), 165, y);
  y += 7;
  doc.text("IVA:",      130, y);
  doc.text(fmtMoney(sale.tax), 165, y);
  y += 7;
  doc.setFontSize(12);
  doc.text("TOTAL:",    130, y);
  doc.text(fmtMoney(sale.total), 165, y);

  // Footer
  doc.setFont(undefined, "normal");
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Documento generado por CPI • www.cpi.com.co", 14, 285);

  doc.save(`Factura_CPI_${sale.invoiceId}.pdf`);
}

function loadImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      c.getContext("2d").drawImage(img, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ===== Modal Historial de Facturas =====
function buildHistoryModal() {
  if (document.getElementById("historyModal")) return;

  document.body.insertAdjacentHTML("beforeend", `
    <div id="historyBackdrop" class="modal-backdrop hidden"></div>
    <div id="historyModal" class="modal hidden" role="dialog">
      <div class="modal-card" style="max-width:700px;width:90vw">
        <div class="modal-header">
          <h3>Invoice History</h3>
          <button type="button" class="modal-close" id="hist-close">×</button>
        </div>
        <div class="modal-body">
          <table class="tbl" id="tbl-history">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Customer</th>
                <th class="ta-right">Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="history-rows"></tbody>
          </table>
        </div>
      </div>
    </div>
  `);

  document.getElementById("hist-close").addEventListener("click", (e) => {
    e.stopPropagation();
    closeHistoryModal();
  });
  document.getElementById("historyBackdrop").addEventListener("click", (e) => {
    if (e.target === document.getElementById("historyBackdrop")) closeHistoryModal();
  });
}

async function openHistoryModal() {
  buildHistoryModal();
  const tbody = document.getElementById("history-rows");
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">Cargando…</td></tr>`;
  const bd = document.getElementById("historyBackdrop");
  const md = document.getElementById("historyModal");
  bd.classList.remove("hidden"); bd.style.display = "";
  md.classList.remove("hidden"); md.style.display = "";

  try {
    const sales = await apiFetch(`${SALES_API}/sales`);
    if (!sales.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;opacity:.5">Sin facturas</td></tr>`;
      return;
    }
    tbody.innerHTML = sales.map(s => {
      const client = allClients.find(c => c.clientId === s.clientId);
      const name   = client ? client.name : `#${s.clientId}`;
      return `<tr>
        <td>#${s.invoiceId}</td>
        <td>${fmtDate(s.invoiceDate)}</td>
        <td>${name}</td>
        <td class="ta-right">${fmtMoney(s.total)}</td>
        <td>${s.status}</td>
        <td>
          <button class="btn-primary btn-dl-pdf" data-id="${s.invoiceId}"
            style="padding:4px 12px;font-size:.8rem">
            ⬇ PDF
          </button>
        </td>
      </tr>`;
    }).join("");

    tbody.querySelectorAll(".btn-dl-pdf").forEach(btn =>
      btn.addEventListener("click", async () => {
        const id   = Number(btn.dataset.id);
        const sale = await apiFetch(`${SALES_API}/sales/${id}`);
        await generatePDF(sale);
      })
    );
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:red">Error: ${e.message}</td></tr>`;
  }
}

function closeHistoryModal() {
  const bd = document.getElementById("historyBackdrop");
  const md = document.getElementById("historyModal");
  if (bd) { bd.classList.add("hidden"); bd.style.display = "none"; }
  if (md) { md.classList.add("hidden"); md.style.display = "none"; }
}

// ===== Modal Editar Venta =====
function openEditSaleModal() {
  const raw = document.getElementById("iv-edit").dataset.sale;
  if (!raw) { alert("Selecciona una venta primero"); return; }
  const sale = JSON.parse(raw);

  // Reutiliza el modal de nueva venta
  fillClientsSelect();
  document.getElementById("ns-date").value  = sale.invoiceDate?.slice(0,10) || todayISODate();
  document.getElementById("ns-exr").value   = sale.exchangeRate || "";
  if (sale.exchangeRate) {
    document.getElementById("ns-exr-custom").checked = true;
    document.getElementById("ns-exr").disabled = false;
  }

  // Limpiar y cargar líneas
  document.getElementById("ns-lines-body").innerHTML = "";
  (sale.details || []).forEach(d => addLine(d));
  renderTotals();

  // Cambiar título y submit
  document.getElementById("saleModalTitle").textContent = `Editar Venta #${sale.invoiceId}`;
  const form = document.getElementById("form-new-sale");
  form.dataset.editId = sale.invoiceId;

  document.getElementById("saleBackdrop").classList.remove("hidden");
  document.getElementById("saleModal").classList.remove("hidden");
}

// ===== Modal Nueva Venta =====
function openSaleModal() {
  fillClientsSelect();
  document.getElementById("ns-date").value = todayISODate();
  document.getElementById("ns-exr").value  = "";
  document.getElementById("ns-exr").disabled = true;
  document.getElementById("ns-lines-body").innerHTML = "";
  document.getElementById("saleModalTitle").textContent = "New Sale";
  document.getElementById("form-new-sale").dataset.editId = "";
  addLine();
  renderTotals();
  document.getElementById("saleBackdrop").classList.remove("hidden");
  document.getElementById("saleModal").classList.remove("hidden");
}

function closeSaleModal() {
  document.getElementById("saleBackdrop").classList.add("hidden");
  document.getElementById("saleModal").classList.add("hidden");
}

function fillClientsSelect() {
  const sel = document.getElementById("ns-client");
  sel.innerHTML = `<option value="">Seleccione…</option>` +
    allClients.map(c =>
      `<option value="${c.clientId}">${c.name} (${c.documentType} ${c.documentID})</option>`
    ).join("");
}

function fillProductsSelect(sel, selectedId = "") {
  sel.innerHTML = `<option value="">Seleccione…</option>` +
    allProducts.map(p =>
      `<option value="${p.productId}" data-price="${p.value}"
        ${p.productId === selectedId ? "selected" : ""}>
        ${p.name} (Stock: ${p.stock})
      </option>`
    ).join("");
}

function addLine(prefill = null) {
  const tbody = document.getElementById("ns-lines-body");
  const tr    = document.createElement("tr");

  const tdProd  = document.createElement("td");
  const sel     = document.createElement("select"); sel.required = true;
  fillProductsSelect(sel, prefill?.productId || "");
  tdProd.appendChild(sel);

  const tdPrice = document.createElement("td");
  const inpPrice = document.createElement("input");
  inpPrice.type = "number"; inpPrice.step = "0.01"; inpPrice.min = "0";
  inpPrice.value = prefill?.unitPrice || "";
  tdPrice.appendChild(inpPrice);

  const tdQty = document.createElement("td");
  const inpQty = document.createElement("input");
  inpQty.type = "number"; inpQty.step = "0.001"; inpQty.min = "0.001";
  inpQty.value = prefill?.quantity || "";
  tdQty.appendChild(inpQty);

  const tdTotal = document.createElement("td");
  tdTotal.className = "ta-right";
  const spanTot = document.createElement("span");
  spanTot.textContent = fmtMoney((prefill?.unitPrice || 0) * (prefill?.quantity || 0));
  tdTotal.appendChild(spanTot);

  const tdDel = document.createElement("td");
  const btnDel = document.createElement("button");
  btnDel.type = "button"; btnDel.className = "btn-secondary";
  btnDel.textContent = "Quitar";
  tdDel.appendChild(btnDel);

  tr.append(tdProd, tdPrice, tdQty, tdTotal, tdDel);
  tbody.appendChild(tr);

  sel.addEventListener("change", () => {
    const opt = sel.selectedOptions[0];
    if (opt?.dataset.price) inpPrice.value = opt.dataset.price;
    recalcRow();
  });
  [inpPrice, inpQty].forEach(i => i.addEventListener("input", recalcRow));
  btnDel.addEventListener("click", () => { tr.remove(); renderTotals(); });

  function recalcRow() {
    spanTot.textContent = fmtMoney(Number(inpQty.value || 0) * Number(inpPrice.value || 0));
    renderTotals();
  }
}

function readLines() {
  return Array.from(document.getElementById("ns-lines-body").querySelectorAll("tr"))
    .map(tr => ({
      productId: tr.querySelector("select")?.value || "",
      unitPrice: Number(tr.querySelector("td:nth-child(2) input")?.value || 0),
      quantity:  Number(tr.querySelector("td:nth-child(3) input")?.value || 0)
    }))
    .filter(x => x.productId && x.quantity > 0);
}

function renderTotals() {
  const lines    = readLines();
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  document.getElementById("ns-subtotal").textContent = fmtMoney(subtotal);
  document.getElementById("ns-iva").textContent      = fmtMoney(0);
  document.getElementById("ns-total").textContent    = fmtMoney(subtotal);
}

// ===== Submit nueva venta / editar =====
async function submitSale(e) {
  e.preventDefault();

  const clientId = Number(document.getElementById("ns-client").value);
  const date     = document.getElementById("ns-date").value;
  const lines    = readLines();
  const isCustom = document.getElementById("ns-exr-custom").checked;
  const exrVal   = document.getElementById("ns-exr").value;
  const editId   = e.target.dataset.editId;

  if (!clientId) { alert("Selecciona un cliente"); return; }
  if (!date)     { alert("Selecciona una fecha"); return; }
  if (!lines.length) { alert("Agrega al menos un producto"); return; }

  const payload = {
    clientId,
    invoiceDate:  new Date(date).toISOString(),
    exchangeRate: isCustom && exrVal ? Number(exrVal) : null,
    lines
  };

  try {
    if (editId) {
      // Eliminar y recrear (API no tiene PUT para ventas)
      await apiFetch(`${SALES_API}/sales/${editId}`, { method: "DELETE" });
      await apiFetch(`${SALES_API}/sales`, { method: "POST", body: JSON.stringify(payload) });
    } else {
      await apiFetch(`${SALES_API}/sales`, { method: "POST", body: JSON.stringify(payload) });
    }
    closeSaleModal();
    await loadSalesSummary();
  } catch (e) {
    alert("Error: " + e.message);
  }
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", async () => {
  // Cargar jsPDF dinámicamente
  if (!window.jspdf) {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    document.head.appendChild(script);
    await new Promise(r => script.onload = r);
  }

  await loadInitialData();
  await loadSalesSummary();

  document.getElementById("btn-new-sale")?.addEventListener("click", openSaleModal);
  document.getElementById("ns-close")?.addEventListener("click", closeSaleModal);
  document.getElementById("ns-cancel")?.addEventListener("click", closeSaleModal);
  document.getElementById("saleBackdrop")?.addEventListener("click", closeSaleModal);
  document.getElementById("ns-add-line")?.addEventListener("click", () => addLine());
  document.getElementById("ns-exr-today")?.addEventListener("change", () => {
    document.getElementById("ns-exr").disabled = true;
  });
  document.getElementById("ns-exr-custom")?.addEventListener("change", () => {
    document.getElementById("ns-exr").disabled = false;
    document.getElementById("ns-exr").focus();
  });
  document.getElementById("form-new-sale")?.addEventListener("submit", submitSale);
  document.getElementById("form-sale-status")?.addEventListener("submit", handleStatusUpdate);

  // Guardar factura → PDF
  document.getElementById("iv-save")?.addEventListener("click", async () => {
    const raw = document.getElementById("iv-save").dataset.sale;
    if (!raw) { alert("Selecciona una venta primero"); return; }
    await generatePDF(JSON.parse(raw));
  });

  // Modificar venta
  document.getElementById("iv-edit")?.addEventListener("click", openEditSaleModal);

  // Botón historial — se agrega dinámicamente junto a New Sale
  const btnNew = document.getElementById("btn-new-sale");
  if (btnNew) {
    const btnHist = document.createElement("button");
    btnHist.className = "btn-secondary";
    btnHist.id        = "btn-invoice-history";
    btnHist.textContent = "📄 Invoice History";
    btnHist.style.marginLeft = "10px";
    btnNew.parentElement.appendChild(btnHist);
    btnHist.addEventListener("click", openHistoryModal);
  }
});