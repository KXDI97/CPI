
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
