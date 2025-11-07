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
        alert('Acceso denegado. Solo el CEO puede ver esta página.');
        window.location.href = '../administracion.html';
        return;
    }
    
    // Cargar datos del dashboard
    loadDashboardData();
});

// ========================================
// VARIABLES GLOBALES PARA GRÁFICOS
// ========================================
let ventasChart = null;
let serviciosChart = null;

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
    // Tabla de últimos pedidos
    const tablaPedidos = document.getElementById('tablaPedidos');
    tablaPedidos.innerHTML = '';
    
    if (pedidos.ultimos && pedidos.ultimos.length > 0) {
        pedidos.ultimos.forEach(pedido => {
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
    
    // Tabla de pedidos pendientes
    const tablaPendientes = document.getElementById('tablaPendientes');
    const badgePendientes = document.getElementById('badgePendientes');
    tablaPendientes.innerHTML = '';
    
    if (pedidos.pendientes && pedidos.pendientes.length > 0) {
        badgePendientes.textContent = pedidos.pendientes.length;
        
        pedidos.pendientes.forEach(pedido => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${pedido.ID_Pedido}</td>
                <td>${pedido.Cliente}</td>
                <td>$${parseFloat(pedido.Total).toFixed(2)}</td>
                <td>${pedido.DiasPendiente} días</td>
                <td><button class="action-btn" onclick="verDetallePedido(${pedido.ID_Pedido})">Ver detalle</button></td>
            `;
            tablaPendientes.appendChild(row);
        });
    } else {
        badgePendientes.textContent = '0';
        tablaPendientes.innerHTML = '<tr><td colspan="5" class="empty">No hay pedidos pendientes</td></tr>';
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

function verDetallePedido(idPedido) {
    alert(`Ver detalle del pedido #${idPedido}\n\nFunción en desarrollo`);
}

function refreshDashboard() {
    loadDashboardData();
}

function showLoadingModal() {
    document.getElementById('loadingModal').classList.add('active');
}

function hideLoadingModal() {
    document.getElementById('loadingModal').classList.remove('active');
}

function showErrorMessage(message) {
    alert(message);
}