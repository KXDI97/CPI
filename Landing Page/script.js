// Carousel functionality
const track = document.querySelector('.carousel-track');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');
const cardWidth = 236; // card width + margin
let currentIndex = 0;
const totalCards = track.children.length;

nextBtn.addEventListener('click', () => {
    if (currentIndex < totalCards - 3) {
        currentIndex++;
        track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    }
});

prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
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
document.addEventListener('DOMContentLoaded', function() {
    // Código de carrusel anterior...

    // Filtros
    var filterBtn = document.querySelector('.filter-btn');
    var filterDropdown = document.querySelector('.filter-dropdown');
    var filterOptions = document.querySelectorAll('.filter-option');
    var applyFiltersBtn = document.querySelector('.apply-filters');

    // Toggle dropdown
    filterBtn.addEventListener('click', function() {
        filterDropdown.classList.toggle('active');
    });

    // Select/deselect filter options
    filterOptions.forEach(function(option) {
        option.addEventListener('click', function() {
            this.classList.toggle('selected');
        });
    });

    // Apply filters
    applyFiltersBtn.addEventListener('click', function() {
        var selectedCategories = Array.from(document.querySelectorAll('.category-filters .selected'))
            .map(el => el.dataset.filter);
        var selectedDates = Array.from(document.querySelectorAll('.date-filters .selected'))
            .map(el => el.dataset.filter);
        var selectedPrices = Array.from(document.querySelectorAll('.price-filters .selected'))
            .map(el => el.dataset.filter);

        // Aplicar filtros a las tarjetas
        var purchaseCards = document.querySelectorAll('.purchase-card');
        purchaseCards.forEach(function(card) {
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
    document.addEventListener('click', function(event) {
        if (!filterBtn.contains(event.target) && !filterDropdown.contains(event.target)) {
            filterDropdown.classList.remove('active');
        }
    });
});