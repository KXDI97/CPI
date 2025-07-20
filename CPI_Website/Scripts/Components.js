export function loadComponents() {
    // Cargar Header
    fetch('header.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('header-container').innerHTML = html;

            const popupScript = document.createElement('script');
            popupScript.src = '../scripts/Popup.js';
            document.body.appendChild(popupScript);
        })
        .catch(error => console.error('Error cargando Header:', error));

    // Cargar Sidebar
    fetch('Slider.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('sidebar-container').innerHTML = data;

            // Cargar scripts para modales globales
            const globalModalScript = document.createElement('script');
            globalModalScript.src = '../Scripts/GlobalModal.js';
            globalModalScript.onload = () => {
                createGlobalModals();

                // Redefinir funciones para desenfoque
                const originalShowLogoutModal = showLogoutModal;
                const originalCloseModal = closeModal;
                const originalShowHelpModal = showHelpModal;
                const originalCloseHelpModal = closeHelpModal;

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

            // Activar botón activo según URL
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

            // Toggle del drawer (una sola vez)
            setTimeout(() => {
                const hamburgerButton = document.querySelector('.hamburger');
                const sidebarDrawer = document.querySelector('.sidebar-drawer');
                const overlay = document.querySelector('.sidebar-overlay');

                if (hamburgerButton && sidebarDrawer && overlay) {
                    hamburgerButton.addEventListener('click', () => {
                        sidebarDrawer.classList.toggle('open');
                        overlay.classList.toggle('show');
                    });

                    overlay.addEventListener('click', () => {
                        sidebarDrawer.classList.remove('open');
                        overlay.classList.remove('show');
                    });
                }
            }, 50); // pequeño retraso para asegurar que el DOM ya lo cargó
        })
        .catch(error => console.error('Error cargando Slider:', error));
}
