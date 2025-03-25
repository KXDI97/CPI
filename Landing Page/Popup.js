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
