document.addEventListener("DOMContentLoaded", function () {
   var swiper = new Swiper(".mySwiper-2", {
    slidesPerView: 1, // Ajusta el número de productos visibles al mismo tiempo
    spaceBetween: 20, // Espaciado entre productos
    loop: false, // Hace que el carrusel sea infinito
    loopFillGroupWithBlank:true, // 🔥 Esto evita el hueco
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
// Función para manejar la búsqueda de productos
function searchProducts() {
    const searchInput = document.querySelector('.search-bar_p input').value.toLowerCase();
    const resultsTitle = document.querySelector('h2');
    const products = document.querySelectorAll('.product');
    let foundCount = 0;

    // Actualizar el título de resultados
    resultsTitle.textContent = searchInput ? `Results: "${searchInput}"` : 'Results: " "';

    // Filtrar productos según el término de búsqueda
    products.forEach(product => {
        const productName = product.querySelector('h3').textContent.toLowerCase();
        const productCategory = product.querySelector('p').textContent.toLowerCase();
        const productContainer = product.closest('.swiper-slide');

        if (productName.includes(searchInput) || productCategory.includes(searchInput)) {
            productContainer.style.display = 'block';
            foundCount++;
        } else {
            productContainer.style.display = 'none';
        }
    });

    // Actualizar el mensaje si no se encuentran resultados
    if (foundCount === 0 && searchInput !== '') {
        resultsTitle.textContent = `No results found for: "${searchInput}"`;
    }

    // Reiniciar el slider después de la búsqueda
    if (window.swiper) {
        window.swiper.update();
    }
}

// Evento para la tecla Enter en el campo de búsqueda
document.querySelector('.search-bar_p input').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        searchProducts();
    }
});

// Evento para el ícono de búsqueda
document.querySelector('.search-bar_p ion-icon').addEventListener('click', searchProducts);

// Función para aplicar los filtros seleccionados
function applyFilters() {
    const sortValue = document.getElementById('sortButton').textContent.trim().replace(' ⌄', '');
    const categoryValue = document.getElementById('categoryButton').textContent.trim().replace(' ⌄', '');
    const dateValue = document.getElementById('dateButton').textContent.trim().replace(' ⌄', '');
    const amountValue = document.getElementById('amountButton').textContent.trim().replace(' ⌄', '');
    const providerValue = document.getElementById('providerButton').textContent.trim().replace(' ⌄', '');
    
    const searchInput = document.querySelector('.search-bar_p input').value.toLowerCase();
    const products = document.querySelectorAll('.product');
    const slides = document.querySelectorAll('.swiper-slide');
    let filteredProducts = [];

    // Primero aplicamos los filtros de búsqueda
    products.forEach((product, index) => {
        const productName = product.querySelector('h3').textContent.toLowerCase();
        const productCategory = product.querySelector('p').textContent.toLowerCase();
        const productPrice = parseFloat(product.querySelector('.precio').textContent.replace('$', ''));
        const productDate = product.querySelectorAll('p')[1].textContent;
        
        let matchesSearch = true;
        let matchesCategory = true;
        let matchesAmount = true;
        let matchesDate = true;
        let matchesProvider = true;

        // Filtro de búsqueda
        if (searchInput && !(productName.includes(searchInput) || productCategory.includes(searchInput))) {
            matchesSearch = false;
        }

        // Filtro de categoría
        if (categoryValue !== 'Category' && !productCategory.toLowerCase().includes(categoryValue.toLowerCase())) {
            matchesCategory = false;
        }

        // Filtro de precio
        if (amountValue === 'Low to High' || amountValue === 'High to Low') {
            // Solo marcamos que coincide, ordenaremos después
            matchesAmount = true;
        }

        // Filtro de fecha
        if (dateValue === 'Newest' || dateValue === 'Oldest') {
            // Solo marcamos que coincide, ordenaremos después
            matchesDate = true;
        }

        // Si coincide con todos los filtros, lo añadimos
        if (matchesSearch && matchesCategory && matchesAmount && matchesDate && matchesProvider) {
            filteredProducts.push({
                element: slides[index],
                price: productPrice,
                date: new Date(productDate.replace('Date: ', '')).getTime()
            });
        } else {
            slides[index].style.display = 'none';
        }
    });

    // Aplicar ordenamiento
    if (sortValue === 'Ascending') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortValue === 'Descending') {
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    if (amountValue === 'Low to High') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (amountValue === 'High to Low') {
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    if (dateValue === 'Newest') {
        filteredProducts.sort((a, b) => b.date - a.date);
    } else if (dateValue === 'Oldest') {
        filteredProducts.sort((a, b) => a.date - b.date);
    }

    // Actualizar el título de resultados
    const resultsTitle = document.querySelector('h2');
    if (searchInput) {
        resultsTitle.textContent = `Results: "${searchInput}"`;
    } else if (filteredProducts.length === 0) {
        resultsTitle.textContent = 'No results found';
    } else {
        resultsTitle.textContent = `Results: ${filteredProducts.length} products found`;
    }

    // Reordenar elementos según los filtros
    const swiperWrapper = document.querySelector('.swiper-wrapper');
    
    // Mostrar los productos filtrados
    filteredProducts.forEach(product => {
        product.element.style.display = 'block';
        swiperWrapper.appendChild(product.element);
    });

    // Reiniciar el slider después de aplicar filtros
    if (window.swiper) {
        window.swiper.update();
    }

    // Cerrar el modal después de aplicar filtros
    closeModal();
}

// Modificar la función closeModal para aplicar filtros al cerrar
function closeModal() {
    const modal = document.getElementById("modal");
    modal.style.display = "none";
    applyFilters(); // Aplicar filtros al cerrar el modal
}

// Agregar un botón de aplicar filtros al modal
document.addEventListener('DOMContentLoaded', function() {
    const modalContent = document.querySelector('.modal-content_p');
    const filtersContainer = document.querySelector('.filters-container');
    
    // Crear y añadir el botón de aplicar
    const applyButton = document.createElement('button');
    applyButton.textContent = 'Apply Filters';
    applyButton.className = 'btn-apply-filters';
    applyButton.style.marginTop = '15px';
    applyButton.style.padding = '8px 15px';
    applyButton.style.backgroundColor = '#9069F9';
    applyButton.style.color = 'white';
    applyButton.style.border = 'none';
    applyButton.style.borderRadius = '4px';
    applyButton.style.cursor = 'pointer';
    
    applyButton.addEventListener('click', function() {
        applyFilters();
    });
    
    filtersContainer.appendChild(applyButton);

    // Inicializar Swiper
    window.swiper = new Swiper(".mySwiper-2", {
        slidesPerView: 1,
        spaceBetween: 10,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        breakpoints: {
            640: {
                slidesPerView: 2,
                spaceBetween: 10,
            },
            768: {
                slidesPerView: 3,
                spaceBetween: 15,
            },
            1024: {
                slidesPerView: 4,
                spaceBetween: 15,
            },
        },
    });
});
