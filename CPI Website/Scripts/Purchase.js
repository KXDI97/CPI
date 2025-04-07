const track = document.querySelector('.carousel-track');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');
const cardWidth = 236; // card width + margin
let currentIndex = 0;
const totalCards = track.children.length;

// Clonar los elementos para crear un efecto infinito
function setupInfiniteCarousel() {
    // Clonar los primeros y últimos elementos
    const firstCard = track.children[0];
    const lastCard = track.children[totalCards - 1];

    // Clonar y agregar al principio y al final
    const firstClone = firstCard.cloneNode(true);
    const lastClone = lastCard.cloneNode(true);

    track.insertBefore(lastClone, firstCard);
    track.appendChild(firstClone);

    // Ajustar el índice inicial para comenzar después del clon del último elemento
    currentIndex = 1;
    track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
}

// Inicializar el carrusel infinito
setupInfiniteCarousel();

nextBtn.addEventListener('click', () => {
    if (currentIndex < totalCards + 1) {
        currentIndex++;
        track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;

        // Transición suave al final
        if (currentIndex === totalCards + 1) {
            setTimeout(() => {
                track.style.transition = 'none';
                currentIndex = 1;
                track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;

                // Restaurar la transición
                setTimeout(() => {
                    track.style.transition = 'transform 0.3s ease';
                }, 50);
            }, 300);
        }
    }
});

prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;

        // Transición suave al principio
        if (currentIndex === 0) {
            setTimeout(() => {
                track.style.transition = 'none';
                currentIndex = totalCards;
                track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;

                // Restaurar la transición
                setTimeout(() => {
                    track.style.transition = 'transform 0.3s ease';
                }, 50);
            }, 300);
        }
    }
});

// Search functionality
const searchInput = document.querySelector('.search-input');
const purchaseCards = document.querySelectorAll('.purchase-card');

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();

    purchaseCards.forEach(card => {
        const cardText = card.textContent.toLowerCase();
        card.style.display = cardText.includes(searchTerm) ? 'flex' : 'none';
    });
});
document.addEventListener('DOMContentLoaded', function () {
    // Código de carrusel anterior...

    // Filtros
    var filterBtn = document.querySelector('.filter-btn');
    var filterDropdown = document.querySelector('.filter-dropdown');
    var filterOptions = document.querySelectorAll('.filter-option');
    var applyFiltersBtn = document.querySelector('.apply-filters');

    // Toggle dropdown
    filterBtn.addEventListener('click', function () {
        filterDropdown.classList.toggle('active');
    });

    // Select/deselect filter options
    filterOptions.forEach(function (option) {
        option.addEventListener('click', function () {
            this.classList.toggle('selected');
        });
    });

    // Apply filters
    applyFiltersBtn.addEventListener('click', function () {
        var selectedCategories = Array.from(document.querySelectorAll('.category-filters .selected'))
            .map(el => el.dataset.filter);
        var selectedDates = Array.from(document.querySelectorAll('.date-filters .selected'))
            .map(el => el.dataset.filter);
        var selectedPrices = Array.from(document.querySelectorAll('.price-filters .selected'))
            .map(el => el.dataset.filter);

        // Aplicar filtros a las tarjetas
        var purchaseCards = document.querySelectorAll('.purchase-card');
        purchaseCards.forEach(function (card) {
            var cardCategory = card.querySelector('.card-details').textContent.toLowerCase();
            var cardPrice = parseFloat(card.querySelector('.card-price').textContent.replace('$', ''));

            var categoryMatch = selectedCategories.length === 0 ||
                selectedCategories.some(cat => cardCategory.includes(cat));

            // Aquí podrías agregar más lógica de filtrado

            card.style.display = categoryMatch ? 'flex' : 'none';
        });

        // Cerrar dropdown
        filterDropdown.classList.remove('active');
    });

    // Cerrar dropdown si se hace clic fuera
    document.addEventListener('click', function (event) {
        if (!filterBtn.contains(event.target) && !filterDropdown.contains(event.target)) {
            filterDropdown.classList.remove('active');
        }
    });
});
document.addEventListener("DOMContentLoaded", function () {
    // Mostrar/Ocultar Número de Cuenta
    const accountNumber = document.querySelector(".account-number p");
    const showAccountLink = document.querySelector(".account-number a");
    let isHidden = true;

    showAccountLink.addEventListener("click", function (event) {
        event.preventDefault();
        isHidden = !isHidden;
        accountNumber.innerHTML = `Account Number: ${isHidden ? "******3017" : "1234-5678-3017"} <a href="#">${isHidden ? "Show" : "Hide"}</a>`;
    });

    // Actualización de Saldos
    let availableBalance = 5000;  // Saldo disponible inicial
    let currentBalance = 5200;    // Saldo actual inicial
    let interestYTD = 50;         // Intereses generados
    let apy = 1.5;                // Porcentaje de interés anual

    function updateBalances() {
        document.querySelector(".balance-item:nth-child(1) strong").textContent = `$${availableBalance.toFixed(2)}`;
        document.querySelector(".balance-item:nth-child(2) strong").textContent = `$${currentBalance.toFixed(2)}`;
        document.querySelector(".balance-item:nth-child(3) strong").textContent = `$${interestYTD.toFixed(2)}`;
        document.querySelector(".balance-item:nth-child(4) strong").textContent = `${apy}%`;
    }

    updateBalances(); // Llamamos la función al cargar la página

    // Simulación de actualización de saldo cada 5 segundos
    setInterval(() => {
        let interest = (currentBalance * (apy / 100)) / 12;  // Interés mensual
        interestYTD += interest;
        currentBalance += interest;
        updateBalances();
    }, 5000);
});
        // Modal functionality with pre-filled values
        const modal = document.getElementById('purchaseModal');
        const addButtons = document.querySelectorAll('.add-btn');
        const closeBtn = document.querySelector('.close-btn');
        const cancelBtn = document.querySelector('.cancel-btn');
        
        // Form elements
        const orderNumberInput = document.getElementById('orderNumber');
        const clientDocumentInput = document.getElementById('clientDocument');
        const purchaseDateInput = document.getElementById('purchaseDate');
        const quantityInput = document.getElementById('quantity');
        const unitPriceValue = document.getElementById('unitPriceValue');
        const subtotalValue = document.getElementById('subtotalValue');
        const ivaValue = document.getElementById('ivaValue');
        const totalValue = document.getElementById('totalValue');
        
        // Current product info (for calculation)
        let currentProductData = {
            id: '',
            unitPrice: 0,
            ivaRate: 0
        };
        
        // Update price calculations based on quantity
        function updatePrices() {
            const quantity = parseInt(quantityInput.value) || 1;
            
            // Calculate new values
            const subtotal = currentProductData.unitPrice * quantity;
            const iva = subtotal * currentProductData.ivaRate;
            const total = subtotal + iva;
            
            // Flash animation effect on changing values
            [subtotalValue, ivaValue, totalValue].forEach(el => {
                el.classList.add('value-changing');
                setTimeout(() => el.classList.remove('value-changing'), 500);
            });
            
            // Update displayed values
            subtotalValue.textContent = `$${subtotal.toFixed(2)}`;
            ivaValue.textContent = `$${iva.toFixed(2)}`;
            totalValue.textContent = `$${total.toFixed(2)}`;
        }
        
        // Attach event listener to quantity input
        quantityInput.addEventListener('input', updatePrices);
        
        addButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.purchase-card');
                
                // Get data from the selected card
                const orderNumber = item.getAttribute('data-order');
                const purchaseDate = item.getAttribute('data-date');
                const productId = item.getAttribute('data-product-id');
                const unitPrice = parseFloat(item.getAttribute('data-unit-price'));
                const ivaRate = parseFloat(item.getAttribute('data-iva-rate'));
                const client = item.getAttribute('data-client');
                const defaultQuantity = parseInt(item.getAttribute('data-default-quantity')) || 1;
                
                // Store product data for calculations
                currentProductData = {
                    id: productId,
                    unitPrice: unitPrice,
                    ivaRate: ivaRate
                };
                
                // Fill the form with the data
                orderNumberInput.value = orderNumber;
                clientDocumentInput.value = client;
                purchaseDateInput.value = purchaseDate;
                quantityInput.value = defaultQuantity;
                unitPriceValue.textContent = `$${unitPrice.toFixed(2)}`;
                
                // Calculate initial values
                updatePrices();
                
                // Show the modal
                modal.style.display = 'block';
            });
        });
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Form submission
        const purchaseForm = document.getElementById('purchaseForm');
        
        purchaseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Calculate final values for submission
            const quantity = parseInt(quantityInput.value) || 1;
            const subtotal = currentProductData.unitPrice * quantity;
            const iva = subtotal * currentProductData.ivaRate;
            const total = subtotal + iva;
            
            // Here we would submit the form data including the calculated values
            console.log('Processing purchase for product ID:', currentProductData.id);
            console.log('Quantity:', quantity);
            console.log('Subtotal:', subtotal.toFixed(2));
            console.log('IVA:', iva.toFixed(2));
            console.log('Total:', total.toFixed(2));
            
            // Show confirmation message
            alert('Purchase processed successfully!');
            modal.style.display = 'none';
        });