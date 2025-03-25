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

    fetch('slider.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('sidebar-container').innerHTML = data;

            // Aquí ya existe el sidebar, entonces ahora sí:
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
