export function loadComponents() {
    fetch('header.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('header-container').innerHTML = html;
            const popupScript = document.createElement('script');
            popupScript.src = '../scripts/Popup.js';
            document.body.appendChild(popupScript);
        })
        .catch(error => console.error('Error cargando Header:', error));

    

// Header Loading Script

fetch('Slider.html')
.then(response => response.text())
.then(data => {
    document.getElementById('sidebar-container').innerHTML = data;

    const globalModalScript = document.createElement('script');
    globalModalScript.src = '../Scripts/GlobalModal.js';
    globalModalScript.onload = () => {
        // Crear modales
        createGlobalModals();

        // Guardar funciones originales antes de sobreescribir
        const originalShowLogoutModal = showLogoutModal;
        const originalCloseModal = closeModal;
        const originalShowHelpModal = showHelpModal;
        const originalCloseHelpModal = closeHelpModal;

        // Redefinir funciones para aplicar desenfoque al fondo
        showLogoutModal = function () {
            originalShowLogoutModal();
            const content = document.getElementById('main-content');
            if (content) content.classList.add('blurred');
        };

        closeModal = function () {
            originalCloseModal();
            const content = document.getElementById('main-content');
            if (content) content.classList.remove('blurred');
        };

        showHelpModal = function () {
            originalShowHelpModal();
            const content = document.getElementById('main-content');
            if (content) content.classList.add('blurred');
        };

        closeHelpModal = function () {
            originalCloseHelpModal();
            const content = document.getElementById('main-content');
            if (content) content.classList.remove('blurred');
        };
    };

    document.body.appendChild(globalModalScript);

    // Activar botón de navegación según la página actual
    const buttons = document.querySelectorAll('.sidebar button');
    const currentPage = window.location.pathname.split('/').pop().toLowerCase();

    buttons.forEach(button => {
        const onclickValue = button.getAttribute('onclick');
        if (onclickValue) {
            const page = onclickValue.match(/'([^']+)'/);
            if (page && currentPage === page[1].toLowerCase()) {
                button.classList.add('active');
            }
        }
    });
    const waitForHamburger = () => {
                const hamburgerButton = document.querySelector('.hamburger');
                const sidebar = document.querySelector('.sidebar');

                if (hamburgerButton && sidebar) {
                    hamburgerButton.addEventListener('click', () => {
                        sidebar.classList.toggle('collapsed');
                    });
                } else {
                    setTimeout(waitForHamburger, 100);
                }
            };

        waitForHamburger();
})
.catch(error => console.error('Error cargando Slider:', error));
}