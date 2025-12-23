// ========================================
// VARIABLES GLOBALES
// ========================================
let vendedoresData = [];
let modoEdicion = false;

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
    
    // Cargar vendedores
    cargarVendedores();
});

// ========================================
// CARGAR VENDEDORES DESDE LA BD
// ========================================
function cargarVendedores() {
    showLoadingModal();
    
    fetch('../../php/gest-vendedores.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'get_all'
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            vendedoresData = data.vendedores;
            mostrarVendedores(vendedoresData);
        } else {
            console.error('Error:', data.message);
            mostrarError('Error al cargar vendedores');
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        mostrarError('Error de conexión. Verifica que XAMPP esté activo.');
    });
}

// ========================================
// MOSTRAR VENDEDORES EN LA TABLA
// ========================================
function mostrarVendedores(vendedores) {
    const tabla = document.getElementById('tablaVendedores');
    tabla.innerHTML = '';
    
    if (vendedores.length === 0) {
        tabla.innerHTML = '<tr><td colspan="4" class="empty">No hay vendedores registrados</td></tr>';
        return;
    }
    
    vendedores.forEach(vendedor => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${vendedor.ID_Usuario}</td>
            <td>${vendedor.NombreCompleto}</td>
            <td>${vendedor.Correo || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon stats" title="Ver estadísticas">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                    </button>
                    <button class="btn-icon edit" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon delete" title="Eliminar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tabla.appendChild(row);

        // Asignar listeners en vez de usar onclick inline (evita rotura por comillas en nombres)
        const btnStats = row.querySelector('.stats');
        const btnEdit = row.querySelector('.edit');
        const btnDelete = row.querySelector('.delete');

        if (btnStats) btnStats.addEventListener('click', () => verEstadisticas(vendedor.ID_Usuario));
        if (btnEdit) btnEdit.addEventListener('click', () => editarVendedor(vendedor.ID_Usuario));
        if (btnDelete) btnDelete.addEventListener('click', () => eliminarVendedor(vendedor.ID_Usuario, vendedor.NombreCompleto));
    });
}

// ========================================
// ABRIR MODAL AGREGAR
// ========================================
function openModalAgregar() {
    modoEdicion = false;
    document.getElementById('modalTitle').textContent = 'Agregar Vendedor';
    document.getElementById('formVendedor').reset();
    document.getElementById('vendedorId').value = '';
    document.getElementById('contrasena').required = true;
    document.getElementById('requiredStar').style.display = 'inline';
    document.getElementById('passwordHelp').textContent = 'Mínimo 6 caracteres';
    document.getElementById('passwordHelp').classList.remove('show');
    document.getElementById('modalVendedor').classList.add('active');
}

// ========================================
// EDITAR VENDEDOR
// ========================================
function editarVendedor(id) {
    const vendedor = vendedoresData.find(v => v.ID_Usuario === id);
    
    if (!vendedor) {
        mostrarModal('Vendedor no encontrado', 'error');
        return;
    }
    
    modoEdicion = true;
    document.getElementById('modalTitle').textContent = 'Editar Vendedor';
    document.getElementById('vendedorId').value = vendedor.ID_Usuario;
    document.getElementById('nombreCompleto').value = vendedor.NombreCompleto;
    document.getElementById('usuario').value = vendedor.Usuario || '';
    document.getElementById('correo').value = vendedor.Correo || '';
    document.getElementById('contrasena').value = '';
    document.getElementById('contrasena').required = false;
    document.getElementById('requiredStar').style.display = 'none';
    document.getElementById('passwordHelp').textContent = 'Dejar vacío para mantener la contraseña actual';
    document.getElementById('passwordHelp').classList.add('show');
    
    document.getElementById('modalVendedor').classList.add('active');
}

// ========================================
// GUARDAR VENDEDOR 
// ========================================
function guardarVendedor(event) {
    event.preventDefault();
    
    const formData = {
        action: modoEdicion ? 'update' : 'create',
        id: document.getElementById('vendedorId').value,
        nombreCompleto: document.getElementById('nombreCompleto').value,
        usuario: document.getElementById('usuario').value,
        correo: document.getElementById('correo').value,
        contrasena: document.getElementById('contrasena').value
    };
    
    // Validación de contraseña
    if (!modoEdicion && formData.contrasena.length < 6) {
        mostrarModal('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    //FIX 1: CERRAR MODAL PRIMERO (antes del fetch)
    closeModal();
    
    //FIX 2: Pequeño delay para suavizar transición
    setTimeout(() => {
        showLoadingModal();
    }, 100);
    
    fetch('../../php/gest-vendedores.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        //FIX 3: Mostrar mensaje DESPUÉS de cerrar loading
        setTimeout(() => {
            if (data.success) {
                mostrarModal(
                    modoEdicion ? 'Vendedor actualizado correctamente' : 'Vendedor agregado correctamente',
                    'success'
                );
                cargarVendedores();
            } else {
                mostrarModal('Error: ' + data.message, 'error');
            }
        }, 200); // Delay para suavizar
        
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        setTimeout(() => {
            mostrarModal('Error de conexión. Intenta nuevamente.', 'error');
        }, 200);
    });
}

// ========================================
// ELIMINAR VENDEDOR - CON CONFIRMACIÓN EN DOS PASOS
// ========================================
let vendedorIdEliminar = null;
let confirmarEliminacionForzadaVendedor = false;

function eliminarVendedor(id, nombre) {
    vendedorIdEliminar = id;
    confirmarEliminacionForzadaVendedor = false;
    
    console.log('🔍 DEBUG: Abriendo modal eliminar vendedor ID:', id); // DEBUG
    
    document.getElementById('vendedorNombre').textContent = nombre;
    document.getElementById('advertenciaVentasVendedor').style.display = 'none';
    
    // ✅ FORZAR VISIBILIDAD DEL BOTÓN
    const btnEliminar = document.querySelector('#modalEliminar .btn-danger');
    console.log('🔍 DEBUG: Botón eliminar encontrado:', btnEliminar); // DEBUG
    
    if (btnEliminar) {
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.style.backgroundColor = '#c62828';
        btnEliminar.style.display = 'inline-block';
        btnEliminar.style.visibility = 'visible';
        btnEliminar.style.opacity = '1';
        console.log('✅ DEBUG: Botón configurado como visible'); // DEBUG
    } else {
        console.error('❌ DEBUG: No se encontró el botón .btn-danger en #modalEliminar'); // DEBUG
    }
    
    const modal = document.getElementById('modalEliminar');
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    
    console.log('✅ DEBUG: Modal activado'); // DEBUG
}

function confirmarEliminar() {
    if (!vendedorIdEliminar) {
        console.error('Error: vendedorIdEliminar está vacío');
        mostrarModal('Error: No se pudo obtener el ID del vendedor', 'error');
        return;
    }
    
    // Guardar el ID ANTES de cerrar el modal
    const idAEliminar = vendedorIdEliminar;
    const forzar = confirmarEliminacionForzadaVendedor;
    
    // ✅ CERRAR MODAL PRIMERO
    closeModalEliminar();
    
    setTimeout(() => {
        showLoadingModal();
    }, 100);
    
    console.log('Eliminando vendedor con ID:', idAEliminar, 'Forzar:', forzar);
    
    fetch('../../php/gest-vendedores.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'delete',
            id: parseInt(idAEliminar),
            forzarEliminacion: forzar
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        console.log('Respuesta del servidor:', data);
        
        // ==========================================
        // CASO 1: Requiere confirmación (tiene ventas)
        // ==========================================
        if (data.requiereConfirmacion) {
            // Restaurar ID para segunda confirmación
            vendedorIdEliminar = idAEliminar;
            confirmarEliminacionForzadaVendedor = true;
            
            // Actualizar modal con advertencia
            const advertencia = document.getElementById('advertenciaVentasVendedor');
            advertencia.textContent = `⚠️ Advertencia: Este vendedor tiene ${data.totalVentas} venta(s) asociada(s). Al eliminar el vendedor, también se eliminarán todas las ventas, abonos, facturas y datos relacionados. Esta acción NO SE PUEDE DESHACER.`;
            advertencia.style.display = 'block';
            advertencia.style.color = '#d32f2f';
            advertencia.style.backgroundColor = '#ffebee';
            advertencia.style.padding = '15px';
            advertencia.style.borderRadius = '5px';
            advertencia.style.marginTop = '15px';
            advertencia.style.fontWeight = 'bold';
            
            // Cambiar texto del botón
            const btnEliminar = document.querySelector('#modalEliminar .btn-danger');
            btnEliminar.textContent = 'Sí, eliminar TODO';
            btnEliminar.style.backgroundColor = '#b71c1c';
            
            // Reabrir modal
            document.getElementById('modalEliminar').classList.add('active');
            document.body.classList.add('modal-open');
            
            return;
        }
        
        // ==========================================
        // CASO 2: Eliminación exitosa
        // ==========================================
        setTimeout(() => {
            if (data.success) {
                mostrarModal(data.message || 'Vendedor eliminado correctamente', 'success');
                cargarVendedores();
            } else {
                mostrarModal('Error: ' + data.message, 'error');
            }
        }, 200);
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error en fetch:', error);
        setTimeout(() => {
            mostrarModal('Error de conexión. Intenta nuevamente.', 'error');
        }, 200);
    });
}

function closeModalEliminar() {
    document.getElementById('modalEliminar').classList.remove('active');
    document.body.classList.remove('modal-open');
    vendedorIdEliminar = null;
    confirmarEliminacionForzadaVendedor = false;
}

// ========================================
// VER ESTADÍSTICAS
// ========================================
function verEstadisticas(id) {
    const vendedor = vendedoresData.find(v => v.ID_Usuario === id);
    
    if (!vendedor) {
        mostrarModal('Vendedor no encontrado', 'error');
        return;
    }
    
    showLoadingModal();
    
    fetch('../../php/gest-vendedores.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'get_stats',
            id: id
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            const stats = data.stats;
            
            // Información básica
            document.getElementById('estadisticasNombre').textContent = vendedor.NombreCompleto;
            document.getElementById('statVentas').textContent = '$' + parseFloat(stats.totalVentas || 0).toFixed(2);
            document.getElementById('statLugar').textContent = stats.lugarTrabajo || 'No especificado';
            
            // Actividad actual
            document.getElementById('statPedidosActivos').textContent = stats.pedidosActivos || 0;
            document.getElementById('statUltimoPedido').textContent = stats.ultimoPedido || 'Sin pedidos';
            
            // Estado de las ventas
            document.getElementById('statPendientes').textContent = stats.estadoPendientes || 0;
            document.getElementById('statProceso').textContent = stats.estadoProceso || 0;
            document.getElementById('statCompletados').textContent = stats.estadoCompletados || 0;
            document.getElementById('statCancelados').textContent = stats.estadoCancelados || 0;
            
            document.getElementById('modalEstadisticas').classList.add('active');
        } else {
            mostrarModal('Error al cargar estadísticas', 'error');
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        mostrarModal('Error de conexión.', 'error');
    });
}

// ========================================
// CERRAR MODALES
// ========================================
function closeModal() {
    document.getElementById('modalVendedor').classList.remove('active');
    document.getElementById('formVendedor').reset();
    document.getElementById('passwordHelp').classList.remove('show');
}


function closeModalEstadisticas() {
    document.getElementById('modalEstadisticas').classList.remove('active');
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================
function showLoadingModal() {
    document.getElementById('loadingModal').classList.add('active');
}

function hideLoadingModal() {
    document.getElementById('loadingModal').classList.remove('active');
}

function mostrarError(mensaje) {
    mostrarModal(mensaje, 'error');
}

// Cerrar modales al hacer clic fuera
window.onclick = function(event) {
    const modalVendedor = document.getElementById('modalVendedor');
    const modalEliminar = document.getElementById('modalEliminar');
    const modalEstadisticas = document.getElementById('modalEstadisticas');
    
    if (event.target === modalVendedor) {
        closeModal();
    }
    if (event.target === modalEliminar) {
        closeModalEliminar();
    }
    if (event.target === modalEstadisticas) {
        closeModalEstadisticas();
    }
}