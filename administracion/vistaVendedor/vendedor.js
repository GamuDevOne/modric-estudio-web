// ========================================
// FLUJO DE VENTA INTEGRADO CON REGISTRO
// ========================================
// NUEVO (21/12/2025):
// El flujo ahora es:
// 1. Vendedor registra venta básica (nombre cliente, servicio, precio)
// 2. Datos se guardan en localStorage con clave 'ventaDesdeVendedor'
// 3. Se redirige a registro.html para completar detalles
// 4. En registro.html se cargan los datos previos y se pueden editar
// 5. Al enviar el formulario se genera la factura
// 6. La factura contiene info del vendedor, colegio y cliente completa

// ========================================
// FUNCIÓN AUXILIAR: Obtener fecha local
// ========================================
function obtenerFechaLocal() {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ========================================
// VARIABLES GLOBALES
// ========================================
let vendedorData = null;
let asignacionActual = null;
let serviciosDisponibles = [];
let ventasDelDia = [];

// ========================================
// VERIFICAR SESIÓN Y CARGAR DATOS
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    const user = checkSession();
    
    if (!user) {
        window.location.href = '../../login/login.html';
        return;
    }
    
    if (user.tipo !== 'Vendedor') {
        alert('Esta vista es solo para vendedores.');
        window.location.href = '../administracion.html';
        return;
    }
    
    vendedorData = user;
    
    // Mostrar nombre del vendedor
    document.getElementById('nombreVendedor').textContent = user.nombre;
    
    // Mostrar fecha de hoy
    mostrarFechaHoy();
    
    // Cargar datos
    cargarAsignacionDelDia();
    cargarServiciosDisponibles();
    cargarVentasDelDia();
});

// ========================================
// MOSTRAR FECHA DE HOY
// ========================================
function mostrarFechaHoy() {
    const hoy = new Date();
    const opciones = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const fechaFormateada = hoy.toLocaleDateString('es-ES', opciones);
    const fechaCapitalizada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
    
    document.getElementById('fechaHoy').textContent = fechaCapitalizada;
}

// ========================================
// CARGAR ASIGNACIÓN DEL DÍA (CORREGIDO)
// ========================================
function cargarAsignacionDelDia() {
    const fechaLocal = obtenerFechaLocal(); // ← USAR FUNCIÓN LOCAL
    
    console.log('Cargando asignación para vendedor:', vendedorData.id, 'fecha:', fechaLocal); // DEBUG
    
    fetch('../../php/gest-colegios.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'obtener_asignacion_vendedor',
            idVendedor: vendedorData.id,
            fecha: fechaLocal // ← AGREGAR FECHA EXPLÍCITA
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Respuesta asignación:', data); // DEBUG
        
        if (data.success && data.asignaciones.length > 0) {
            // Tomar la primera asignación (debería ser solo una por día)
            asignacionActual = data.asignaciones[0];
            mostrarAsignacion(asignacionActual);
        } else {
            console.log('No hay asignaciones para hoy'); // DEBUG
            mostrarSinAsignacion();
        }
    })
    .catch(error => {
        console.error('Error al cargar asignación:', error);
        mostrarSinAsignacion();
    });
}

// ========================================
// MOSTRAR ASIGNACIÓN
// ========================================
function mostrarAsignacion(asignacion) {
    const card = document.getElementById('asignacionCard');
    card.classList.remove('sin-asignacion');
    
    document.getElementById('colegioNombre').textContent = asignacion.NombreColegio;
    document.getElementById('colegioDireccion').textContent = asignacion.Direccion || '';
}

function mostrarSinAsignacion() {
    const card = document.getElementById('asignacionCard');
    card.classList.add('sin-asignacion');
    
    document.getElementById('colegioNombre').textContent = 'Sin asignación para hoy';
    document.getElementById('colegioDireccion').textContent = 'Contacta con tu supervisor';
}

// ========================================
// CARGAR SERVICIOS DISPONIBLES
// ========================================
function cargarServiciosDisponibles() {
    // Primero cargar servicios
    fetch('../../php/gest-ventas.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'obtener_servicios'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            serviciosDisponibles = data.servicios;
            
            // Ahora cargar paquetes
            return fetch('../../php/gest-ventas.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'obtener_paquetes'
                })
            });
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Combinar servicios y paquetes
            const paquetes = data.paquetes.map(p => ({
                ...p,
                esPaquete: true
            }));
            
            serviciosDisponibles = [...serviciosDisponibles, ...paquetes];
            actualizarSelectServicios();
        }
    })
    .catch(error => {
        console.error('Error al cargar servicios:', error);
    });
}

// ========================================
// ACTUALIZAR SELECT DE SERVICIOS
// ========================================
function actualizarSelectServicios() {
    const select = document.getElementById('selectServicio');
    select.innerHTML = '<option value="">Selecciona un servicio</option>';
    
    serviciosDisponibles.forEach(servicio => {
        const option = document.createElement('option');
        option.value = servicio.ID_Servicio || servicio.ID_Paquete;
        option.dataset.precio = servicio.Precio;
        option.dataset.esPaquete = servicio.esPaquete ? 'true' : 'false';
        option.textContent = `${servicio.NombreServicio || servicio.NombrePaquete} - $${parseFloat(servicio.Precio).toFixed(2)}`;
        select.appendChild(option);
    });
}

// ========================================
// ACTUALIZAR PRECIO AL SELECCIONAR SERVICIO
// ========================================
function actualizarPrecio() {
    const select = document.getElementById('selectServicio');
    const selectedOption = select.options[select.selectedIndex];
    const precio = selectedOption.dataset.precio || '0';
    
    document.getElementById('precioVenta').value = parseFloat(precio).toFixed(2);
}

// ========================================
// CARGAR VENTAS DEL DÍA
// ========================================
function cargarVentasDelDia() {
    fetch('../../php/gest-ventas.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'obtener_ventas_vendedor_hoy',
            idVendedor: vendedorData.id
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            ventasDelDia = data.ventas;
            mostrarVentas(ventasDelDia);
            actualizarEstadisticas(data.estadisticas);
        } else {
            console.error('Error:', data.message);
        }
    })
    .catch(error => {
        console.error('Error al cargar ventas:', error);
    });
}

// ========================================
// MOSTRAR VENTAS
// ========================================
function mostrarVentas(ventas) {
    const lista = document.getElementById('ventasLista');
    const badge = document.getElementById('badgeVentas');
    
    lista.innerHTML = '';
    badge.textContent = ventas.length;
    
    if (ventas.length === 0) {
        lista.innerHTML = '<p class="sin-ventas">No has registrado ventas hoy</p>';
        return;
    }
    
    ventas.forEach(venta => {
        const item = document.createElement('div');
        item.className = 'venta-item';
        
        const hora = formatearHora(venta.Fecha);
        const estadoClass = venta.EstadoPago === 'Completo' ? 'completo' : 'abono';
        const estadoTexto = venta.EstadoPago === 'Completo' ? 'Pagado' : 'Abono';
        
        //NUEVO: Calcular saldo pendiente (11/12/25)
        let detalleAbono = '';
        if (venta.EstadoPago === 'Abono' && venta.MontoAbonado) {
            const montoAbonado = parseFloat(venta.MontoAbonado);
            const total = parseFloat(venta.Total);
            const saldoPendiente = total - montoAbonado;
            
            detalleAbono = `
                <div style="margin-top: 8px; padding: 8px; background-color: #fff3e0; border-radius: 5px; font-size: 12px;">
                    <strong>Abonado:</strong> $${montoAbonado.toFixed(2)} / $${total.toFixed(2)}<br>
                    <strong style="color: #f57c00;">Saldo pendiente:</strong> $${saldoPendiente.toFixed(2)}
                </div>
            `;
        }
        
        item.innerHTML = `
            <div class="venta-header-item">
                <span class="venta-cliente">${venta.NombreCliente}</span>
                <span class="venta-hora">${hora}</span>
            </div>
            <div class="venta-detalles">
                <span class="venta-servicio">${venta.Servicio}</span>
                <span class="venta-precio">$${parseFloat(venta.Total).toFixed(2)}</span>
                <span class="venta-metodo">${venta.MetodoPago}</span>
                <span class="venta-estado ${estadoClass}">${estadoTexto}</span>
            </div>
            ${detalleAbono}
            ${venta.Notas ? `<div style="margin-top: 8px; font-size: 13px; color: #999;">${venta.Notas}</div>` : ''}
        `;
        
        lista.appendChild(item);
    });
}

// ========================================
// ACTUALIZAR ESTADÍSTICAS
// ========================================
function actualizarEstadisticas(stats) {
    document.getElementById('ventasHoy').textContent = stats.totalVentas || 0;
    document.getElementById('totalHoy').textContent = '$' + parseFloat(stats.totalMonto || 0).toFixed(2);
}

// ========================================
// MODAL: REGISTRAR VENTA
// ========================================
function abrirModalVenta() {
    // Verificar que tenga asignación
    if (!asignacionActual) {
        openModalSinAsignacion();
        return;
    }
    
    document.getElementById('formVenta').reset();
    document.getElementById('modalVenta').classList.add('active');
    document.body.classList.add('modal-open');
}

function openModalSinAsignacion() {
    document.getElementById('modalSinAsignacion').classList.add('active');
    document.body.classList.add('modal-open');
}

function closeModalSinAsignacion() {
    document.getElementById('modalSinAsignacion').classList.remove('active');
    document.body.classList.remove('modal-open');
}

function cerrarModalVenta() {
    document.getElementById('modalVenta').classList.remove('active');
    document.body.classList.remove('modal-open');
}

// ========================================
// GUARDAR VENTA
// ========================================
function guardarVenta(event) {
    event.preventDefault();
    
    if (!asignacionActual) {
        mostrarModal('No tienes un colegio asignado para hoy');
        return;
    }
    
    const nombreCliente = document.getElementById('nombreCliente').value;
    const selectServicio = document.getElementById('selectServicio');
    const selectedOption = selectServicio.options[selectServicio.selectedIndex];
    const idServicio = selectServicio.value;
    const esPaquete = selectedOption.dataset.esPaquete === 'true';
    const precio = parseFloat(document.getElementById('precioVenta').value);
    const metodoPago = document.getElementById('metodoPago').value;
    const estadoPago = document.getElementById('estadoPago').value;
    const notas = document.getElementById('notasVenta').value;
    const nombreServicio = selectedOption.textContent.split(' - ')[0];
    
    // NUEVO: Obtener monto abonado(11/12/25)
    let montoAbonado = null;
    if (estadoPago === 'Abono') {
        montoAbonado = parseFloat(document.getElementById('montoAbonado').value);
        
        // Validaciones
        if (!montoAbonado || montoAbonado <= 0) {
            mostrarModal('Debes ingresar el monto abonado');
            return;  //revisar el mensaje (12/13/25)
        }
        
        if (montoAbonado > precio) {
            mostrarModal('El abono no puede ser mayor al precio total');
            return;
        }
    }
    
    // ========================================
    // NUEVO: Guardar en localStorage y redirigir a registro.html
    // ========================================
    const ventaData = {
        origen: 'vendedor',
        cliente: {
            nombre: nombreCliente,
            apellido: '',
            grupo: '',
            telefono: '',
            escuela: asignacionActual.NombreColegio,
            comentario: notas || ''
        },
        venta: {
            idServicio: esPaquete ? null : idServicio,
            idPaquete: esPaquete ? idServicio : null,
            nombreServicio: nombreServicio,
            esPaquete: esPaquete,
            precio: precio,
            metodoPago: metodoPago,
            estadoPago: estadoPago,
            montoAbonado: montoAbonado,
            idVendedor: vendedorData.id,
            idColegio: asignacionActual.ID_Colegio,
            nombreVendedor: vendedorData.nombre,
            colegioNombre: asignacionActual.NombreColegio
        },
        productos: [
            {
                descripcion: nombreServicio,
                base: precio.toFixed(2),
                itbms: '0.00',                    // Sin ITBMS
                total: precio.toFixed(2)
            }
        ]
    };
    
    // Guardar en localStorage
    localStorage.setItem('ventaDesdeVendedor', JSON.stringify(ventaData));
    
    console.log('✓ Venta guardada en localStorage:', ventaData);
    console.log('✓ Redirigiendo a registro.html...');
    
    // Mostrar notificación y redirigir
    showLoadingModal();
    setTimeout(() => {
        hideLoadingModal();
        window.location.href = '../../RegistroCliente_Factura/registro.html';
    }, 500);
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================
function formatearHora(fechaHora) {
    const fecha = new Date(fechaHora);
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
}

function showLoadingModal() {
    document.getElementById('loadingModal').classList.add('active');
}

function hideLoadingModal() {
    document.getElementById('loadingModal').classList.remove('active');
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('modalVenta');
    if (event.target === modal) {
        cerrarModalVenta();
    }
};