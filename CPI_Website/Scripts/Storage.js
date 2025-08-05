document.addEventListener("DOMContentLoaded", function () {
    // Cargar productos al iniciar
    loadProducts();
    setupAddStockButton();
    // Acción al hacer clic en "Add Product"
    const addProductBtn = document.querySelector('.modal-add-product .btn-1');

    addProductBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const product = {
            productId: document.getElementById("product-id").value.trim(),
            name: document.getElementById("product-name").value.trim(),
            value: parseFloat(document.getElementById("value").value),
            category: document.getElementById("category").value.trim(),
            description: document.getElementById("description").value.trim(),
            stock: 0
        };

        // Validación básica
        if (!product.productId || !product.name || isNaN(product.value) || !product.category || !product.description) {
            alert("⚠️ Por favor completa todos los campos requeridos.");
            return;
        }

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

                // Limpiar formulario y cerrar modal
                document.getElementById("product-id").value = "";
                document.getElementById("product-name").value = "";
                document.getElementById("value").value = "";
                document.getElementById("category").value = "";
                document.getElementById("description").value = "";
                document.getElementById("productModal").classList.add("hidden");

                // Recargar tabla
                loadProducts();
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

async function loadProducts() {
    const tableBody = document.querySelector(".table-container tbody");
    tableBody.innerHTML = ""; // Limpiar contenido previo

    try {
        const response = await fetch("http://localhost:5219/api/products");

        if (!response.ok) {
            throw new Error("Error al cargar productos");
        }

        const products = await response.json();

        if (products.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='8'>No hay productos registrados.</td></tr>";
            return;
        }

        products.forEach(product => {
            const row = document.createElement("tr");

            row.innerHTML = `
        <td><ion-icon name="cube-outline"></ion-icon> ${product.name}</td>     <!-- Description -->
        <td>${product.category}</td>                                           <!-- Category -->
        <td>${product.stock}</td>                                              <!-- Quantity -->
        <td>${product.pending || "N/A"}</td>                                   <!-- Pending -->
        <td>$${product.value.toLocaleString()}</td>                            <!-- Amount -->
        <td>
            <ion-icon name="pencil-outline" class="icon edit"></ion-icon>
            <ion-icon name="trash-outline" class="icon delete"></ion-icon>
        </td>                                                                   <!-- Actions -->
`;


            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("❌ Error cargando productos:", error);
        tableBody.innerHTML = "<tr><td colspan='8'>Error al cargar productos.</td></tr>";
    }
}

function formatDate(dateStr) {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
    });
}

// Conexión del botón "Add Stock" al backend
function setupAddStockButton() {
    const addStockBtn = document.querySelector('.modal-add-stock .btn-1');

    addStockBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const productId = document.getElementById("product-id").value.trim();
        const quantity = parseInt(document.getElementById("quantity-stock").value);

        if (!productId || isNaN(quantity) || quantity <= 0) {
            alert("⚠️ Ingresa un producto válido y una cantidad mayor a cero.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:5219/api/products/${productId}/add-stock`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quantity })
            });

            if (response.ok) {
                alert("✅ Stock actualizado correctamente.");
                document.getElementById("product-name-stock").value = "";
                document.getElementById("product-id").value = "";
                document.getElementById("category-stock").value = "";
                document.getElementById("provider-stock").value = "";
                document.getElementById("quantity-stock").value = "";
                document.getElementById("stockModal").classList.add("hidden");
                loadProducts();
            } else {
                const error = await response.json();
                alert("❌ Error al actualizar stock: " + (error.message || "Error interno"));
            }
        } catch (err) {
            console.error(err);
            alert("❌ Error de red. No se pudo conectar con el servidor.");
        }
    });
}
