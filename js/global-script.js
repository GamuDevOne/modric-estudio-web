// ========================================
// EFECTO SCROLL EN EL HEADER
// ========================================
window.addEventListener('scroll', function() {
    const header = document.getElementById('header');
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
});

// ========================================
// NAVEGACIÓN SUAVE
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerHeight = document.getElementById('header').offsetHeight;
            const targetPosition = target.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});


// ========================================
// SCROLL TO TOP
// ========================================
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// ========================================
// TOGGLE MENÚ DE LOGIN
// ========================================
function toggleLoginMenu() {
    const loginMenu = document.getElementById('loginMenu');
    if (loginMenu) {
        loginMenu.classList.toggle('active');
    }
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
    globalThis.location.href = '/PaginaWebMS/index.html';
}

// ========================================
// AGREGAR OPCIÓN "PANEL..." AL MENÚ SI HAY SESIÓN
// ========================================
function addPanelOption() {
    const user = checkSession();
    
    if (user && (user.tipo === 'CEO' || user.tipo === 'Vendedor')) {
        const dropdownMenu = document.querySelector('.dropdown-menu');
        
        if (dropdownMenu) {
            // Verificar si ya existe la opción
            const existingPanel = Array.from(dropdownMenu.querySelectorAll('a')).find(
                a => a.textContent.includes('administracion')
            );
            
            if (!existingPanel) {
                const panelItem = document.createElement('li');
                panelItem.innerHTML = '<a href="administracion/administracion.html">Panel de Administración</a>';
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

// Cerrar menú de login al hacer clic fuera
document.addEventListener('click', function(e) {
    const loginBtn = document.querySelector('.login-btn');
    const loginMenu = document.getElementById('loginMenu');
    
    if (loginBtn && loginMenu && !loginBtn.contains(e.target)) {
        loginMenu.classList.remove('active');
    }
});

// ========================================
// ACTIVAR LINK SEGÚN SECCIÓN
// ========================================
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav a');
    const header = document.getElementById('header');
    
    if (sections.length > 0 && navLinks.length > 0 && header) {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const headerHeight = header.offsetHeight;
            
            if (window.scrollY >= (sectionTop - headerHeight - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }
});


// Ejecutar al cargar la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addPanelOption);
} else {
    addPanelOption();
}

// Reemplazar la función de transparencia de iconos sociales
document.addEventListener('DOMContentLoaded', function() {
    const socialIcons = document.querySelector('.social-icons');
    const contactSection = document.getElementById('contacto');

    if (socialIcons && contactSection) {
        window.addEventListener('scroll', function() {
            const contactRect = contactSection.getBoundingClientRect();
            
            // Si la sección de contacto está visible
            if (contactRect.top < window.innerHeight && contactRect.bottom > 0) {
                socialIcons.style.opacity = '0.2';
            } else {
                socialIcons.style.opacity = '1';
            }
        });

        // Efecto hover
        socialIcons.addEventListener('mouseenter', function() {
            this.style.opacity = '1';
        });

        socialIcons.addEventListener('mouseleave', function() {
            const contactRect = contactSection.getBoundingClientRect();
            if (contactRect.top < window.innerHeight && contactRect.bottom > 0) {
                this.style.opacity = '0.2';
            }
        });
    }
});



