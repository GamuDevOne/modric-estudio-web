// ========================================
// REGISTRO.JS - VERSIÓN CORREGIDA
// Ahora guarda en BD antes de generar factura
// fecha: 12/21/25
// ========================================

console.log('📝 registro.js cargado');

// ========================================
// CARGAR DATOS PREVIOS DESDE LOCALSTORAGE
// ========================================
function cargarDatosDesdeVendedor() {
    const ventaData = localStorage.getItem('ventaDesdeVendedor');
    
    if (!ventaData) {
        console.log('No hay datos desde vendedor');
        return;
    }
    
    try {
        const datos = JSON.parse(ventaData);
        console.log('Datos recuperados del localStorage:', datos);
        
        // Mostrar indicador de origen
        const indicador = document.getElementById('origenIndicador');
        if (indicador) {
            indicador.style.display = 'block';
            console.log('Indicador mostrado');
        }
        
        // Cargar datos del cliente
        if (datos.cliente) {
            document.getElementById('nombre').value = datos.cliente.nombre || '';
            document.getElementById('apellido').value = datos.cliente.apellido || '';
            document.getElementById('grupo').value = datos.cliente.grupo || '';
            document.getElementById('telefono').value = datos.cliente.telefono || '';
            document.getElementById('comentario').value = datos.cliente.comentario || '';
            
            // Seleccionar escuela
            const escuelaSelect = document.getElementById('escuela');
            if (datos.cliente.escuela) {
                let found = false;
                for (let option of escuelaSelect.options) {
                    if (option.value === datos.cliente.escuela) {
                        escuelaSelect.value = datos.cliente.escuela;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    escuelaSelect.value = 'Otra';
                    document.getElementById('otraEscuelaSection').style.display = 'block';
                    document.getElementById('otraEscuela').value = datos.cliente.escuela;
                    document.getElementById('otraEscuela').required = true;
                }
            }
        }
        
        // Cargar datos de paquete/servicio
        if (datos.venta && datos.venta.nombreServicio) {
            const paqueteSelect = document.getElementById('paquete');
            let paqueteEncontrado = false;
            const nombreServicioLower = datos.venta.nombreServicio.toLowerCase();
            
            for (let option of paqueteSelect.options) {
                const textoOption = option.textContent.toLowerCase();
                const valueOption = option.value.toLowerCase();
                
                if (textoOption.includes(nombreServicioLower) || 
                    nombreServicioLower.includes(textoOption) ||
                    nombreServicioLower.includes(valueOption) ||
                    valueOption.includes(nombreServicioLower)) {
                    paqueteSelect.value = option.value;
                    paqueteEncontrado = true;
                    break;
                }
            }
            
            if (!paqueteEncontrado) {
                const newValue = datos.venta.nombreServicio.toLowerCase().replace(/\s+/g, '-');
                const newOption = document.createElement('option');
                newOption.value = newValue;
                newOption.textContent = `${datos.venta.nombreServicio} - $${datos.venta.precio.toFixed(2)}`;
                newOption.selected = true;
                paqueteSelect.appendChild(newOption);
                paqueteSelect.value = newValue;
            }
        }
        
        // Cargar información de pago
        if (datos.venta) {
            // Método de pago
            if (datos.venta.metodoPago) {
                const metodoPagoNormalizado = datos.venta.metodoPago.toLowerCase();
                const metodoPagoRadios = document.querySelectorAll('input[name="metodoPago"]');
                for (let radio of metodoPagoRadios) {
                    if (radio.value === metodoPagoNormalizado) {
                        radio.checked = true;
                        break;
                    }
                }
            }
            
            // Tipo de pago
            if (datos.venta.estadoPago) {
                const tipoPagoValue = datos.venta.estadoPago.toLowerCase();
                const tipoPagoRadios = document.querySelectorAll('input[name="tipoPago"]');
                for (let radio of tipoPagoRadios) {
                    if (radio.value === tipoPagoValue) {
                        radio.checked = true;
                        
                        if (tipoPagoValue === 'abono') {
                            const abonoSection = document.getElementById('abonoSection');
                            if (abonoSection) {
                                abonoSection.style.display = 'block';
                                
                                if (datos.venta.montoAbonado) {
                                    const montoAbonadoInput = document.getElementById('cantidadAbono');
                                    const montoFormateado = '$' + parseFloat(datos.venta.montoAbonado).toFixed(2);
                                    montoAbonadoInput.value = montoFormateado;
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }
        
        console.log('✓ Todos los datos cargados correctamente');
        
    } catch (error) {
        console.error('Error al cargar datos desde vendedor:', error);
    }
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - Inicializando registro.js');
    
    cargarDatosDesdeVendedor();
    
    // Configurar formateo de teléfono
    const telefonoInput = document.getElementById('telefono');
    if (telefonoInput) {
        telefonoInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 4) {
                value = value.slice(0, 4) + '-' + value.slice(4, 8);
            }
            e.target.value = value;
        });
    }
    
    // Configurar sección de abono
    const tipoPagoRadios = document.querySelectorAll('input[name="tipoPago"]');
    const abonoSection = document.getElementById('abonoSection');
    const cantidadAbonoInput = document.getElementById('cantidadAbono');
    
    tipoPagoRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            if (this.value === 'abono') {
                abonoSection.style.display = 'block';
                cantidadAbonoInput.required = true;
            } else {
                abonoSection.style.display = 'none';
                cantidadAbonoInput.required = false;
                cantidadAbonoInput.value = '';
            }
        });
    });
    
    // Configurar escuela
    const escuelaSelect = document.getElementById('escuela');
    const otraEscuelaSection = document.getElementById('otraEscuelaSection');
    const otraEscuelaInput = document.getElementById('otraEscuela');
    
    escuelaSelect.addEventListener('change', function() {
        if (this.value === 'Otra') {
            otraEscuelaSection.style.display = 'block';
            otraEscuelaSection.classList.add('active');
            otraEscuelaInput.required = true;
        } else {
            otraEscuelaSection.style.display = 'none';
            otraEscuelaSection.classList.remove('active');
            otraEscuelaInput.required = false;
            otraEscuelaInput.value = '';
            hideError('otraEscuela');
        }
    });
    
    // Configurar formateo de abono
    cantidadAbonoInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/[^\d.]/g, '');
        const parts = value.split('.');
        if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
        if (parts[1] && parts[1].length > 2) value = parts[0] + '.' + parts[1].slice(0, 2);
        e.target.value = value ? '$' + value : '';
    });
    
    // ========================================
    // CONFIGURAR VALIDACIÓN DEL FORMULARIO
    // ========================================
    document.getElementById('facturaForm').addEventListener('submit', function (e) {
        e.preventDefault();
        let isValid = true;

        const nombre = document.getElementById('nombre');
        const apellido = document.getElementById('apellido');
        const telefono = document.getElementById('telefono');
        const escuela = document.getElementById('escuela');
        const paquete = document.getElementById('paquete');
        const metodoPago = document.querySelector('input[name="metodoPago"]:checked');
        const tipoPago = document.querySelector('input[name="tipoPago"]:checked');
        const comentario = document.getElementById('comentario');
        const grupo = document.getElementById('grupo');

        const telefonoPattern = /^6\d{3}-\d{4}$/;

        // Validaciones
        if (!nombre.value.trim()) { showError('nombre'); isValid = false; } else hideError('nombre');
        if (!apellido.value.trim()) { showError('apellido'); isValid = false; } else hideError('apellido');
        if (!telefonoPattern.test(telefono.value)) { showError('telefono'); isValid = false; } else hideError('telefono');
        if (!escuela.value.trim()) { showError('escuela'); isValid = false; } else hideError('escuela');
        if (!paquete.value) { showError('paquete'); isValid = false; } else hideError('paquete');
        if (!metodoPago) { showError('metodoPago'); isValid = false; } else hideError('metodoPago');
        if (!tipoPago) { showError('tipoPago'); isValid = false; } else hideError('tipoPago');

        if (tipoPago && tipoPago.value === 'abono') {
            const abonoValue = parseFloat(cantidadAbonoInput.value.replace('$', ''));
            if (!abonoValue || abonoValue <= 0) {
                showError('abono');
                isValid = false;
            } else hideError('abono');
        }

        if (!isValid) {
            return;
        }
        
        // ========================================
        // PREPARAR DATOS PARA GUARDAR
        // ========================================
        const ventaData = localStorage.getItem('ventaDesdeVendedor');
        const desdeVendedor = ventaData ? JSON.parse(ventaData) : null;
        
        // Calcular precio con ITBMS
        let precioBásico = 50.00;
        let paqueteNombre = paquete.options[paquete.selectedIndex].text;
        
        if (desdeVendedor && desdeVendedor.venta.precio) {
            precioBásico = parseFloat(desdeVendedor.venta.precio);
            paqueteNombre = desdeVendedor.venta.nombreServicio;
        } else {
            const precioMatch = paqueteNombre.match(/\$(\d+\.?\d*)/);
            if (precioMatch) {
                precioBásico = parseFloat(precioMatch[1]);
            }
        }
        
        const itbms = precioBásico * 0.07;
        const totalConItbms = precioBásico + itbms;
        
        const tipoPagoValue = tipoPago.value;
        let cantidadAbonoValue = 'N/A';
        
        if (tipoPagoValue === 'abono') {
            const abonoInput = cantidadAbonoInput.value.trim();
            if (abonoInput) {
                cantidadAbonoValue = abonoInput.includes('$') ? abonoInput : '$' + abonoInput;
            } else if (desdeVendedor && desdeVendedor.venta.montoAbonado) {
                cantidadAbonoValue = '$' + parseFloat(desdeVendedor.venta.montoAbonado).toFixed(2);
            }
        }
        
        const formData = {
            cliente: {
                nombre: `${nombre.value} ${apellido.value}`,
                telefono: telefono.value.replace('-', ''),
                escuela: escuela.value === 'Otra' ? document.getElementById('otraEscuela').value : escuela.value,
                grupo: grupo ? grupo.value : '',
                comentario: comentario.value.trim() || "Sin comentarios"
            },
            paquete: paqueteNombre,
            metodoPago: desdeVendedor ? desdeVendedor.venta.metodoPago : metodoPago.value,
            tipoPago: tipoPagoValue,
            cantidadAbono: cantidadAbonoValue,
            comentario: comentario.value.trim() || "Sin comentarios",
            desdeVendedor: desdeVendedor ? true : false,
            ventaInfo: desdeVendedor ? {
                idVendedor: desdeVendedor.venta.idVendedor,
                idColegio: desdeVendedor.venta.idColegio,
                nombreVendedor: desdeVendedor.venta.nombreVendedor,
                colegioNombre: desdeVendedor.venta.colegioNombre,
                metodoPago: desdeVendedor.venta.metodoPago,
                estadoPago: desdeVendedor.venta.estadoPago,
                montoAbonado: desdeVendedor.venta.montoAbonado,
                idServicio: desdeVendedor.venta.idServicio,
                idPaquete: desdeVendedor.venta.idPaquete
            } : null,
            productos: [
                {
                    descripcion: paqueteNombre,
                    base: precioBásico.toFixed(2),
                    itbms: itbms.toFixed(2),
                    total: totalConItbms.toFixed(2)
                }
            ]
        };

        console.log('✓ FormData construida:', formData);
        
        // ========================================
        // GUARDAR EN BASE DE DATOS
        // ========================================
        // Mostrar modal de carga
        mostrarModal('Guardando venta...', 'info');
        
        fetch('../php/guardar-venta.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error del servidor: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log('Respuesta del servidor:', data);
            
            if (data.success) {
                // Agregar número de orden a los datos
                formData.numeroOrden = data.numeroOrden;
                formData.idPedido = data.idPedido;
                
                // Guardar datos para la factura
                localStorage.setItem('facturaData', JSON.stringify(formData));
                
                // Limpiar datos del vendedor
                localStorage.removeItem('ventaDesdeVendedor');
                
                mostrarModal('¡Venta guardada exitosamente!', 'success');
                
                // Redirigir a factura después de 1 segundo
                setTimeout(() => {
                    window.location.href = "factura.html";
                }, 1000);
            } else {
                mostrarModal('Error al guardar: ' + (data.message || 'Error desconocido'), 'error');
            }
        })
        .catch(error => {
            console.error('Error al guardar venta:', error);
            mostrarModal('Error de conexión. Verifica que XAMPP esté activo.', 'error');
        });
    });
    
    // Ocultar error al escribir
    document.querySelectorAll('input, select, textarea').forEach(element => {
        element.addEventListener('input', function () {
            hideError(this.id);
        });
    });
});

// ========================================
// FUNCIONES DE ERROR
// ========================================
function showError(fieldName) {
    const field = document.getElementById(fieldName);
    const error = document.getElementById(fieldName + 'Error');
    if (field) field.classList.add('invalid');
    if (error) error.classList.add('active');
}

function hideError(fieldName) {
    const field = document.getElementById(fieldName);
    const error = document.getElementById(fieldName + 'Error');
    if (field) field.classList.remove('invalid');
    if (error) error.classList.remove('active');
}

// Función para mostrar notificaciones/modales
function mostrarModal(mensaje, tipo = 'info') {
    let modal = document.getElementById('notificacionRegistro');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'notificacionRegistro';
        modal.className = 'notificacion-modal';
        document.body.appendChild(modal);
    }
    
    modal.className = 'notificacion-modal ' + tipo;
    modal.textContent = mensaje;
    modal.style.display = 'block';
    modal.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        font-weight: bold;
        z-index: 9999;
        display: block;
        min-width: 250px;
    `;
    
    // Definir colores según el tipo
    const colores = {
        'info': { bg: '#e3f2fd', color: '#1976d2', border: '2px solid #1976d2' },
        'success': { bg: '#e8f5e9', color: '#388e3c', border: '2px solid #388e3c' },
        'error': { bg: '#ffebee', color: '#d32f2f', border: '2px solid #d32f2f' },
        'warning': { bg: '#fff3e0', color: '#f57c00', border: '2px solid #f57c00' }
    };
    
    const estilos = colores[tipo] || colores['info'];
    modal.style.backgroundColor = estilos.bg;
    modal.style.color = estilos.color;
    modal.style.border = estilos.border;
    
    // Auto-hide para success/error (no para info/loading)
    if (tipo !== 'info') {
        setTimeout(() => {
            modal.style.display = 'none';
        }, 4000);
    }
}