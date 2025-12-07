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
        alert('No tienes un colegio asignado para hoy');
        return;
    }
    
    const nombreCliente = document.getElementById('nombreCliente').value;
    const selectServicio = document.getElementById('selectServicio');
    const selectedOption = selectServicio.options[selectServicio.selectedIndex];
    const idServicio = selectServicio.value;
    const esPaquete = selectedOption.dataset.esPaquete === 'true';
    const precio = document.getElementById('precioVenta').value;
    const metodoPago = document.getElementById('metodoPago').value;
    const estadoPago = document.getElementById('estadoPago').value;
    const notas = document.getElementById('notasVenta').value;
    
    showLoadingModal();
    
    fetch('../../php/gest-ventas.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'registrar_venta',
            idVendedor: vendedorData.id,
            idColegio: asignacionActual.ID_Colegio,
            nombreCliente: nombreCliente,
            idServicio: esPaquete ? null : idServicio,
            idPaquete: esPaquete ? idServicio : null,
            total: precio,
            metodoPago: metodoPago,
            estadoPago: estadoPago,
            notas: notas
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            alert('¡Venta registrada correctamente!');
            cerrarModalVenta();
            cargarVentasDelDia();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        alert('Error de conexión');
    });
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