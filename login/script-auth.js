// ========================================
// MANEJO DE LOGIN
// ========================================

function handleLoginSubmit(event) {
    event.preventDefault();
    
    const correo = document.getElementById('correo').value;
    const contrasena = document.getElementById('contrasena').value;
    const errorMessage = document.getElementById('errorMessage');
    const buttonText = document.getElementById('buttonText');
    const buttonLoader = document.getElementById('buttonLoader');
    const loginButton = document.querySelector('.login-button');
    
    // Limpiar mensaje de error
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
    
    // Mostrar loader
    buttonText.style.display = 'none';
    buttonLoader.style.display = 'inline-block';
    loginButton.disabled = true;
    
    // Hacer petición al servidor PHP
    fetch('php/login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            correo: correo,
            contrasena: contrasena
        })
    })
    .then(response => response.json())
    .then(data => {
        // Ocultar loader
        buttonText.style.display = 'inline';
        buttonLoader.style.display = 'none';
        loginButton.disabled = false;
        
        if (data.success) {
            // Guardar sesión en localStorage
            localStorage.setItem('userSession', JSON.stringify({
                id: data.user.ID_Usuario,
                nombre: data.user.NombreCompleto,
                correo: data.user.Correo,
                tipo: data.user.TipoUsuario,
                foto: data.user.Foto
            }));
            
            // Redirigir según el tipo de usuario
            if (data.user.TipoUsuario === 'CEO' || data.user.TipoUsuario === 'Vendedor') {
                globalThis.location.href = '/administracion/administracion.html';
            } else if (data.user.TipoUsuario === 'Cliente') {
                globalThis.location.href = 'index.html';
            }
        } else {
            // Mostrar error
            errorMessage.textContent = data.message || 'Credenciales incorrectas';
            errorMessage.classList.add('show');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        buttonText.style.display = 'inline';
        buttonLoader.style.display = 'none';
        loginButton.disabled = false;
        
        errorMessage.textContent = 'Error de conexión. Verifica que XAMPP esté activo.';
        errorMessage.classList.add('show');
    });
}

// ========================================
// VERIFICAR SESIÓN ACTIVA
// ========================================

function checkSession() {
    const session = localStorage.getItem('userSession');
    
    if (session) {
        const user = JSON.parse(session);
        return user;
    }
    
    return null;
}

// ========================================
// CERRAR SESIÓN
// ========================================

function logout() {
    localStorage.removeItem('userSession');
    globalThis.location.href = 'index.html';
}

// ========================================
// AGREGAR OPCIÓN "PANEL" AL MENÚ SI HAY SESIÓN
// ========================================

function addPanelOption() {
    const user = checkSession();
    
    if (user && (user.tipo === 'CEO' || user.tipo === 'Vendedor')) {
        const dropdownMenu = document.querySelector('.dropdown-menu');
        
        if (dropdownMenu) {
            // Verificar si ya existe la opción
            const existingPanel = Array.from(dropdownMenu.querySelectorAll('a')).find(
                a => a.textContent.includes('Panel')
            );
            
            if (!existingPanel) {
                const panelItem = document.createElement('li');
                panelItem.innerHTML = '<a href="/administracion/administracion.html">Panel de Administración</a>';
                dropdownMenu.insertBefore(panelItem, dropdownMenu.firstChild);
            }
        }
        
        // Cambiar botón de login por logout
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.innerHTML = `
                <button onclick="logout()" class="login-icon-btn" title="Cerrar sesión">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </button>
            `;
        }
    }
}

// Ejecutar al cargar la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addPanelOption);
} else {
    addPanelOption();
}