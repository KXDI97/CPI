export function loadComponents() {
    fetch('header.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('header-container').innerHTML = html;
            const popupScript = document.createElement('script');
            popupScript.src = './popup.js';
            document.body.appendChild(popupScript);
        })
        .catch(error => console.error('Error cargando Header:', error));

    

// Header Loading Script

fetch('Slider.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('sidebar-container').innerHTML = data;

        const globalModalScript = document.createElement('script');
        globalModalScript.src = './GlobalModal.js';
        globalModalScript.onload = () => {
            createGlobalModals();

            // Modificamos las funciones para agregar blur al contenido principal
            const originalShowLogoutModal = showLogoutModal;
            showLogoutModal = function() {
                originalShowLogoutModal();
                document.getElementById('main-content').classList.add('blurred');
            };

            const originalCloseModal = closeModal;
            closeModal = function() {
                originalCloseModal();
                document.getElementById('main-content').classList.remove('blurred');
            };

            const originalShowHelpModal = showHelpModal;
            showHelpModal = function() {
                originalShowHelpModal();
                document.getElementById('main-content').classList.add('blurred');
            };

            const originalCloseHelpModal = closeHelpModal;
            closeHelpModal = function() {
                originalCloseHelpModal();
                document.getElementById('main-content').classList.remove('blurred');
            };
        };
        document.body.appendChild(globalModalScript);

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
    })
    .catch(error => console.error('Error cargando Slider:', error));
}
