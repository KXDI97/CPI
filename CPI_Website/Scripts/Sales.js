
const CATALOG_API = "http://localhost:5131/api";
const SALES_API   = "http://localhost:5215/api";


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

// ===== Fetch helpers =====
async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status}: ${err}`);
  }
  return res.status === 204 ? null : res.json();
}

// ===== Estado global =====
let allClients  = [];
let allProducts = [];

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
    console.error("Error cargando datos del catálogo:", e);
  }
}

// ===== Sales Summary =====
async function loadSalesSummary() {
  const tbody = document.getElementById("sales-summary-rows");
  if (!tbody) return;

  try {
    const sales = await apiFetch(`${SALES_API}/sales`);

    if (!sales.length) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;opacity:.5">Sin ventas registradas</td></tr>`;
      return;
    }

    tbody.innerHTML = sales.map(s => {
      const client = allClients.find(c => c.clientId === s.clientId);
      const clientName = client ? client.name : `Cliente #${s.clientId}`;
      const statusClass = s.status === "Paid" ? "status-paid"
                        : s.status === "Emitida" ? "status-emitida"
                        : s.status === "Overdue" ? "status-overdue"
                        : "status-pending";
      return `
        <tr class="sale-row" data-id="${s.invoiceId}" style="cursor:pointer">
          <td>${fmtDate(s.invoiceDate)}</td>
          <td>${clientName}</td>
          <td class="ta-right">${fmtMoney(s.total)}</td>
          <td><span class="badge ${statusClass}">${s.status}</span></td>
        </tr>`;
    }).join("");

    // Click en fila → cargar detalle
    tbody.querySelectorAll(".sale-row").forEach(row => {
      row.addEventListener("click", () => loadSaleDetail(Number(row.dataset.id)));
    });

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:red">Error cargando ventas</td></tr>`;
    console.error(e);
  }
}

// ===== Detalle de venta =====
async function loadSaleDetail(invoiceId) {
  try {
    const sale = await apiFetch(`${SALES_API}/sales/${invoiceId}`);
    const client = allClients.find(c => c.clientId === sale.clientId);

    // Card: Client Details
    document.getElementById("cd-doc").textContent =
      client ? `${client.documentType} ${client.documentID}` : `ID ${sale.clientId}`;
    document.getElementById("cd-name").textContent =
      client ? client.name : `Cliente #${sale.clientId}`;
    document.getElementById("cd-date").textContent = fmtDate(sale.invoiceDate);
    document.getElementById("cd-amount").textContent = fmtMoney(sale.total);
    document.getElementById("cd-invoiceId").value = sale.invoiceId;
    document.getElementById("cd-clientId").value = sale.clientId;

    // Card: Sale Status
    document.getElementById("se-customer-txt").textContent =
      client ? client.name : `Cliente #${sale.clientId}`;
    document.getElementById("se-date-txt").textContent = fmtDate(sale.invoiceDate);
    document.getElementById("se-exr-txt").textContent =
      sale.exchangeRate ? fmtMoney(sale.exchangeRate) : "—";
    document.getElementById("se-total-txt").textContent = fmtMoney(sale.total);
    document.getElementById("se-status").value = sale.status;

    // Card: Invoice Totals
    document.getElementById("iv-invoiceId").textContent = `#${sale.invoiceId}`;
    document.getElementById("iv-subtotal").textContent  = fmtMoney(sale.subtotal);
    document.getElementById("iv-tax").textContent       = fmtMoney(sale.tax);
    document.getElementById("iv-total").textContent     = fmtMoney(sale.total);

  } catch (e) {
    console.error("Error cargando detalle de venta:", e);
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
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    alert(`Estado actualizado a "${status}"`);
    await loadSalesSummary();
  } catch (e) {
    alert("Error actualizando estado: " + e.message);
  }
}

// ===== Modal Nueva Venta =====
function openSaleModal() {
  fillClientsSelect();
  document.getElementById("ns-date").value = todayISODate();
  document.getElementById("ns-exr").value = "";
  document.getElementById("ns-exr").disabled = true;
  document.getElementById("ns-lines-body").innerHTML = "";
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

function fillProductsSelect(sel) {
  sel.innerHTML = `<option value="">Seleccione…</option>` +
    allProducts.map(p =>
      `<option value="${p.productId}" data-price="${p.value}" data-stock="${p.stock}">
        ${p.name} (Stock: ${p.stock})
      </option>`
    ).join("");
}

function addLine() {
  const tbody = document.getElementById("ns-lines-body");
  const tr = document.createElement("tr");

  const tdProd = document.createElement("td");
  const sel = document.createElement("select"); sel.required = true;
  fillProductsSelect(sel);
  tdProd.appendChild(sel);

  const tdPrice = document.createElement("td");
  const inpPrice = document.createElement("input");
  inpPrice.type = "number"; inpPrice.step = "0.01"; inpPrice.min = "0";
  tdPrice.appendChild(inpPrice);

  const tdQty = document.createElement("td");
  const inpQty = document.createElement("input");
  inpQty.type = "number"; inpQty.step = "0.001"; inpQty.min = "0.001";
  tdQty.appendChild(inpQty);

  const tdTotal = document.createElement("td");
  tdTotal.className = "ta-right";
  const spanTot = document.createElement("span");
  spanTot.textContent = fmtMoney(0);
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
    if (!opt) return;
    inpPrice.value = opt.dataset.price || "";
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
  const iva      = 0; // ajusta si manejas IVA
  document.getElementById("ns-subtotal").textContent = fmtMoney(subtotal);
  document.getElementById("ns-iva").textContent      = fmtMoney(iva);
  document.getElementById("ns-total").textContent    = fmtMoney(subtotal + iva);
}

// ===== Submit nueva venta =====
async function submitSale(e) {
  e.preventDefault();

  const clientId = Number(document.getElementById("ns-client").value);
  const date     = document.getElementById("ns-date").value;
  const lines    = readLines();
  const isCustom = document.getElementById("ns-exr-custom").checked;
  const exrVal   = document.getElementById("ns-exr").value;

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
    await apiFetch(`${SALES_API}/sales`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    closeSaleModal();
    await loadSalesSummary();
  } catch (e) {
    alert("Error creando venta: " + e.message);
    console.error(e);
  }
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", async () => {
  await loadInitialData();
  await loadSalesSummary();

  // Botón nueva venta
  document.getElementById("btn-new-sale")
    ?.addEventListener("click", openSaleModal);

  // Cerrar modal
  document.getElementById("ns-close")
    ?.addEventListener("click", closeSaleModal);
  document.getElementById("ns-cancel")
    ?.addEventListener("click", closeSaleModal);
  document.getElementById("saleBackdrop")
    ?.addEventListener("click", closeSaleModal);

  // Agregar línea
  document.getElementById("ns-add-line")
    ?.addEventListener("click", addLine);

  // TRM toggle
  document.getElementById("ns-exr-today")?.addEventListener("change", () => {
    document.getElementById("ns-exr").disabled = true;
  });
  document.getElementById("ns-exr-custom")?.addEventListener("change", () => {
    document.getElementById("ns-exr").disabled = false;
    document.getElementById("ns-exr").focus();
  });

  // Submit
  document.getElementById("form-new-sale")
    ?.addEventListener("submit", submitSale);

  // Cambiar estado
  document.getElementById("form-sale-status")
    ?.addEventListener("submit", handleStatusUpdate);
});
