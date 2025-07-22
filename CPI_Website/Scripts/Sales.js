document.addEventListener("DOMContentLoaded", () => {
    const btnNuevaVenta = document.getElementById("btnNuevaVenta");
    const formVenta = document.getElementById("form-venta");

    btnNuevaVenta.addEventListener("click", () => {
        formVenta.classList.toggle("hidden");
    });
});
