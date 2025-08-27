let allProducts = [];

document.addEventListener("DOMContentLoaded", () => {
    setupStockModal();
});

function setupStockModal() {
    const productNameInput = document.getElementById("product-name-stock");
    const productIdInput = document.getElementById("product-id-stock");
    const categoryInput = document.getElementById("category-stock");
    const providerInput = document.getElementById("provider-stock");
    const datalist = document.getElementById("product-list");

    // 1. Cargar productos y llenar datalist
    fetch("http://localhost:5219/api/products")
        .then(res => res.json())
        .then(data => {
            allProducts = data;
            datalist.innerHTML = "";

            data.forEach(p => {
                const option = document.createElement("option");
                option.value = p.name;
                datalist.appendChild(option);
            });
        });

    // 2. Autocompletar campos al seleccionar nombre
    productNameInput.addEventListener("change", () => {
        const selected = allProducts.find(p => p.name.toLowerCase() === productNameInput.value.toLowerCase());

        if (selected) {
            productIdInput.value = selected.productId;
            categoryInput.value = selected.category;
            providerInput.value = selected.provider || "";
        } else {
            productIdInput.value = "";
            categoryInput.value = "";
            providerInput.value = "";
        }
    });
}
