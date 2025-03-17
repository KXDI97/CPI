document.addEventListener("DOMContentLoaded", function () {
    var swiper = new Swiper(".mySwiper-2", {
        slidersPerView: 1,
        spaceBetween: 30,
        loop: true,
        autoplay: {  // 🔹 Agrega esto para que se mueva automáticamente
            delay: 3000, // Tiempo en milisegundos entre cada movimiento
            disableOnInteraction: false,
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        breakpoints: {
            0: { slidersPerView: 1 },
            520: { slidersPerView: 2 },
            950: { slidersPerView: 3 }
        }
    });
});
