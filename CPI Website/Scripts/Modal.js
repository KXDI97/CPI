document.addEventListener("DOMContentLoaded", () => {
    // Elementos del DOM
    const modalBackdrop = document.getElementById("modalBackdrop");

    const stockModal = document.getElementById("stockModal");
    const productModal = document.getElementById("productModal");

    const openStockBtn = document.getElementById("openStockModal");
    const openProductBtn = document.getElementById("openProductModal");

    const closeStockBtn = document.getElementById("closeStockModal");
    const closeProductBtn = document.getElementById("closeProductModal");

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
    openStockBtn.addEventListener("click", () => openModal(stockModal));
    openProductBtn.addEventListener("click", () => openModal(productModal));

    // Eventos para cerrar los modales
    closeStockBtn.addEventListener("click", () => closeModal(stockModal));
    closeProductBtn.addEventListener("click", () => closeModal(productModal));

    // Cerrar modal al hacer clic fuera de él
    modalBackdrop.addEventListener("click", () => {
        closeModal(stockModal);
        closeModal(productModal);
    })
});
