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
        // Add this to your Purchase.js file

// Invoice modal HTML to be inserted into the body
function createInvoiceModal() {
    const invoiceModal = document.createElement('div');
    invoiceModal.id = 'invoiceModal';
    invoiceModal.className = 'modal';
    invoiceModal.innerHTML = `
      <div class="modal-content invoice-modal">
        <span class="close-invoice-btn">&times;</span>
        <div class="invoice-header">
          <h2>Purchase Invoice</h2>
          <div class="invoice-logo">LOGO</div>
        </div>
        <div class="invoice-details">
          <div class="invoice-info">
            <p><strong>Invoice #:</strong> <span id="invoiceNumber"></span></p>
            <p><strong>Date:</strong> <span id="invoiceDate"></span></p>
          </div>
          <div class="invoice-client">
            <p><strong>Client:</strong> <span id="invoiceClient"></span></p>
          </div>
        </div>
        <div class="invoice-items">
          <table>
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody id="invoiceItemsList">
              <!-- Items will be added here dynamically -->
            </tbody>
          </table>
        </div>
        <div class="invoice-summary">
          <div class="summary-item">
            <span>Subtotal:</span>
            <span id="invoiceSummarySubtotal"></span>
          </div>
          <div class="summary-item">
            <span>IVA (19%):</span>
            <span id="invoiceSummaryIva"></span>
          </div>
          <div class="summary-item total">
            <span>Total:</span>
            <span id="invoiceSummaryTotal"></span>
          </div>
        </div>
        <div class="invoice-footer">
          <p>Thank you for your purchase!</p>
          <div class="invoice-actions">
            <button id="printInvoiceBtn" class="print-btn">Print Invoice</button>
            <button id="closeInvoiceBtn" class="close-btn">Close</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(invoiceModal);
    return invoiceModal;
  }
  
  // Add this to your DOMContentLoaded event listener
  document.addEventListener('DOMContentLoaded', function() {
    // Create and append the invoice modal to the body
    const invoiceModal = createInvoiceModal();
    
    // Get invoice elements
    const closeInvoiceBtn = document.querySelector('.close-invoice-btn');
    const printInvoiceBtn = document.getElementById('printInvoiceBtn');
    const closeInvoiceActionBtn = document.getElementById('closeInvoiceBtn');
    
    // Close invoice modal events
    closeInvoiceBtn.addEventListener('click', () => {
      invoiceModal.style.display = 'none';
    });
    
    closeInvoiceActionBtn.addEventListener('click', () => {
      invoiceModal.style.display = 'none';
    });
    
    printInvoiceBtn.addEventListener('click', () => {
      printInvoice();
    });
    
    window.addEventListener('click', (event) => {
      if (event.target === invoiceModal) {
        invoiceModal.style.display = 'none';
      }
    });
    
    // Update the purchase form submission to show the invoice
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
      
      // Generate invoice number (you might want to get this from your backend)
      const invoiceNumber = 'INV-' + new Date().getTime().toString().slice(-6);
      
      // Close purchase modal
      modal.style.display = 'none';
      
      // Show invoice with a slight delay to allow modal transition
      setTimeout(() => {
        generateInvoice({
          invoiceNumber: invoiceNumber,
          orderNumber: orderNumberInput.value,
          client: clientDocumentInput.value,
          date: purchaseDateInput.value,
          productId: currentProductData.id,
          productName: getProductNameById(currentProductData.id),
          quantity: quantity,
          unitPrice: currentProductData.unitPrice,
          subtotal: subtotal,
          ivaRate: currentProductData.ivaRate,
          iva: iva,
          total: total,
          paymentMethod: document.getElementById('paymentMethod').value
        });
        
        invoiceModal.style.display = 'block';
      }, 300);
    });
  });
  
  // Helper function to get product name by ID
  function getProductNameById(productId) {
    // This would ideally be fetched from a database or product catalog
    const productTypes = {
      'PO-2024-001': 'Premium Black Ink Cartridge',
      'PO-2024-002': 'Color Ink Cartridge - High Capacity',
      'PO-2024-003': 'Laser Printer Drum',
      'PO-2024-004': 'Adhesive Printing Tape',
      'PO-2024-005': 'Thermal Print Head'
    };
    
    return productTypes[productId] || 'Product ' + productId;
  }
  
  // Generate and populate the invoice
  function generateInvoice(data) {
    // Set invoice details
    document.getElementById('invoiceNumber').textContent = data.invoiceNumber;
    document.getElementById('invoiceDate').textContent = formatDate(data.date);
    document.getElementById('invoiceClient').textContent = data.client || 'Guest Client';
    
    // Clear previous items
    const itemsList = document.getElementById('invoiceItemsList');
    itemsList.innerHTML = '';
    
    // Add the purchased item
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${data.productId}</td>
      <td>${data.productName}</td>
      <td>${data.quantity}</td>
      <td>$${data.unitPrice.toFixed(2)}</td>
      <td>$${data.subtotal.toFixed(2)}</td>
    `;
    itemsList.appendChild(row);
    
    // Set summary values
    document.getElementById('invoiceSummarySubtotal').textContent = `$${data.subtotal.toFixed(2)}`;
    document.getElementById('invoiceSummaryIva').textContent = `$${data.iva.toFixed(2)}`;
    document.getElementById('invoiceSummaryTotal').textContent = `$${data.total.toFixed(2)}`;
  }
  
  // Format date to a more readable format
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  // Print invoice function
  function printInvoice() {
    const invoiceContent = document.querySelector('.invoice-modal').cloneNode(true);
    
    // Remove action buttons for printing
    const actionButtons = invoiceContent.querySelector('.invoice-actions');
    if (actionButtons) {
      actionButtons.remove();
    }
    
    // Remove close button
    const closeBtn = invoiceContent.querySelector('.close-invoice-btn');
    if (closeBtn) {
      closeBtn.remove();
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice</title>
          <style>
            body {
              font-family: 'Poppins', sans-serif;
              color: #121826;
              padding: 20px;
            }
            .invoice-modal {
              max-width: 800px;
              margin: 0 auto;
              background-color: white;
              padding: 20px;
              border-radius: 10px;
            }
            .invoice-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 2px solid #eaeaea;
            }
            .invoice-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #eaeaea;
            }
            th {
              background-color: #f5f5f5;
            }
            .invoice-summary {
              margin-top: 20px;
              text-align: right;
            }
            .summary-item {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 5px;
            }
            .summary-item span:first-child {
              margin-right: 20px;
              font-weight: 600;
            }
            .total {
              font-weight: bold;
              font-size: 1.2em;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 2px solid #eaeaea;
            }
            .invoice-footer {
              margin-top: 30px;
              text-align: center;
              color: #666;
            }
          </style>
        </head>
        <body>
          ${invoiceContent.outerHTML}
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }