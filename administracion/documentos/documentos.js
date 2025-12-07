// ========================================
// VARIABLES GLOBALES
// ========================================
let albumsData = [];
let clientesData = [];
let albumActualId = null;
let fotosSeleccionadas = [];

// Variables para modal de confirmación
let accionPendiente = null;
let datosAccion = null;

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
            'Content-Type': 'application/json'
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
            'Content-Type': 'application/json'
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
        grid.innerHTML = '<div class="loading-card"><p>No hay álbumes para mostrar</p></div>';
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
    
    const tituloEscapado = album.Titulo.replace(/'/g, "\\'");
    
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
            ${album.Descripcion ? '<p class="album-descripcion">' + album.Descripcion + '</p>' : ''}
            
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
                    <button class="btn-icon" title="Subir fotos" onclick="abrirSubirFotos(${album.ID_Album}, '${tituloEscapado}')">
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
                    <button class="btn-icon" title="Editar álbum" onclick="abrirEditarAlbum(${album.ID_Album})">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    
                    <button class="btn-icon" title="Cerrar álbum" onclick="confirmarCerrarAlbum(${album.ID_Album}, '${tituloEscapado}')">
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
    
    if (filtroEstado !== 'todos') {
        albumsFiltrados = albumsFiltrados.filter(a => a.Estado === filtroEstado);
    }
    
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
    document.body.classList.add('modal-open');
}

function closeModalCrearAlbum() {
    document.getElementById('modalCrearAlbum').classList.remove('active');
    document.getElementById('formCrearAlbum').reset();
    document.body.classList.remove('modal-open');
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
            'Content-Type': 'application/json'
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
    document.body.classList.add('modal-open');
}

function closeModalCrearCliente() {
    document.getElementById('modalCrearCliente').classList.remove('active');
    document.getElementById('formCrearCliente').reset();
    document.getElementById('credencialesPreview').style.display = 'none';
    document.body.classList.remove('modal-open');
}

function crearClienteTemporal(event) {
    event.preventDefault();
    
    const nombreCliente = document.getElementById('nombreCliente').value;
    const correoCliente = document.getElementById('correoCliente').value;
    
    showLoadingModal();
    
    fetch('../../php/documentos.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
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
            document.getElementById('usuarioGenerado').textContent = data.usuario;
            document.getElementById('contrasenaGenerada').textContent = data.contrasena;
            document.getElementById('credencialesPreview').style.display = 'block';
            
            window.credencialesTemp = {
                usuario: data.usuario,
                contrasena: data.contrasena
            };
            
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
    
    const texto = 'Usuario: ' + window.credencialesTemp.usuario + '\nContraseña: ' + window.credencialesTemp.contrasena;
    
    navigator.clipboard.writeText(texto).then(() => {
        alert('Credenciales copiadas al portapapeles');
    }).catch(err => {
        console.error('Error al copiar:', err);
        alert('No se pudieron copiar las credenciales');
    });
}

// ========================================
// CERRAR ÁLBUM CON CONFIRMACIÓN
// ========================================
function confirmarCerrarAlbum(idAlbum, titulo) {
    accionPendiente = 'cerrar_album';
    datosAccion = { idAlbum };
    
    const modal = document.getElementById('modalConfirmacion');
    const title = document.getElementById('confirmTitle');
    const message = document.getElementById('confirmMessage');
    const inputContainer = document.getElementById('confirmInputContainer');
    const confirmBtn = document.getElementById('confirmBtn');
    
    title.textContent = 'Cerrar Álbum';
    message.textContent = `¿Deseas cerrar el álbum "${titulo}"? Los clientes no podrán descargar las fotos después de esta acción.`;
    inputContainer.style.display = 'none';
    confirmBtn.textContent = 'Cerrar Álbum';
    confirmBtn.style.background = '#ff9800';
    
    modal.classList.add('active');
    document.body.classList.add('modal-open');
}

// ========================================
// EDITAR ÁLBUM
// ========================================
function abrirEditarAlbum(idAlbum) {
    const album = albumsData.find(a => parseInt(a.ID_Album) === parseInt(idAlbum));
    
    if (!album) {
        alert('Álbum no encontrado');
        return;
    }
    
    // Llenar formulario
    document.getElementById('editAlbumId').value = album.ID_Album;
    document.getElementById('editTituloAlbum').value = album.Titulo;
    document.getElementById('editDescripcionAlbum').value = album.Descripcion || '';
    
    // Convertir fecha para input datetime-local
    const fecha = new Date(album.FechaCaducidad);
    const fechaLocal = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('editFechaCaducidad').value = fechaLocal;
    
    document.getElementById('modalEditarAlbum').classList.add('active');
    document.body.classList.add('modal-open');
}

function closeModalEditarAlbum() {
    document.getElementById('modalEditarAlbum').classList.remove('active');
    document.getElementById('formEditarAlbum').reset();
    document.body.classList.remove('modal-open');
}

function guardarEdicionAlbum(event) {
    event.preventDefault();
    
    const idAlbum = document.getElementById('editAlbumId').value;
    const titulo = document.getElementById('editTituloAlbum').value;
    const descripcion = document.getElementById('editDescripcionAlbum').value;
    const fechaCaducidad = document.getElementById('editFechaCaducidad').value;
    
    // Convertir datetime-local a formato MySQL
    const fecha = new Date(fechaCaducidad);
    const fechaMySQL = fecha.getFullYear() + '-' + 
                       String(fecha.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(fecha.getDate()).padStart(2, '0') + ' ' +
                       String(fecha.getHours()).padStart(2, '0') + ':' + 
                       String(fecha.getMinutes()).padStart(2, '0') + ':00';
    
    showLoadingModal();
    
    fetch('../../php/documentos.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'editar_album',
            idAlbum: idAlbum,
            titulo: titulo,
            descripcion: descripcion,
            fechaCaducidad: fechaMySQL
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            alert('Álbum actualizado correctamente');
            closeModalEditarAlbum();
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
    const album = albumsData.find(a => parseInt(a.ID_Album) === parseInt(idAlbum));
    
    if (!album) {
        console.error('Álbum no encontrado. ID buscado:', idAlbum);
        console.log('Álbumes disponibles:', albumsData);
        alert('Álbum no encontrado');
        return;
    }
    
    document.getElementById('tituloAlbumFotos').textContent = album.Titulo;
    document.getElementById('modalVerFotos').classList.add('active');
    document.body.classList.add('modal-open');
    
    cargarFotosAlbum(idAlbum);
}

function closeModalVerFotos() {
    document.getElementById('modalVerFotos').classList.remove('active');
    document.body.classList.remove('modal-open');
}

// ========================================
// CARGAR FOTOS DEL ÁLBUM
// ========================================
function cargarFotosAlbum(idAlbum) {
    const galeria = document.getElementById('galeriaPreviews');
    galeria.innerHTML = '<div class="loading-card"><div class="spinner"></div><p>Cargando fotos...</p></div>';
    
    fetch('../../php/documentos.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'obtener_fotos_album',
            idAlbum: idAlbum
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarGaleriaFotos(data.fotos);
            document.getElementById('totalFotosAlbum').textContent = data.fotos.length;
        } else {
            galeria.innerHTML = '<div class="loading-card"><p>Error al cargar fotos</p></div>';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        galeria.innerHTML = '<div class="loading-card"><p>Error de conexión</p></div>';
    });
}

// ========================================
// MOSTRAR GALERÍA DE FOTOS
// ========================================
function mostrarGaleriaFotos(fotos) {
    const galeria = document.getElementById('galeriaPreviews');
    galeria.innerHTML = '';
    
    if (fotos.length === 0) {
        galeria.innerHTML = '<div class="loading-card"><p>No hay fotos en este álbum</p></div>';
        return;
    }
    
    fotos.forEach(foto => {
        const card = document.createElement('div');
        card.className = 'preview-card';
        
        const rutaImagen = foto.RutaArchivo.replace('../', '../../');
        const nombreEscapado = foto.NombreArchivo.replace(/'/g, "\\'");
        
        card.innerHTML = `
            <div class="preview-imagen">
                <img src="${rutaImagen}" alt="${foto.NombreArchivo}" onclick="abrirImagenFullscreen('${rutaImagen}')">
            </div>
            <div class="preview-info">
                <div class="preview-nombre" title="${foto.NombreArchivo}">${foto.NombreArchivo}</div>
                <div class="preview-detalles">
                    <span>${formatearTamano(foto.TamanoBytes)}</span>
                    ${foto.Descargada == 1 ? '<span class="preview-descargada">Descargada</span>' : ''}
                </div>
            </div>
            <div class="preview-actions">
                <button class="btn-preview-action" onclick="descargarFoto('${rutaImagen}', '${nombreEscapado}')" title="Descargar">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Descargar
                </button>
                <button class="btn-preview-action btn-preview-delete" onclick="eliminarFotoAlbum(${foto.ID_Foto}, '${nombreEscapado}')" title="Eliminar">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
        
        galeria.appendChild(card);
    });
}

// ========================================
// ABRIR IMAGEN EN PANTALLA COMPLETA
// ========================================
function abrirImagenFullscreen(ruta) {
    window.open(ruta, '_blank');
}

// ========================================
// DESCARGAR FOTO (ADMIN)
// ========================================
function descargarFoto(ruta, nombre) {
    const link = document.createElement('a');
    link.href = ruta;
    link.download = nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ========================================
// DESCARGAR TODAS LAS FOTOS (ZIP)
// ========================================
function descargarTodasLasFotos() {
    const tituloActual = document.getElementById('tituloAlbumFotos').textContent;
    const album = albumsData.find(a => a.Titulo === tituloActual);
    
    if (!album) {
        alert('No se pudo identificar el álbum');
        return;
    }
    
    const totalFotos = parseInt(document.getElementById('totalFotosAlbum').textContent);
    
    if (totalFotos === 0) {
        alert('No hay fotos para descargar');
        return;
    }
    
    if (!confirm('¿Descargar ' + totalFotos + ' fotos como archivo ZIP?')) {
        return;
    }
    
    window.location.href = '../../php/download_album_zip.php?idAlbum=' + album.ID_Album;
}

// ========================================
// ELIMINAR FOTO DEL ÁLBUM CON CONFIRMACIÓN
// ========================================
function eliminarFotoAlbum(idFoto, nombreFoto) {
    accionPendiente = 'eliminar_foto';
    datosAccion = { idFoto };
    
    const modal = document.getElementById('modalConfirmacion');
    const title = document.getElementById('confirmTitle');
    const message = document.getElementById('confirmMessage');
    const inputContainer = document.getElementById('confirmInputContainer');
    const confirmBtn = document.getElementById('confirmBtn');
    
    title.textContent = 'Eliminar Foto';
    message.textContent = `¿Deseas eliminar la foto "${nombreFoto}"? Esta acción no se puede deshacer.`;
    inputContainer.style.display = 'none';
    confirmBtn.textContent = 'Eliminar';
    confirmBtn.style.background = '#f44336';
    
    modal.classList.add('active');
    document.body.classList.add('modal-open');
}

// ========================================
// ABRIR MODAL SUBIR FOTOS
// ========================================
function abrirSubirFotos(idAlbum, titulo) {
    albumActualId = idAlbum;
    document.getElementById('idAlbumActual').value = idAlbum;
    document.getElementById('tituloAlbumActual').textContent = titulo;
    document.getElementById('modalSubirFotos').classList.add('active');
    document.body.classList.add('modal-open');
    
    configurarDropzone();
}

function closeModalSubirFotos() {
    document.getElementById('modalSubirFotos').classList.remove('active');
    fotosSeleccionadas = [];
    document.getElementById('listaFotos').innerHTML = '';
    document.body.classList.remove('modal-open');
}

// ========================================
// CONFIGURAR DROPZONE
// ========================================
function configurarDropzone() {
    const dropzone = document.getElementById('dropzone');
    const inputFotos = document.getElementById('inputFotos');
    
    dropzone.onclick = () => inputFotos.click();
    
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
        
        if (!archivo.type.startsWith('image/')) {
            alert(archivo.name + ' no es una imagen válida');
            continue;
        }
        
        if (archivo.size > 10 * 1024 * 1024) {
            alert(archivo.name + ' supera el tamaño máximo de 10MB');
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
    
    const idAlbum = document.getElementById('idAlbumActual').value;
    
    if (!idAlbum) {
        alert('Error: No se encontró el ID del álbum');
        return;
    }
    
    const formData = new FormData();
    formData.append('idAlbum', idAlbum);
    
    fotosSeleccionadas.forEach((foto) => {
        formData.append('fotos[]', foto);
    });
    
    showLoadingModal();
    
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const porcentaje = Math.round((e.loaded / e.total) * 100);
            actualizarProgresoSubida(porcentaje);
        }
    });
    
    xhr.addEventListener('load', function() {
        hideLoadingModal();
        
        if (xhr.status === 200) {
            try {
                const response = JSON.parse(xhr.responseText);
                
                if (response.success) {
                    let mensaje = response.message;
                    
                    if (response.errores && response.errores.length > 0) {
                        mensaje += '\n\nErrores:\n' + response.errores.join('\n');
                    }
                    
                    alert(mensaje);
                    closeModalSubirFotos();
                    cargarAlbums();
                } else {
                    alert('Error: ' + response.message);
                }
            } catch (e) {
                console.error('Error al parsear respuesta:', e);
                console.log('Respuesta recibida:', xhr.responseText);
                alert('Error al procesar la respuesta del servidor');
            }
        } else {
            alert('Error del servidor: ' + xhr.status);
        }
    });
    
    xhr.addEventListener('error', function() {
        hideLoadingModal();
        alert('Error de conexión. Verifica que XAMPP esté activo.');
    });
    
    xhr.open('POST', '../../php/upload_fotos.php', true);
    xhr.send(formData);
}

// ========================================
// ACTUALIZAR PROGRESO DE SUBIDA
// ========================================
function actualizarProgresoSubida(porcentaje) {
    const loadingContent = document.querySelector('.loading-content p');
    if (loadingContent) {
        loadingContent.textContent = 'Subiendo fotos... ' + porcentaje + '%';
    }
}

// ========================================
// CERRAR MODAL DE CONFIRMACIÓN
// ========================================
function cerrarModalConfirmacion() {
    const modal = document.getElementById('modalConfirmacion');
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
    accionPendiente = null;
    datosAccion = null;
}

// ========================================
// EJECUTAR ACCIÓN CONFIRMADA
// ========================================
function ejecutarAccion() {
    if (!accionPendiente || !datosAccion) {
        console.error('Error: Datos de acción incompletos', { accionPendiente, datosAccion });
        alert('Error: No se pudo procesar la acción. Por favor, intenta nuevamente.');
        cerrarModalConfirmacion();
        return;
    }
    
    // Guardar los datos ANTES de cerrar el modal
    const accionAEjecutar = accionPendiente;
    const datosAEnviar = { ...datosAccion };
    
    cerrarModalConfirmacion();
    showLoadingModal('Procesando...');
    
    // Construcción del payload según la acción
    let payload = {};
    
    switch (accionAEjecutar) {
        case 'cerrar_album':
            payload = {
                action: 'cerrar_album',
                idAlbum: datosAEnviar.idAlbum
            };
            break;
            
        case 'eliminar_foto':
            payload = {
                action: 'eliminar_foto',
                idFoto: datosAEnviar.idFoto
            };
            break;
            
        default:
            hideLoadingModal();
            alert('Acción no reconocida');
            return;
    }
    
    console.log('Enviando payload:', payload);
    
    fetch('../../php/documentos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(data => {
        hideLoadingModal();
        
        console.log('Respuesta del servidor:', data);
        
        if (data.success) {
            alert(data.message || 'Acción completada exitosamente');
            
            // Recargar datos según la acción
            if (accionAEjecutar === 'cerrar_album') {
                cargarAlbums();
            } else if (accionAEjecutar === 'eliminar_foto') {
                const tituloActual = document.getElementById('tituloAlbumFotos').textContent;
                const album = albumsData.find(a => a.Titulo === tituloActual);
                if (album) {
                    cargarFotosAlbum(album.ID_Album);
                }
                cargarAlbums();
            }
        } else {
            alert('Error: ' + (data.message || 'Respuesta inesperada'));
        }
    })
    .catch(err => {
        hideLoadingModal();
        console.error('Error en fetch:', err);
        alert('Error de conexión');
    });
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================
function formatearFecha(fecha) {
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();
    return dia + '/' + mes + '/' + anio;
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

// ========================================
// CERRAR MODALES AL HACER CLIC FUERA
// ========================================
window.onclick = function(event) {
    const modales = document.querySelectorAll('.modal');
    modales.forEach(modal => {
        if (event.target === modal) {
            if (modal.id === 'modalConfirmacion') {
                cerrarModalConfirmacion();
            } else {
                modal.classList.remove('active');
                document.body.classList.remove('modal-open');
            }
        }
    });
};