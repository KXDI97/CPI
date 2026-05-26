/* ==========================================================================
   REPORTS & ANALYTICS  —  Reports-Script.js
   ========================================================================== */

// ── MOCK DATA ──────────────────────────────────────────────────────────────
// Each block shows the API endpoint to wire when the backend is ready.

// API: GET /api/reports/sales?from=&to=
const MOCK_SALES = [
    { date: '2026-04-01', client: 'Comercial Torres',  products: 'LAMU 5009 x3, LA 0056 x1', total: 1240.00, status: 'paid' },
    { date: '2026-04-03', client: 'Dist. Ramírez',     products: 'BK-1200 x5',                total: 875.50,  status: 'paid' },
    { date: '2026-04-05', client: 'Almacenes Cruz',    products: 'POLY TU x2',                total: 430.00,  status: 'pending' },
    { date: '2026-04-08', client: 'Ferretería López',  products: 'TVSA 33x700 x4',            total: 2100.00, status: 'paid' },
    { date: '2026-04-10', client: 'Industrias Ruiz',   products: 'LAMU 5009 x7',              total: 2940.00, status: 'paid' },
    { date: '2026-04-14', client: 'Comercial Torres',  products: 'LA 0056 x10',               total: 1560.00, status: 'overdue' },
    { date: '2026-04-17', client: 'Proveedora Sur',    products: 'BK-1200 x2, POLY TU x1',   total: 565.00,  status: 'paid' },
    { date: '2026-04-20', client: 'Dist. Ramírez',     products: 'TVSA 33x700 x1',            total: 525.00,  status: 'pending' },
    { date: '2026-04-23', client: 'Almacenes Cruz',    products: 'LAMU 5009 x4',              total: 1680.00, status: 'paid' },
    { date: '2026-04-26', client: 'Ferretería López',  products: 'LA 0056 x6',                total: 936.00,  status: 'paid' },
    { date: '2026-04-29', client: 'Industrias Ruiz',   products: 'BK-1200 x3',                total: 525.75,  status: 'paid' },
    { date: '2026-05-02', client: 'Proveedora Sur',    products: 'POLY TU x5',                total: 1075.00, status: 'pending' },
    { date: '2026-05-06', client: 'Comercial Torres',  products: 'LAMU 5009 x2, BK-1200 x1', total: 1015.25, status: 'paid' },
    { date: '2026-05-09', client: 'Dist. Ramírez',     products: 'TVSA 33x700 x3',            total: 1575.00, status: 'paid' },
    { date: '2026-05-12', client: 'Almacenes Cruz',    products: 'LA 0056 x4',                total: 624.00,  status: 'overdue' },
];

// API: GET /api/reports/purchases?from=&to=
const MOCK_PURCHASES = [
    { date: '2026-04-02', supplier: 'Proveedor A',    products: 'LAMU 5009 x20',              total: 3200.00, status: 'received' },
    { date: '2026-04-05', supplier: 'Dist. Central',  products: 'LA 0056 x50',                total: 4750.00, status: 'received' },
    { date: '2026-04-09', supplier: 'Importadora XL', products: 'BK-1200 x15',               total: 1875.00, status: 'pending' },
    { date: '2026-04-13', supplier: 'Proveedor A',    products: 'TVSA 33x700 x10',            total: 2200.00, status: 'received' },
    { date: '2026-04-18', supplier: 'Sumin. Norte',   products: 'POLY TU x30',               total: 2100.00, status: 'received' },
    { date: '2026-04-22', supplier: 'Dist. Central',  products: 'LAMU 5009 x12, LA 0056 x8', total: 2680.00, status: 'cancelled' },
    { date: '2026-04-27', supplier: 'Importadora XL', products: 'BK-1200 x25',               total: 3125.00, status: 'received' },
    { date: '2026-05-01', supplier: 'Proveedor A',    products: 'TVSA 33x700 x6',            total: 1320.00, status: 'pending' },
    { date: '2026-05-05', supplier: 'Sumin. Norte',   products: 'POLY TU x20',              total: 1400.00, status: 'received' },
    { date: '2026-05-10', supplier: 'Dist. Central',  products: 'LAMU 5009 x8',             total: 1280.00, status: 'received' },
];

// API: GET /api/reports/inventory?from=&to=
const MOCK_INVENTORY = [
    { product: 'LAMU 5009',   category: 'Luminarias', entries: 40, exits: 16, stock: 24 },
    { product: 'LA 0056',     category: 'Luminarias', entries: 58, exits: 20, stock: 38 },
    { product: 'TVSA 33x700', category: 'Tubos',      entries: 16, exits:  8, stock:  8 },
    { product: 'POLY TU',     category: 'Polímeros',  entries: 50, exits:  7, stock: 43 },
    { product: 'BK-1200',     category: 'Cables',     entries: 40, exits: 13, stock: 27 },
    { product: 'FX-330',      category: 'Conectores', entries: 60, exits: 22, stock: 38 },
    { product: 'ZN-800',      category: 'Zincado',    entries: 30, exits:  5, stock: 25 },
    { product: 'CU-Wire 2.5', category: 'Cables',     entries: 100, exits: 47, stock: 53 },
];

// API: GET /api/reports/users?from=&to=  (admin only)
const MOCK_USERS = [
    { user: 'admin@cpi.com',       role: 'Admin',   lastAccess: '2026-05-26 09:14', status: 'active' },
    { user: 'maria.lopez@cpi.com', role: 'Manager', lastAccess: '2026-05-26 08:55', status: 'active' },
    { user: 'carlos.ruiz@cpi.com', role: 'Seller',  lastAccess: '2026-05-25 17:30', status: 'active' },
    { user: 'ana.torres@cpi.com',  role: 'Seller',  lastAccess: '2026-05-24 12:01', status: 'inactive' },
    { user: 'javier.p@cpi.com',    role: 'Viewer',  lastAccess: '2026-05-20 09:00', status: 'inactive' },
];

// ── TYPE ICONS ─────────────────────────────────────────────────────────────
const TYPE_ICONS = {
    sales:     'trending-up-outline',
    purchases: 'cart-outline',
    inventory: 'cube-outline',
    users:     'people-outline',
};

// ── SCHEMAS ────────────────────────────────────────────────────────────────
const SCHEMAS = {
    sales: {
        title: 'Sales Report',
        chartTitle: 'Revenue by Date',
        columns: ['Date', 'Client', 'Products', 'Total', 'Status'],
        row: r => [
            r.date,
            r.client,
            `<span style="max-width:220px;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.products}</span>`,
            `<strong>$${r.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>`,
            badge(r.status, { paid: 'green', pending: 'yellow', overdue: 'red' })
        ],
        data: MOCK_SALES,
        kpis: rows => {
            const total   = rows.reduce((s, r) => s + r.total, 0);
            const paid    = rows.filter(r => r.status === 'paid').reduce((s,r) => s + r.total, 0);
            const pending = rows.filter(r => r.status !== 'paid').reduce((s,r) => s + r.total, 0);
            const avg     = rows.length ? total / rows.length : 0;
            return [
                { label: 'Total Revenue',  value: total,   prefix: '$', accent: '#9069F9' },
                { label: 'Orders',         value: rows.length, prefix: '',  accent: '#54F1B7' },
                { label: 'Avg Order',      value: avg,    prefix: '$', accent: '#F59E0B' },
                { label: 'Pending Amount', value: pending, prefix: '$', accent: '#3B82F6' },
            ];
        },
        chart: rows => {
            // Aggregate totals by date
            const map = {};
            rows.forEach(r => { map[r.date] = (map[r.date] || 0) + r.total; });
            const labels = Object.keys(map).sort();
            return {
                type: 'line',
                labels,
                datasets: [{
                    label: 'Revenue ($)',
                    data: labels.map(d => map[d]),
                    borderColor: '#9069F9',
                    backgroundColor: 'rgba(144,105,249,0.12)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#9069F9',
                    pointRadius: 4,
                }]
            };
        },
        summary: rows => {
            const total = rows.reduce((s,r) => s + r.total, 0);
            const paid  = rows.filter(r => r.status === 'paid').length;
            return [
                { label: 'Total Revenue', value: `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, accent: true },
                { label: 'Paid',    value: paid },
                { label: 'Pending / Overdue', value: rows.length - paid },
            ];
        }
    },

    purchases: {
        title: 'Purchases Report',
        chartTitle: 'Spending by Supplier',
        columns: ['Date', 'Supplier', 'Products', 'Total', 'Status'],
        row: r => [
            r.date,
            r.supplier,
            `<span style="max-width:220px;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.products}</span>`,
            `<strong>$${r.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>`,
            badge(r.status, { received: 'green', pending: 'yellow', cancelled: 'red' })
        ],
        data: MOCK_PURCHASES,
        kpis: rows => {
            const total    = rows.reduce((s,r) => s + r.total, 0);
            const received = rows.filter(r => r.status === 'received').length;
            const suppliers = [...new Set(rows.map(r => r.supplier))].length;
            const pending  = rows.filter(r => r.status === 'pending').reduce((s,r) => s + r.total, 0);
            return [
                { label: 'Total Spent',  value: total,     prefix: '$', accent: '#9069F9' },
                { label: 'Orders',       value: rows.length, prefix: '',  accent: '#54F1B7' },
                { label: 'Suppliers',    value: suppliers, prefix: '',  accent: '#F59E0B' },
                { label: 'Pending',      value: pending,   prefix: '$', accent: '#3B82F6' },
            ];
        },
        chart: rows => {
            const map = {};
            rows.forEach(r => { map[r.supplier] = (map[r.supplier] || 0) + r.total; });
            const labels = Object.keys(map);
            return {
                type: 'bar',
                labels,
                datasets: [{
                    label: 'Amount ($)',
                    data: labels.map(k => map[k]),
                    backgroundColor: [
                        'rgba(144,105,249,0.7)',
                        'rgba(84,241,183,0.7)',
                        'rgba(245,158,11,0.7)',
                        'rgba(59,130,246,0.7)',
                        'rgba(239,68,68,0.7)',
                    ],
                    borderRadius: 6,
                    borderWidth: 0,
                }]
            };
        },
        summary: rows => {
            const total    = rows.reduce((s,r) => s + r.total, 0);
            const received = rows.filter(r => r.status === 'received').length;
            return [
                { label: 'Total Spent', value: `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, accent: true },
                { label: 'Received', value: received },
                { label: 'Pending / Cancelled', value: rows.length - received },
            ];
        }
    },

    inventory: {
        title: 'Inventory Report',
        chartTitle: 'Entries vs Exits by Product',
        columns: ['Product', 'Category', 'Entries', 'Exits', 'Stock'],
        row: r => [
            `<strong>${r.product}</strong>`,
            r.category,
            `<span style="color:#54F1B7">${r.entries}</span>`,
            `<span style="color:#f87171">${r.exits}</span>`,
            r.stock <= 10
                ? `<span class="rp-badge rp-badge--yellow">${r.stock} low</span>`
                : `<span style="font-weight:700">${r.stock}</span>`
        ],
        data: MOCK_INVENTORY,
        kpis: rows => {
            const entries  = rows.reduce((s,r) => s + r.entries, 0);
            const exits    = rows.reduce((s,r) => s + r.exits, 0);
            const lowStock = rows.filter(r => r.stock <= 10).length;
            return [
                { label: 'Products',    value: rows.length, prefix: '',  accent: '#9069F9' },
                { label: 'Entries',     value: entries,    prefix: '',  accent: '#54F1B7' },
                { label: 'Exits',       value: exits,      prefix: '',  accent: '#F59E0B' },
                { label: 'Low Stock',   value: lowStock,   prefix: '',  accent: '#f87171' },
            ];
        },
        chart: rows => ({
            type: 'bar',
            labels: rows.map(r => r.product),
            datasets: [
                {
                    label: 'Entries',
                    data: rows.map(r => r.entries),
                    backgroundColor: 'rgba(84,241,183,0.75)',
                    borderRadius: 5,
                    borderWidth: 0,
                },
                {
                    label: 'Exits',
                    data: rows.map(r => r.exits),
                    backgroundColor: 'rgba(239,68,68,0.65)',
                    borderRadius: 5,
                    borderWidth: 0,
                }
            ]
        }),
        summary: rows => {
            const entries  = rows.reduce((s,r) => s + r.entries, 0);
            const exits    = rows.reduce((s,r) => s + r.exits, 0);
            const lowStock = rows.filter(r => r.stock <= 10).length;
            return [
                { label: 'Total Entries', value: entries },
                { label: 'Total Exits',   value: exits },
                { label: 'Low Stock Alerts', value: lowStock, accent: lowStock > 0 },
            ];
        }
    },

    users: {
        title: 'User Activity Report',
        chartTitle: null,
        columns: ['User', 'Role', 'Last Access', 'Status'],
        row: r => [
            r.user,
            `<span class="rp-badge rp-badge--purple">${r.role}</span>`,
            r.lastAccess,
            badge(r.status, { active: 'green', inactive: 'yellow' })
        ],
        data: MOCK_USERS,
        kpis: rows => {
            const active = rows.filter(r => r.status === 'active').length;
            return [
                { label: 'Total Users', value: rows.length, prefix: '', accent: '#9069F9' },
                { label: 'Active',      value: active,      prefix: '', accent: '#54F1B7' },
                { label: 'Inactive',    value: rows.length - active, prefix: '', accent: '#F59E0B' },
                { label: 'Roles',       value: [...new Set(rows.map(r => r.role))].length, prefix: '', accent: '#3B82F6' },
            ];
        },
        chart: null,
        summary: rows => {
            const active = rows.filter(r => r.status === 'active').length;
            return [
                { label: 'Total Users', value: rows.length },
                { label: 'Active',      value: active },
                { label: 'Inactive',    value: rows.length - active },
            ];
        }
    }
};

// ── STATE ──────────────────────────────────────────────────────────────────
const STATE = {
    data:    [],
    schema:  null,
    type:    '',
    page:    1,
    perPage: 10,
    from:    '',
    to:      '',
    chart:   null,
};

// ── HELPERS ────────────────────────────────────────────────────────────────
function badge(val, map) {
    const cls = map[val] || 'blue';
    const label = val.charAt(0).toUpperCase() + val.slice(1);
    return `<span class="rp-badge rp-badge--${cls}">${label}</span>`;
}

function fmt(d) {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[+m - 1]} ${+day}, ${y}`;
}

function today() { return new Date().toISOString().slice(0, 10); }

function daysAgo(n) {
    const d = new Date(); d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
}

function animateCounter(el, target, prefix = '', decimals = 0) {
    const duration = 900;
    const start = performance.now();
    (function tick(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = eased * target;
        el.textContent = prefix + (decimals
            ? val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
            : Math.round(val).toLocaleString('en-US'));
        if (t < 1) requestAnimationFrame(tick);
    })(start);
}

// ── TOAST ──────────────────────────────────────────────────────────────────
function toast(type, text) {
    const container = document.getElementById('rp-toast-container');
    const el = document.createElement('div');
    const icon = type === 'loading'
        ? '<ion-icon name="sync-outline"></ion-icon>'
        : '<ion-icon name="checkmark-circle-outline"></ion-icon>';
    el.className = `rp-toast rp-toast--${type}`;
    el.innerHTML = `${icon}<span>${text}</span>`;
    container.appendChild(el);

    if (type !== 'loading') {
        setTimeout(() => {
            el.classList.add('rp-toast--out');
            setTimeout(() => el.remove(), 280);
        }, 2200);
    }

    return el;
}

// ── STATES ─────────────────────────────────────────────────────────────────
function showState(s) {
    document.getElementById('rp-state-empty').style.display   = s === 'empty'   ? '' : 'none';
    document.getElementById('rp-state-loading').style.display = s === 'loading' ? '' : 'none';
    document.getElementById('rp-state-nodata').style.display  = s === 'nodata'  ? '' : 'none';
    document.getElementById('rp-output').style.display        = s === 'output'  ? '' : 'none';
}

function setExportEnabled(on) {
    document.getElementById('btnExportPDF').disabled = !on;
    document.getElementById('btnExportCSV').disabled = !on;
}

// ── INIT ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // Show User Activity option for admins
    try {
        if (typeof getTokenRole === 'function' && getTokenRole() === 'Admin') {
            document.querySelectorAll('.rp-admin-only, .rp-admin-card').forEach(el => el.style.display = '');
        }
    } catch (_) {}

    // Type select → update icon + preview cards
    const typeSelect = document.getElementById('rp-type');
    typeSelect.addEventListener('change', () => {
        const val = typeSelect.value;
        updateTypeIcon(val);
        highlightPreviewCard(val);
    });

    // Preview cards → set select value
    document.querySelectorAll('.rp-preview-card').forEach(card => {
        card.addEventListener('click', () => {
            const t = card.dataset.type;
            typeSelect.value = t;
            updateTypeIcon(t);
            highlightPreviewCard(t);
        });
    });

    // Preset pills
    document.querySelectorAll('.rp-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.rp-preset').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('rp-to').value   = today();
            document.getElementById('rp-from').value = daysAgo(+btn.dataset.days);
        });
    });

    // Clear preset on manual date change
    ['rp-from', 'rp-to'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            document.querySelectorAll('.rp-preset').forEach(b => b.classList.remove('active'));
        });
    });

    document.getElementById('btnGenerate').addEventListener('click', generateReport);
    document.getElementById('rp-pg-prev').addEventListener('click', () => { STATE.page--; renderTable(); });
    document.getElementById('rp-pg-next').addEventListener('click', () => { STATE.page++; renderTable(); });
    document.getElementById('btnExportPDF').addEventListener('click', exportPDF);
    document.getElementById('btnExportCSV').addEventListener('click', exportCSV);
});

function updateTypeIcon(val) {
    const icon = document.getElementById('rp-type-icon')?.querySelector('ion-icon');
    if (!icon) return;
    icon.setAttribute('name', TYPE_ICONS[val] || 'bar-chart-outline');
}

function highlightPreviewCard(val) {
    document.querySelectorAll('.rp-preview-card').forEach(c => {
        c.classList.toggle('active', c.dataset.type === val);
    });
}

// ── GENERATE ───────────────────────────────────────────────────────────────
function generateReport() {
    const type = document.getElementById('rp-type').value;
    if (!type) { toast('loading', 'Please select a report type'); setTimeout(() => {}, 0); return; }

    STATE.type   = type;
    STATE.from   = document.getElementById('rp-from').value;
    STATE.to     = document.getElementById('rp-to').value;
    STATE.schema = SCHEMAS[type];
    STATE.page   = 1;

    showState('loading');
    setExportEnabled(false);

    // Simulate async API call — replace with fetch() when backend is ready
    setTimeout(() => {
        let data = [...STATE.schema.data];

        // Filter by date range if both dates are provided
        // When connecting to API: pass from/to as query params instead
        if (STATE.from && STATE.to) {
            data = data.filter(r => {
                const d = (r.date || r.lastAccess || '').slice(0, 10);
                return d >= STATE.from && d <= STATE.to;
            });
        }

        STATE.data = data;

        if (data.length === 0) {
            showState('nodata');
            return;
        }

        const rangeLabel = (STATE.from && STATE.to)
            ? `${fmt(STATE.from)} – ${fmt(STATE.to)}`
            : 'All time';

        document.getElementById('rp-date-label').textContent  = `${STATE.schema.title} · ${rangeLabel}`;
        document.getElementById('rp-output-title').textContent = STATE.schema.title;
        document.getElementById('rp-output-range').textContent = rangeLabel;
        document.getElementById('rp-row-count').textContent   = `${data.length} records`;

        renderKPIs(data);
        renderChart(data);
        renderTable();
        renderSummary();

        showState('output');
        setExportEnabled(true);
    }, 800);
}

// ── KPI CARDS ──────────────────────────────────────────────────────────────
function renderKPIs(data) {
    const kpis = STATE.schema.kpis(data);
    const accents = ['#9069F9', '#54F1B7', '#F59E0B', '#3B82F6'];
    const icons   = ['cash-outline', 'receipt-outline', 'trending-up-outline', 'time-outline'];

    document.getElementById('rp-kpi-row').innerHTML = kpis.map((k, i) => {
        const accent = k.accent || accents[i];
        const isMonetary = k.prefix === '$';
        const displayVal = isMonetary
            ? k.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : Math.round(k.value).toLocaleString('en-US');

        return `
        <div class="rp-kpi-card" style="--kpi-accent:${accent}; animation-delay:${i * 0.06}s">
            <span class="rp-kpi-card__label">${k.label}</span>
            <span class="rp-kpi-card__value" data-target="${k.value}" data-prefix="${k.prefix || ''}" data-decimals="${isMonetary ? 2 : 0}">
                ${k.prefix}${displayVal}
            </span>
            <span class="rp-kpi-card__sub">${k.prefix ? 'Total period' : 'count'}</span>
            <ion-icon class="rp-kpi-card__icon" name="${icons[i]}"></ion-icon>
        </div>`;
    }).join('');

    // Animate counters after DOM paint
    requestAnimationFrame(() => {
        document.querySelectorAll('.rp-kpi-card__value').forEach(el => {
            const target   = parseFloat(el.dataset.target);
            const prefix   = el.dataset.prefix || '';
            const decimals = parseInt(el.dataset.decimals, 10) || 0;
            animateCounter(el, target, prefix, decimals);
        });
    });
}

// ── CHART ──────────────────────────────────────────────────────────────────
function renderChart(data) {
    const chartCard  = document.getElementById('rp-chart-card');
    const chartTitle = document.getElementById('rp-chart-title');

    if (!STATE.schema.chart || !STATE.schema.chartTitle) {
        chartCard.style.display = 'none';
        return;
    }

    chartCard.style.display = '';
    chartTitle.textContent   = STATE.schema.chartTitle;

    if (STATE.chart) {
        STATE.chart.destroy();
        STATE.chart = null;
    }

    const cfg = STATE.schema.chart(data);
    const isDark = !document.body.classList.contains('light-mode');
    const gridColor  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
    const tickColor  = isDark ? 'rgba(255,255,255,0.45)' : '#6b7280';
    const legendColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';

    STATE.chart = new Chart(document.getElementById('rp-chart'), {
        type: cfg.type,
        data: {
            labels: cfg.labels,
            datasets: cfg.datasets,
        },
        options: {
            responsive: true,
            animation: { duration: 700, easing: 'easeOutQuart' },
            plugins: {
                legend: {
                    labels: { color: legendColor, font: { family: 'Montserrat', size: 11 } }
                },
                tooltip: {
                    backgroundColor: isDark ? '#1a1d2e' : '#fff',
                    titleColor:  isDark ? '#fff' : '#111827',
                    bodyColor:   isDark ? 'rgba(255,255,255,0.7)' : '#374151',
                    borderColor: 'rgba(144,105,249,0.3)',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 10,
                }
            },
            scales: {
                x: {
                    ticks:  { color: tickColor, font: { family: 'Montserrat', size: 10 } },
                    grid:   { color: gridColor, drawBorder: false },
                },
                y: {
                    ticks:  { color: tickColor, font: { family: 'Montserrat', size: 10 } },
                    grid:   { color: gridColor, drawBorder: false },
                }
            }
        }
    });
}

// ── TABLE ──────────────────────────────────────────────────────────────────
function renderTable() {
    const { data, schema, page, perPage } = STATE;
    const totalPages = Math.ceil(data.length / perPage);
    const slice = data.slice((page - 1) * perPage, page * perPage);

    document.getElementById('rp-thead').innerHTML =
        `<tr>${schema.columns.map(c => `<th>${c}</th>`).join('')}</tr>`;

    document.getElementById('rp-tbody').innerHTML = slice.map(r =>
        `<tr>${schema.row(r).map(c => `<td>${c}</td>`).join('')}</tr>`
    ).join('');

    document.getElementById('rp-pg-info').textContent = `Page ${page} of ${totalPages}`;
    document.getElementById('rp-pg-prev').disabled = page <= 1;
    document.getElementById('rp-pg-next').disabled = page >= totalPages;
}

// ── SUMMARY ────────────────────────────────────────────────────────────────
function renderSummary() {
    const items = STATE.schema.summary(STATE.data);
    document.getElementById('rp-summary').innerHTML = items.map(item => `
        <div class="rp-summary-item">
            <span class="rp-summary-item__label">${item.label}</span>
            <span class="rp-summary-item__value${item.accent ? ' rp-summary-item__value--accent' : ''}">${item.value}</span>
        </div>`).join('');
}

// ── EXPORT PDF ─────────────────────────────────────────────────────────────
function exportPDF() {
    const t = toast('loading', 'Generating PDF…');

    setTimeout(() => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const schema = STATE.schema;
            const rangeStr = (STATE.from && STATE.to)
                ? `${fmt(STATE.from)} – ${fmt(STATE.to)}`
                : 'All time';

            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(schema.title, 14, 20);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(120);
            doc.text(`Date range: ${rangeStr}`, 14, 28);
            doc.text(`Generated: ${new Date().toLocaleString()}  ·  Total records: ${STATE.data.length}`, 14, 33);
            doc.setTextColor(0);

            const stripHtml = s => String(s).replace(/<[^>]+>/g, '');
            const rows = STATE.data.map(r => schema.row(r).map(stripHtml));

            doc.autoTable({
                head: [schema.columns],
                body: rows,
                startY: 38,
                styles: { fontSize: 8, cellPadding: 3 },
                headStyles: { fillColor: [144, 105, 249], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 245, 250] },
                margin: { left: 14, right: 14 },
            });

            const summary = schema.summary(STATE.data);
            const fy = doc.lastAutoTable.finalY + 8;
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(summary.map(i => `${i.label}: ${i.value}`).join('   |   '), 14, fy);

            doc.save(`${schema.title.replace(/\s+/g,'_')}_${STATE.from||'all'}_${STATE.to||'all'}.pdf`);

            t.classList.add('rp-toast--out');
            setTimeout(() => { t.remove(); toast('success', 'PDF downloaded!'); }, 200);
        } catch (e) {
            t.remove();
            toast('loading', 'Export failed');
        }
    }, 300);
}

// ── EXPORT CSV ─────────────────────────────────────────────────────────────
function exportCSV() {
    const t = toast('loading', 'Generating CSV…');

    setTimeout(() => {
        const schema = STATE.schema;
        const stripHtml = s => String(s).replace(/<[^>]+>/g, '');
        const escape = s => s.includes(',') || s.includes('"') ? `"${s.replace(/"/g,'""')}"` : s;

        const header = schema.columns.join(',');
        const rows   = STATE.data.map(r =>
            schema.row(r).map(c => escape(stripHtml(c))).join(',')
        );

        const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `${schema.title.replace(/\s+/g,'_')}_${STATE.from||'all'}_${STATE.to||'all'}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        t.classList.add('rp-toast--out');
        setTimeout(() => { t.remove(); toast('success', 'CSV downloaded!'); }, 200);
    }, 200);
}
