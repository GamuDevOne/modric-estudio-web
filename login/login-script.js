// ========================================
// MANEJO DE LOGIN - VERSIÓN CON USUARIO O CORREO
// ========================================

function handleLoginSubmit(event) {
    event.preventDefault();
    
    const usuarioCorreo = document.getElementById('usuarioCorreo').value.trim();
    const contrasena = document.getElementById('contrasena').value;
    const errorMessage = document.getElementById('errorMessage');
    const buttonText = document.getElementById('buttonText');
    const buttonLoader = document.getElementById('buttonLoader');
    const loginButton = document.querySelector('.login-button');
    
    // Validación básica
    if (!usuarioCorreo || !contrasena) {
        errorMessage.textContent = 'Por favor, completa todos los campos';
        errorMessage.classList.add('show');
        return;
    }
    
    // Limpiar mensaje de error
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
    
    // Mostrar loader
    buttonText.style.display = 'none';
    buttonLoader.style.display = 'inline-block';
    loginButton.disabled = true;
    
    // Hacer petición al servidor PHP
    fetch('../php/login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            usuarioCorreo: usuarioCorreo,
            contrasena: contrasena
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error del servidor: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        // Ocultar loader
        buttonText.style.display = 'inline';
        buttonLoader.style.display = 'none';
        loginButton.disabled = false;
        
        if (data.success) {
            const sessionData = {
                id: data.user.ID_Usuario,
                nombre: data.user.NombreCompleto,
                correo: data.user.Correo,
                usuario: data.user.Usuario,
                tipo: data.user.TipoUsuario,
                foto: data.user.Foto
            };
            
            localStorage.setItem('userSession', JSON.stringify(sessionData));
            
            // Redirigir según el tipo de usuario
            if (data.user.TipoUsuario === 'CEO' || data.user.TipoUsuario === 'Vendedor') {
                window.location.replace('../administracion/administracion.html');
            } else if (data.user.TipoUsuario === 'Cliente') {
                window.location.replace('../index.html');
            }
        } else {
            errorMessage.textContent = data.message || 'Credenciales incorrectas';
            errorMessage.classList.add('show');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        buttonText.style.display = 'inline';
        buttonLoader.style.display = 'none';
        loginButton.disabled = false;
        
        if (error.name === 'TypeError') {
            errorMessage.textContent = 'Error de conexión. Verifica que XAMPP esté activo.';
        } else {
            errorMessage.textContent = 'Error inesperado. Intenta nuevamente.';
        }
        errorMessage.classList.add('show');
    });
}

// Verificar sesión existente SOLO en página de login
function checkExistingSession() {
    // Solo ejecutar en página de login
    if (!window.location.pathname.includes('login.html')) {
        return false;
    }
    
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
        try {
            const user = JSON.parse(userSession);
            if (user && user.tipo && user.id) {
                if (user.tipo === 'CEO' || user.tipo === 'Vendedor') {
                    window.location.replace('../administracion/administracion.html');
                } else if (user.tipo === 'Cliente') {
                    window.location.replace('../index.html');
                }
                return true;
            }
        } catch (e) {
            console.error('Error al parsear la sesión:', e);
            localStorage.removeItem('userSession');
        }
    }
    return false;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // Solo verificar sesión si estamos en login
    if (window.location.pathname.includes('login.html')) {
        checkExistingSession();
    }
});