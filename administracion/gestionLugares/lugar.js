// ========================================
// VARIABLES GLOBALES
// ========================================
let colegiosData = [];
let vendedoresDisponibles = [];
let colegioActualId = null;
let fechaActual = new Date().toISOString().split('T')[0];

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
        alert('Acceso denegado. Solo el CEO puede acceder a esta página.');
        window.location.href = '../administracion.html';
        return;
    }
    
    // Cargar datos iniciales
    cargarColegios();
    cargarVendedoresDisponibles();
});

// ========================================
// CARGAR COLEGIOS
// ========================================
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

// ========================================
// MOSTRAR COLEGIOS EN EL GRID
// ========================================
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

// ========================================
// CREAR CARD DE COLEGIO
// ========================================
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

// ========================================
// FILTRAR COLEGIOS
// ========================================
function filtrarColegios() {
    const filtroEstado = document.getElementById('filtroEstado').value;
    
    let colegiosFiltrados = colegiosData;
    
    if (filtroEstado !== 'todos') {
        colegiosFiltrados = colegiosFiltrados.filter(c => c.Estado === filtroEstado);
    }
    
    mostrarColegios(colegiosFiltrados);
}

// ========================================
// CARGAR VENDEDORES DISPONIBLES
// ========================================
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

// ========================================
// ACTUALIZAR SELECT DE VENDEDORES
// ========================================
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

// ========================================
// MODAL: CREAR/EDITAR COLEGIO
// ========================================
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
        alert('Lugar no encontrado');
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

async function guardarColegio(event) {
    event.preventDefault();
    const id = document.getElementById('colegioId').value || null;
    const nombre = document.getElementById('nombreColegio').value.trim();
    const direccion = document.getElementById('direccionColegio').value.trim();
    const telefono = document.getElementById('telefonoColegio').value.trim();
    const notas = document.getElementById('notasColegio').value.trim(); // <= asegurar lectura

    const payload = { id, nombre, direccion, telefono, notas };

    try {
        showLoading(); // si tienes función de loading
        const res = await fetch('api/colegios/save.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            closeModalColegio();
            cargarColegios(); // recargar lista desde servidor (debe traer notas)
        } else {
            alert(data.message || 'Error al guardar');
        }
    } catch (err) {
        console.error(err);
        alert('Error de conexión');
    } finally {
        hideLoading();
    }
}

// Ejemplo de función para crear la tarjeta de un lugar (usar cuando renderices cada elemento)
function crearCardColegio(lugar) {
    const card = document.createElement('div');
    card.className = 'colegio-card';

    const header = document.createElement('div');
    header.className = 'colegio-header';
    const title = document.createElement('h3');
    title.textContent = lugar.nombre || 'Sin nombre';
    header.appendChild(title);
    card.appendChild(header);

    if (lugar.direccion) {
        const dir = document.createElement('p');
        dir.className = 'colegio-direccion';
        dir.textContent = lugar.direccion;
        card.appendChild(dir);
    }

    if (lugar.telefono) {
        const tel = document.createElement('p');
        tel.className = 'colegio-telefono';
        tel.textContent = lugar.telefono;
        card.appendChild(tel);
    }

    // NOTAS: crear siempre el elemento pero esconder si vacío
    const notasEl = document.createElement('p');
    notasEl.className = 'colegio-notas';
    if (lugar.notas && lugar.notas.trim() !== '') {
        notasEl.textContent = lugar.notas;
        notasEl.style.display = ''; // visible
    } else {
        notasEl.style.display = 'none'; // ocultar si vacío
    }
    card.appendChild(notasEl);

    // ... botones / stats ...
    return card;
}

// ========================================
// CERRAR COLEGIO
// ========================================
function cerrarColegio(id, nombre) {
    if (!confirm('¿Cerrar el lugar "' + nombre + '"?\n\nEsto finalizará todas las asignaciones activas.')) {
        return;
    }
    
    showLoadingModal();
    
    fetch('../../php/gest-colegios.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'cerrar_colegio',
            idColegio: id
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            alert('Lugar cerrado correctamente');
            cargarColegios();
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
// ELIMINAR COLEGIO/LUGAR
// ========================================
function eliminarColegio(id, nombre) {
    if (!confirm('¿Eliminar el lugar "' + nombre + '"?\n\nEsta acción no se puede deshacer.')) {
        return;
    }
    
    showLoadingModal();
    
    fetch('../../php/gest-colegios.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'eliminar_colegio',
            idColegio: id
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            alert('Lugar eliminado correctamente');
            cargarColegios();
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

function closeModalAsignar() {
    document.getElementById('modalAsignar').classList.remove('active');
    colegioActualId = null;
    document.body.classList.remove('modal-open');
}

function setFechaHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaAsignacion').value = hoy;
    fechaActual = hoy;
}

// ========================================
// CARGAR ASIGNACIONES
// ========================================
function cargarAsignaciones() {
    const idColegio = document.getElementById('colegioIdAsignar').value;
    const fecha = document.getElementById('fechaAsignacion').value;
    
    if (!idColegio || !fecha) return;
    
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
// MOSTRAR ASIGNACIONES
// ========================================
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

// ========================================
// ASIGNAR VENDEDOR
// ========================================
function asignarVendedor() {
    const idColegio = document.getElementById('colegioIdAsignar').value;
    const idVendedor = document.getElementById('selectVendedor').value;
    const fecha = document.getElementById('fechaAsignacion').value;
    
    if (!idVendedor) {
        alert('Debes seleccionar un vendedor');
        return;
    }
    
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
        
        if (data.success) {
            document.getElementById('selectVendedor').value = '';
            cargarAsignaciones();
            cargarColegios(); // Actualizar contador de vendedores
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
// QUITAR ASIGNACIÓN
// ========================================
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
            cargarColegios(); // Actualizar contador
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
// MODAL: VER ESTADÍSTICAS
// ========================================
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
            alert('Error al cargar estadísticas');
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        alert('Error de conexión');
    });
}

function closeModalEstadisticas() {
    document.getElementById('modalEstadisticas').classList.remove('active');
    document.body.classList.remove('modal-open');
}

// ========================================
// MOSTRAR ESTADÍSTICAS
// ========================================
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
    alert(mensaje);
}

// Cerrar modales al hacer clic fuera
window.onclick = function(event) {
    const modales = document.querySelectorAll('.modal');
    modales.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    });
};