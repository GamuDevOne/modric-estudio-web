// gestion-abonos.js

let pedidoSeleccionado = null;

// ========================================
// INICIALIZAR
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    const user = checkSession();
    
    if (!user || user.tipo !== 'CEO') {
        alert('Acceso denegado');
        window.location.href = '../administracion.html';
        return;
    }
    
    cargarEstadisticas();
    cargarPedidosAbonos();
});

// ========================================
// CARGAR ESTADÍSTICAS
// ========================================
function cargarEstadisticas() {
    fetch('../../php/gest-abonos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'obtener_estadisticas_abonos' })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            const stats = data.estadisticas;
            document.getElementById('statTotalPendientes').textContent = stats.totalPendientes;
            document.getElementById('statSumaSaldos').textContent = '$' + parseFloat(stats.sumaSaldosPendientes).toFixed(2);
            document.getElementById('statUrgentes').textContent = stats.urgentes;
            document.getElementById('statVencidos').textContent = stats.vencidos;
        }
    })
    .catch(err => console.error('Error:', err));
}

// ========================================
// CARGAR PEDIDOS CON ABONOS
// ========================================
function cargarPedidosAbonos() {
    const filtro = document.getElementById('filtroAbonos').value;
    
    fetch('../../php/gest-abonos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'obtener_pedidos_con_abonos',
            filtro: filtro
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            mostrarPedidos(data.pedidos);
        }
    })
    .catch(err => console.error('Error:', err));
}

// ========================================
// MOSTRAR PEDIDOS EN TABLA
// ========================================
function mostrarPedidos(pedidos) {
    const tbody = document.getElementById('tablaPedidosAbonos');
    tbody.innerHTML = '';
    
    if (pedidos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No hay pedidos con abonos pendientes</td></tr>';
        return;
    }
    
    pedidos.forEach(p => {
        const row = document.createElement('tr');
        
        let badgeClass = 'normal';
        if (p.EstadoUrgencia === 'Vencido') badgeClass = 'vencido';
        else if (p.EstadoUrgencia === 'Urgente') badgeClass = 'urgente';
        else if (p.EstadoUrgencia === 'Próximo') badgeClass = 'proximo';
        
        row.innerHTML = `
            <td>#${p.ID_Pedido}</td>
            <td>
                ${p.Cliente}<br>
                <small style="color: #999;">${p.CorreoCliente}</small>
            </td>
            <td>$${parseFloat(p.Total).toFixed(2)}</td>
            <td style="color: #4caf50; font-weight: 600;">$${parseFloat(p.TotalAbonado).toFixed(2)}</td>
            <td style="color: #f57c00; font-weight: 600;">$${parseFloat(p.SaldoPendiente).toFixed(2)}</td>
            <td>
                ${formatearFecha(p.FechaLimiteAbono)}<br>
                <small style="color: #999;">${p.DiasRestantes >= 0 ? p.DiasRestantes + ' días' : 'Vencido'}</small>
            </td>
            <td><span class="badge-urgencia ${badgeClass}">${p.EstadoUrgencia}</span></td>
            <td>
                <button class="btn-icon-action" onclick="verHistorial(${p.ID_Pedido})" title="Ver historial">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// ========================================
// VER HISTORIAL DE ABONOS
// ========================================
function verHistorial(idPedido) {
    pedidoSeleccionado = idPedido;
    document.getElementById('historialPedidoId').textContent = idPedido;
    
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
            mostrarHistorial(data.abonos, data.totales);
            document.getElementById('modalHistorial').classList.add('active');
            document.body.classList.add('modal-open');
        }
    })
    .catch(err => console.error('Error:', err));
}

// ========================================
// MOSTRAR HISTORIAL
// ========================================
function mostrarHistorial(abonos, totales) {
    // Totales
    document.getElementById('totalPedido').textContent = '$' + parseFloat(totales.Total).toFixed(2);
    document.getElementById('totalAbonado').textContent = '$' + parseFloat(totales.TotalAbonado).toFixed(2);
    document.getElementById('saldoPendiente').textContent = '$' + parseFloat(totales.SaldoPendiente).toFixed(2);
    
    // Lista de abonos
    const lista = document.getElementById('listaHistorial');
    lista.innerHTML = '';
    
    if (abonos.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: #999;">No hay abonos registrados</p>';
        return;
    }
    
    abonos.forEach(abono => {
        const item = document.createElement('div');
        item.className = 'historial-item';
        item.innerHTML = `
            <div class="historial-header">
                <span>$${parseFloat(abono.MontoAbonado).toFixed(2)}</span>
                <span>${formatearFechaHora(abono.FechaAbono)}</span>
            </div>
            <div class="historial-detalles">
                <strong>Método:</strong> ${abono.MetodoPago} | 
                <strong>Vendedor:</strong> ${abono.Vendedor || 'N/A'}
                ${abono.Notas ? '<br><strong>Notas:</strong> ' + abono.Notas : ''}
            </div>
        `;
        lista.appendChild(item);
    });
}

// ========================================
// ABRIR MODAL NUEVO ABONO
// ========================================
function abrirModalNuevoAbono() {
    if (!pedidoSeleccionado) return;
    
    document.getElementById('abonoIdPedido').value = pedidoSeleccionado;
    
    // Obtener saldo actual
    const saldo = document.getElementById('saldoPendiente').textContent.replace('$', '');
    document.getElementById('abonoSaldoDisponible').textContent = saldo;
    
    document.getElementById('formNuevoAbono').reset();
    document.getElementById('abonoIdPedido').value = pedidoSeleccionado;
    
    document.getElementById('modalHistorial').classList.remove('active');
    document.getElementById('modalNuevoAbono').classList.add('active');
}

// ========================================
// GUARDAR ABONO
// ========================================
function guardarAbono(event) {
    event.preventDefault();
    
    const user = checkSession();
    const idPedido = document.getElementById('abonoIdPedido').value;
    const monto = parseFloat(document.getElementById('abonoMonto').value);
    const metodoPago = document.getElementById('abonoMetodoPago').value;
    const notas = document.getElementById('abonoNotas').value;
    
    showLoadingModal();
    
    fetch('../../php/gest-abonos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'registrar_abono',
            idPedido: idPedido,
            monto: monto,
            metodoPago: metodoPago,
            idVendedor: user.id,
            notas: notas
        })
    })
    .then(r => r.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            alert('¡Abono registrado correctamente!');
            cerrarModalNuevoAbono();
            cargarEstadisticas();
            cargarPedidosAbonos();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(err => {
        hideLoadingModal();
        console.error('Error:', err);
        alert('Error de conexión');
    });
}

// ========================================
// CERRAR MODALES
// ========================================
function cerrarModalHistorial() {
    document.getElementById('modalHistorial').classList.remove('active');
    document.body.classList.remove('modal-open');
    pedidoSeleccionado = null;
}

function cerrarModalNuevoAbono() {
    document.getElementById('modalNuevoAbono').classList.remove('active');
    document.getElementById('modalHistorial').classList.add('active');
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================
function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES');
}

function formatearFechaHora(fecha) {
    if (!fecha) return 'N/A';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES') + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function showLoadingModal() {
    document.getElementById('loadingModal').classList.add('active');
}

function hideLoadingModal() {
    document.getElementById('loadingModal').classList.remove('active');
}

// Cerrar modales al hacer clic fuera
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
};