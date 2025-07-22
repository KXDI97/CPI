document.addEventListener("DOMContentLoaded", function () {
    const addProductBtn = document.querySelector('.modal-add-product .btn-1');

    addProductBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const product = {
            productId: document.getElementById("product-id").value.trim(),
            name: document.getElementById("product-name").value.trim(),
            value: parseFloat(document.getElementById("value").value),
            category: document.getElementById("category").value.trim(),
            description: document.getElementById("description").value.trim(),
            stock: 0 // Lo puedes reemplazar si agregas campo de cantidad
        };

        try {
            const response = await fetch("http://localhost:5219/api/products", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(product)
            });

            if (response.ok) {
                alert("✅ Producto agregado exitosamente");
                // Opcional: cerrar modal y limpiar campos
                document.getElementById("product-id").value = "";
                document.getElementById("product-name").value = "";
                document.getElementById("value").value = "";
                document.getElementById("category").value = "";
                document.getElementById("description").value = "";
                document.getElementById("productModal").classList.add("hidden");
            } else {
                const errorData = await response.json();
                alert("❌ Error al guardar producto: " + (errorData.message || "Error interno"));
            }
        } catch (err) {
            console.error("Error:", err);
            alert("❌ Error de red al intentar conectar con el backend.");
        }
    });
});
