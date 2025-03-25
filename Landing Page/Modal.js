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
    });
});

/*popup*/

function togglePopup(id) {
    document.querySelectorAll('.popup').forEach(popup => {
        if (popup.id !== id) {
            popup.classList.remove('show');
        }
    });

    const popup = document.getElementById(id);
    popup.classList.toggle('show');
}

// Manejar botón de perfil
document.querySelector('.profile-button').addEventListener('click', (e) => {
    e.stopPropagation();
    togglePopup('profile-popup');
});

// Manejar botón de notificaciones
document.querySelector('.notification-button').addEventListener('click', (e) => {
    e.stopPropagation();
    togglePopup('notification-popup');
});

// Cerrar popups al hacer clic afuera
window.addEventListener('click', (e) => {
    if (!e.target.closest('.popup') && !e.target.closest('.profile-button') && !e.target.closest('.notification-button')) {
        document.querySelectorAll('.popup').forEach(popup => popup.classList.remove('show'));
    }
});

function updateNotificationCount(count) {
    const counter = document.getElementById('notification-counter');
    if (count > 0) {
        counter.textContent = count;
        counter.style.display = 'flex';
    } else {
        counter.style.display = 'none';
    }
}

// Ejemplo de prueba:
let cantidadNotificaciones = 3; // Este número lo puedes actualizar dinámicamente según tu sistema
updateNotificationCount(cantidadNotificaciones);
