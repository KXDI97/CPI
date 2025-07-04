export function setupHamburgerToggle() {
    const waitForElements = () => {
        const hamburgerButton = document.querySelector('.hamburger');
        const sidebar = document.querySelector('.sidebar');

        if (hamburgerButton && sidebar) {
            hamburgerButton.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        } else {
            // Esperar hasta que el header y sidebar estén completamente cargados
            setTimeout(waitForElements, 100);
        }
    };

    waitForElements();
}
