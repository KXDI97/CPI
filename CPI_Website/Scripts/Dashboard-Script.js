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


// ── INVENTORY SERVICE BASE URL ─────────────────────────────────────────────
const INVENTORY_API = 'http://localhost:5035';

// ── CHART INSTANCES (kept for live refresh) ───────────────────────────────
let purchaseChartInstance = null;
let doughnutChartInstance = null;

// ── KPI COUNTER ANIMATION ──────────────────────────────────────────────────
function animateCounter(el) {
    const target   = parseFloat(el.dataset.count) || 0;
    const prefix   = el.dataset.prefix || '';
    const isFloat  = el.dataset.float === 'true';
    const duration = 1200;
    const started  = performance.now();

    (function tick(now) {
        const t      = Math.min((now - started) / duration, 1);
        const eased  = 1 - Math.pow(1 - t, 3);
        const value  = eased * target;
        if (isFloat) {
            el.textContent = prefix + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        } else {
            el.textContent = prefix + Math.round(value).toLocaleString('en-US');
        }
        if (t < 1) requestAnimationFrame(tick);
    })(started);
}

// ── CATEGORY ICON HELPER ────────────────────────────────────────────────────
function categoryIcon(cat) {
    const map = { Ink: 'color-fill-outline', Additives: 'infinite-outline', Tapes: 'radio-outline', Devices: 'desktop-outline' };
    return map[cat] || 'cube-outline';
}

function categoryBadge(cat) {
    const cls = (cat || '').toLowerCase().replace(/\s+/, '-');
    return `<span class="category-badge category-badge--${cls}">${cat}</span>`;
}

// ── FETCH DASHBOARD DATA ────────────────────────────────────────────────────
async function fetchDashboardData() {
    const safe = url => fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(() => null);
    const [kpis, storage, ordersChart, spendingChart, upcomingPayments] = await Promise.all([
        safe(`${INVENTORY_API}/api/dashboard/kpis`),
        safe(`${INVENTORY_API}/api/dashboard/recent-storage`),
        safe(`${INVENTORY_API}/api/dashboard/purchase-orders-chart`),
        safe(`${INVENTORY_API}/api/dashboard/spending-chart`),
        safe(`${INVENTORY_API}/api/dashboard/upcoming-payments`),
    ]);
    if (!kpis && !storage) { console.warn('Dashboard API unavailable.'); return null; }
    return { kpis, storage, ordersChart, spendingChart, upcomingPayments };
}

async function fetchChartData(from, to) {
    try {
        const params = new URLSearchParams();
        if (from) params.set('dateFrom', from);
        if (to)   params.set('dateTo',   to);
        const qs = params.toString() ? '?' + params.toString() : '';

        const [ordersChart, spendingChart] = await Promise.all([
            fetch(`${INVENTORY_API}/api/dashboard/purchase-orders-chart${qs}`).then(r => r.json()),
            fetch(`${INVENTORY_API}/api/dashboard/spending-chart${qs}`).then(r => r.json()),
        ]);
        return { ordersChart, spendingChart };
    } catch (e) {
        console.warn('Failed to refresh chart data.', e);
        return null;
    }
}

async function refreshCharts(from, to) {
    const result = await fetchChartData(from, to);
    if (!result) return;

    if (purchaseChartInstance) {
        purchaseChartInstance.data.labels              = result.ordersChart?.labels ?? [];
        purchaseChartInstance.data.datasets[0].data    = result.ordersChart?.data   ?? [];
        purchaseChartInstance.update();
    }

    if (doughnutChartInstance) {
        const catColors = { Ink: '#38ff9a', Additives: '#8a48ff', Tapes: '#ff4a4a', Devices: '#4295ff' };
        const labels = result.spendingChart?.labels ?? [];
        const data   = result.spendingChart?.data   ?? [];
        const colors = labels.map((l, i) => catColors[l] ?? ['#38ff9a','#8a48ff','#ff4a4a','#4295ff'][i % 4]);

        doughnutChartInstance.data.labels              = labels;
        doughnutChartInstance.data.datasets[0].data    = data;
        doughnutChartInstance.data.datasets[0].backgroundColor = colors;
        doughnutChartInstance.update();
    }
}

function applyKpis(kpis) {
    const [totalOrders, totalSpending, pendingPayments, activeProducts] =
        document.querySelectorAll('.kpi-value[data-count]');

    totalOrders.dataset.count    = kpis.totalOrders;
    totalSpending.dataset.count  = kpis.totalSpending;
    totalSpending.dataset.prefix = '$';
    pendingPayments.dataset.count  = kpis.pendingPayments;
    pendingPayments.dataset.prefix = '$';
    activeProducts.dataset.count = kpis.activeProducts;

    document.querySelectorAll('.kpi-value[data-count]').forEach(animateCounter);
}

function applyRecentStorage(items) {
    const tbody = document.getElementById('recent-storage-body');
    if (!tbody) return;
    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;opacity:0.5">No data</td></tr>';
        return;
    }
    tbody.innerHTML = items.map(item => `
        <tr>
            <td><ion-icon name="${categoryIcon(item.category)}"></ion-icon> ${item.name}</td>
            <td>${categoryBadge(item.category)}</td>
            <td>${Number(item.stock).toLocaleString('en-US')}</td>
            <td>${item.supplier}</td>
            <td>$${Number(item.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>`).join('');

    const label = document.getElementById('storage-date-label');
    if (label) label.textContent = `Top ${items.length} by stock`;
}

function applyUpcomingPayments(items) {
    const list = document.getElementById('upcoming-payments-list');
    if (!list) return;
    if (!items || !items.length) return;

    const statusBadge = (s) => {
        if (s === 'Overdue') return `<span class="pay-status pay-status--overdue">Overdue</span>`;
        if (s === 'Paid')    return `<span class="pay-status pay-status--paid">Paid</span>`;
        return `<span class="pay-status pay-status--pending">Pending</span>`;
    };

    const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');

    const fmtDate = (iso) => iso
        ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '—';

    list.innerHTML = items.map(p => `
        <div class="payment-row">
            <div class="pay-info">
                <div class="pay-avatar">${initials(p.clientName)}</div>
                <div class="pay-meta">
                    <span class="pay-name">${p.clientName}</span>
                    <span class="pay-date">${fmtDate(p.invoiceDate)}</span>
                </div>
            </div>
            <div class="pay-right">
                <span class="pay-amount negative">-$${Number(p.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                ${statusBadge(p.status)}
            </div>
        </div>`).join('');
}


// ── DATE FILTER HELPERS ────────────────────────────────────────────────────
let fpInstance = null;
let activeFrom = null;
let activeTo   = null;

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
        activeFrom = a;
        activeTo   = b;
        setChartSubtitles(`${formatShort(new Date(a))} – ${formatShort(new Date(b))}`);
        refreshCharts(activeFrom, activeTo);
    }
}

function limpiarFiltro() {
    if (fpInstance) fpInstance.clear();
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    activeFrom = null;
    activeTo   = null;
    setChartSubtitles('All time');
    refreshCharts(null, null);
}

function filtrarFechas() { aplicarFiltro(); }


// ── DOM-READY ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {

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
            const fromStr = start.toISOString().slice(0, 10);
            const toStr   = end.toISOString().slice(0, 10);
            activeFrom = fromStr;
            activeTo   = toStr;
            setChartSubtitles(`${formatShort(start)} – ${formatShort(end)}`);
            refreshCharts(fromStr, toStr);
        });
    });

    // ── Fetch real data ───────────────────────────────────────────────────
    const dash = await fetchDashboardData();

    // KPIs
    if (dash?.kpis) {
        applyKpis(dash.kpis);
    } else {
        document.querySelectorAll('.kpi-value[data-count]').forEach(animateCounter);
    }

    // Recent Storage table
    if (dash?.storage) applyRecentStorage(dash.storage);

    // Upcoming Payments
    if (dash?.upcomingPayments) applyUpcomingPayments(dash.upcomingPayments);

    // ── Spending Doughnut Chart ───────────────────────────────────────────
    const doughnutLabels = dash?.spendingChart?.labels ?? ['Ink', 'Additives', 'Tapes', 'Devices'];
    const doughnutData   = dash?.spendingChart?.data   ?? [36, 42, 15, 5];
    const catColors      = { Ink: '#38ff9a', Additives: '#8a48ff', Tapes: '#ff4a4a', Devices: '#4295ff' };
    const doughnutColors = doughnutLabels.map((l, i) => catColors[l] ?? ['#38ff9a','#8a48ff','#ff4a4a','#4295ff'][i % 4]);

    const totalSpend = doughnutData.reduce((s, v) => s + v, 0);
    const totalLabel = totalSpend >= 1000
        ? '$' + Math.round(totalSpend).toLocaleString('en-US')
        : '$' + totalSpend.toFixed(0);

    doughnutChartInstance = new Chart(document.getElementById('doughnutChart'), {
        type: 'doughnut',
        data: {
            labels: doughnutLabels,
            datasets: [{ data: doughnutData, backgroundColor: doughnutColors, borderWidth: 0 }]
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
                        usePointStyle: true, pointStyle: 'circle',
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
                    ctx.fillText(totalLabel, width / 2, height / 2 - 10);
                    ctx.font = `bold ${fontSize / 1.5}px 'Poppins', sans-serif`;
                    ctx.fillStyle = '#54F1B7';
                    ctx.fillText('Total', width / 2, height / 2 + 15);
                });
                ctx.restore();
            }
        }]
    });

    // ── Purchase Orders Line Chart ────────────────────────────────────────
    const chartLabels = dash?.ordersChart?.labels ?? ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const chartCounts = dash?.ordersChart?.data   ?? [0, 0, 0, 0, 0];

    purchaseChartInstance = new Chart(document.getElementById('purchaseChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Purchase Orders',
                data: chartCounts,
                borderColor: '#9069F9',
                backgroundColor: 'rgba(144,105,249,0.08)',
                fill: true,
                pointBackgroundColor: '#9069F9',
                pointRadius: 4,
                borderWidth: 3,
                tension: 0.4
            }]
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
