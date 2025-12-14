// ========================================
// VARIABLES GLOBALES
// ========================================
let vendedoresDisponibles = [];
let colegioActualId = null;
let fechaActual = null; // Cambio: Inicializar en null
let lugarIdCerrar = null;
let lugarIdEliminar = null;

// ========================================
// FUNCIÓN AUXILIAR: Obtener fecha local en formato YYYY-MM-DD
// ========================================
function obtenerFechaLocal() {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ========================================
// FUNCIÓN: Establecer fecha de hoy CORRECTAMENTE
// ========================================
function setFechaHoy() {
    const fechaLocal = obtenerFechaLocal();
    document.getElementById('fechaAsignacion').value = fechaLocal;
    fechaActual = fechaLocal;
    console.log('Fecha establecida:', fechaLocal); // Debug
    cargarAsignaciones();
}

// ========================================
// MODAL: ASIGNAR VENDEDORES
// ========================================
function openModalAsignar(id, nombre) {
    colegioActualId = id;
    document.getElementById('colegioIdAsignar').value = id;
    document.getElementById('nombreColegioAsignar').textContent = nombre;
    
    // Establecer fecha de hoy por defecto
    setFechaHoy();
    
    // Cargar vendedores disponibles
    actualizarSelectVendedores();
    
    // Cargar asignaciones
    cargarAsignaciones();
    
    document.getElementById('modalAsignar').classList.add('active');
    document.body.classList.add('modal-open');
}

// ========================================
// CARGAR ASIGNACIONES
// ========================================
function cargarAsignaciones() {
    const idColegio = document.getElementById('colegioIdAsignar').value;
    const fecha = document.getElementById('fechaAsignacion').value;
    
    if (!idColegio || !fecha) {
        console.log('Faltan datos:', { idColegio, fecha }); // Debug
        return;
    }
    
    console.log('Cargando asignaciones para:', { idColegio, fecha }); // Debug
    
    fetch('../../php/gest-colegios.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'obtener_asignaciones',
            idColegio: idColegio,
            fecha: fecha
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Respuesta asignaciones:', data); // Debug
        if (data.success) {
            mostrarAsignaciones(data.asignaciones);
        } else {
            console.error('Error:', data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// ========================================
// ASIGNAR VENDEDOR
// ========================================
function asignarVendedor() {
    const idColegio = document.getElementById('colegioIdAsignar').value;
    const idVendedor = document.getElementById('selectVendedor').value;
    const fecha = document.getElementById('fechaAsignacion').value;
    
    if (!idVendedor) {
        mostrarModal('Debes seleccionar un vendedor');
        return;
    }
    
    console.log('Asignando vendedor:', { idColegio, idVendedor, fecha }); // Debug
    
    showLoadingModal();
    
    fetch('../../php/gest-colegios.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'asignar_vendedor',
            idColegio: idColegio,
            idVendedor: idVendedor,
            fecha: fecha
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        console.log('Respuesta asignación:', data); // Debug
        
        if (data.success) {
            mostrarModal('Vendedor asignado correctamente');
            document.getElementById('selectVendedor').value = '';
            cargarAsignaciones();
            cargarColegios(); // Actualizar contador de vendedores
        } else {
            mostrarModal('Error: ' + data.message);
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        mostrarModal('Error de conexión');
    });
}

// ========================================
// RESTO DEL CÓDIGO (sin cambios)
// ========================================
let colegiosData = [];

document.addEventListener('DOMContentLoaded', function() {
    const user = checkSession();
    
    if (!user) {
        window.location.href = '../../login/login.html';
        return;
    }
    
    if (user.tipo !== 'CEO') {
        mostrarModal('Acceso denegado. Solo el CEO puede acceder a esta página.');
        setTimeout(() => {
        window.location.href = '../administracion.html';
        }, 2000);
        return;
    }
    
    cargarColegios();
    cargarVendedoresDisponibles();
});

function cargarColegios() {
    showLoadingModal();
    
    fetch('../../php/gest-colegios.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'obtener_colegios'
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            colegiosData = data.colegios;
            mostrarColegios(colegiosData);
        } else {
            console.error('Error:', data.message);
            mostrarError('Error al cargar colegios');
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        mostrarError('Error de conexión. Verifica que XAMPP esté activo.');
    });
}

function mostrarColegios(colegios) {
    const grid = document.getElementById('colegiosGrid');
    grid.innerHTML = '';
    
    if (colegios.length === 0) {
        grid.innerHTML = '<div class="loading-card"><p>No hay lugares registrados</p></div>';
        return;
    }
    
    colegios.forEach(colegio => {
        const card = crearColegioCard(colegio);
        grid.appendChild(card);
    });
}

function crearColegioCard(colegio) {
    const card = document.createElement('div');
    card.className = 'colegio-card';
    
    const estadoClass = colegio.Estado.toLowerCase();
    const nombreEscapado = colegio.NombreColegio.replace(/'/g, "\\'");
    
    card.innerHTML = `
        <div class="colegio-header">
            <h3 class="colegio-nombre">${colegio.NombreColegio}</h3>
            <div class="colegio-info">
                ${colegio.Direccion ? `
                <div class="info-item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    ${colegio.Direccion}
                </div>
                ` : ''}
                ${colegio.Telefono ? `
                <div class="info-item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    ${colegio.Telefono}
                </div>
                ` : ''}
                ${colegio.Notas ? `
                <div class="info-item" style="margin-top: 10px; color: #666; font-size: 13px;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    ${colegio.Notas}
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="colegio-body">
            <div class="colegio-stats">
                <div class="stat-box">
                    <div class="stat-label">Vendedores Hoy</div>
                    <div class="stat-value">${colegio.VendedoresHoy || 0}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Total Ventas</div>
                    <div class="stat-value">${colegio.TotalVentas || 0}</div>
                </div>
            </div>
        </div>
        
        <div class="colegio-footer">
            <span class="colegio-estado ${estadoClass}">${colegio.Estado}</span>
            <div class="colegio-actions">
                ${colegio.Estado === 'Activo' ? `
                    <button class="btn-icon" title="Asignar vendedores" onclick="openModalAsignar(${colegio.ID_Colegio}, '${nombreEscapado}')">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                    </button>
                    
                    <button class="btn-icon" title="Editar colegio" onclick="editarColegio(${colegio.ID_Colegio})">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    
                    <button class="btn-icon" title="Cerrar colegio" onclick="cerrarColegio(${colegio.ID_Colegio}, '${nombreEscapado}')">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </button>
                ` : ''}
                
                <button class="btn-icon" title="Ver estadísticas" onclick="verEstadisticas(${colegio.ID_Colegio}, '${nombreEscapado}')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                </button>
                
                ${colegio.TotalVentas == 0 ? `
                    <button class="btn-icon" title="Eliminar colegio" onclick="eliminarColegio(${colegio.ID_Colegio}, '${nombreEscapado}')">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    return card;
}

function filtrarColegios() {
    const filtroEstado = document.getElementById('filtroEstado').value;
    
    let colegiosFiltrados = colegiosData;
    
    if (filtroEstado !== 'todos') {
        colegiosFiltrados = colegiosFiltrados.filter(c => c.Estado === filtroEstado);
    }
    
    if (filtroEstado === 'activos-relevantes') {
    colegiosFiltrados = colegiosFiltrados.filter(c => 
        c.Estado === 'Activo' || (c.Estado === 'Cerrado' && c.TotalVentas > 0));
}
     mostrarColegios(colegiosFiltrados);

}

function cargarVendedoresDisponibles() {
    fetch('../../php/gest-colegios.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'obtener_vendedores_disponibles'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            vendedoresDisponibles = data.vendedores;
            actualizarSelectVendedores();
        }
    })
    .catch(error => {
        console.error('Error al cargar vendedores:', error);
    });
}

function actualizarSelectVendedores() {
    const select = document.getElementById('selectVendedor');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecciona un vendedor</option>';
    
    vendedoresDisponibles.forEach(vendedor => {
        const option = document.createElement('option');
        option.value = vendedor.ID_Usuario;
        option.textContent = vendedor.NombreCompleto;
        select.appendChild(option);
    });
}

function openModalCrearColegio() {
    document.getElementById('modalColegioTitle').textContent = 'Nuevo Lugar';
    document.getElementById('colegioId').value = '';
    document.getElementById('formColegio').reset();
    document.getElementById('modalColegio').classList.add('active');
    document.body.classList.add('modal-open');
}

function editarColegio(id) {
    const colegio = colegiosData.find(c => c.ID_Colegio == id);
    
    if (!colegio) {
        mostrarModal('Lugar no encontrado');
        return;
    }
    
    document.getElementById('modalColegioTitle').textContent = 'Editar Lugar';
    document.getElementById('colegioId').value = colegio.ID_Colegio;
    document.getElementById('nombreColegio').value = colegio.NombreColegio;
    document.getElementById('direccionColegio').value = colegio.Direccion || '';
    document.getElementById('telefonoColegio').value = colegio.Telefono || '';
    document.getElementById('notasColegio').value = colegio.Notas || '';
    
    document.getElementById('modalColegio').classList.add('active');
    document.body.classList.add('modal-open');
}

function closeModalColegio() {
    document.getElementById('modalColegio').classList.remove('active');
    document.getElementById('formColegio').reset();
    document.body.classList.remove('modal-open');
}

function guardarColegio(event) {
    event.preventDefault();
    
    const id = document.getElementById('colegioId').value;
    const nombreColegio = document.getElementById('nombreColegio').value.trim();
    const direccion = document.getElementById('direccionColegio').value.trim();
    const telefono = document.getElementById('telefonoColegio').value.trim();
    const notas = document.getElementById('notasColegio').value.trim();
    
    if (!nombreColegio) {
        mostrarModal('El nombre del lugar es requerido');
        return;
    }
    
    showLoadingModal();
    
    const action = id ? 'editar_colegio' : 'crear_colegio';
    const payload = {
        action: action,
        nombreColegio: nombreColegio,
        direccion: direccion,
        telefono: telefono,
        notas: notas
    };
    
    if (id) {
        payload.idColegio = id;
    }
    
    fetch('../../php/gest-colegios.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
        //Cerrar modal primero
        closeModalColegio();
        //Mostrar mensaje después
        setTimeout(() => {
            mostrarModal(
                id ? 'Lugar actualizado correctamente' : 'Lugar creado correctamente',
                'success'
            );
        }, 300); // Pequeño delay para que el cierre sea suave
        
        //Recargar datos
        cargarColegios();
        } else {
            mostrarModal('Error: ' + data.message);
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        mostrarModal('Error de conexión');
    });
}

function cerrarColegio(id, nombre) {
    //CONVERTIR A NÚMERO PARA ASEGURAR TIPO CORRECTO
    lugarIdCerrar = parseInt(id);
    
    console.log('Cerrar colegio - ID recibido:', id, 'Tipo:', typeof id);
    console.log('Cerrar colegio - ID guardado:', lugarIdCerrar, 'Tipo:', typeof lugarIdCerrar);
    
    if (!lugarIdCerrar || isNaN(lugarIdCerrar)) {
        mostrarModal('Error: ID de lugar inválido');
        return;
    }
    
    document.getElementById('nombreLugarCerrar').textContent = nombre;
    document.getElementById('modalCerrarLugar').classList.add('active');
    document.body.classList.add('modal-open');
}

function closeModalCerrarLugar() {
    document.getElementById('modalCerrarLugar').classList.remove('active');
    document.body.classList.remove('modal-open');
    lugarIdCerrar = null;
}

function confirmarCerrarLugar() {
    // FIX CRÍTICO: GUARDAR ID ANTES DE CERRAR MODAL (11/12/25)
    const idAUsar = lugarIdCerrar;
    
    // VALIDACIÓN CON LA VARIABLE LOCAL
    if (!idAUsar || isNaN(idAUsar)) {
        console.error('Error: ID inválido', idAUsar);
        mostrarModal('Error: No se pudo identificar el lugar a cerrar');
        closeModalCerrarLugar();
        return;
    }
    
    console.log('Confirmando cerrar colegio - ID a usar:', idAUsar);
    
    // AHORA SÍ CERRAMOS EL MODAL(11/12/25)
    closeModalCerrarLugar();
    showLoadingModal();
    
    // USAR LA VARIABLE LOCAL EN EL FETCH(11/12/25)
    fetch('../../php/gest-colegios.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'cerrar_colegio',
            idColegio: idAUsar
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        console.log('Respuesta cerrar colegio:', data);
        
        if (data.success) {
            mostrarModal('Lugar cerrado correctamente');
            cargarColegios();
        } else {
            mostrarModal('Error: ' + data.message);
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        mostrarModal('Error de conexión');
    });
}

function eliminarColegio(id, nombre) {
    // FIx CONVERTIR A NÚMERO PARA ASEGURAR TIPO CORRECTO(11/12/25)
    lugarIdEliminar = parseInt(id);
    
    console.log('Eliminar colegio - ID recibido:', id, 'Tipo:', typeof id);
    console.log('Eliminar colegio - ID guardado:', lugarIdEliminar, 'Tipo:', typeof lugarIdEliminar);
    
    if (!lugarIdEliminar || isNaN(lugarIdEliminar)) {
        mostrarModal('Error: ID de lugar inválido');
        return;
    }
    
    document.getElementById('nombreLugarEliminar').textContent = nombre;
    document.getElementById('modalEliminarLugar').classList.add('active');
    document.body.classList.add('modal-open');
}

function closeModalEliminarLugar() {
    document.getElementById('modalEliminarLugar').classList.remove('active');
    document.body.classList.remove('modal-open');
    lugarIdEliminar = null;
}

function confirmarEliminarLugar() {
    // FIX CRÍTICO: GUARDAR ID ANTES DE CERRAR MODAL(11/12/25)
    const idAUsar = lugarIdEliminar;
    
    // VALIDACIÓN CON LA VARIABLE LOCAL
    if (!idAUsar || isNaN(idAUsar)) {
        console.error('Error: ID inválido', idAUsar);
        mostrarModal('Error: No se pudo identificar el lugar a eliminar');
        closeModalEliminarLugar();
        return;
    }
    
    console.log('Confirmando eliminar colegio - ID a usar:', idAUsar);
    
    // AHORA SÍ CERRAMOS EL MODAL
    closeModalEliminarLugar();
    showLoadingModal();
    
    // USAR LA VARIABLE LOCAL EN EL FETCH
    fetch('../../php/gest-colegios.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'eliminar_colegio',
            idColegio: idAUsar
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        console.log('Respuesta eliminar colegio:', data);
        
        if (data.success) {
            mostrarModal('Lugar eliminado correctamente');
            cargarColegios();
        } else {
            mostrarModal('Error: ' + data.message);
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        mostrarModal('Error de conexión');
    });
}

function closeModalAsignar() {
    document.getElementById('modalAsignar').classList.remove('active');
    colegioActualId = null;
    document.body.classList.remove('modal-open');
}

function mostrarAsignaciones(asignaciones) {
    const lista = document.getElementById('listaAsignados');
    const badge = document.getElementById('totalAsignados');
    
    lista.innerHTML = '';
    badge.textContent = asignaciones.length;
    
    if (asignaciones.length === 0) {
        lista.innerHTML = '<p class="sin-asignaciones">No hay vendedores asignados para esta fecha</p>';
        return;
    }
    
    asignaciones.forEach(asignacion => {
        const item = document.createElement('div');
        item.className = 'vendedor-item';
        
        item.innerHTML = `
            <div class="vendedor-info">
                <div class="vendedor-nombre">${asignacion.NombreCompleto}</div>
                <div class="vendedor-detalles">${asignacion.Correo || 'Sin correo'}</div>
            </div>
            <div class="vendedor-stats">
                <div class="stat-item-small">
                    <div class="label">Ventas</div>
                    <div class="value">${asignacion.VentasDelDia || 0}</div>
                </div>
                <div class="stat-item-small">
                    <div class="label">Total</div>
                    <div class="value">$${parseFloat(asignacion.TotalVendido || 0).toFixed(2)}</div>
                </div>
            </div>
            <button class="btn-quitar" onclick="quitarAsignacion(${asignacion.ID_Asignacion})">
                Quitar
            </button>
        `;
        
        lista.appendChild(item);
    });
}

function quitarAsignacion(idAsignacion) {
    if (!confirm('¿Quitar esta asignación?')) {
        return;
    }
    
    showLoadingModal();
    
    fetch('../../php/gest-colegios.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'quitar_asignacion',
            idAsignacion: idAsignacion
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            cargarAsignaciones();
            cargarColegios();
        } else {
            mostrarModal('Error: ' + data.message);
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        mostrarModal('Error de conexión');
    });
}

function verEstadisticas(id, nombre) {
    document.getElementById('nombreColegioStats').textContent = nombre;
    
    showLoadingModal();
    
    fetch('../../php/gest-colegios.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'obtener_estadisticas_colegio',
            idColegio: id
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            mostrarEstadisticas(data.estadisticas);
            document.getElementById('modalEstadisticas').classList.add('active');
            document.body.classList.add('modal-open');
        } else {
            mostrarModal('Error al cargar estadísticas');
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        mostrarModal('Error de conexión');
    });
}

function closeModalEstadisticas() {
    document.getElementById('modalEstadisticas').classList.remove('active');
    document.body.classList.remove('modal-open');
}

function mostrarEstadisticas(stats) {
    document.getElementById('statTotalVentas').textContent = stats.totalVentas;
    document.getElementById('statTotalMonto').textContent = '$' + parseFloat(stats.totalMonto).toFixed(2);
    
    const listaStats = document.getElementById('listaStatsVendedores');
    listaStats.innerHTML = '';
    
    if (stats.porVendedor.length === 0) {
        listaStats.innerHTML = '<p>No hay datos de ventas</p>';
        return;
    }
    
    stats.porVendedor.forEach(vendedor => {
        const item = document.createElement('div');
        item.className = 'vendedor-stat-item';
        
        item.innerHTML = `
            <div class="vendedor-stat-nombre">${vendedor.NombreCompleto}</div>
            <div class="vendedor-stat-numeros">
                <div class="numero-box">
                    <div class="numero-label">Ventas</div>
                    <div class="numero-valor">${vendedor.ventas}</div>
                </div>
                <div class="numero-box">
                    <div class="numero-label">Monto</div>
                    <div class="numero-valor">$${parseFloat(vendedor.monto).toFixed(2)}</div>
                </div>
            </div>
        `;
        
        listaStats.appendChild(item);
    });
}

function showLoadingModal() {
    document.getElementById('loadingModal').classList.add('active');
}

function hideLoadingModal() {
    document.getElementById('loadingModal').classList.remove('active');
}

function mostrarError(mensaje) {
    mostrarModal(mensaje);
}

window.onclick = function(event) {
    const modales = document.querySelectorAll('.modal');
    modales.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    });
    
    if (event.target === document.getElementById('modalCerrarLugar')) {
        lugarIdCerrar = null;
    }
    if (event.target === document.getElementById('modalEliminarLugar')) {
        lugarIdEliminar = null;
    }
};