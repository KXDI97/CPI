// ====== CONFIG ======
const API_BASE = "http://localhost:5131";           // ⬅️ puerto real
const CLIENTS_URL = `${API_BASE}/api/clients`;      // GET/POST/PUT/DELETE
const PAGE_SIZE = 24;                                // tamaño de página que quieras
// ====================

document.addEventListener("DOMContentLoaded", () => {
  // DOM
  const grid            = document.getElementById("clientesGrid");
  const searchInput     = document.getElementById("search-client");

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

  // Estado
  let editingId = null;
  let currentQuery = "";
  let currentPage = 1;

  // Modal helpers
  const openModal = () => { 
    modal.classList.remove("hidden"); 
    backdrop.classList.remove("hidden"); 
    errorBox.style.display="none"; 
  };
  const closeModal = () => { 
    modal.classList.add("hidden"); 
    backdrop.classList.add("hidden"); 
    editingId = null;
  };

  openBtn?.addEventListener("click", () => {
    editingId = null;
    clearForm();
    openModal();
  });
  cancelBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  const clearForm = () => {
    nameInput.value = "";
    typeInput.value = "Empresa";
    docTypeInput.value = "RUT";
    docIdInput.value = "";
    emailInput.value = "";
    phoneInput.value = "";
    websiteInput.value = "";
    addressInput.value = "";
  };

  // Render helpers
  const initials = (name="C") => name.split(" ").filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join("");

  const card = (c) => {
    const web = c.website ? `<a href="${c.website}" target="_blank">${c.website.replace(/^https?:\/\//,'')}</a>` : "";
    return `
      <div class="cliente-card" data-id="${c.clientId}">
        <div class="cliente-header">
          <div class="cliente-avatar">${initials(c.name)}</div>
          <div><h3>${c.name}</h3><p>${c.clientType || ""}</p></div>
          <div class="menu-container">
            <button class="menu-btn"><ion-icon name="ellipsis-vertical"></ion-icon></button>
            <ul class="menu-options hidden">
              <li class="opt-edit">Editar</li>
              <li class="opt-delete">Borrar</li>
            </ul>
          </div>
        </div>
        <p><strong>Documento:</strong> ${c.documentType} ${c.documentID}</p>
        <p><strong>Teléfono:</strong> ${c.phone ?? ""}</p>
        <p><strong>Email:</strong> ${c.email ?? ""}</p>
        <p><strong>Web:</strong> ${web}</p>
        <p><strong>Dirección:</strong> ${c.address ?? ""}</p>
      </div>
    `;
  };

  const render = (list=[]) => {
    if (!grid) return;
    grid.innerHTML = list.map(card).join("");

    // attach eventos para menús
    grid.querySelectorAll(".cliente-card").forEach(cardEl => {
      const id = cardEl.dataset.id;
      const menuBtn = cardEl.querySelector(".menu-btn");
      const menu = cardEl.querySelector(".menu-options");

      // Toggle menú
      menuBtn.addEventListener("click", e => {
        e.stopPropagation();
        document.querySelectorAll(".menu-options").forEach(m => m.classList.add("hidden"));
        menu.classList.toggle("hidden");
      });

      // Editar
      cardEl.querySelector(".opt-edit").addEventListener("click", async () => {
        // buscamos el cliente actual en pantalla
        const { items } = await getClients(currentPage, PAGE_SIZE, currentQuery);
        const client = items.find(x => x.clientId == id);
        if (!client) return;
        editingId = id;
        nameInput.value = client.name || "";
        typeInput.value = client.clientType || "Empresa";
        docTypeInput.value = client.documentType || "RUT";
        docIdInput.value = client.documentID || "";
        emailInput.value = client.email || "";
        phoneInput.value = client.phone || "";
        websiteInput.value = client.website || "";
        addressInput.value = client.address || "";
        openModal();
        menu.classList.add("hidden");
      });

      // Borrar
      cardEl.querySelector(".opt-delete").addEventListener("click", async () => {
        if (!confirm("¿Eliminar este cliente?")) return;
        try {
          await deleteClient(id);
          await loadAndRender(currentPage, currentQuery);
        } catch (err) {
          alert(err.message);
        }
        menu.classList.add("hidden");
      });
    });
  };

  // Cerrar menús si hago clic afuera
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".menu-container")) {
      document.querySelectorAll(".menu-options").forEach(m => m.classList.add("hidden"));
    }
  });

  // ===== API (ahora paginada) =====
  async function getClients(page = 1, pageSize = PAGE_SIZE, q = "") {
    const url = new URL(CLIENTS_URL);
    url.searchParams.set("page", page);
    url.searchParams.set("pageSize", pageSize);
    if (q) url.searchParams.set("q", q);

    const r = await fetch(url);
    if (!r.ok) throw new Error(`GET ${url} -> ${r.status}`);
    return r.json(); // { items, total }
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

  async function updateClient(id, dto) {
    const r = await fetch(`${CLIENTS_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto)
    });
    if (r.status === 409) throw new Error("Conflicto de documento.");
    if (!r.ok) throw new Error(await r.text() || `PUT -> ${r.status}`);
    return r.json();
  }

  async function deleteClient(id) {
    const r = await fetch(`${CLIENTS_URL}/${id}`, { method: "DELETE" });
    if (!r.ok) throw new Error(await r.text() || `DELETE -> ${r.status}`);
  }

  // ===== Acciones =====
  async function loadAndRender(page = 1, q = "") {
    try {
      const { items } = await getClients(page, PAGE_SIZE, q); // ← tomamos solo el array
      currentPage = page;
      currentQuery = q;
      render(items);
    } catch (e) {
      console.error(e);
      if (grid) grid.innerHTML = `<p style="color:#c0392b">No puedo conectar con ${CLIENTS_URL}. Verifica backend.</p>`;
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
      if (editingId) {
        await updateClient(editingId, dto);
      } else {
        await createClient(dto);
      }
      closeModal();
      await loadAndRender(currentPage, currentQuery);
    } catch (err) {
      errorBox.textContent = err.message || "No se pudo guardar el cliente.";
      errorBox.style.display = "block";
    }
  });

  // Búsqueda (usa ?q= en el server)
  let debounce;
  searchInput?.addEventListener("input", (e) => {
    const q = (e.target.value || "").trim();
    clearTimeout(debounce);
    debounce = setTimeout(() => loadAndRender(1, q), 300);
  });

  // Boot
  loadAndRender(1, "");
});
