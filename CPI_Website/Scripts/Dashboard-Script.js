// ── SEARCH BAR (event delegation — header is dynamically injected) ─────────
const SEARCH_ITEMS = [
    { label: 'Dashboard',           href: 'Dashboard.html',  icon: 'grid-outline',         section: 'Pages' },
    { label: 'Purchases',           href: 'Purchase.html',   icon: 'cart-outline',          section: 'Pages' },
    { label: 'Storage',             href: 'Storage.html',    icon: 'cube-outline',          section: 'Pages' },
    { label: 'Profile',             href: 'Profile.html',    icon: 'person-outline',        section: 'Pages' },
    { label: 'New Purchase Order',  href: 'Purchase.html',   icon: 'add-circle-outline',    section: 'Quick Actions' },
    { label: 'Add to Storage',      href: 'Storage.html',    icon: 'archive-outline',       section: 'Quick Actions' },
    { label: 'View Reports',        href: 'Dashboard.html',  icon: 'bar-chart-outline',     section: 'Quick Actions' },
];

function escapeRe(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function highlight(text, query) {
    if (!query) return text;
    return text.replace(new RegExp(`(${escapeRe(query)})`, 'gi'), '<mark class="search-mark">$1</mark>');
}

function buildSearchHTML(items, raw) {
    if (!items.length) return '<p class="search-empty">No results found</p>';
    const grouped = items.reduce((acc, item) => {
        (acc[item.section] = acc[item.section] || []).push(item);
        return acc;
    }, {});
    return Object.entries(grouped).map(([section, list]) =>
        `<div class="search-section">
            <span class="search-section-label">${section}</span>
            ${list.map(i => `<a class="search-item" href="${i.href}">
                <ion-icon name="${i.icon}"></ion-icon>
                <span>${highlight(i.label, raw)}</span>
            </a>`).join('')}
        </div>`
    ).join('');
}

function openSearchDropdown(inputValue) {
    const dropdown = document.getElementById('search-dropdown');
    if (!dropdown) return;
    const q = inputValue.trim().toLowerCase();
    const filtered = q ? SEARCH_ITEMS.filter(i => i.label.toLowerCase().includes(q)) : SEARCH_ITEMS;
    dropdown.innerHTML = buildSearchHTML(filtered, inputValue.trim());
    dropdown.classList.add('show');
}

function closeSearchDropdown() {
    const dropdown = document.getElementById('search-dropdown');
    if (dropdown) dropdown.classList.remove('show');
}

document.addEventListener('input', function (e) {
    if (e.target.classList.contains('header-search__input')) openSearchDropdown(e.target.value);
});

document.addEventListener('focusin', function (e) {
    if (e.target.classList.contains('header-search__input')) openSearchDropdown(e.target.value);
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        const inp = document.querySelector('.header-search__input');
        if (inp) { inp.value = ''; inp.blur(); }
        closeSearchDropdown();
    }
});

document.addEventListener('click', function (e) {
    if (!e.target.closest('.header-search')) closeSearchDropdown();
});


// ── KPI COUNTER ANIMATION ──────────────────────────────────────────────────
function animateCounter(el) {
    const target   = parseInt(el.dataset.count, 10);
    const prefix   = el.dataset.prefix || '';
    const duration = 1200;
    const started  = performance.now();

    (function tick(now) {
        const t      = Math.min((now - started) / duration, 1);
        const eased  = 1 - Math.pow(1 - t, 3);
        const value  = Math.round(eased * target);
        el.textContent = prefix + (target >= 1000 ? value.toLocaleString('en-US') : value);
        if (t < 1) requestAnimationFrame(tick);
    })(started);
}


// ── DATE FILTER HELPERS ────────────────────────────────────────────────────
let fpInstance = null;

function formatShort(d) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function setChartSubtitles(label) {
    document.querySelectorAll('.chart-date-label').forEach(el => el.textContent = label);
}

function aplicarFiltro() {
    const val = document.getElementById('date-range').value;
    if (val.includes(' to ')) {
        const [a, b] = val.split(' to ');
        setChartSubtitles(`${formatShort(new Date(a))} – ${formatShort(new Date(b))}`);
    }
}

function limpiarFiltro() {
    if (fpInstance) fpInstance.clear();
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    setChartSubtitles('Jan 14 – Mar 14, 2024');
}

function filtrarFechas() { aplicarFiltro(); }


// ── DOM-READY ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

    // Counter animations
    document.querySelectorAll('.kpi-value[data-count]').forEach(animateCounter);

    // KPI card navigation
    document.querySelectorAll('.kpi-card[data-href]').forEach(card => {
        card.addEventListener('click', () => window.location.href = card.dataset.href);
    });

    // Navigation buttons
    const purchasego = document.getElementById('purchasego');
    const storagego  = document.getElementById('storagego');
    if (purchasego) purchasego.addEventListener('click', () => window.location.href = 'Purchase.html');
    if (storagego)  storagego.addEventListener('click',  () => window.location.href = 'Storage.html');

    // Flatpickr date range
    fpInstance = flatpickr('#date-range', {
        mode: 'range',
        dateFormat: 'Y-m-d',
        onClose() {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        }
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const days  = parseInt(this.dataset.days, 10);
            const end   = new Date();
            const start = new Date();
            start.setDate(end.getDate() - days + 1);
            fpInstance.setDate([start, end]);
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            setChartSubtitles(`${formatShort(start)} – ${formatShort(end)}`);
        });
    });

    // ── Doughnut Chart ────────────────────────────────────────────────────
    new Chart(document.getElementById('doughnutChart'), {
        type: 'doughnut',
        data: {
            labels: ['Ink', 'Additives', 'Tapes', 'Devices'],
            datasets: [{
                data: [36, 42, 15, 5],
                backgroundColor: ['#38ff9a', '#8a48ff', '#ff4a4a', '#4295ff'],
                borderWidth: 0,
            }]
        },
        options: {
            cutout: '85%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'rgba(255,255,255,0.6)',
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 10, boxHeight: 10, padding: 16,
                        font: { family: 'Montserrat', size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(22,27,39,0.95)',
                    titleColor: '#ffffff',
                    bodyColor: 'rgba(255,255,255,0.7)',
                    borderColor: 'rgba(144,105,249,0.3)',
                    borderWidth: 1, padding: 10, cornerRadius: 10,
                    titleFont: { family: 'Montserrat', weight: '700' },
                    bodyFont: { family: 'Montserrat' }
                }
            }
        },
        plugins: [{
            afterDraw(chart) {
                const { ctx, width, height } = chart;
                ctx.save();
                const fontSize = (height / 10).toFixed(2);
                document.fonts.load(`bold ${fontSize}px Poppins`).then(() => {
                    ctx.font = `${fontSize}px 'Poppins', sans-serif`;
                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText('$5,285', width / 2, height / 2 - 10);
                    ctx.font = `bold ${fontSize / 1.5}px 'Poppins', sans-serif`;
                    ctx.fillStyle = '#ff4d4d';
                    ctx.fillText('+2.4%', width / 2, height / 2 + 15);
                });
                ctx.restore();
            }
        }]
    });

    // ── Purchase Line Chart ───────────────────────────────────────────────
    new Chart(document.getElementById('purchaseChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Jan 14', 'Jan 28', 'Feb 11', 'Feb 25', 'Mar 10'],
            datasets: [
                { label: 'Ink',      data: [10, 25, 5,  20, 15], borderColor: '#38ff9a', backgroundColor: 'transparent', pointBackgroundColor: '#38ff9a', pointRadius: 0.09, borderWidth: 3, tension: 0.4 },
                { label: 'Additive', data: [5,  15, 20, 10, 12], borderColor: '#8a48ff', backgroundColor: 'transparent', pointBackgroundColor: '#8a48ff', pointRadius: 0.09, borderWidth: 3, tension: 0.4 },
                { label: 'Tapes',    data: [12,  8, 15, 18, 25], borderColor: '#ff4a4a', backgroundColor: 'transparent', pointBackgroundColor: '#ff4a4a', pointRadius: 0.09, borderWidth: 3, tension: 0.4 },
                { label: 'Devices',  data: [3,   5,  8,  7,  4], borderColor: '#4295ff', backgroundColor: 'transparent', pointBackgroundColor: '#4295ff', pointRadius: 0.09, borderWidth: 3, tension: 0.4 },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: 'rgba(255,255,255,0.6)', usePointStyle: true, pointStyle: 'circle', boxWidth: 10, boxHeight: 6, padding: 14, font: { family: 'Montserrat', size: 12 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(22,27,39,0.95)',
                    titleColor: '#ffffff',
                    bodyColor: 'rgba(255,255,255,0.7)',
                    borderColor: 'rgba(144,105,249,0.3)',
                    borderWidth: 1, padding: 10, cornerRadius: 10,
                    titleFont: { family: 'Montserrat', weight: '700' },
                    bodyFont: { family: 'Montserrat' }
                }
            },
            scales: {
                x: { ticks: { color: 'rgba(255,255,255,0.45)', font: { family: 'Montserrat', size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' }, border: { color: 'rgba(255,255,255,0.08)' } },
                y: { ticks: { color: 'rgba(255,255,255,0.45)', font: { family: 'Montserrat', size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' }, border: { color: 'rgba(255,255,255,0.08)' }, beginAtZero: true }
            }
        }
    });
});
