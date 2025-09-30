// Scripts/Sales.js

// ==== MOCKS para demo (sin backend) ====
const MOCK_CLIENTS = [
  { clientId: 1, name: "Acme S.A.S.", documentType: "NIT", documentID: "900123456-7" },
  { clientId: 2, name: "Beta Corp", documentType: "CC", documentID: "1032456789" },
  { clientId: 3, name: "Jane Smith", documentType: "CC", documentID: "1010101010" }
];

const MOCK_PRODUCTS = [
  { productId: "SKU-001", name: "Tornillo 1/2", value: 3500, stock: 250 },
  { productId: "SKU-002", name: "Arandela X", value: 1200, stock: 500 },
  { productId: "SKU-003", name: "Lubricante 250ml", value: 22000, stock: 42 }
];

// IVA demo (ajústalo si quieres mostrar otro valor)
const IVA_RATE = 0.19;

// ===== Helpers de formato =====
function fmtMoney(n) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0
  }).format(Number(n || 0));
}
function todayISODate() {
  const d = new Date();
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

// ===== Inyección del modal si no existe =====
function ensureSaleModal() {
  if (document.getElementById("saleModal")) return; // ya existe

  const backdrop = document.createElement("div");
  backdrop.id = "saleBackdrop";
  backdrop.className = "modal-backdrop hidden";

  const modal = document.createElement("div");
  modal.id = "saleModal";
  modal.className = "modal hidden";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "saleModalTitle");

  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 id="saleModalTitle">Nueva venta</h3>
        <button type="button" class="modal-close" id="ns-close" aria-label="Cerrar">×</button>
      </div>
      <div class="modal-body">
        <form id="form-new-sale">
          <div class="grid-2">
            <label class="fld">
              <span>Cliente</span>
              <select id="ns-client" required>
                <option value="">Seleccione…</option>
              </select>
            </label>
            <label class="fld">
              <span>Fecha</span>
              <input type="date" id="ns-date" required>
            </label>
          </div>

          <div class="fld">
            <span>TRM</span>
            <div class="trm-row">
              <label class="radio">
                <input type="radio" name="ns-exr-mode" id="ns-exr-today" checked>
                <span>TRM del día</span>
              </label>
              <label class="radio">
                <input type="radio" name="ns-exr-mode" id="ns-exr-custom">
                <span>Personalizada</span>
              </label>
              <input type="number" id="ns-exr" step="0.0001" placeholder="p.ej. 4050.1234" disabled>
              <small id="ns-exr-hint" class="muted">Demo: la TRM se puede escribir si eliges personalizada.</small>
            </div>
          </div>

          <div class="lines">
            <div class="lines-header">
              <h4>Productos</h4>
              <button type="button" id="ns-add-line" class="btn-secondary">+ Agregar producto</button>
            </div>
            <table class="tbl tbl-lines">
              <thead>
                <tr>
                  <th style="width:42%">Producto</th>
                  <th style="width:16%">Precio</th>
                  <th style="width:16%">Cantidad</th>
                  <th style="width:16%" class="ta-right">Total</th>
                  <th style="width:10%"></th>
                </tr>
              </thead>
              <tbody id="ns-lines-body"></tbody>
            </table>
          </div>

          <div class="totals">
            <div><span>Subtotal</span><strong id="ns-subtotal">$0</strong></div>
            <div><span>IVA</span><strong id="ns-iva">$0</strong></div>
            <div class="total"><span>Total</span><strong id="ns-total">$0</strong></div>
          </div>

          <div class="actions mt">
            <button type="button" class="btn-secondary" id="ns-cancel">Cancelar</button>
            <button type="submit" class="btn-primary">Crear venta (demo)</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);
}

// ===== Estado/refs =====
let $backdrop, $modal, $btnClose, $btnCancel, $form,
    $clientSel, $dateInput, $exrToday, $exrCustom, $exrInput, $exrHint,
    $addLineBtn, $linesBody, $subTotSpan, $ivaSpan, $totSpan;

// ===== Apertura/cierre =====
function openSaleModal() {
  ensureSaleModal();
  cacheRefs();

  // Inicial
  fillClientsMock();
  $dateInput.value = todayISODate();
  $exrInput.value = ""; // demo
  $exrInput.disabled = true;
  $exrHint.textContent = "Demo: TRM del día (deshabilitada) o escribe una personalizada.";
  $linesBody.innerHTML = "";
  addLine();
  renderTotals();

  // Mostrar
  $backdrop.classList.remove("hidden");
  $modal.classList.remove("hidden");
}

function closeSaleModal() {
  if (!$modal) return;
  $backdrop.classList.add("hidden");
  $modal.classList.add("hidden");
  $linesBody.innerHTML = "";
}

// ===== Cachear referencias (después de inyectar modal) =====
function cacheRefs() {
  $backdrop   = document.getElementById("saleBackdrop");
  $modal      = document.getElementById("saleModal");
  $btnClose   = document.getElementById("ns-close");
  $btnCancel  = document.getElementById("ns-cancel");
  $form       = document.getElementById("form-new-sale");

  $clientSel  = document.getElementById("ns-client");
  $dateInput  = document.getElementById("ns-date");
  $exrToday   = document.getElementById("ns-exr-today");
  $exrCustom  = document.getElementById("ns-exr-custom");
  $exrInput   = document.getElementById("ns-exr");
  $exrHint    = document.getElementById("ns-exr-hint");

  $addLineBtn = document.getElementById("ns-add-line");
  $linesBody  = document.getElementById("ns-lines-body");

  $subTotSpan = document.getElementById("ns-subtotal");
  $ivaSpan    = document.getElementById("ns-iva");
  $totSpan    = document.getElementById("ns-total");

  // Listeners básicos
  $btnClose.addEventListener("click", closeSaleModal);
  $btnCancel.addEventListener("click", closeSaleModal);
  $backdrop.addEventListener("click", closeSaleModal);
  $addLineBtn.addEventListener("click", addLine);
  $exrToday.addEventListener("change", toggleTRMMode);
  $exrCustom.addEventListener("change", toggleTRMMode);
  $form.addEventListener("submit", submitDemo);
}

// ===== Poblar selects (mock) =====
function fillClientsMock() {
  $clientSel.innerHTML = `<option value="">Seleccione…</option>` + MOCK_CLIENTS.map(c => {
    const doc = (c.documentType || "") + " " + (c.documentID || "");
    return `<option value="${c.clientId}">${c.name} (${doc.trim()})</option>`;
  }).join("");
}

function fillProductsSelect(sel) {
  sel.innerHTML = `<option value="">Seleccione…</option>` + MOCK_PRODUCTS.map(p => {
    return `<option value="${p.productId}" data-price="${p.value}" data-stock="${p.stock}">
      ${p.name} (Stock: ${p.stock})
    </option>`;
  }).join("");
}

// ===== TRM =====
function toggleTRMMode() {
  if ($exrCustom.checked) {
    $exrInput.disabled = false;
    $exrHint.textContent = "Escribe la TRM personalizada.";
    $exrInput.focus();
  } else {
    $exrInput.disabled = true;
    $exrHint.textContent = "Demo: TRM del día (sin servicio).";
  }
}

// ===== Líneas =====
function addLine() {
  const tr = document.createElement("tr");

  const tdProd = document.createElement("td");
  const sel = document.createElement("select");
  sel.required = true;
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
  $linesBody.appendChild(tr);

  sel.addEventListener("change", () => {
    const opt = sel.selectedOptions[0];
    if (!opt) return;
    const price = Number(opt.dataset.price || 0);
    inpPrice.value = price ? String(price) : "";
    recalcRow();
  });
  [inpPrice, inpQty].forEach(inp => inp.addEventListener("input", recalcRow));
  btnDel.addEventListener("click", () => { tr.remove(); renderTotals(); });

  function recalcRow() {
    const q = Number(inpQty.value || 0);
    const p = Number(inpPrice.value || 0);
    const lt = q * p;
    spanTot.textContent = fmtMoney(lt);
    renderTotals();
  }
}

function readLines() {
  const rows = Array.from($linesBody.querySelectorAll("tr"));
  return rows.map(tr => {
    const sel = tr.querySelector("select");
    const inpP = tr.querySelector("td:nth-child(2) input");
    const inpQ = tr.querySelector("td:nth-child(3) input");
    return {
      productId: sel && sel.value || "",
      unitPrice: Number(inpP && inpP.value || 0),
      quantity:  Number(inpQ && inpQ.value || 0)
    };
  }).filter(x => x.productId && x.quantity > 0);
}

function renderTotals() {
  const lines = readLines();
  const subtotal = lines.reduce((s, l) => s + (l.unitPrice * l.quantity), 0);
  const iva = subtotal * IVA_RATE;
  const total = subtotal + iva;
  document.getElementById("ns-subtotal").textContent = fmtMoney(subtotal);
  document.getElementById("ns-iva").textContent = fmtMoney(iva);
  document.getElementById("ns-total").textContent = fmtMoney(total);
}

// ===== Submit DEMO =====
function submitDemo(e) {
  e.preventDefault();

  const clientId = document.getElementById("ns-client").value;
  const date = document.getElementById("ns-date").value;
  const lines = readLines();

  if (!clientId) { alert("Selecciona un cliente"); return; }
  if (!date) { alert("Selecciona una fecha"); return; }
  if (!lines.length) { alert("Agrega al menos un producto"); return; }

  const exrMode = document.getElementById("ns-exr-custom").checked ? "custom" : "today";
  const exrVal = document.getElementById("ns-exr").value || null;

  const payloadDemo = {
    ClientId: Number(clientId),
    InvoiceDate: date,
    ExchangeRate: exrMode === "custom" ? Number(exrVal) : null,
    Details: lines
  };

  console.log("DEMO payload listo para enviar al backend:", payloadDemo);
  alert("Demo OK: se mostraría la venta creada en consola.");
  closeSaleModal();
}

// ===== Hook botón "+ New Sale" =====
document.addEventListener("DOMContentLoaded", function () {
  const btnNew = document.getElementById("btn-new-sale");
  if (!btnNew) return;
  btnNew.addEventListener("click", openSaleModal);
});
