document.getElementById("purchasego").addEventListener("click", function () {
    window.location.href = "Purchase.html";
});

document.getElementById("storagego").addEventListener("click", function () {
    window.location.href = "Storage.html";
});
document.addEventListener("DOMContentLoaded", function () {
    // 🍩 Doughnut Chart - Spending Chart
    const doughnutChart = new Chart(document.getElementById('doughnutChart'), {
        type: 'doughnut',
        data: {
            labels: ['Ink', 'Additives', 'Tapes', 'Devices'],
            datasets: [{
                labels: ['Ink', 'Additives', 'Tapes', 'Devices'],
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
                    position: 'bottom', // Pone los labels debajo del canvas
                    labels: {
                        color: 'white', // Color del texto de los labels (puedes cambiarlo si no es fondo oscuro)
                        usePointStyle: true, // Cambia línea por punto
                        pointStyle: 'circle', // Forma del punto
                        boxWidth: 10,
                        boxHeight: 10,
                        padding: 15
                    }
                }
            }
        },
        plugins: [{
            afterDraw: function (chart) {
                let ctx = chart.ctx;
                let width = chart.width;
                let height = chart.height;

                ctx.save();
                let fontSize = (height / 10).toFixed(2);

                document.fonts.load("bold " + fontSize + "px Poppins").then(function () {
                    ctx.font = fontSize + "px 'Poppins', sans-serif";
                    ctx.textBaseline = "middle";
                    ctx.textAlign = "center";

                    let text = "$5,285";
                    let textX = width / 2;
                    let textY = height / 2 - 10;

                    let percentage = "+2.4%";
                    let percentageY = height / 2 + 15;

                    ctx.fillStyle = "#ffffff";
                    ctx.fillText(text, textX, textY);

                    ctx.font = "bold " + (fontSize / 1.5) + "px 'Poppins', sans-serif";
                    ctx.fillStyle = "#ff4d4d";
                    ctx.fillText(percentage, textX, percentageY);
                });
            }
        }]
    });
});

const purchaseCtx = document.getElementById('purchaseChart').getContext('2d');

const purchaseChart = new Chart(purchaseCtx, {
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
            layout: {
                padding: 20
            },
            legend: {
                position: 'bottom',
                labels: {
                    color: 'white',
                    usePointStyle: true,
                    pointStyle: 'circle',
                    boxWidth: 10,
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
