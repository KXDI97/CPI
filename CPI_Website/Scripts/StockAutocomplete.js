// StockAutocomplete.js — Filtro de búsqueda en tiempo real para la tabla de Storage.

(function () {
  function filterTable(query) {
    const q = query.trim().toLowerCase();
    const rows = document.querySelectorAll('.content-Storage table tbody tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = !q || text.includes(q) ? '' : 'none';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.content-Storage .search-bar input');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => filterTable(searchInput.value));
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        filterTable('');
      }
    });
  });
})();
