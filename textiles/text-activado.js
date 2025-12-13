document.addEventListener("DOMContentLoaded", () => {

    // ============================
    // REDIRECCIÓN SEGÚN ESTADO
    // ============================
    if (localStorage.getItem("textilActivo") !== "true") {
        window.location.href = "text-desactivado.html";
        return;
    }

    // ============================
    // CARGAR DATOS DESDE EDITOR
    // ============================
    function cargarConfiguracionTextiles() {
        const configGuardada = localStorage.getItem('configTextiles');
        if (configGuardada) {
            return JSON.parse(configGuardada);
        }
        
        // Configuración por defecto
        return {
            sweater: {
                nombre: 'Suéter Personalizado',
                activo: true,
                precios: { xs: 25, s: 25, m: 25, l: 28, xl: 28 },
                imagenes: ['../imagenes/polomodric.png', '../imagenes/polomodric.png', '../imagenes/polomodric.png']
            },
            abrigo: {
                nombre: 'Abrigo Personalizado',
                activo: true,
                precios: { s: 45, m: 45, l: 48, xl: 48, xxl: 50 },
                imagenes: ['../imagenes/abrigmodric.png', '../imagenes/abrigmodric.png', '../imagenes/abrigmodric.png']
            }
        };
    }

    const configTextiles = cargarConfiguracionTextiles();

    // ============================
    // ELEMENTOS DOM
    // ============================
    const grid = document.getElementById('productos-grid');
    const cartIcon = document.getElementById('cart-icon');
    const cartCount = document.getElementById('cart-count');
    const cartPanel = document.getElementById('cart-panel');
    const cartItemsList = document.getElementById('cart-items');
    const checkoutBtn = document.getElementById('checkout-btn');
    const cartTotal = document.getElementById('cart-total');
    const cartClose = document.getElementById('cart-close');

    let cart = [];

    // ============================
    // FUNCIONES PRINCIPALES
    // ============================

    // Renderizar productos desde la configuración
    function renderProductos() {
        grid.innerHTML = '';
        
        // Filtrar productos activos
        const productosActivos = Object.entries(configTextiles)
            .filter(([key, producto]) => producto.activo)
            .map(([key, producto]) => ({
                id: key,
                ...producto,
                tallas: Object.keys(producto.precios).filter(talla => producto.precios[talla] > 0),
                precioMinimo: Math.min(...Object.values(producto.precios).filter(p => p > 0))
            }));

        if (productosActivos.length === 0) {
            grid.innerHTML = `
                <div class="no-productos" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <p>No hay productos textiles disponibles en este momento.</p>
                </div>
            `;
            return;
        }

        productosActivos.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'producto-card';
            card.dataset.productoId = prod.id;

            const imagenPrincipal = prod.imagenes && prod.imagenes.length > 0 ? 
                prod.imagenes[0] : '../imagenes/placeholder.jpg';

            card.innerHTML = `
                <div class="producto-imagen-container">
                    <img src="${imagenPrincipal}" class="producto-img" alt="${prod.nombre}">
                    ${prod.imagenes && prod.imagenes.length > 1 ? 
                        '<div class="carrusel-indicador"><i class="fas fa-exchange-alt"></i></div>' : ''}
                </div>
                <div class="producto-info">
                    <h3 class="producto-nombre">${prod.nombre}</h3>
                    <div class="producto-precio">
                        <span class="precio-base">Desde: $${prod.precioMinimo}</span>
                    </div>
                    <div class="producto-tallas">
                        <label>Talla:</label>
                        <select class="producto-talla">
                            <option value="">Selecciona talla</option>
                            ${prod.tallas.map(talla => {
                                const precio = prod.precios[talla];
                                return `<option value="${talla}" data-precio="${precio}">${talla.toUpperCase()} - $${precio}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    <div class="producto-cantidad">
                        <label>Cantidad:</label>
                        <input type="number" class="cantidad-input" min="1" value="1">
                    </div>
                    <button class="add-to-cart-btn">
                        <i class="fas fa-cart-plus"></i> Añadir al carrito
                    </button>
                </div>
            `;

            grid.appendChild(card);

          // En la función renderProductos, modifica la parte del carrusel:

// Carrusel de imágenes mejorado
if (prod.imagenes && prod.imagenes.length > 1) {
    let currentIndex = 0;
    const imgEl = card.querySelector('.producto-img');
    const indicador = card.querySelector('.carrusel-indicador');
    
    // Hacer la imagen clickeable solo si hay múltiples imágenes
    imgEl.style.cursor = 'pointer';
    
    imgEl.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % prod.imagenes.length;
        imgEl.src = prod.imagenes[currentIndex];
        
        // Efecto de transición suave
        imgEl.style.opacity = '0.7';
        setTimeout(() => {
            imgEl.style.opacity = '1';
        }, 150);
        
        // Actualizar indicador (opcional - mostrar número)
        indicador.innerHTML = `<small>${currentIndex + 1}/${prod.imagenes.length}</small>`;
    });
}
            // Evento para agregar al carrito
            const addBtn = card.querySelector('.add-to-cart-btn');
            addBtn.addEventListener('click', () => {
                const tallaSelect = card.querySelector('.producto-talla');
                const talla = tallaSelect.value;
                const cantidad = parseInt(card.querySelector('.cantidad-input').value);
                
                if (!talla) {
                    mostrarNotificacion('Por favor selecciona una talla', 'error');
                    return;
                }

                if (cantidad < 1) {
                    mostrarNotificacion('La cantidad debe ser al menos 1', 'error');
                    return;
                }

                const precio = parseFloat(tallaSelect.selectedOptions[0].dataset.precio);
                agregarAlCarrito(prod.nombre, talla, cantidad, precio);
            });
        });
    }

    // Función para agregar productos al carrito
    function agregarAlCarrito(nombre, talla, cantidad, precio) {
        const productoExistente = cart.find(item => 
            item.nombre === nombre && item.talla === talla
        );

        if (productoExistente) {
            productoExistente.cantidad += cantidad;
        } else {
            cart.push({ 
                nombre, 
                talla, 
                cantidad, 
                precio 
            });
        }
        
        actualizarCarritoUI();
        mostrarNotificacion(`${nombre} añadido al carrito`, 'success');
    }

    // Actualizar interfaz del carrito
function actualizarCarritoUI() {
    const totalItems = cart.reduce((total, item) => total + item.cantidad, 0);
    cartCount.textContent = totalItems;

    if (cart.length === 0) {
        cartItemsList.innerHTML = `
            <li class="cart-empty">
                <i class="fas fa-shopping-cart" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Tu carrito está vacío</p>
            </li>
        `;
        cartTotal.textContent = 'Total: $0.00';
        checkoutBtn.disabled = true;
        return;
    }

    cartItemsList.innerHTML = cart.map((item, index) => `
        <li class="cart-item">
            <div class="item-details">
                <strong class="item-nombre">${item.nombre}</strong>
                <div class="item-info">
                    <span class="item-talla">Talla: ${item.talla.toUpperCase()}</span>

                    <div class="cantidad-control">
                        <button onclick="cambiarCantidad(${index}, -1)">−</button>
                        <span class="cantidad-numero">${item.cantidad}</span>
                        <button onclick="cambiarCantidad(${index}, 1)">+</button>
                    </div>

                    <span class="item-precio">$${item.precio} c/u</span>
                </div>
            </div>

            <div class="item-actions">
                <span class="item-subtotal">
                    $${(item.precio * item.cantidad).toFixed(2)}
                </span>

                <button class="remove-btn" onclick="removerDelCarrito(${index})" title="Eliminar todo">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </li>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    cartTotal.textContent = `Total: $${total.toFixed(2)}`;
    checkoutBtn.disabled = false;
}


    // Función global para remover items del carrito
    window.removerDelCarrito = function(index) {
        const item = cart[index];
        cart.splice(index, 1);
        actualizarCarritoUI();
        mostrarNotificacion(`${item.nombre} removido del carrito`, 'info');
    };
window.cambiarCantidad = function(index, cambio) {
    cart[index].cantidad += cambio;

    if (cart[index].cantidad <= 0) {
        const nombre = cart[index].nombre;
        cart.splice(index, 1);
        mostrarNotificacion(`${nombre} eliminado del carrito`, 'info');
    }

    actualizarCarritoUI();
};

    // Abrir/cerrar carrito
  cartIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    cartPanel.classList.toggle('active');
});

    cartClose.addEventListener('click', () => {
        cartPanel.classList.remove('active');
    });

 
   // Cotizar por WhatsApp
checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        mostrarNotificacion('Tu carrito está vacío', 'error');
        return;
    }

    let mensaje = '¡Hola! Me gustaría cotizar los siguientes productos textiles:\n\n';
    let total = 0;
    
    cart.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        mensaje += `🔹 ${item.nombre}\n`;
        mensaje += `   • Talla: ${item.talla.toUpperCase()}\n`;
        mensaje += `   • Cantidad: ${item.cantidad}\n`;
        mensaje += `   • Precio unitario: $${item.precio}\n`;
        mensaje += `   • Subtotal: $${subtotal.toFixed(2)}\n\n`;
        total += subtotal;
    });

    mensaje += `💰 *TOTAL: $${total.toFixed(2)}*\n\n`;
    mensaje += `🏫 *Perfecto para escuelas y empresas*\n`;
    mensaje += `🎨 *Productos personalizados*\n\n`;
    mensaje += `Por favor, necesito información sobre:\n`;
    mensaje += `• Tiempos de entrega\n`;
    mensaje += `• Opciones de personalización\n`;
    mensaje += `• Muestras de colores y materiales`;

    const telefono = '50769764758'; // Usando el número de tus iconos sociales
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    
    // Limpiar carrito después de enviar
    cart = [];
    actualizarCarritoUI();
    cartPanel.classList.remove('active');
});

    // Función para mostrar notificaciones
    function mostrarNotificacion(mensaje, tipo = 'info') {
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo}`;
        
        const icono = tipo === 'success' ? 'check-circle' : 
                     tipo === 'error' ? 'exclamation-triangle' : 'info-circle';
        
        notificacion.innerHTML = `
            <i class="fas fa-${icono}"></i>
            <span>${mensaje}</span>
        `;
        
        document.body.appendChild(notificacion);
        
        setTimeout(() => {
            notificacion.classList.add('fade-out');
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.parentNode.removeChild(notificacion);
                }
            }, 300);
        }, 3000);
    }

    // Escuchar cambios en la configuración
    window.addEventListener('storage', (e) => {
        if (e.key === 'configTextiles') {
            location.reload();
        }
    });

    // ============================
    // INICIALIZACIÓN
    // ============================
    renderProductos();
    actualizarCarritoUI();
});

// Función para el menú de login
function toggleLoginMenu() {
    const menu = document.getElementById('loginMenu');
    menu.classList.toggle('active');
}

// Cerrar menú al hacer clic fuera
document.addEventListener('click', (e) => {
    const menu = document.getElementById('loginMenu');
    const button = document.querySelector('.login-icon-btn');
    
    if (!menu.contains(e.target) && !button.contains(e.target)) {
        menu.classList.remove('active');
    }
});

// Cerrar menú al hacer scroll
window.addEventListener('scroll', () => {
    const menu = document.getElementById('loginMenu');
    menu.classList.remove('active');
});