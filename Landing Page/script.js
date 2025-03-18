document.addEventListener("DOMContentLoaded", function () {
var swiper = new Swiper(".mySwiper-2", {
    slidesPerView: 3, // Ajusta el número de productos visibles al mismo tiempo
    spaceBetween: 20, // Espaciado entre productos
    loop: true, // Hace que el carrusel sea infinito
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    breakpoints: {
        320: { slidesPerView: 1 }, // Móvil
        768: { slidesPerView: 2 }, // Tablet
        1024: { slidesPerView: 4 } // Escritorio
    }
});
});

