// ========================================
// VERIFICAR SESIÓN Y PERMISOS
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    const user = checkSession();
    
    if (!user) {
        window.location.href = '../../login/login.html';
        return;
    }
    
    if (user.tipo !== 'CEO') {
        mostrarModal('Acceso denegado. Solo el CEO puede ver esta página.');
        window.location.href = '../administracion.html';
        return;
    }
    
    // Cargar datos del dashboard
    loadDashboardData();
});

// ========================================
// VARIABLES GLOBALES PARA GESTIÓN DE ABONOS
// ========================================
let pedidoActualDetalle = null;
let saldoPendienteActual = 0;

// ========================================
// VARIABLES GLOBALES PARA GRÁFICOS
// ========================================
let ventasChart = null;
let serviciosChart = null;

// ========================================
// VARIABLES PARA MODAL DE CONFIRMACIÓN
// ========================================
let accionPendiente = null;
let datosAccion = null;

// ========================================
// CARGAR TODOS LOS DATOS DEL DASHBOARD
// ========================================
function loadDashboardData() {
    showLoadingModal();
    
    fetch('../../php/dashboard.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'get_dashboard_data'
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            updateEstadisticas(data.estadisticas);
            updateGraficos(data.graficos);
            updateTablas(data.pedidos);
        } else {
            console.error('Error al cargar datos:', data.message);
            showErrorMessage('Error al cargar los datos del dashboard');
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        showErrorMessage('Error de conexión. Verifica que XAMPP esté activo.');
    });
}

// ========================================
// ACTUALIZAR TARJETAS DE ESTADÍSTICAS
// ========================================
function updateEstadisticas(stats) {
    // Ventas del mes
    document.getElementById('ventasMes').textContent = `$${parseFloat(stats.ventasMes || 0).toFixed(2)}`;
    
    const cambioVentas = parseFloat(stats.cambioVentas || 0);
    const ventasCambioEl = document.getElementById('ventasMesCambio');
    if (cambioVentas > 0) {
        ventasCambioEl.textContent = `+${cambioVentas}% vs mes anterior`;
        ventasCambioEl.className = 'stat-change positive';
    } else if (cambioVentas < 0) {
        ventasCambioEl.textContent = `${cambioVentas}% vs mes anterior`;
        ventasCambioEl.className = 'stat-change negative';
    } else {
        ventasCambioEl.textContent = 'Sin cambios vs mes anterior';
        ventasCambioEl.className = 'stat-change';
    }
    
    // Pedidos activos
    document.getElementById('pedidosActivos').textContent = stats.pedidosActivos || 0;
    document.getElementById('pedidosPendientes').textContent = `${stats.pedidosPendientes || 0} pendientes de pago`;
    
    // Total clientes
    document.getElementById('totalClientes').textContent = stats.totalClientes || 0;
    document.getElementById('clientesNuevos').textContent = `${stats.clientesNuevos || 0} nuevos este mes`;
    
    // Ingresos totales
    document.getElementById('ingresosTotales').textContent = `$${parseFloat(stats.ingresosTotales || 0).toFixed(2)}`;
}

// ========================================
// ACTUALIZAR GRÁFICOS
// ========================================
function updateGraficos(graficos) {
    // Destruir gráficos anteriores si existen
    if (ventasChart) ventasChart.destroy();
    if (serviciosChart) serviciosChart.destroy();
    
    // Gráfico de ventas mensuales
    const ventasCtx = document.getElementById('ventasChart').getContext('2d');
    ventasChart = new Chart(ventasCtx, {
        type: 'line',
        data: {
            labels: graficos.ventasMensuales.labels || [],
            datasets: [{
                label: 'Ventas ($)',
                data: graficos.ventasMensuales.data || [],
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
    
    // Gráfico de servicios más vendidos
    const serviciosCtx = document.getElementById('serviciosChart').getContext('2d');
    serviciosChart = new Chart(serviciosCtx, {
        type: 'bar',
        data: {
            labels: graficos.servicios.labels || [],
            datasets: [{
                label: 'Cantidad vendida',
                data: graficos.servicios.data || [],
                backgroundColor: [
                    '#2196f3',
                    '#4caf50',
                    '#ff9800',
                    '#9c27b0',
                    '#f44336'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ========================================
// ACTUALIZAR TABLAS
// ========================================
function updateTablas(pedidos) {
    //FIX 1: Tabla de ÚLTIMOS PEDIDOS (limitada a 5) (12/12/25)
    const tablaPedidos = document.getElementById('tablaPedidos');
    tablaPedidos.innerHTML = '';
    
    if (pedidos.ultimos && pedidos.ultimos.length > 0) {
        // Limitar a solo 5 pedidos (sin importar cuántos haya)
        const pedidosLimitados = pedidos.ultimos.slice(0, 5);
        
        pedidosLimitados.forEach(pedido => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${pedido.ID_Pedido}</td>
                <td>${pedido.Cliente}</td>
                <td>${pedido.Servicio || 'N/A'}</td>
                <td>${formatFecha(pedido.Fecha)}</td>
                <td>$${parseFloat(pedido.Total).toFixed(2)}</td>
                <td><span class="status-badge ${pedido.Estado.toLowerCase()}">${pedido.Estado}</span></td>
            `;
            tablaPedidos.appendChild(row);
        });
    } else {
        tablaPedidos.innerHTML = '<tr><td colspan="6" class="empty">No hay pedidos recientes</td></tr>';
    }
    
    //FIX 2: Tabla de PEDIDOS PENDIENTES (excluir cancelados)(12/12/25)
    const tablaPendientes = document.getElementById('tablaPendientes');
    const badgePendientes = document.getElementById('badgePendientes');
    tablaPendientes.innerHTML = '';
    
    if (pedidos.pendientes && pedidos.pendientes.length > 0) {
        // ← FIX: Filtrar pedidos cancelados en el frontend
        const pedidosActivos = pedidos.pendientes.filter(p => 
            p.Estado !== 'Cancelado' && 
            p.EstadoPago !== 'Cancelado'
        );
        
        badgePendientes.textContent = pedidosActivos.length;
        
        if (pedidosActivos.length > 0) {
            pedidosActivos.forEach(pedido => {
                const row = document.createElement('tr');
                const estadoTexto = pedido.EstadoPago === 'Abono' ? 'Abono' : 'Pendiente';
                const estadoClass = pedido.EstadoPago === 'Abono' ? 'abono' : 'pendiente';
                
                row.innerHTML = `
                    <td>#${pedido.ID_Pedido}</td>
                    <td>${pedido.Cliente}</td>
                    <td>$${parseFloat(pedido.Total).toFixed(2)}</td>
                    <td>${pedido.DiasPendiente} días</td>
                    <td><span class="status-badge ${estadoClass}">${estadoTexto}</span></td>
                    <td>
                        <div class="action-buttons-dashboard">
                            <button class="btn-action btn-completar" onclick="marcarCompletado(${pedido.ID_Pedido})" title="Marcar como completado">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                            </button>
                            <button class="btn-action btn-cancelar" onclick="cancelarPedido(${pedido.ID_Pedido})" title="Cancelar pedido">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                            </button>
                            <button class="btn-action btn-detalle" onclick="verDetallePedido(${pedido.ID_Pedido})" title="Ver detalle">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                    </td>
                `;
                tablaPendientes.appendChild(row);
            });
        } else {
            tablaPendientes.innerHTML = '<tr><td colspan="6" class="empty">No hay pedidos pendientes</td></tr>';
        }
    } else {
        badgePendientes.textContent = '0';
        tablaPendientes.innerHTML = '<tr><td colspan="6" class="empty">No hay pedidos pendientes</td></tr>';
    }
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================
function formatFecha(fecha) {
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

// ========================================
// VER DETALLE / MARCAR COMPLETADO / CANCELAR
// ========================================
function verDetallePedido(idPedido) {
    showLoadingModal('Cargando detalles...');
    
    fetch('../../php/gest-abonos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'obtener_detalle_pedido',
            idPedido: idPedido
        })
    })
    .then(r => r.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success && data.pedido) {
            mostrarModalDetallePedido(data.pedido);
        } else {
            mostrarModal('Error: ' + (data.message || 'No se pudo cargar el pedido'), 'error');
        }
    })
    .catch(err => {
        hideLoadingModal();
        console.error('Error:', err);
        mostrarModal('Error de conexión al cargar el pedido', 'error');
    });
}

// ========================================
// MOSTRAR MODAL CON DETALLE DEL PEDIDO
// ========================================
function mostrarModalDetallePedido(pedido) {
    pedidoActualDetalle = pedido;
    saldoPendienteActual = parseFloat(pedido.SaldoPendiente);
    
    // Llenar información básica
    document.getElementById('detallePedidoId').textContent = pedido.ID_Pedido;
    document.getElementById('detCliente').textContent = pedido.Cliente || 'N/A';
    document.getElementById('detServicio').textContent = pedido.Servicio || 'N/A';
    document.getElementById('detVendedor').textContent = pedido.Vendedor || 'N/A';
    document.getElementById('detFecha').textContent = formatFecha(pedido.Fecha);
    document.getElementById('detColegio').textContent = pedido.Colegio || 'N/A';
    
    // Estado del pedido
    const estadoBadge = document.getElementById('detEstado');
    estadoBadge.textContent = pedido.Estado;
    estadoBadge.className = 'status-badge ' + pedido.Estado.toLowerCase();
    
    // Información de pago
    document.getElementById('detTotal').textContent = '$' + parseFloat(pedido.Total).toFixed(2);
    document.getElementById('detAbonado').textContent = '$' + parseFloat(pedido.TotalAbonado || 0).toFixed(2);
    document.getElementById('detPendiente').textContent = '$' + saldoPendienteActual.toFixed(2);
    
    // Notas
    const notasEl = document.getElementById('detNotas');
    notasEl.textContent = pedido.Notas || 'Sin notas adicionales';
    
    // Mostrar botón de nuevo abono solo si hay saldo pendiente
    const btnNuevoAbono = document.getElementById('btnNuevoAbono');
    if (saldoPendienteActual > 0) {
        btnNuevoAbono.style.display = 'block';
    } else {
        btnNuevoAbono.style.display = 'none';
    }
    
    // Cargar historial de abonos
    cargarHistorialAbonos(pedido.ID_Pedido);
    
    // Mostrar modal
    document.getElementById('modalDetallePedido').classList.add('active');
    document.body.classList.add('modal-open');
}

// MARCAR PEDIDO COMO COMPLETADO
function marcarCompletado(idPedido) {
    accionPendiente = 'marcar_completado';
    datosAccion = { idPedido: idPedido };
    
    const modal = document.getElementById('modalConfirmacion');
    const title = document.getElementById('confirmTitle');
    const message = document.getElementById('confirmMessage');
    const inputContainer = document.getElementById('confirmInputContainer');
    const confirmBtn = document.getElementById('confirmBtn');
    
    title.textContent = 'Marcar como Completado';
    message.textContent = `¿Deseas marcar el pedido #${idPedido} como completado?`;
    inputContainer.style.display = 'none';
    confirmBtn.textContent = 'Confirmar';
    confirmBtn.style.background = '#2e7d32';
    
    modal.classList.add('active');
    document.body.classList.add('modal-open');
}

// CANCELAR PEDIDO
function cancelarPedido(idPedido) {
    accionPendiente = 'cancelar_pedido';
    datosAccion = { idPedido: idPedido };
    
    const modal = document.getElementById('modalConfirmacion');
    const title = document.getElementById('confirmTitle');
    const message = document.getElementById('confirmMessage');
    const inputContainer = document.getElementById('confirmInputContainer');
    const confirmBtn = document.getElementById('confirmBtn');
    
    title.textContent = 'Cancelar Pedido';
    message.textContent = `¿Deseas cancelar el pedido #${idPedido}?`;
    inputContainer.style.display = 'block';
    confirmBtn.textContent = 'Cancelar Pedido';
    confirmBtn.style.background = '#c62828';
    
    // Limpiar textarea
    document.getElementById('confirmInput').value = '';
    
    modal.classList.add('active');
    document.body.classList.add('modal-open');
}

// CERRAR MODAL DE CONFIRMACIÓN
function cerrarModalConfirmacion() {
    const modal = document.getElementById('modalConfirmacion');
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
    accionPendiente = null;
    datosAccion = null;
}

// EJECUTAR ACCIÓN CONFIRMADA
function ejecutarAccion() {
    if (!accionPendiente || !datosAccion || !datosAccion.idPedido) {
        console.error('Error: Datos de acción incompletos', { accionPendiente, datosAccion });
        mostrarModal('Error: No se pudo procesar la acción. Por favor, intenta nuevamente.');
        cerrarModalConfirmacion();
        return;
    }
    
    // Guardar los datos ANTES de cerrar el modal
    const accionAEjecutar = accionPendiente;
    const datosAEnviar = { ...datosAccion };
    
    // Si es cancelación, agregar motivo
    if (accionAEjecutar === 'cancelar_pedido') {
        const motivo = document.getElementById('confirmInput').value.trim();
        datosAEnviar.motivo = motivo;
    }
    
    cerrarModalConfirmacion();
    showLoadingModal('Procesando...');
    
    // Construcción del payload según la acción
    const payload = {
        action: accionAEjecutar,
        idPedido: datosAEnviar.idPedido
    };
    
    if (datosAEnviar.motivo !== undefined) {
        payload.motivo = datosAEnviar.motivo;
    }
    
    console.log('Enviando payload:', payload);
    
    fetch('../../php/dashboard.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(data => {
        hideLoadingModal();
        
        console.log('Respuesta del servidor:', data);
        
        if (data.success) {
            mostrarModal(data.message || 'Acción completada exitosamente');
            loadDashboardData(); // ← Recargar dashboard completo
        } else {
            mostrarModal('Error: ' + (data.message || 'Respuesta inesperada'));
        }
    })
    .catch(err => {
        hideLoadingModal();
        console.error('Error en fetch:', err);
        mostrarModal('Error de conexión');
    });
}

// ========================================
// REFRESCAR DASHBOARD
// ========================================
function refreshDashboard() {
    loadDashboardData();
}

// ========================================
// MODALES DE CARGA Y ERROR
// ========================================
function showLoadingModal(mensaje = 'Cargando...') {
    const modal = document.getElementById('loadingModal');
    const texto = modal.querySelector('.loading-content p');
    
    if (texto) {
        texto.textContent = mensaje;
    }
    
    modal.classList.add('active');
}

function hideLoadingModal() {
    document.getElementById('loadingModal').classList.remove('active');
}

function showErrorMessage(message) {
    mostrarModal(message);
}

// ========================================
// MODAL: TODOS LOS PEDIDOS
// ========================================
function abrirModalTodosPedidos() {
    const modal = document.getElementById('modalTodosPedidos');
    const tabla = document.getElementById('tablaTodosPedidos');
    
    if (!modal) {
        console.error('Modal no encontrado');
        return;
    }

    modal.classList.add('active');
    document.body.classList.add('modal-open');

    showLoadingModal('Cargando todos los pedidos...');

    fetch('../../php/dashboard.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_all_pedidos' })
    })
    .then(r => r.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success && data.pedidos && data.pedidos.length > 0) {
            tabla.innerHTML = '';
            
            data.pedidos.forEach(pedido => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>#${pedido.ID_Pedido}</td>
                    <td>${pedido.Cliente || 'N/A'}</td>
                    <td>${pedido.Servicio || 'N/A'}</td>
                    <td>${new Date(pedido.Fecha).toLocaleDateString('es-ES')}</td>
                    <td>$${parseFloat(pedido.Total).toFixed(2)}</td>
                    <td><span class="status-badge ${pedido.Estado.toLowerCase()}">${pedido.Estado}</span></td>
                `;
                tabla.appendChild(row);
            });
        } else {
            tabla.innerHTML = '<tr><td colspan="6" class="empty">No hay pedidos disponibles</td></tr>';
        }
    })
    .catch(err => {
        hideLoadingModal();
        console.error(err);
        tabla.innerHTML = '<tr><td colspan="6" class="error">Error al cargar pedidos</td></tr>';
    });
}

function cerrarModalTodosPedidos() {
    const modal = document.getElementById('modalTodosPedidos');
    if (!modal) return;
    
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('modalTodosPedidos');
    if (event.target === modal) {
        cerrarModalTodosPedidos();
    }
};

// ========================================
// FUNCIONES DE HISTORIAL DE ABONOS (ENLZADAS AL DETALLE)
// ========================================

// ========================================
// CARGAR HISTORIAL DE ABONOS
// ========================================
function cargarHistorialAbonos(idPedido) {
    const listaAbonos = document.getElementById('listaAbonos');
    listaAbonos.innerHTML = '<p class="sin-abonos">Cargando historial...</p>';
    
    fetch('../../php/gest-abonos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'obtener_historial_abonos',
            idPedido: idPedido
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            mostrarHistorialAbonos(data.abonos);
        } else {
            listaAbonos.innerHTML = '<p class="sin-abonos">Error al cargar historial</p>';
        }
    })
    .catch(err => {
        console.error('Error:', err);
        listaAbonos.innerHTML = '<p class="sin-abonos">Error de conexión</p>';
    });
}

// ========================================
// MOSTRAR HISTORIAL DE ABONOS EN EL DOM
// ========================================
function mostrarHistorialAbonos(abonos) {
    const listaAbonos = document.getElementById('listaAbonos');
    
    if (!abonos || abonos.length === 0) {
        listaAbonos.innerHTML = '<p class="sin-abonos">No hay abonos registrados aún</p>';
        return;
    }
    
    listaAbonos.innerHTML = '';
    
    abonos.forEach((abono, index) => {
        const abonoDiv = document.createElement('div');
        abonoDiv.className = 'abono-item';
        
        const fecha = new Date(abono.FechaRegistro);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        abonoDiv.innerHTML = `
            <div class="abono-header">
                <span class="abono-monto">$${parseFloat(abono.Monto).toFixed(2)}</span>
                <span class="abono-fecha">${fechaFormateada}</span>
            </div>
            <div class="abono-detalles">
                <span>
                    <strong>Método:</strong> ${abono.MetodoPago || 'No especificado'}
                </span>
                <span>
                    <strong>Registrado por:</strong> ${abono.RegistradoPor || 'Sistema'}
                </span>
                <span>
                    <strong>Abono #${index + 1}</strong>
                </span>
            </div>
            ${abono.Notas ? `<div class="abono-notas">${abono.Notas}</div>` : ''}
        `;
        
        listaAbonos.appendChild(abonoDiv);
    });
}

// ========================================
// CERRAR MODAL DETALLE PEDIDO
// ========================================
function cerrarModalDetallePedido() {
    document.getElementById('modalDetallePedido').classList.remove('active');
    document.body.classList.remove('modal-open');
    pedidoActualDetalle = null;
    saldoPendienteActual = 0;
}

// ========================================
// ABRIR MODAL NUEVO ABONO
// ========================================
function abrirModalNuevoAbono() {
    if (!pedidoActualDetalle) {
        mostrarModal('Error: No se ha cargado el pedido', 'error');
        return;
    }
    
    // Llenar datos del modal
    document.getElementById('abonoIdPedido').value = pedidoActualDetalle.ID_Pedido;
    document.getElementById('abonoSaldoPendiente').textContent = saldoPendienteActual.toFixed(2);
    
    // Limpiar formulario
    document.getElementById('formNuevoAbono').reset();
    document.getElementById('abonoIdPedido').value = pedidoActualDetalle.ID_Pedido; // Restaurar después del reset
    
    // Mostrar modal
    document.getElementById('modalNuevoAbono').classList.add('active');
}

// ========================================
// CERRAR MODAL NUEVO ABONO
// ========================================
function cerrarModalNuevoAbono() {
    document.getElementById('modalNuevoAbono').classList.remove('active');
}

// ========================================
// REGISTRAR NUEVO ABONO
// ========================================
function registrarNuevoAbono(event) {
    event.preventDefault();
    
    const user = checkSession();
    if (!user) {
        mostrarModal('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
        return;
    }
    
    const idPedido = document.getElementById('abonoIdPedido').value;
    const monto = parseFloat(document.getElementById('montoNuevoAbono').value);
    const metodo = document.getElementById('metodoAbono').value;
    const notas = document.getElementById('notasAbono').value.trim();
    
    // Validaciones frontend
    if (!monto || monto <= 0) {
        mostrarModal('El monto debe ser mayor a 0', 'warning');
        return;
    }
    
    if (monto > saldoPendienteActual) {
        mostrarModal(`El monto ($${monto.toFixed(2)}) excede el saldo pendiente ($${saldoPendienteActual.toFixed(2)})`, 'warning');
        return;
    }
    
    if (!metodo) {
        mostrarModal('Selecciona un método de pago', 'warning');
        return;
    }
    
    showLoadingModal('Registrando abono...');
    
    fetch('../../php/gest-abonos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'registrar_nuevo_abono',
            idPedido: idPedido,
            monto: monto,
            metodo: metodo,
            notas: notas,
            idUsuario: user.id
        })
    })
    .then(r => r.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            // Mensaje de éxito
            if (data.completado) {
                mostrarModal('¡Pago completado! El cliente ha pagado la totalidad del pedido.', 'success');
            } else {
                mostrarModal(`Abono registrado. Nuevo saldo pendiente: $${data.saldoRestante.toFixed(2)}`, 'success');
            }
            
            // Cerrar modal de nuevo abono
            cerrarModalNuevoAbono();
            
            // Recargar detalles del pedido
            setTimeout(() => {
                verDetallePedido(idPedido);
            }, 500);
            
            // Recargar dashboard completo después de 1 segundo
            setTimeout(() => {
                loadDashboardData();
            }, 1000);
            
        } else {
            mostrarModal('Error: ' + (data.message || 'No se pudo registrar el abono'), 'error');
        }
    })
    .catch(err => {
        hideLoadingModal();
        console.error('Error:', err);
        mostrarModal('Error de conexión al registrar el abono', 'error');
    });
}

// ========================================
// CERRAR MODALES AL HACER CLIC FUERA
// ========================================
window.addEventListener('click', function(event) {
    // Modal detalle pedido
    const modalDetalle = document.getElementById('modalDetallePedido');
    if (event.target === modalDetalle) {
        cerrarModalDetallePedido();
    }
    
    // Modal nuevo abono
    const modalAbono = document.getElementById('modalNuevoAbono');
    if (event.target === modalAbono) {
        cerrarModalNuevoAbono();
    }
});

