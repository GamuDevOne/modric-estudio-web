// ========================================
// DEBUG: Verificar localStorage al cargar
// ========================================
console.log('📝 registro.js cargado');
console.log('Datos en localStorage:', {
    ventaDesdeVendedor: localStorage.getItem('ventaDesdeVendedor'),
    facturaData: localStorage.getItem('facturaData')
});

// ========================================
// CARGAR DATOS PREVIOS DESDE LOCALSTORAGE
// ========================================
function cargarDatosDesdeVendedor() {
    const ventaData = localStorage.getItem('ventaDesdeVendedor');
    
    if (!ventaData) {
        console.log('No hay datos desde vendedor');
        return; // No hay datos desde vendedor
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
        
        // ==========================================
        // 1. CARGAR DATOS DEL CLIENTE
        // ==========================================
        if (datos.cliente) {
            document.getElementById('nombre').value = datos.cliente.nombre || '';
            document.getElementById('apellido').value = datos.cliente.apellido || '';
            document.getElementById('grupo').value = datos.cliente.grupo || '';
            document.getElementById('telefono').value = datos.cliente.telefono || '';
            document.getElementById('comentario').value = datos.cliente.comentario || '';
            
            console.log('Campos básicos cargados');
            
            // Seleccionar escuela
            const escuelaSelect = document.getElementById('escuela');
            if (datos.cliente.escuela) {
                // Buscar si la escuela existe en el select
                let found = false;
                for (let option of escuelaSelect.options) {
                    if (option.value === datos.cliente.escuela) {
                        escuelaSelect.value = datos.cliente.escuela;
                        found = true;
                        console.log('Escuela encontrada y seleccionada:', datos.cliente.escuela);
                        break;
                    }
                }
                // Si no se encuentra, seleccionar "Otra"
                if (!found) {
                    escuelaSelect.value = 'Otra';
                    document.getElementById('otraEscuelaSection').style.display = 'block';
                    document.getElementById('otraEscuela').value = datos.cliente.escuela;
                    document.getElementById('otraEscuela').required = true;
                    console.log('Escuela no encontrada, seleccionada "Otra":', datos.cliente.escuela);
                }
            }
        }
        
        // ==========================================
        // 2. CARGAR DATOS DE PAQUETE/SERVICIO
        // ==========================================
        if (datos.venta && datos.venta.nombreServicio) {
            const paqueteSelect = document.getElementById('paquete');
            let paqueteEncontrado = false;
            const nombreServicioLower = datos.venta.nombreServicio.toLowerCase();
            
            // Buscar el paquete en el select
            for (let option of paqueteSelect.options) {
                const textoOption = option.textContent.toLowerCase();
                const valueOption = option.value.toLowerCase();
                
                // Intenta varias estrategias de búsqueda
                if (textoOption.includes(nombreServicioLower) || 
                    nombreServicioLower.includes(textoOption) ||
                    nombreServicioLower.includes(valueOption) ||
                    valueOption.includes(nombreServicioLower)) {
                    paqueteSelect.value = option.value;
                    paqueteEncontrado = true;
                    console.log('Paquete encontrado en select:', datos.venta.nombreServicio, '→', option.value);
                    break;
                }
            }
            
            // Si no se encontró, crear una opción nueva dinámicamente
            if (!paqueteEncontrado) {
                console.log('⚠️ Paquete no encontrado en select, creando opción dinámica:', datos.venta.nombreServicio);
                
                // Crear un value único basado en el nombre del servicio
                const newValue = datos.venta.nombreServicio.toLowerCase().replace(/\s+/g, '-');
                const newOption = document.createElement('option');
                newOption.value = newValue;
                newOption.textContent = `${datos.venta.nombreServicio} - $${datos.venta.precio.toFixed(2)}`;
                newOption.selected = true;
                
                paqueteSelect.appendChild(newOption);
                paqueteSelect.value = newValue;
                
                console.log('✓ Opción dinámica creada y seleccionada:', newValue);
            }
        }
        
        // ==========================================
        // 3. CARGAR INFORMACIÓN DE PAGO
        // ==========================================
        if (datos.venta) {
            // Seleccionar método de pago (solo si está en formato compatible)
            if (datos.venta.metodoPago) {
                // Convertir el método de pago a minúsculas para que coincida
                const metodoPagoNormalizado = datos.venta.metodoPago.toLowerCase();
                
                const metodoPagoRadios = document.querySelectorAll('input[name="metodoPago"]');
                for (let radio of metodoPagoRadios) {
                    if (radio.value === metodoPagoNormalizado) {
                        radio.checked = true;
                        console.log('Método de pago seleccionado:', metodoPagoNormalizado);
                        break;
                    }
                }
            }
            
            // Seleccionar tipo de pago
            if (datos.venta.estadoPago) {
                const tipoPagoSelect = document.getElementById('tipoPago');
                // Convertir "Completo" a "completo" y "Abono" a "abono" si es necesario
                const tipoPagoValue = datos.venta.estadoPago.toLowerCase();
                
                const tipoPagoRadios = document.querySelectorAll('input[name="tipoPago"]');
                for (let radio of tipoPagoRadios) {
                    if (radio.value === tipoPagoValue) {
                        radio.checked = true;
                        console.log('Tipo de pago seleccionado:', tipoPagoValue);
                        
                        // Si es abono, mostrar sección y cargar monto
                        if (tipoPagoValue === 'abono') {
                            const abonoSection = document.getElementById('abonoSection');
                            if (abonoSection) {
                                abonoSection.style.display = 'block';
                                
                                if (datos.venta.montoAbonado) {
                                    const montoAbonadoInput = document.getElementById('cantidadAbono');
                                    // Formatear con "$" para que coincida con el formato esperado
                                    const montoFormateado = '$' + parseFloat(datos.venta.montoAbonado).toFixed(2);
                                    montoAbonadoInput.value = montoFormateado;
                                    console.log('Monto abonado cargado y formateado:', montoFormateado);
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }
        
        console.log('✓ Todos los datos cargados desde vendedor correctamente');
        
    } catch (error) {
        console.error('Error al cargar datos desde vendedor:', error);
    }
}

// Cargar y configurar todo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - Inicializando registro.js');
    
    // 1. Cargar datos previos desde vendedor
    cargarDatosDesdeVendedor();
    
    // 2. Configurar formateo de teléfono
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
    
    // 3. Configurar sección de abono
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
    
    // 4. Configurar escuela
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
    
    // 5. Configurar formateo de abono
    cantidadAbonoInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/[^\d.]/g, '');
        const parts = value.split('.');
        if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
        if (parts[1] && parts[1].length > 2) value = parts[0] + '.' + parts[1].slice(0, 2);
        e.target.value = value ? '$' + value : '';
    });
    
    // 6. Configurar validación del formulario
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

        // === Validaciones básicas ===
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

        // === Si todo está bien, guardar datos ===
        if (isValid) {
            // Detectar si viene desde vendedor
            const ventaData = localStorage.getItem('ventaDesdeVendedor');
            const desdeVendedor = ventaData ? JSON.parse(ventaData) : null;
            
            // ==========================================
            // Calcular precio y ITBMS (7%)
            // ==========================================
            let precioBásico = 50.00; // valor por defecto
            let paqueteNombre = paquete.options[paquete.selectedIndex].text;
            
            // Si viene desde vendedor, usar el precio del servicio
            if (desdeVendedor && desdeVendedor.venta.precio) {
                precioBásico = parseFloat(desdeVendedor.venta.precio);
                paqueteNombre = desdeVendedor.venta.nombreServicio;
            } else {
                // Si es un paquete del formulario, extraer el precio del texto
                const precioMatch = paqueteNombre.match(/\$(\d+\.?\d*)/);
                if (precioMatch) {
                    precioBásico = parseFloat(precioMatch[1]);
                }
            }
            
            const itbms = precioBásico * 0.07;
            const totalConItbms = precioBásico + itbms;
            
            // Obtener los valores de tipoPago y cantidadAbono
            const tipoPagoValue = tipoPago.value; // 'completo' o 'abono'
            let cantidadAbonoValue = 'N/A';
            
            if (tipoPagoValue === 'abono') {
                const abonoInput = cantidadAbonoInput.value.trim();
                if (abonoInput) {
                    // Si viene del formateo, tendrá "$", si viene del vendedor puede tenerlo o no
                    cantidadAbonoValue = abonoInput.includes('$') ? abonoInput : '$' + abonoInput;
                } else if (desdeVendedor && desdeVendedor.venta.montoAbonado) {
                    // Fallback: usar montoAbonado del vendedor si el input está vacío
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
                tipoPago: tipoPagoValue, // Usar siempre minúsculas ('completo' o 'abono')
                cantidadAbono: cantidadAbonoValue,
                comentario: comentario.value.trim() || "Sin comentarios",
                // NUEVO: Datos del vendedor si aplica
                desdeVendedor: desdeVendedor ? true : false,
                ventaInfo: desdeVendedor ? {
                    idVendedor: desdeVendedor.venta.idVendedor,
                    idColegio: desdeVendedor.venta.idColegio,
                    nombreVendedor: desdeVendedor.venta.nombreVendedor,
                    colegioNombre: desdeVendedor.venta.colegioNombre,
                    metodoPago: desdeVendedor.venta.metodoPago,
                    estadoPago: desdeVendedor.venta.estadoPago,
                    montoAbonado: desdeVendedor.venta.montoAbonado
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

            console.log('✓ FormData construida correctamente:', formData);
            console.log('  - tipoPago:', formData.tipoPago);
            console.log('  - cantidadAbono:', formData.cantidadAbono);
            console.log('  - desdeVendedor:', formData.desdeVendedor);
            if (formData.ventaInfo) {
                console.log('  - ventaInfo.montoAbonado:', formData.ventaInfo.montoAbonado);
            }
            
            // === 💾 Guardar datos de la factura en localStorage ===
            localStorage.setItem('facturaData', JSON.stringify(formData));

            // === 🔄 Redirigir automáticamente a factura.html ===
            window.location.href = "factura.html";
        }
    });
    
    // 7. Configurar ocultar error al escribir
    document.querySelectorAll('input, select, textarea').forEach(element => {
        element.addEventListener('input', function () {
            hideError(this.id);
        });
    });
});

// === 🚨 Funciones de error ===
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

// === ✏️ Ocultar error al escribir ===
document.querySelectorAll('input, select, textarea').forEach(element => {
    element.addEventListener('input', function () {
        hideError(this.id);
    });
});
