// ----------------------------------------------------
// MANEJO DE TECLADO EN LOGIN.HTML
// ----------------------------------------------------
function setupLoginKeypad() {
    const inputField = document.getElementById('number-box');
    const user = loadUserData();
    const correctPin = user.pin;

    const pinConstraints = {
        pin: {
            presence: { allowEmpty: false, message: "El PIN no puede estar vacío." },
            numericality: { onlyInteger: true, message: "El PIN debe contener solo números." },
            length: { is: 4, message: "El PIN debe tener exactamente 4 dígitos." }
        }
    };

    // ... lógica del teclado y botones de acción (clear, cancel, enter) ...
    document.querySelectorAll('#keyboard').forEach(button => {
        button.addEventListener('click', () => {
            if (inputField.value.length < 4) {
                inputField.value += button.textContent;
            }
        });
    });

    document.querySelectorAll('#action-btn').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.textContent.trim().toLowerCase();
            
            if (action === 'clear') {
                inputField.value = '';
            } else if (action === 'cancel') {
                handleLogout("Operación cancelada.");
            } else if (action === 'enter') {
                const enteredPin = inputField.value;
                const validationResult = validate({pin: enteredPin}, pinConstraints);
                
                if (validationResult) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Error de Formato/PIN',
                        html: validationResult.pin.join('<br>'),
                        confirmButtonText: 'Aceptar'
                    }).then(() => { inputField.value = ''; }); 
                } else if (enteredPin === correctPin) {
                    Swal.fire({
                        icon: 'success',
                        title: `¡Bienvenido, ${user.nombre}!`,
                        text: `Acceso exitoso.`,
                        confirmButtonText: 'Continuar'
                    }).then(() => {
                        window.location.href = 'menu.html'; 
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'PIN Incorrecto',
                        text: 'El PIN ingresado no es válido.',
                        confirmButtonText: 'Reintentar'
                    }).then(() => { inputField.value = ''; }); 
                }
            }
        });
    });
    
     document.getElementById('close-bottom').addEventListener('click', () => handleLogout());
}


// ----------------------------------------------------
// LÓGICA DE MENÚ (menu.html)
// ----------------------------------------------------
function setupMenuPage() {
    const user = loadUserData();
    
    // 1. Actualizar datos en menu.html
    const nameSpan = document.getElementById('user-name-span');
    const accountSpan = document.getElementById('user-account-span');

    if (nameSpan) nameSpan.textContent = user.nombre;
    if (accountSpan) accountSpan.textContent = user.cuenta;

    // 2. Configurar botones de navegación
    document.querySelectorAll('#operation-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const operation = e.target.textContent.trim();
            if (operation === 'Deposito') {
                window.location.href = 'deposit.html';
            } else if (operation === 'Retiro') {
                window.location.href = 'getcash.html';
            } else if (operation === 'Consultas') {
                window.location.href = 'balance.html';
            } else if (operation === 'Pago') {
                window.location.href = 'payment.html'; 
            }
        });
    });

    // 3. Botón Retirar tarjeta (Salir)
    document.getElementById('close-bottom').addEventListener('click', () => handleLogout());
}

// ----------------------------------------------------
// LÓGICA DE INPUT DE TRANSACCIÓN (deposit.html, getcash.html)
// ----------------------------------------------------

function setupTransactionInputPage(type) {
    const numberBox = document.getElementById('number-box');
    const continueBtn = document.getElementById('continue-btn');
    const returnBtn = document.getElementById('return-btn');
    
    // 1. Botón Continuar (Valida y procesa)
    if (continueBtn) {
        continueBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const enteredValue = numberBox.value;
            const validationResult = validate({amount: enteredValue}, transactionConstraints);

            if (validationResult) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Error de Validación',
                    html: validationResult.amount.join('<br>'),
                    confirmButtonText: 'Reintentar'
                }).then(() => {
                    numberBox.value = ''; 
                });
            } else {
                const amount = parseFloat(enteredValue);
                if (type === 'deposit') {
                    handleDeposit(amount);
                } else if (type === 'withdrawal') {
                    handleWithdrawal(amount);
                }
            }
        });
    }

    // 2. Botón Regresar
    if (returnBtn) {
        returnBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'menu.html';
        });
    }
}


// ----------------------------------------------------
// LÓGICA DE PAGO (payment.html)
// ----------------------------------------------------

function setupPaymentPage() {
    // 1. Configurar botones de operación (Tarjetas, Servicios) usando #operation-btn
    document.querySelectorAll('#operation-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const operationText = e.target.textContent.trim();
            if (operationText === 'Tarjetas') {
                promptPaymentAmount('Tarjeta'); // Llama a la función de pago
            } else if (operationText === 'Servicios') {
                promptPaymentAmount('Servicio'); // Llama a la función de pago
            }
        });
    });
    
    // 2. Botón Regresar (ID: #return-btn-2 en payment.html)
    document.getElementById('return-btn-2')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'menu.html';
    });
}


// ----------------------------------------------------
// LÓGICA DE CONSULTAS (balance.html)
// ----------------------------------------------------

function setupBalancePage() {
    const user = loadUserData();
    
    // 1. Mostrar historial y datos
    displayBalanceHistory(user);
    
    // 2. Configurar el BOTÓN para mostrar el gráfico (Chart.js)
    const analisisBtn = document.getElementById('analisis-btn');
    if (analisisBtn) {
        analisisBtn.addEventListener('click', () => {
            showTransactionChart(user); // Llama a la función que muestra el gráfico en SweetAlert
        });
    }

    // 3. Botón de regreso 
    const backButton = document.createElement('button');
    backButton.className = 'btn d-flex align-items-center py-3 px-3 m-3';
    backButton.innerHTML = '<ion-icon name="chevron-back-outline" class="mr-5"></ion-icon> Volver al Menú';
    backButton.style.position = 'fixed';
    backButton.style.bottom = '10px';
    backButton.style.left = '10px';
    document.body.appendChild(backButton);

    backButton.addEventListener('click', () => {
        window.location.href = 'menu.html';
    });
}

// ----------------------------------------------------
// INICIALIZACIÓN DE LA APLICACIÓN
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.includes('login.html') || path.endsWith('/')) {
        setupLoginKeypad(); 
    } else if (path.includes('menu.html')) {
        setupMenuPage();
    } else if (path.includes('deposit.html')) {
        setupTransactionInputPage('deposit'); 
    } else if (path.includes('getcash.html')) {
        setupTransactionInputPage('withdrawal');
    } else if (path.includes('balance.html')) {
        setupBalancePage();
    } else if (path.includes('payment.html')) {
        setupPaymentPage(); 
    }
});