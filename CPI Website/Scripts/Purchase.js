const carousel = document.getElementById("product-carousel");
const modal = document.getElementById("purchase-modal");
const form = document.getElementById("purchase-form");

// Inputs
const orderNumberInput = document.getElementById("order-number");
const clientDocumentInput = document.getElementById("client-document");
const purchaseDateInput = document.getElementById("purchase-date");
const quantityInput = document.getElementById("quantity");
const paymentMethodInput = document.getElementById("payment-method");
const productIdInput = document.getElementById("product-id");

// 🔧 Variables globales
let carrito = [];
let productosDisponibles = [];
let swiperInstance; // ⬅️ Swiper global

// ✅ Cargar productos y generar tarjetas
async function cargarProductos(filtro = "") {
    try {
        const res = await fetch("http://localhost:5219/productos");
        productosDisponibles = await res.json();

        const contenedor = document.getElementById("product-carousel");
        contenedor.innerHTML = "";

        const productosFiltrados = productosDisponibles.filter(prod =>
            prod.nom_Prod.toLowerCase().includes(filtro.toLowerCase())
        );

        productosFiltrados.forEach(prod => {
            const card = document.createElement("div");
            card.classList.add("swiper-slide", "card");
            card.innerHTML = `
                <h3>${prod.nom_Prod}</h3>
                <div class="imagen"></div>
                <p class="product-date"> Date: ${new Date(prod.fecha).toLocaleDateString()}</p>
                <p class="product-price"> Price: $${prod.valor}</p>
                <div class="product-quantity">
                    <label for="qty-${prod.cod_Prod}"> Quantity:</label>
                    <input type="number" id="qty-${prod.cod_Prod}" value="1" min="1">
                </div>
                <button class="btn-add" onclick="agregarAlCarrito('${prod.cod_Prod}')">Add</button>
            `;
            contenedor.appendChild(card);
        });

        // 🧽 Destruir instancia anterior si existe
        if (swiperInstance) {
            swiperInstance.destroy(true, true);
        }
        // 🚀 Crear nueva instancia
        swiperInstance = new Swiper(".mySwiper", {
            slidesPerView: 3,
            spaceBetween: 20,
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev"
            },
            breakpoints: {
                0: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 }
            }
        });

    } catch (err) {
        console.error("Error al cargar productos:", err);
        const contenedor = document.getElementById("product-carousel");
        if (contenedor) {
            contenedor.innerHTML = "<p>Error al cargar los productos. Por favor, intente de nuevo más tarde.</p>";
        }
    }
}


// ✅ Agregar al carrito
function agregarAlCarrito(codProd) {
    const producto = productosDisponibles.find(p => p.cod_Prod === codProd);
    const cantidadInput = document.getElementById(`qty-${codProd}`);
    const cantidad = parseInt(cantidadInput.value);

    if (!producto || cantidad <= 0) return;

    const existente = carrito.find(item => item.codProd === codProd);

    if (existente) {
        existente.cantidad += cantidad;
    } else {
        carrito.push({
            codProd: producto.cod_Prod,
            nombre: producto.nom_Prod,
            precio: producto.valor,
            cantidad: cantidad
        });
    }
    actualizarTablaCarrito();
}

// ✅ Eliminar producto del carrito
function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarTablaCarrito();
}

// ✅ Editar cantidad desde la tabla
function editarCantidad(index, nuevaCantidad) {
    if (nuevaCantidad < 1) return;
    carrito[index].cantidad = parseInt(nuevaCantidad);
    actualizarTablaCarrito();
}

// ✅ Actualizar tabla carrito
function actualizarTablaCarrito() {
    const tabla = document.getElementById("tabla-carrito");
    const totalCarritoSpan = document.getElementById("total-carrito");
    if (!tabla || !totalCarritoSpan) {
        console.error("No se encontró la tabla o el span del total del carrito.");
        return;
    }

    tabla.innerHTML = "";
    let totalCarrito = 0;

    carrito.forEach((item, index) => {
        const iva = item.precio * item.cantidad * 0.19;
        const subtotal = item.precio * item.cantidad;
        const costos = 130;
        const total = subtotal + iva + costos;
        totalCarrito += total;

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${item.codProd}</td>
            <td>${item.nombre}</td>
            <td><input type="number" min="1" value="${item.cantidad}" onchange="editarCantidad(${index}, this.value)" style="width:60px"></td>
            <td>$${item.precio.toFixed(2)}</td>
            <td>$${iva.toFixed(2)}</td>
            <td>$${costos.toFixed(2)}</td>
            <td><strong>$${total.toFixed(2)}</strong></td>
            <td><button onclick="eliminarDelCarrito(${index})">🗑️</button></td>
        `;
        tabla.appendChild(fila);
    });

    totalCarritoSpan.textContent = totalCarrito.toFixed(2);
}

// ✅ Generar número de orden desde backend
async function generarNumeroOrden() {
    try {
        const res = await fetch("http://localhost:5219/compras/ultimo");
        if (!res.ok) {
            console.warn("No se pudo obtener el último número de orden del backend. Usando valor por defecto.");
            return "ORD-001";
        }
        return await res.text();
    } catch (err) {
        console.error("Error al generar número de orden:", err);
        return "ORD-001";
    }
}

// ✅ Procesar compra completa
async function procesarCompra() {
    if (carrito.length === 0) {
        return alert("⚠️ El carrito está vacío.");
    }

    const orden = await generarNumeroOrden();
    const documento = document.getElementById("client-document").value;
    const fecha = document.getElementById("purchase-date").value;
    const metodo = document.getElementById("payment-method").value;

    if (!documento || !fecha || !metodo) {
        return alert("❌ Por favor, completa todos los campos.");
    }
    cerrarModalCompra();

    try {
        // 👉 1. Registrar cada producto como una COMPRA
        for (let item of carrito) {
            const response = await fetch("http://localhost:5219/compras", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    No_Orden: orden,
                    Doc_Identidad: documento,
                    Fecha_Compra: fecha,
                    Cod_Prod: item.codProd,
                    Ref_Prod: orden,
                    Cantidad: item.cantidad,
                    Valor_Prod: item.precio,
                    TRM: 4000
                })
            });
            if (!response.ok) throw new Error(`Error en compras: ${response.status}`);
        }

        // 👉 2. Registrar una sola entrada de COSTOS LÓGICOS
        const responseCostos = await fetch("http://localhost:5219/costos-logicos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                No_Orden: orden,
                Transporte_Internacional: 50,
                Transporte_Local: 30,
                Nacionalizacion: 20,
                Seguro_Carga: 10,
                Tasa_Arancelaria: 15,
                Otros: 5
            })
        });
        if (!responseCostos.ok) throw new Error(`Error en costos lógicos: ${responseCostos.status}`);


        // 👉 3. Calcular totales generales para la FACTURA
        const subtotal = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
        const iva = subtotal * 0.19;
        const total = subtotal + iva + 130;
        const facturaNum = "F-" + Date.now().toString().slice(-6);

        const responseFacturas = await fetch("http://localhost:5219/facturas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                Num_Factura: facturaNum,
                No_Orden: orden,
                Cod_Prod: carrito[0].codProd,
                SubTotal: subtotal,
                IVA: iva,
                Doc_Identidad: documento,
                TRM: 4000,
                Total: total
            })
        });
        if (!responseFacturas.ok) throw new Error(`Error en facturas: ${responseFacturas.status}`);

        // 👉 4. Registrar una sola TRANSACCIÓN
        const responseTransacciones = await fetch("http://localhost:5219/transacciones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                Num_Transaccion: "T-" + Date.now().toString().slice(-6),
                No_Orden: orden,
                Num_Factura: facturaNum,
                Recordatorio: "Pagar antes de 15 días",
                Estado_Transac: "Pendiente",
                Fechas_Pago: "2025-07-15"
            })
        });
        if (!responseTransacciones.ok) throw new Error(`Error en transacciones: ${responseTransacciones.status}`);

        mostrarFactura(orden, documento, fecha);
        alert("✅ Compra registrada exitosamente.");

    } catch (error) {
        console.error("❌ Error al procesar la compra:", error);
        alert(`❌ Error al procesar la compra: ${error.message}. Revisa la consola para más detalles.`);
    } finally {
        carrito = [];
        actualizarTablaCarrito();
        document.getElementById("client-document").value = "";
        document.getElementById("purchase-date").value = "";
        document.getElementById("payment-method").value = "";
    }
}


// ✅ Abrir modal de compra
function abrirModalCompra() {
    const modal = document.getElementById("modal-registro");
    const total = document.getElementById("total-carrito").textContent;
    document.getElementById("total-final-modal").textContent = total;
    if (modal) {
        modal.style.display = "block";
    }
}

// ❌ Cerrar modal de compra
function cerrarModalCompra() {
    const modal = document.getElementById("modal-registro");
    if (modal) {
        modal.style.display = "none";
    }
}

document.getElementById("form-compra").addEventListener("submit", async (e) => {
    e.preventDefault();
    await procesarCompra();
});


function mostrarFactura(noOrden, docIdentidad, fechaCompra) {
    const modal = document.getElementById("factura-modal");
    const tabla = document.getElementById("factura-productos");
    const facturaTotalSpan = document.getElementById("factura-total");

    if (!modal || !tabla || !facturaTotalSpan) {
        console.error("⛔ Modal, tabla o span de total de factura no encontrados");
        return;
    }

    let totalFinal = 0;

    document.getElementById("factura-orden").textContent = noOrden;
    document.getElementById("factura-cliente").textContent = docIdentidad;
    document.getElementById("factura-fecha").textContent = fechaCompra;
    tabla.innerHTML = "";

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        const iva = subtotal * 0.19;
        const costosFijos = 130;
        const total = subtotal + iva + costosFijos;
        totalFinal += total;

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${item.nombre}</td>
            <td>${item.cantidad}</td>
            <td>$${item.precio.toFixed(2)}</td>
            <td>$${iva.toFixed(2)}</td>
            <td>$${total.toFixed(2)}</td>
        `;
        tabla.appendChild(fila);
    });

    facturaTotalSpan.textContent = totalFinal.toFixed(2);
    modal.style.display = "flex";
}

function cerrarFactura() {
    const modal = document.getElementById("factura-modal");
    if (modal) {
        modal.style.display = "none";
    }
}

// 🔁 Mostrar u ocultar el carrito como modal
function abrirCarrito() {
    const modal = document.getElementById("carrito-modal");
    if (modal) {
        modal.style.display = "flex";
    }
}

function cerrarCarrito() {
    const modal = document.getElementById("carrito-modal");
    if (modal) {
        modal.style.display = "none";
    }
}

function buscarProducto() {
    const valor = document.getElementById("search-input").value;
    cargarProductos(valor);
}

// 🟢 Un solo listener DOMContentLoaded para todas las inicializaciones
document.addEventListener("DOMContentLoaded", async () => {
    // Inicializar Swiper por primera vez aquí, antes de cargar los productos
    swiperInstance = new Swiper(".mySwiper", {
        slidesPerView: 3,
        spaceBetween: 20,
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev"
        },
        breakpoints: {
            0: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 }
        }
    });

    await cargarProductos(); // Carga inicial de productos

    // Inicializar fecha de compra y número de orden
    if (purchaseDateInput) {
        purchaseDateInput.value = new Date().toISOString().split("T")[0];
    }
    if (orderNumberInput) {
        generarNumeroOrden().then(n => {
            orderNumberInput.value = n;
        });
    }

    // Event listener para el input de búsqueda
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("keyup", (e) => {
            if (e.key === "Enter") {
                buscarProducto();
            }
        });
    }

    // Event listener para el botón de cancelar del modal de compra
    const btnCancelar = document.getElementById("btn-cancelar");
    if (btnCancelar) {
        btnCancelar.addEventListener("click", cerrarModalCompra);
    }

    // Mostrar/Ocultar el panel de filtros
    const filterBtn = document.querySelector(".filter-btn");
    if (filterBtn) {
        filterBtn.addEventListener("click", () => {
            const panel = document.getElementById("filtro-panel");
            if (panel) {
                panel.style.display = panel.style.display === "none" ? "flex" : "none";
            }
        });
    }
});

// Aplicar filtros
function aplicarFiltros() {
    const categoria = document.getElementById("filtro-categoria").value.toLowerCase();
    const precioMax = parseFloat(document.getElementById("filtro-precio").value);
    const fechaInicio = document.getElementById("filtro-fecha-inicio").value;
    const fechaFin = document.getElementById("filtro-fecha-fin").value;

    const filtrados = productosDisponibles.filter(prod => {
        const fechaProd = new Date(prod.fecha);
        const cumpleCategoria = !categoria || prod.nom_Prod.toLowerCase().includes(categoria);
        const cumplePrecio = !precioMax || prod.valor <= precioMax;
        const cumpleFecha =
            (!fechaInicio || fechaProd >= new Date(fechaInicio)) &&
            (!fechaFin || fechaProd <= new Date(fechaFin));

        return cumpleCategoria && cumplePrecio && cumpleFecha;
    });

    const contenedor = document.getElementById("product-carousel");
    if (contenedor) {
        contenedor.innerHTML = "";
        filtrados.forEach(prod => {
            const card = document.createElement("div");
            card.classList.add("swiper-slide", "card");
            card.innerHTML = `
                <h3>${prod.nom_Prod}</h3>
                <div class="imagen"></div>
                <p class="product-date"> Date: ${new Date(prod.fecha).toLocaleDateString()}</p>
                <p class="product-price"> Price: $${prod.valor}</p>
                <div class="product-quantity">
                    <label for="qty-${prod.cod_Prod}"> Quantity:</label>
                    <input type="number" id="qty-${prod.cod_Prod}" value="1" min="1">
                </div>
                <button class="btn-add" onclick="agregarAlCarrito('${prod.cod_Prod}')">Add</button>
            `;
            contenedor.appendChild(card);
        });

        if (swiperInstance) {
            swiperInstance.destroy(true, true);
        }
        swiperInstance = new Swiper(".mySwiper", {
            slidesPerView: 3,
            spaceBetween: 20,
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev"
            },
            breakpoints: {
                0: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 }
            }
        });
    }
}
async function cargarClientes() {
  try {
    const res = await fetch("http://localhost:5219/clientes");
    if (!res.ok) throw new Error("Error al obtener clientes");
    const clientes = await res.json();

    // Ejemplo: llenar un select con los clientes
    const select = document.getElementById("client-select");
    select.innerHTML = "";

    clientes.forEach(cliente => {
      const option = document.createElement("option");
      option.value = cliente.docIdentidad;
      option.textContent = `${cliente.nomUsuario} (${cliente.docIdentidad})`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("❌ Error al cargar clientes:", err);
  }
}
