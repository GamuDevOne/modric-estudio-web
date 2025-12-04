class EditorTextiles {
    constructor() {
        this.productos = {
            sweater: {
                nombre: 'Suéter Personalizado',
                activo: true,
                precios: { xs: 0, s: 0, m: 0, l: 0, xl: 0 },
                imagenes: ['', '', '']
            },
            abrigo: {
                nombre: 'Abrigo Personalizado',
                activo: true,
                precios: { s: 0, m: 0, l: 0, xl: 0, xxl: 0 },
                imagenes: ['', '', '']
            }
        };
        
        this.init();
    }

    init() {
        this.cargarDatos();
        this.bindEvents();
    }

    cargarDatos() {
        const datosGuardados = localStorage.getItem('configTextiles');
        if (datosGuardados) {
            this.productos = JSON.parse(datosGuardados);
            this.actualizarUI();
        }
    }

    guardarDatos() {
        localStorage.setItem('configTextiles', JSON.stringify(this.productos));
    }

    bindEvents() {
        // Eventos para precios
        document.querySelectorAll('.precio-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const producto = e.target.closest('.producto-card').dataset.producto;
                const talla = e.target.dataset.talla;
                const precio = parseFloat(e.target.value) || 0;
                
                this.productos[producto].precios[talla] = precio;
                this.guardarDatos();
            });

            input.addEventListener('input', (e) => {
                // Validación en tiempo real
                const valor = e.target.value;
                if (valor < 0) {
                    e.target.value = 0;
                }
            });
        });

        // Eventos para toggles de estado
        document.querySelectorAll('.estado-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const producto = e.target.closest('.producto-card').dataset.producto;
                this.productos[producto].activo = e.target.checked;
                this.guardarDatos();
            });
        });

        // Eventos para subida de imágenes
        document.querySelectorAll('.upload-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                const producto = e.target.closest('.producto-card').dataset.producto;
                const input = e.target.previousElementSibling;
                input.click();
                
                input.onchange = (event) => this.subirImagen(event, producto, parseInt(index));
            });
        });

        // Eventos de galería
        document.querySelectorAll('.galeria-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const container = e.target.closest('.galeria-container');
                const preview = container.querySelector('.imagenes-preview');
                const items = preview.querySelectorAll('.imagen-item');
                
                if (e.target.closest('.next-btn')) {
                    preview.appendChild(items[0]);
                } else {
                    preview.insertBefore(items[items.length - 1], items[0]);
                }
            });
        });

        // Botones principales
        document.getElementById('guardarCambios').addEventListener('click', () => this.guardarCambios());
        document.getElementById('verCotizacion').addEventListener('click', () => this.mostrarCotizacion());
        document.getElementById('copiarCotizacion').addEventListener('click', () => this.copiarCotizacion());
        
        // Modal
        document.querySelector('.modal-close').addEventListener('click', () => this.cerrarModal());
        document.getElementById('modalCotizacion').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.cerrarModal();
        });

        // Enter para guardar cambios
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.guardarCambios();
            }
        });
    }

    subirImagen(event, producto, index) {
        const file = event.target.files[0];
        if (file) {
            // Validar tipo de archivo
            if (!file.type.startsWith('image/')) {
                this.mostrarNotificacion('Por favor selecciona una imagen válida', 'error');
                return;
            }

            // Validar tamaño (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.mostrarNotificacion('La imagen no debe superar los 5MB', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                this.productos[producto].imagenes[index] = e.target.result;
                this.actualizarImagenUI(producto, index, e.target.result);
                this.guardarDatos();
                this.mostrarNotificacion('Imagen subida correctamente', 'success');
            };
            
            reader.onerror = () => {
                this.mostrarNotificacion('Error al cargar la imagen', 'error');
            };
            
            reader.readAsDataURL(file);
        }
    }

    actualizarImagenUI(producto, index, src) {
        const imagen = document.querySelector(`[data-producto="${producto}"] .producto-imagen[data-index="${index}"]`);
        if (imagen) {
            imagen.src = src;
            imagen.style.border = '2px solid #000';
            imagen.style.background = '#f8f9fa';
            
            // Ocultar botón de subir si hay imagen
            const uploadBtn = imagen.nextElementSibling.nextElementSibling;
            if (uploadBtn) {
                uploadBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Cambiar';
            }
        }
    }

    actualizarUI() {
        // Actualizar precios
        Object.keys(this.productos).forEach(productoKey => {
            const producto = this.productos[productoKey];
            const card = document.querySelector(`[data-producto="${productoKey}"]`);
            
            // Precios
            Object.keys(producto.precios).forEach(talla => {
                const input = card.querySelector(`[data-talla="${talla}"]`);
                if (input) input.value = producto.precios[talla];
            });
            
            // Estado
            const toggle = card.querySelector('.estado-toggle');
            if (toggle) toggle.checked = producto.activo;
            
            // Imágenes
            producto.imagenes.forEach((src, index) => {
                if (src) {
                    this.actualizarImagenUI(productoKey, index, src);
                }
            });
        });
    }

    guardarCambios() {
        this.guardarDatos();
        this.mostrarNotificacion('Cambios guardados exitosamente', 'success');
        
        // Opcional: Redirigir después de guardar
        setTimeout(() => {
            // window.location.href = '../configuracion-servicios/config-servicios.html';
        }, 1500);
    }

    mostrarCotizacion() {
        const texto = this.generarTextoCotizacion();
        document.getElementById('textoCotizacion').textContent = texto;
        document.getElementById('modalCotizacion').classList.add('active');
    }

    generarTextoCotizacion() {
        let texto = '¡Hola! Te envío la cotización de textiles personalizados:\n\n';
        let productosActivos = false;
        
        Object.keys(this.productos).forEach(productoKey => {
            const producto = this.productos[productoKey];
            if (producto.activo) {
                productosActivos = true;
                texto += `🔹 ${producto.nombre}\n`;
                
                const preciosValidos = Object.entries(producto.precios)
                    .filter(([talla, precio]) => precio > 0)
                    .map(([talla, precio]) => `   Talla ${talla.toUpperCase()}: $${precio}`);
                
                if (preciosValidos.length > 0) {
                    texto += preciosValidos.join('\n') + '\n';
                } else {
                    texto += '   (Precios por configurar)\n';
                }
                
                texto += '\n';
            }
        });

        if (!productosActivos) {
            texto += '⚠️ No hay productos activos en este momento.\n\n';
        }
        
        texto += '💬 ¿Te interesa alguno de estos productos? Puedo ayudarte con tu pedido personalizado.\n';
        texto += '🏫 Perfecto para escuelas y empresas\n';
        texto += '🎨 Personalización disponible con logos y colores';
        
        return texto;
    }

    async copiarCotizacion() {
        const texto = document.getElementById('textoCotizacion').textContent;
        try {
            await navigator.clipboard.writeText(texto);
            this.mostrarNotificacion('Cotización copiada al portapapeles', 'success');
            
            // Cerrar modal después de copiar
            setTimeout(() => {
                this.cerrarModal();
            }, 1000);
            
        } catch (err) {
            console.error('Error al copiar: ', err);
            this.mostrarNotificacion('Error al copiar al portapapeles', 'error');
        }
    }

    cerrarModal() {
        document.getElementById('modalCotizacion').classList.remove('active');
    }

    mostrarNotificacion(mensaje, tipo) {
        // Crear notificación
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo}`;
        
        const iconos = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        notificacion.innerHTML = `
            <i class="fas fa-${iconos[tipo] || 'info-circle'}"></i>
            <span>${mensaje}</span>
        `;
        
        // Estilos de notificación
        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #000;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 1001;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
            border-left: 4px solid ${tipo === 'success' ? '#4CAF50' : tipo === 'error' ? '#f44336' : '#2196F3'};
            max-width: 400px;
        `;
        
        document.body.appendChild(notificacion);
        
        // Remover después de 4 segundos
        setTimeout(() => {
            notificacion.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.parentNode.removeChild(notificacion);
                }
            }, 300);
        }, 4000);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new EditorTextiles();
});

// Estilos para las animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { 
            transform: translateX(100%); 
            opacity: 0; 
        }
        to { 
            transform: translateX(0); 
            opacity: 1; 
        }
    }
    
    @keyframes slideOut {
        from { 
            transform: translateX(0); 
            opacity: 1; 
        }
        to { 
            transform: translateX(100%); 
            opacity: 0; 
        }
    }
    
    /* Mejoras para el footer simplificado */
    .acciones-footer {
        background: #ffffff;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        border: 2px solid #f5f5f5;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 2rem;
    }
    
    .acciones-buttons {
        display: flex;
        gap: 1.5rem;
        flex-wrap: wrap;
        justify-content: center;
    }
    
    @media (max-width: 768px) {
        .acciones-buttons {
            flex-direction: column;
            width: 100%;
        }
        
        .btn-guardar,
        .btn-cotizar {
            min-width: auto;
            width: 100%;
        }
    }
`;
document.head.appendChild(style);