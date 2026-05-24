export function loadComponents() {
    // Cargar Header
    fetch('header.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('header-container').innerHTML = html;

            setTimeout(() => {
            setUserHeaderInfo();
            }, 0);

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

            // Show admin-only buttons based on role
            try {
                const userStr = localStorage.getItem('user');
                if (userStr && userStr !== 'undefined') {
                    const u = JSON.parse(userStr);
                    if ((u.role || getTokenRole()) === 'Admin') {
                        const adminBtn = document.getElementById('admin-users-btn');
                        if (adminBtn) adminBtn.style.display = '';
                    }
                }
            } catch { /* role check failed silently */ }

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

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/[\s_+.\-@]+/).filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function applyRoleBadge(el, role) {
    if (!el) return;
    el.textContent = role;
    el.className = el.className.replace(/\brole-\w+/g, '').trim();
    el.classList.add(`role-${role.toLowerCase()}`);
}

function setUserHeaderInfo() {
    const userString = localStorage.getItem("user");
    if (!userString || userString === "undefined") return;

    try {
        const user = JSON.parse(userString);
        const role = user.role || getTokenRole() || 'Viewer';
        const initials = getInitials(user.username);

        const headerName   = document.getElementById("header-username");
        const popupName    = document.getElementById("popup-name");
        const popupEmail   = document.getElementById("popup-email");
        const headerAvatar = document.getElementById("header-avatar");
        const popupAvatar  = document.getElementById("popup-avatar");
        const headerBadge  = document.getElementById("header-role-badge");
        const popupBadge   = document.getElementById("popup-role-badge");

        if (headerName)   headerName.textContent  = user.username;
        if (popupName)    popupName.textContent    = user.username;
        if (popupEmail)   popupEmail.textContent   = user.email;
        if (headerAvatar) headerAvatar.textContent = initials;
        if (popupAvatar)  popupAvatar.textContent  = initials;

        applyRoleBadge(headerBadge, role);
        applyRoleBadge(popupBadge,  role);
    } catch (err) {
        console.error("❌ Error al parsear usuario desde localStorage:", err);
    }
}

