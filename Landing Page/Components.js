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
        .then(data => document.getElementById('sidebar-container').innerHTML = data)
        .catch(error => console.error('Error cargando Slider:', error));
}
