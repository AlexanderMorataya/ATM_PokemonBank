const INITIAL_USER_DATA = {
    nombre: "Ash Ketchum", 
    pin: "1234", 
    cuenta: "0987654321", 
    saldo: 500.00, 
    transacciones: [] 
};

const LOCAL_STORAGE_KEY = 'pokemonBankUser';

function loadUserData() {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
        return JSON.parse(data);
    } else {
        saveUserData(INITIAL_USER_DATA);
        return INITIAL_USER_DATA;
    }
}

function saveUserData(userData) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
}

function handleLogout(message = 'Sesión cerrada.') {
    Swal.fire({
        icon: 'success',
        title: '¡Gracias por usar Pokémon Bank!',
        text: message,
        confirmButtonText: 'Aceptar'
    }).then(() => {
        window.location.href = 'login.html';
    });
}