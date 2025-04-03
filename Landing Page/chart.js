const ctx = document.getElementById('purchaseChart').getContext('2d');
const purchaseChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jan 14', 'Jan 28', 'Feb 11', 'Feb 25', 'Mar 10'],
        datasets: [
            {
                label: 'Ink',
                data: [10, 25, 5, 20, 15],
                borderColor: '#38ff9a',
                backgroundColor: 'transparent',
                pointBackgroundColor: '#38ff9a',
                pointRadius: 0.09,
                borderWidth: 3,
                tension: 0.4
            },
            {
                label: 'Additive',
                data: [5, 15, 20, 10, 12],
                borderColor: '#8a48ff',
                backgroundColor: 'transparent',
                pointBackgroundColor: '#8a48ff',
                pointRadius: 0.09,
                borderWidth: 3,
                tension: 0.4
            },
            {
                label: 'Tapes',
                data: [12, 8, 15, 18, 25],
                borderColor: '#ff4a4a',
                backgroundColor: 'transparent',
                pointBackgroundColor: '#ff4a4a',
                pointRadius: 0.09,
                borderWidth: 3,
                tension: 0.4
            },
            {
                label: 'Devices',
                data: [3, 5, 8, 7, 4],
                borderColor: '#4295ff',
                backgroundColor: 'transparent',
                pointBackgroundColor: '#4295ff',
                pointRadius: 0.09,
                borderWidth: 3,
                tension: 0.4
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            layout:{
                padding: 20
            },
            legend: {
                position: 'bottom',
                labels: {
                    color: 'white',
                    usePointStyle: true,
                    pointStyle: 'circle',
                    boxWidth: 20,
                    boxHeight: 6,
                    padding: 10
                }
            }
        },
        scales: {
            x: { ticks: { color: 'white' } },
            y: { ticks: { color: 'white' }, beginAtZero: true }
        }
    }
});
