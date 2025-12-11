// ========================================
// VARIABLES GLOBALES
// ========================================
let cotizacionesData = [];
let cotizacionSeleccionada = null;

// ========================================
// VERIFICAR SESIÓN Y CARGAR DATOS
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    const user = checkSession();
    
    if (!user) {
        window.location.href = '../../login/login.html';
        return;
    }
    
    if (user.tipo !== 'CEO') {
        alert('Acceso denegado. Solo el CEO puede ver esta página.');
        window.location.href = '../administracion.html';
        return;
    }
    
    // Cargar cotizaciones
    cargarCotizaciones();
});

// ========================================
// CARGAR TODAS LAS COTIZACIONES
// ========================================
function cargarCotizaciones() {
    showLoadingModal();
    
    fetch('../../php/cotizaciones.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'obtener_todas_cotizaciones'
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            cotizacionesData = data.cotizaciones;
            actualizarEstadisticas(cotizacionesData);
            filtrarCotizaciones();
        } else {
            console.error('Error:', data.message);
            mostrarError('Error al cargar cotizaciones');
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        mostrarError('Error de conexión. Verifica que XAMPP esté activo.');
    });
}

// ========================================
// ACTUALIZAR ESTADÍSTICAS
// ========================================
function actualizarEstadisticas(cotizaciones) {
    const pendientes = cotizaciones.filter(c => c.Estado === 'Pendiente').length;
    const enRevision = cotizaciones.filter(c => c.Estado === 'En_Revision').length;
    const aprobadas = cotizaciones.filter(c => c.Estado === 'Aprobada').length;
    
    document.getElementById('statPendientes').textContent = pendientes;
    document.getElementById('statRevision').textContent = enRevision;
    document.getElementById('statAprobadas').textContent = aprobadas;
}

// ========================================
// FILTRAR COTIZACIONES
// ========================================
function filtrarCotizaciones() {
    const filtro = document.getElementById('filtroEstado').value;
    
    let cotizacionesFiltradas = cotizacionesData;
    
    if (filtro !== 'todos') {
        cotizacionesFiltradas = cotizacionesData.filter(c => c.Estado === filtro);
    }
    
    mostrarCotizaciones(cotizacionesFiltradas);
}

// ========================================
// MOSTRAR COTIZACIONES EN LA TABLA
// ========================================
function mostrarCotizaciones(cotizaciones) {
    const tabla = document.getElementById('tablaCotizaciones');
    tabla.innerHTML = '';
    
    if (cotizaciones.length === 0) {
        tabla.innerHTML = '<tr><td colspan="7" class="empty">No hay cotizaciones para mostrar</td></tr>';
        return;
    }
    
    cotizaciones.forEach(cot => {
        const row = document.createElement('tr');
        
        // Calcular clase de días restantes
        const diasRestantes = parseInt(cot.DiasHasta);
        let diasClass = 'normal';
        let diasTexto = `${diasRestantes} días`;
        
        if (diasRestantes < 0) {
            diasClass = 'urgente';
            diasTexto = 'Vencida';
        } else if (diasRestantes <= 3) {
            diasClass = 'urgente';
        } else if (diasRestantes <= 7) {
            diasClass = 'proximo';
        }
        
        // Estado formateado
        const estadoClass = cot.Estado.toLowerCase().replace('_', '_');
        const estadoTexto = cot.Estado.replace('_', ' ');
        
        row.innerHTML = `
            <td>#${cot.ID_Cotizacion}</td>
            <td>${cot.NombreCliente}</td>
            <td>${cot.TipoSesion}</td>
            <td>${formatearFecha(cot.FechaSolicitada)}</td>
            <td><span class="dias-restantes ${diasClass}">${diasTexto}</span></td>
            <td><span class="status-badge ${estadoClass}">${estadoTexto}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="verDetalle(${cot.ID_Cotizacion})" title="Ver detalle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        
        tabla.appendChild(row);
    });
}

// ========================================
// VER DETALLE DE COTIZACIÓN
// ========================================
function verDetalle(idCotizacion) {
    const cotizacion = cotizacionesData.find(c => c.ID_Cotizacion === idCotizacion);
    
    if (!cotizacion) {
        alert('Cotización no encontrada');
        return;
    }
    
    cotizacionSeleccionada = cotizacion;
    
    // Llenar datos del modal
    document.getElementById('detalleId').textContent = cotizacion.ID_Cotizacion;
    document.getElementById('detalleNombre').textContent = cotizacion.NombreCliente;
    document.getElementById('detalleCorreo').textContent = cotizacion.CorreoCliente;
    document.getElementById('detalleTelefono').textContent = cotizacion.TelefonoCliente || 'No especificado';
    document.getElementById('detalleTipo').textContent = cotizacion.TipoSesion;
    document.getElementById('detalleFecha').textContent = formatearFecha(cotizacion.FechaSolicitada);
    document.getElementById('detalleHora').textContent = cotizacion.HoraSolicitada || 'No especificada';
    
    const estadoBadge = document.getElementById('detalleEstado');
    estadoBadge.textContent = cotizacion.Estado.replace('_', ' ');
    estadoBadge.className = 'status-badge ' + cotizacion.Estado.toLowerCase().replace('_', '_');
    
    document.getElementById('detalleDescripcion').textContent = cotizacion.DescripcionSesion;
    
    // Mostrar info administrativa si existe
    if (cotizacion.PrecioEstimado || cotizacion.NotasAdmin) {
        document.getElementById('detalleAdminSection').style.display = 'block';
        document.getElementById('detallePrecio').textContent = cotizacion.PrecioEstimado || '0.00';
        document.getElementById('detalleNotas').textContent = cotizacion.NotasAdmin || 'Sin notas';
    } else {
        document.getElementById('detalleAdminSection').style.display = 'none';
    }
    
    // Mostrar/ocultar botones según el estado
    const btnRevisar = document.getElementById('btnRevisar');
    const btnAprobar = document.getElementById('btnAprobar');
    const btnRechazar = document.getElementById('btnRechazar');
    
    if (cotizacion.Estado === 'Pendiente') {
        btnRevisar.style.display = 'inline-block';
        btnAprobar.style.display = 'inline-block';
        btnRechazar.style.display = 'inline-block';
    } else if (cotizacion.Estado === 'En_Revision') {
        btnRevisar.style.display = 'none';
        btnAprobar.style.display = 'inline-block';
        btnRechazar.style.display = 'inline-block';
    } else {
        btnRevisar.style.display = 'none';
        btnAprobar.style.display = 'none';
        btnRechazar.style.display = 'none';
    }
    
    // Abrir modal
    document.getElementById('modalDetalle').classList.add('active');
    document.body.classList.add('modal-open');
}

function closeModalDetalle() {
    document.getElementById('modalDetalle').classList.remove('active');
    document.body.classList.remove('modal-open');
    cotizacionSeleccionada = null;
}

// ========================================
// MARCAR COMO EN REVISIÓN
// ========================================
function marcarEnRevision() {
    if (!cotizacionSeleccionada) return;
    
    if (!confirm('¿Marcar esta cotización como "En Revisión"?')) {
        return;
    }
    
    showLoadingModal();
    
    fetch('../../php/cotizaciones.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'revisar_cotizacion',
            idCotizacion: cotizacionSeleccionada.ID_Cotizacion
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            alert('Cotización marcada como en revisión');
            closeModalDetalle();
            cargarCotizaciones();
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
// APROBAR COTIZACIÓN
// ========================================
function openModalAprobar() {
    if (!cotizacionSeleccionada) return;
    
    document.getElementById('aprobarIdCotizacion').value = cotizacionSeleccionada.ID_Cotizacion;
    document.getElementById('formAprobar').reset();
    document.getElementById('aprobarIdCotizacion').value = cotizacionSeleccionada.ID_Cotizacion;
    
    closeModalDetalle();
    document.getElementById('modalAprobar').classList.add('active');
    document.body.classList.add('modal-open');
}

function closeModalAprobar() {
    document.getElementById('modalAprobar').classList.remove('active');
    document.body.classList.remove('modal-open');
}

function aprobarCotizacion(event) {
    event.preventDefault();
    
    const idCotizacion = document.getElementById('aprobarIdCotizacion').value;
    const precioEstimado = document.getElementById('precioEstimado').value;
    const notasAdmin = document.getElementById('notasAdmin').value;
    
    if (!confirm('¿Confirmar aprobación? Se creará un pedido automáticamente.')) {
        return;
    }
    
    showLoadingModal();
    
    const user = checkSession();
    
    fetch('../../php/cotizaciones.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'aprobar_cotizacion',
            idCotizacion: idCotizacion,
            precioEstimado: precioEstimado,
            notasAdmin: notasAdmin,
            idVendedor: user.id
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            alert('¡Cotización aprobada! Pedido #' + data.idPedido + ' creado correctamente.');
            closeModalAprobar();
            cargarCotizaciones();
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
// RECHAZAR COTIZACIÓN
// ========================================
function openModalRechazar() {
    if (!cotizacionSeleccionada) return;
    
    document.getElementById('rechazarIdCotizacion').value = cotizacionSeleccionada.ID_Cotizacion;
    document.getElementById('formRechazar').reset();
    document.getElementById('rechazarIdCotizacion').value = cotizacionSeleccionada.ID_Cotizacion;
    
    closeModalDetalle();
    document.getElementById('modalRechazar').classList.add('active');
    document.body.classList.add('modal-open');
}

function closeModalRechazar() {
    document.getElementById('modalRechazar').classList.remove('active');
    document.body.classList.remove('modal-open');
}

function rechazarCotizacion(event) {
    event.preventDefault();
    
    const idCotizacion = document.getElementById('rechazarIdCotizacion').value;
    const motivo = document.getElementById('motivoRechazo').value;
    
    if (!confirm('¿Confirmar rechazo de la cotización?')) {
        return;
    }
    
    showLoadingModal();
    
    fetch('../../php/cotizaciones.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'rechazar_cotizacion',
            idCotizacion: idCotizacion,
            motivo: motivo
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            alert('Cotización rechazada correctamente');
            closeModalRechazar();
            cargarCotizaciones();
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
// BLOQUEAR FECHAS
// ========================================
function openModalBloquearFecha() {
    document.getElementById('formBloquear').reset();
    
    // Establecer fecha mínima como hoy
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaInicio').min = hoy;
    document.getElementById('fechaFin').min = hoy;
    
    document.getElementById('modalBloquearFecha').classList.add('active');
    document.body.classList.add('modal-open');
}

function closeModalBloquearFecha() {
    document.getElementById('modalBloquearFecha').classList.remove('active');
    document.body.classList.remove('modal-open');
}

function bloquearFechas(event) {
    event.preventDefault();
    
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const motivo = document.getElementById('motivoBloqueo').value;
    
    // Validar que fecha fin sea mayor o igual a fecha inicio
    if (new Date(fechaFin) < new Date(fechaInicio)) {
        alert('La fecha de fin debe ser posterior o igual a la fecha de inicio');
        return;
    }
    
    showLoadingModal();
    
    fetch('../../php/cotizaciones.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'bloquear_fecha',
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            motivo: motivo
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            alert('Fechas bloqueadas correctamente');
            closeModalBloquearFecha();
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
function formatearFecha(fecha) {
    const date = new Date(fecha);
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', opciones);
}

function showLoadingModal() {
    document.getElementById('loadingModal').classList.add('active');
}

function hideLoadingModal() {
    document.getElementById('loadingModal').classList.remove('active');
}

function mostrarError(mensaje) {
    alert(mensaje);
}

// Cerrar modales al hacer clic fuera
window.onclick = function(event) {
    const modales = ['modalDetalle', 'modalAprobar', 'modalRechazar', 'modalBloquearFecha'];
    
    modales.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    });
};