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
// TOGGLE MENÚ DROPDOWN "MÁS"
// ========================================
function toggleDropdownMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropdown = event.target.closest('.dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
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
    window.location.href = '/PaginaWebMS/index.html';
}

// ========================================
// AGREGAR OPCIÓN "VISTA DE..." AL MENÚ SI HAY SESIÓN
// ========================================
function addPanelOption() {
    const user = checkSession();
    
    // Validar que existe sesión
    if (!user || !user.tipo) {
        return;
    }
    
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const loginBtn = document.querySelector('.login-btn');
    
    if (!dropdownMenu || !loginBtn) {
        return;
    }

    // Verificar si ya existe la opción de panel
    const existingPanel = Array.from(dropdownMenu.querySelectorAll('a')).find(
        a => a.textContent.includes('Panel') || a.textContent.includes('Vista')
    );
    
    if (!existingPanel) {
        const panelItem = document.createElement('li');

        // Detectar la ruta base correcta según la ubicación actual
        const currentPath = window.location.pathname;
        let basePath = './';

        // Si estamos en una subcarpeta (textiles, carnet, etc), ajustar ruta
        if (currentPath.includes('/textiles/') || 
            currentPath.includes('/carnet/') || 
            currentPath.includes('/login/')) {
            basePath = '../';
        }
        
        if (user.tipo === 'CEO') {
            panelItem.innerHTML = `<a href="${basePath}administracion/administracion.html">Panel de Administración</a>`;
        } else if (user.tipo === 'Vendedor') {
            panelItem.innerHTML = `<a href="${basePath}administracion/vistaVendedor/vendedor.html">Panel de vendedor</a>`;
        } else if (user.tipo === 'Cliente') {
            panelItem.innerHTML = `<a href="${basePath}clientes/mis-albumes.html">Mis Álbumes</a>`;
        }
        
        dropdownMenu.insertBefore(panelItem, dropdownMenu.firstChild);
    }

    // Cambiar botón de login por logout (una sola vez)
    loginBtn.innerHTML = `
        <button onclick="logout()" class="login-icon-btn" title="Cerrar sesión" aria-label="Cerrar sesión">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
        </button>
    `;
}

// ========================================
// CERRAR MENÚS AL HACER CLIC FUERA
// ========================================
document.addEventListener('click', function(e) {
    // Cerrar menú de login
    const loginBtn = document.querySelector('.login-btn');
    const loginMenu = document.getElementById('loginMenu');
    
    if (loginBtn && loginMenu && !loginBtn.contains(e.target)) {
        loginMenu.classList.remove('active');
    }
    
    // Cerrar menú dropdown "MÁS"
    const dropdown = document.querySelector('.dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
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


// ========================================
// INICIALIZAR AL CARGAR LA PÁGINA
// ========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        addPanelOption();
        initDropdownMenu();
    });
} else {
    addPanelOption();
    initDropdownMenu();
}

// ========================================
// INICIALIZAR MENÚ DROPDOWN
// ========================================
function initDropdownMenu() {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    if (dropdownToggle) {
        // Remover comportamiento onclick inline si existe
        dropdownToggle.removeAttribute('onclick');
        // Agregar event listener
        dropdownToggle.addEventListener('click', toggleDropdownMenu);
    }
}

// ========================================
// EFECTO DE TRANSPARENCIA EN ICONOS SOCIALES
// ========================================
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

// ========================================
// MENÚ MÓVIL HAMBURGUESA
// ========================================
function toggleMobileMenu() {
    const nav = document.getElementById('mainNav');
    const menuToggle = document.getElementById('mobileMenuToggle');
    const body = document.body;
    
    if (nav && menuToggle) {
        nav.classList.toggle('active');
        menuToggle.classList.toggle('active');
        body.classList.toggle('menu-open');
    }
}

// Cerrar menú móvil al hacer click en un link
function closeMobileMenuOnClick() {
    const navLinks = document.querySelectorAll('#mainNav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Si es un link interno (no dropdown toggle)
            if (!this.classList.contains('dropdown-toggle')) {
                const nav = document.getElementById('mainNav');
                const menuToggle = document.getElementById('mobileMenuToggle');
                const body = document.body;
                
                if (window.innerWidth <= 768) {
                    nav.classList.remove('active');
                    menuToggle.classList.remove('active');
                    body.classList.remove('menu-open');
                }
            }
        });
    });
}

// Cerrar menú al hacer click en el overlay
document.addEventListener('click', function(e) {
    const nav = document.getElementById('mainNav');
    const menuToggle = document.getElementById('mobileMenuToggle');
    const body = document.body;
    
    // Si el menú está abierto y se hace click fuera
    if (nav && nav.classList.contains('active')) {
        if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
            nav.classList.remove('active');
            menuToggle.classList.remove('active');
            body.classList.remove('menu-open');
        }
    }
});

// Cerrar menú al cambiar tamaño de ventana
window.addEventListener('resize', function() {
    const nav = document.getElementById('mainNav');
    const menuToggle = document.getElementById('mobileMenuToggle');
    const body = document.body;
    
    if (window.innerWidth > 768) {
        if (nav) nav.classList.remove('active');
        if (menuToggle) menuToggle.classList.remove('active');
        body.classList.remove('menu-open');
    }
});

// Inicializar menú móvil
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    closeMobileMenuOnClick();
});