// ========================================
// VARIABLES GLOBALES
// ========================================
let albumsData = [];
let clientesData = [];
let albumActualId = null;
let fotosSeleccionadas = [];

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
        alert('Acceso denegado. Solo el CEO puede acceder a esta página.');
        window.location.href = '../administracion.html';
        return;
    }
    
    // Cargar datos iniciales
    cargarClientes();
    cargarAlbums();
});

// ========================================
// CARGAR CLIENTES
// ========================================
function cargarClientes() {
    fetch('../../php/documentos.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'obtener_clientes'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            clientesData = data.clientes;
            actualizarSelectClientes();
            actualizarFiltroClientes();
        }
    })
    .catch(error => {
        console.error('Error al cargar clientes:', error);
    });
}

// ========================================
// ACTUALIZAR SELECT DE CLIENTES
// ========================================
function actualizarSelectClientes() {
    const select = document.getElementById('selectCliente');
    select.innerHTML = '<option value="">Selecciona un cliente</option>';
    
    clientesData.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.ID_Usuario;
        option.textContent = cliente.NombreCompleto;
        if (cliente.EsUsuarioTemporal === '1' || cliente.EsUsuarioTemporal === 1) {
            option.textContent += ' (Temporal)';
        }
        select.appendChild(option);
    });
}

// ========================================
// ACTUALIZAR FILTRO DE CLIENTES
// ========================================
function actualizarFiltroClientes() {
    const select = document.getElementById('filtroCliente');
    const optionActual = select.value;
    
    select.innerHTML = '<option value="todos">Todos</option>';
    
    clientesData.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.ID_Usuario;
        option.textContent = cliente.NombreCompleto;
        select.appendChild(option);
    });
    
    select.value = optionActual;
}

// ========================================
// CARGAR ÁLBUMES
// ========================================
function cargarAlbums() {
    showLoadingModal();
    
    fetch('../../php/documentos.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'obtener_albums'
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            albumsData = data.albums;
            mostrarAlbums(albumsData);
        } else {
            console.error('Error:', data.message);
            mostrarError('Error al cargar álbumes');
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        mostrarError('Error de conexión. Verifica que XAMPP esté activo.');
    });
}

// ========================================
// MOSTRAR ÁLBUMES EN EL GRID
// ========================================
function mostrarAlbums(albums) {
    const grid = document.getElementById('albumsGrid');
    grid.innerHTML = '';
    
    if (albums.length === 0) {
        grid.innerHTML = `
            <div class="loading-card">
                <p>No hay álbumes para mostrar</p>
            </div>
        `;
        return;
    }
    
    albums.forEach(album => {
        const card = crearAlbumCard(album);
        grid.appendChild(card);
    });
}

// ========================================
// CREAR CARD DE ÁLBUM
// ========================================
function crearAlbumCard(album) {
    const card = document.createElement('div');
    card.className = 'album-card';
    
    const estadoClass = album.Estado.toLowerCase();
    const diasRestantes = album.DiasRestantes > 0 ? album.DiasRestantes : 0;
    
    card.innerHTML = `
        <div class="album-header">
            <h3 class="album-title">${album.Titulo}</h3>
            <div class="album-cliente">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                ${album.Cliente}
            </div>
        </div>
        
        <div class="album-body">
            ${album.Descripcion ? `<p class="album-descripcion">${album.Descripcion}</p>` : ''}
            
            <div class="album-info">
                <div class="info-item">
                    <span class="info-label">Fotos</span>
                    <span class="info-value">${album.TotalFotos || 0}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Días restantes</span>
                    <span class="info-value">${diasRestantes}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Fecha creación</span>
                    <span class="info-value">${formatearFecha(album.FechaSubida)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Caduca</span>
                    <span class="info-value">${formatearFecha(album.FechaCaducidad)}</span>
                </div>
            </div>
        </div>
        
        <div class="album-footer">
            <span class="album-estado ${estadoClass}">${album.Estado}</span>
            <div class="album-actions">
                ${album.Estado === 'Activo' ? `
                    <button class="btn-icon" title="Subir fotos" onclick="abrirSubirFotos(${album.ID_Album}, '${album.Titulo}')">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                    </button>
                ` : ''}
                
                <button class="btn-icon" title="Ver fotos" onclick="verFotosAlbum(${album.ID_Album})">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
                
                ${album.Estado === 'Activo' ? `
                    <button class="btn-icon" title="Cerrar álbum" onclick="confirmarCerrarAlbum(${album.ID_Album}, '${album.Titulo}')">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    return card;
}

// ========================================
// FILTRAR ÁLBUMES
// ========================================
function filtrarAlbums() {
    const filtroEstado = document.getElementById('filtroEstado').value;
    const filtroCliente = document.getElementById('filtroCliente').value;
    
    let albumsFiltrados = albumsData;
    
    // Filtrar por estado
    if (filtroEstado !== 'todos') {
        albumsFiltrados = albumsFiltrados.filter(a => a.Estado === filtroEstado);
    }
    
    // Filtrar por cliente
    if (filtroCliente !== 'todos') {
        albumsFiltrados = albumsFiltrados.filter(a => a.ID_Cliente == filtroCliente);
    }
    
    mostrarAlbums(albumsFiltrados);
}

// ========================================
// MODAL: CREAR ÁLBUM
// ========================================
function openModalCrearAlbum() {
    document.getElementById('modalCrearAlbum').classList.add('active');
}

function closeModalCrearAlbum() {
    document.getElementById('modalCrearAlbum').classList.remove('active');
    document.getElementById('formCrearAlbum').reset();
}

function crearAlbum(event) {
    event.preventDefault();
    
    const idCliente = document.getElementById('selectCliente').value;
    const titulo = document.getElementById('tituloAlbum').value;
    const descripcion = document.getElementById('descripcionAlbum').value;
    const diasCaducidad = document.getElementById('diasCaducidad').value;
    
    if (!idCliente) {
        alert('Debes seleccionar un cliente');
        return;
    }
    
    showLoadingModal();
    
    fetch('../../php/documentos.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'crear_album',
            idCliente: idCliente,
            titulo: titulo,
            descripcion: descripcion,
            diasCaducidad: diasCaducidad
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            alert('Álbum creado correctamente');
            closeModalCrearAlbum();
            cargarAlbums();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        alert('Error de conexión. Intenta nuevamente.');
    });
}

// ========================================
// MODAL: CREAR CLIENTE TEMPORAL
// ========================================
function openModalCrearCliente() {
    document.getElementById('modalCrearCliente').classList.add('active');
}

function closeModalCrearCliente() {
    document.getElementById('modalCrearCliente').classList.remove('active');
    document.getElementById('formCrearCliente').reset();
    document.getElementById('credencialesPreview').style.display = 'none';
}

function crearClienteTemporal(event) {
    event.preventDefault();
    
    const nombreCliente = document.getElementById('nombreCliente').value;
    const correoCliente = document.getElementById('correoCliente').value;
    
    showLoadingModal();
    
    fetch('../../php/documentos.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'crear_cliente_temporal',
            nombreCompleto: nombreCliente,
            correo: correoCliente
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            // Mostrar credenciales
            document.getElementById('usuarioGenerado').textContent = data.usuario;
            document.getElementById('contrasenaGenerada').textContent = data.contrasena;
            document.getElementById('credencialesPreview').style.display = 'block';
            
            // Guardar para copiar
            window.credencialesTemp = {
                usuario: data.usuario,
                contrasena: data.contrasena
            };
            
            // Recargar lista de clientes
            cargarClientes();
            
            alert('Cliente temporal creado correctamente');
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        alert('Error de conexión. Intenta nuevamente.');
    });
}

// ========================================
// COPIAR CREDENCIALES
// ========================================
function copiarCredenciales() {
    if (!window.credencialesTemp) return;
    
    const texto = `Usuario: ${window.credencialesTemp.usuario}\nContraseña: ${window.credencialesTemp.contrasena}`;
    
    navigator.clipboard.writeText(texto).then(() => {
        alert('Credenciales copiadas al portapapeles');
    }).catch(err => {
        console.error('Error al copiar:', err);
        alert('No se pudieron copiar las credenciales');
    });
}

// ========================================
// CERRAR ÁLBUM
// ========================================
function confirmarCerrarAlbum(idAlbum, titulo) {
    if (!confirm(`¿Estás seguro de cerrar el álbum "${titulo}"?\n\nEl cliente ya no podrá descargar más fotos.`)) {
        return;
    }
    
    showLoadingModal();
    
    fetch('../../php/documentos.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'cerrar_album',
            idAlbum: idAlbum
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            alert('Álbum cerrado correctamente');
            cargarAlbums();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        alert('Error de conexión. Intenta nuevamente.');
    });
}

// ========================================
// VER FOTOS DEL ÁLBUM
// ========================================
function verFotosAlbum(idAlbum) {
    // Esta función se completará en la siguiente fase
    alert('Función en desarrollo: Ver fotos del álbum #' + idAlbum);
}

// ========================================
// ABRIR MODAL SUBIR FOTOS
// ========================================
function abrirSubirFotos(idAlbum, titulo) {
    albumActualId = idAlbum;
    document.getElementById('idAlbumActual').value = idAlbum;
    document.getElementById('tituloAlbumActual').textContent = titulo;
    document.getElementById('modalSubirFotos').classList.add('active');
    
    // Configurar dropzone
    configurarDropzone();
}

function closeModalSubirFotos() {
    document.getElementById('modalSubirFotos').classList.remove('active');
    fotosSeleccionadas = [];
    document.getElementById('listaFotos').innerHTML = '';
}

// ========================================
// CONFIGURAR DROPZONE
// ========================================
function configurarDropzone() {
    const dropzone = document.getElementById('dropzone');
    const inputFotos = document.getElementById('inputFotos');
    
    // Click para seleccionar archivos
    dropzone.onclick = () => inputFotos.click();
    
    // Drag & Drop
    dropzone.ondragover = (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    };
    
    dropzone.ondragleave = () => {
        dropzone.classList.remove('dragover');
    };
    
    dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const archivos = e.dataTransfer.files;
        procesarArchivos(archivos);
    };
    
    // Input change
    inputFotos.onchange = (e) => {
        procesarArchivos(e.target.files);
    };
}

// ========================================
// PROCESAR ARCHIVOS
// ========================================
function procesarArchivos(archivos) {
    for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];
        
        // Validar que sea imagen
        if (!archivo.type.startsWith('image/')) {
            alert(`${archivo.name} no es una imagen válida`);
            continue;
        }
        
        // Validar tamaño (máx 10MB)
        if (archivo.size > 10 * 1024 * 1024) {
            alert(`${archivo.name} supera el tamaño máximo de 10MB`);
            continue;
        }
        
        fotosSeleccionadas.push(archivo);
    }
    
    mostrarListaFotos();
}

// ========================================
// MOSTRAR LISTA DE FOTOS
// ========================================
function mostrarListaFotos() {
    const lista = document.getElementById('listaFotos');
    lista.innerHTML = '';
    
    fotosSeleccionadas.forEach((foto, index) => {
        const item = document.createElement('div');
        item.className = 'foto-item';
        
        // Crear preview
        const reader = new FileReader();
        reader.onload = (e) => {
            item.innerHTML = `
                <img src="${e.target.result}" alt="${foto.name}">
                <div class="foto-info">
                    <div class="foto-nombre">${foto.name}</div>
                    <div class="foto-tamano">${formatearTamano(foto.size)}</div>
                </div>
                <button class="foto-eliminar" onclick="eliminarFoto(${index})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;
        };
        reader.readAsDataURL(foto);
        
        lista.appendChild(item);
    });
}

// ========================================
// ELIMINAR FOTO DE LA LISTA
// ========================================
function eliminarFoto(index) {
    fotosSeleccionadas.splice(index, 1);
    mostrarListaFotos();
}

// ========================================
// SUBIR FOTOS
// ========================================
function subirFotos() {
    if (fotosSeleccionadas.length === 0) {
        alert('Debes seleccionar al menos una foto');
        return;
    }
    
    // Esta funcionalidad se completará en la siguiente fase
    // con el upload.php
    alert('Función en desarrollo: Subir ' + fotosSeleccionadas.length + ' fotos');
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================
function formatearFecha(fecha) {
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

function formatearTamano(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
    const modales = document.querySelectorAll('.modal');
    modales.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
};