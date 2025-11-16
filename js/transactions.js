// Constraints para ValidateJS
const transactionConstraints = {
    amount: {
        presence: { allowEmpty: false, message: "El monto es obligatorio." },
        numericality: {
            greaterThan: 0, 
            message: "Debe ingresar una cantidad numérica válida mayor a cero."
        }
    }
};

function recordTransaction(user, type, amount) {
    const newTransaction = {
        id: user.transacciones.length + 1,
        type: type,
        amount: Math.abs(amount), 
        date: new Date().toLocaleString()
    };
    
    user.saldo += amount; 
    
    // Solo se registra en historial si es Depósito, Retiro o Pago.
    if (type.includes('Depósito') || type.includes('Retiro') || type.includes('Pago')) {
        user.transacciones.push(newTransaction);
    }
    
    saveUserData(user); 
    return newTransaction;
}

// --- LÓGICA DE DEPÓSITO Y RETIRO ---

async function handleDeposit(depositAmount) {
    const user = loadUserData();
    
    const result = await Swal.fire({
        title: 'Confirmar Depósito',
        html: `¿Desea depositar <strong>$${depositAmount.toFixed(2)}</strong> a su cuenta?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, Depositar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        const transactionRecord = recordTransaction(user, 'Depósito', depositAmount);
        
        await Swal.fire({
            icon: 'success',
            title: 'Depósito Exitoso',
            html: `Se depositaron <strong>$${depositAmount.toFixed(2)}</strong>.<br>
                   Nuevo Saldo: <strong>$${user.saldo.toFixed(2)}</strong>.`,
            showDenyButton: true,
            confirmButtonText: 'Imprimir Comprobante',
            denyButtonText: 'Volver al Menú'
        }).then((printResult) => {
            if (printResult.isConfirmed) {
                generateTransactionPDF(user, transactionRecord); 
            }
        });
    }
    
    window.location.href = 'menu.html';
}

async function handleWithdrawal(withdrawalAmount) {
    const user = loadUserData();
    
    if (withdrawalAmount > user.saldo) {
        await Swal.fire({
            icon: 'error',
            title: 'Saldo Insuficiente',
            html: `No tiene saldo disponible.<br>Saldo actual: <strong>$${user.saldo.toFixed(2)}</strong>.`,
            confirmButtonText: 'Volver al Menú'
        });
        return window.location.href = 'menu.html';
    }

    const result = await Swal.fire({
        title: 'Confirmar Retiro',
        html: `¿Desea retirar <strong>$${withdrawalAmount.toFixed(2)}</strong> de su cuenta?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, Retirar',
        cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
        const transactionRecord = recordTransaction(user, 'Retiro', -withdrawalAmount); 

        await Swal.fire({
            icon: 'success',
            title: 'Retiro Exitoso',
            html: `Se retiraron <strong>$${withdrawalAmount.toFixed(2)}</strong>.<br>
                   Nuevo Saldo: <strong>$${user.saldo.toFixed(2)}</strong>.`,
            showDenyButton: true,
            confirmButtonText: 'Imprimir Comprobante',
            denyButtonText: 'Volver al Menú'
        }).then((printResult) => {
            if (printResult.isConfirmed) {
                generateTransactionPDF(user, transactionRecord); 
            }
        });
    }

    window.location.href = 'menu.html';
}

// --- LÓGICA DE PAGO (Usa SweetAlert para Input/Proceso) ---

/**
 * Muestra SweetAlert para solicitar el monto y procesa el pago.
 * @param {string} paymentType - 'Tarjeta' o 'Servicio'
 */
async function promptPaymentAmount(paymentType) {
    const user = loadUserData();
    
    // 1. Solicitar el monto usando SweetAlert
    const { value: amountString } = await Swal.fire({
        title: `Ingrese el Monto del Pago (${paymentType})`,
        input: 'text',
        inputLabel: 'Monto a pagar:',
        inputPlaceholder: 'Ej. 50.00',
        confirmButtonText: 'Confirmar Pago',
        showCancelButton: true,
        cancelButtonText: 'Cancelar y Volver',
        // Validar el input usando ValidateJS
        inputValidator: (value) => {
            const validationResult = validate({amount: value}, transactionConstraints);
            if (validationResult) { return validationResult.amount.join('\n'); }
        }
    });

    if (amountString) {
        const paymentAmount = parseFloat(amountString);
        
        // 2. Verificar saldo
        if (paymentAmount > user.saldo) {
            await Swal.fire({
                icon: 'error',
                title: 'Saldo Insuficiente',
                html: `No tiene saldo disponible para pagar.<br>Saldo actual: <strong>$${user.saldo.toFixed(2)}</strong>.`,
                confirmButtonText: 'Volver al Menú'
            });
            return window.location.href = 'menu.html';
        }
        
        // 3. Confirmación y Registro de Transacción
        const confirmation = await Swal.fire({
            title: 'Confirmar Pago',
            html: `¿Desea pagar <strong>$${paymentAmount.toFixed(2)}</strong> por ${paymentType}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, Pagar',
            cancelButtonText: 'Cancelar'
        });

        if (confirmation.isConfirmed) {
            const transactionRecord = recordTransaction(user, `Pago (${paymentType})`, -paymentAmount); // El pago es un retiro (negativo)

            await Swal.fire({
                icon: 'success',
                title: 'Pago Exitoso',
                html: `Se pagaron <strong>$${paymentAmount.toFixed(2)}</strong> por ${paymentType}.<br>
                       Nuevo Saldo: <strong>$${user.saldo.toFixed(2)}</strong>.`,
                showDenyButton: true,
                confirmButtonText: 'Imprimir Comprobante',
                denyButtonText: 'Volver al Menú'
            }).then((printResult) => {
                if (printResult.isConfirmed) {
                    generateTransactionPDF(user, transactionRecord); 
                }
            });
        }
    }
    
    // Si cancela la entrada o la confirmación, vuelve al menú
    window.location.href = 'menu.html';
}


// --- LÓGICA DE BALANCE ---

function displayBalanceHistory(user) {
    const infoDiv = document.getElementById('information');
    const tableBody = document.getElementById('transaction-history');

    if (!infoDiv || !tableBody) return; 

    // 1. Actualizar Datos de la Cuenta
    infoDiv.innerHTML = `
        <h4>Datos de la cuenta</h4>
        <p><strong>Titular:</strong> ${user.nombre}</p>
        <p><strong>Num. de cuenta:</strong> ${user.cuenta}</p>
        <p><strong>Saldo actual:</strong> $${user.saldo.toFixed(2)}</p>
    `;

    // 2. Llenar la Tabla de Historial
    tableBody.innerHTML = '';
    
    if (user.transacciones.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No hay transacciones registradas.</td></tr>';
        return;
    }

    [...user.transacciones].reverse().forEach(t => { 
        const row = tableBody.insertRow();
        const isDebit = t.type.includes('Retiro') || t.type.includes('Pago');
        const amountDisplay = (isDebit ? '-' : '+') + `$${t.amount.toFixed(2)}`;
        
        let details;
        if (t.type.includes('Depósito')) details = 'Ingreso de efectivo';
        else if (t.type.includes('Retiro')) details = 'Retiro de efectivo';
        else if (t.type.includes('Pago (Tarjeta)')) details = 'Pago de tarjeta de crédito';
        else if (t.type.includes('Pago (Servicio)')) details = 'Pago de servicios básicos';
        else details = t.type; // En caso de otro tipo

        row.innerHTML = `
            <td>${t.date.split(',')[0]}</td>
            <td>${t.type}</td>
            <td style="color: ${isDebit ? 'red' : 'green'}; font-weight: bold;">${amountDisplay}</td>
            <td>${details}</td>
        `;
    });
}