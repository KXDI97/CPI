
document.addEventListener("DOMContentLoaded", () => {
    // Elementos del DOM
    const modalBackdrop = document.getElementById("modalBackdrop");

    const providerModal = document.getElementById("providerModal");
    const openProviderBtn = document.getElementById("openProviderModal");
    const closeProviderBtn = document.getElementById("closeProviderModal");

    // Función para abrir un modal
    function openModal(modal) {
        modal.classList.remove("hidden");
        modalBackdrop.classList.remove("hidden");
    }

    // Función para cerrar un modal
    function closeModal(modal) {
        modal.classList.add("hidden");
        modalBackdrop.classList.add("hidden");
    }

    // Eventos para abrir los modales

    openProviderBtn.addEventListener("click", () => openModal(providerModal));

    // Eventos para cerrar los modales
    closeProviderBtn.addEventListener("click", () => closeModal(providerModal));

    // Cerrar modal al hacer clic fuera de él
    modalBackdrop.addEventListener("click", () => {
        closeModal(providerModal);
    });
});
async function cargarClientes() {
  try {
    const res = await fetch("http://localhost:5219/clientes");
    if (!res.ok) throw new Error("Error al obtener clientes");
    const clientes = await res.json();

    // Ejemplo: llenar un select con los clientes
    const select = document.getElementById("client-select");
    select.innerHTML = "";

    clientes.forEach(cliente => {
      const option = document.createElement("option");
      option.value = cliente.docIdentidad;
      option.textContent = `${cliente.nomUsuario} (${cliente.docIdentidad})`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("❌ Error al cargar clientes:", err);
  }
}

async function registrarCliente() {
  const data = {
    docIdentidad: document.getElementById("cliente-doc").value,
    nomUsuario: document.getElementById("cliente-nombre").value,
    correo: document.getElementById("cliente-email").value,
    numTel: document.getElementById("cliente-telefono").value,
    contrasenia: document.getElementById("cliente-pass").value,
    codRol: document.getElementById("cliente-rol").value
    
  };

  try {
    const res = await fetch("http://localhost:5219/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("Error al registrar cliente");
    alert("✅ Cliente registrado correctamente.");
    cargarClientes(); // opcional
  } catch (err) {
    console.error("❌ Error:", err);
    alert("No se pudo registrar el cliente.");
  }
}
document.getElementById("btn-registrar-cliente").addEventListener("click", registrarCliente);

