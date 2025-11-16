function generateTransactionPDF(user, transaction) {
    const doc = new window.jspdf.jsPDF();
    
    doc.setFontSize(14);
    doc.text("POKÉMON BANK - COMPROBANTE DE TRANSACCIÓN", 10, 10);
    doc.setFontSize(10);
    doc.text("-----------------------------------------------------", 10, 15);
    
    doc.text(`Fecha/Hora: ${transaction.date}`, 10, 25);
    doc.text(`Titular: ${user.nombre}`, 10, 30);
    doc.text(`Cuenta No.: ${user.cuenta}`, 10, 35);
    
    doc.text("-----------------------------------------------------", 10, 45);
    
    doc.text(`TIPO: ${transaction.type.toUpperCase()}`, 10, 55);
    doc.text(`MONTO: $${transaction.amount.toFixed(2)}`, 10, 60);
    doc.text(`SALDO FINAL: $${user.saldo.toFixed(2)}`, 10, 65);

    doc.save(`Comprobante_${transaction.type}_${transaction.id}.pdf`);
}

async function showTransactionChart(user) {
    const transactions = user.transacciones;
    
    // 1. Contar todas las categorías de transacciones
    const transactionCounts = transactions.reduce((counts, t) => {
        if (t.type === 'Depósito') { 
            counts.Depósitos++; 
        } else if (t.type === 'Retiro') { 
            counts.Retiros++; 
        } else if (t.type === 'Pago (Tarjeta)') {
            counts['Pago Tarjeta']++; // Contar pagos de tarjeta
        } else if (t.type === 'Pago (Servicio)') {
            counts['Pago Servicio']++; // Contar pagos de servicio
        }
        return counts;
    }, { 
        Depósitos: 0, 
        Retiros: 0, 
        'Pago Tarjeta': 0, // Inicializar contador
        'Pago Servicio': 0  // Inicializar contador
    });

    // 2. Definir etiquetas y datos para el gráfico
    const labels = Object.keys(transactionCounts);
    const data = Object.values(transactionCounts);
    
    // 3. Definir colores para las 4 categorías
    const backgroundColors = [
        'rgba(75, 192, 192, 0.6)', // Verde para Depósito
        'rgba(255, 99, 132, 0.6)', // Rojo para Retiro
        'rgba(255, 205, 86, 0.6)', // Amarillo/Oro para Pago Tarjeta
        'rgba(54, 162, 235, 0.6)'  // Azul para Pago Servicio
    ];
    
    const borderColors = [
        'rgba(75, 192, 192, 1)', 
        'rgba(255, 99, 132, 1)', 
        'rgba(255, 205, 86, 1)',
        'rgba(54, 162, 235, 1)'
    ];


    const chartData = {
        labels: labels,
        datasets: [{
            label: '# de Transacciones',
            data: data,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1
        }]
    };

    // Usa SweetAlert para mostrar el gráfico
    await Swal.fire({
        title: '📊 Análisis de Transacciones',
        html: '<div style="height: 300px; width: 100%;"><canvas id="transactionsChart"></canvas></div>',
        willOpen: () => {
            const ctx = document.getElementById('transactionsChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: { display: true, text: 'Conteo de Depósitos, Retiros y Pagos' }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { precision: 0 } }
                    }
                }
            });
        },
        confirmButtonText: 'Cerrar'
    });
}