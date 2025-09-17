// ====== CONFIG ======
const API_BASE = "http://localhost:5000";           // ⬅️ Cambia al puerto real (mira tu Swagger)
const CLIENTS_URL = `${API_BASE}/api/clients`;      // GET/POST CRUD
// ====================

document.addEventListener("DOMContentLoaded", () => {
  // DOM
  const grid            = document.getElementById("clientesGrid");
  const searchInput     = document.getElementById("search-provider");

  const backdrop        = document.getElementById("modalBackdrop");
  const modal           = document.getElementById("clientModal");
  const openBtn         = document.getElementById("openClientModal");
  const cancelBtn       = document.getElementById("btn-cancel-client");
  const saveBtn         = document.getElementById("btn-save-client");
  const errorBox        = document.getElementById("client-error");

  // Inputs (coinciden con dbo.Clients)
  const nameInput       = document.getElementById("client-name");
  const typeInput       = document.getElementById("client-type");
  const docTypeInput    = document.getElementById("client-doc-type");
  const docIdInput      = document.getElementById("client-doc-id");
  const emailInput      = document.getElementById("client-email");
  const phoneInput      = document.getElementById("client-phone");
  const websiteInput    = document.getElementById("client-website");
  const addressInput    = document.getElementById("client-address");

  // Modal helpers
  const openModal = () => { modal.classList.remove("hidden"); backdrop.classList.remove("hidden"); errorBox.style.display="none"; };
  const closeModal = () => { modal.classList.add("hidden"); backdrop.classList.add("hidden"); };

  openBtn?.addEventListener("click", openModal);
  cancelBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  // Render
  const initials = (name="C") => name.split(" ").filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join("");
  const card = (c) => {
    const web = c.website ? `<a href="${c.website}" target="_blank">${c.website.replace(/^https?:\/\//,'')}</a>` : "";
    return `
      <div class="cliente-card">
        <div class="cliente-header">
          <div class="cliente-avatar">${initials(c.name)}</div>
          <div><h3>${c.name}</h3><p>${c.clientType || ""}</p></div>
        </div>
        <p><strong>${c.documentType}:</strong> ${c.documentID}</p>
        <p><strong>Teléfono:</strong> ${c.phone ?? ""}</p>
        <p><strong>Email:</strong> ${c.email ?? ""}</p>
        <p><strong>Web:</strong> ${web}</p>
        <p><strong>Dirección:</strong> ${c.address ?? ""}</p>
      </div>
    `;
  };
  const render = (list=[]) => grid ? grid.innerHTML = list.map(card).join("") : null;

  // API
  async function getClients() {
    const r = await fetch(CLIENTS_URL);
    if (!r.ok) throw new Error(`GET ${CLIENTS_URL} -> ${r.status}`);
    return r.json();
  }
  async function createClient(dto) {
    const r = await fetch(CLIENTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto)
    });
    if (r.status === 409) throw new Error("Ya existe un cliente con ese tipo y número de documento.");
    if (!r.ok) throw new Error(await r.text() || `POST ${CLIENTS_URL} -> ${r.status}`);
    return r.json();
  }

  // Acciones
  async function loadAndRender() {
    try {
      const data = await getClients();
      render(data);
    } catch (e) {
      console.error(e);
      if (grid) grid.innerHTML = `<p style="color:#c0392b">No puedo conectar con ${CLIENTS_URL}. Verifica que el backend esté arriba y el puerto correcto.</p>`;
    }
  }

  saveBtn?.addEventListener("click", async () => {
    const dto = {
      name:        nameInput.value.trim(),
      clientType:  typeInput.value,
      documentType:docTypeInput.value,
      documentID:  docIdInput.value.trim(),
      email:       emailInput.value.trim()   || null,
      phone:       phoneInput.value.trim()   || null,
      website:     websiteInput.value.trim() || null,
      address:     addressInput.value.trim() || null
    };
    if (!dto.name || !dto.documentID) {
      errorBox.textContent = "Nombre y Documento son obligatorios.";
      errorBox.style.display = "block";
      return;
    }
    try {
      await createClient(dto);
      closeModal();
      await loadAndRender();
    } catch (err) {
      errorBox.textContent = err.message || "No se pudo registrar el cliente.";
      errorBox.style.display = "block";
    }
  });

  // Búsqueda rápida
  searchInput?.addEventListener("input", async (e) => {
    const q = (e.target.value || "").toLowerCase();
    try {
      const all = await getClients();
      const filtered = all.filter(c =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.documentID || "").toLowerCase().includes(q) ||
        (c.documentType || "").toLowerCase().includes(q)
      );
      render(filtered);
    } catch { /* ignore */ }
  });

  // Boot
  loadAndRender();
});
