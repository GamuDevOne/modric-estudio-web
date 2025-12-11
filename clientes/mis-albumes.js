// ========================================
// VARIABLES GLOBALES
// ========================================
let albumsData = [];
let fotosActuales = [];
let albumActualId = null;
let fotosSeleccionadas = new Set();
let currentImageIndex = 0;

// ========================================
// VERIFICAR SESIÓN Y CARGAR DATOS
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    const user = checkSession();
    
    if (!user) {
        window.location.href = '../login/login.html';
        return;
    }
    
    // Solo clientes pueden acceder
    if (user.tipo !== 'Cliente') {
        mostrarModal('Acceso denegado. Esta página es solo para clientes.', 'error');
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
        return;
    }
    
    // Mostrar mensaje de bienvenida
    document.getElementById('welcomeMessage').textContent = `Bienvenido/a, ${user.nombre}`;
    
    // Cargar álbumes del cliente
    cargarAlbumsCliente(user.id);
});

// ========================================
// CARGAR ÁLBUMES DEL CLIENTE
// ========================================
function cargarAlbumsCliente(idCliente) {
    showLoadingModal();
    
    fetch('../php/documentos.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'obtener_albums_cliente',
            idCliente: idCliente
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            albumsData = data.albums;
            mostrarAlbums(albumsData);
            mostrarAlertas(albumsData);
        } else {
            console.error('Error:', data.message);
            mostrarError('Error al cargar tus álbumes');
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        mostrarError('Error de conexión. Por favor, intenta nuevamente.');
    });
}

// ========================================
// MOSTRAR ALERTAS
// ========================================
function mostrarAlertas(albums) {
    const infoAlert = document.getElementById('infoAlert');
    const infoMessage = document.getElementById('infoMessage');
    
    // Verificar si hay álbumes próximos a vencer
    const albumsProximosAVencer = albums.filter(a => 
        a.Estado === 'Activo' && a.DiasRestantes > 0 && a.DiasRestantes <= 7
    );
    
    if (albumsProximosAVencer.length > 0) {
        const diasMinimos = Math.min(...albumsProximosAVencer.map(a => a.DiasRestantes));
        infoMessage.textContent = `Tienes álbumes que vencen pronto. El más próximo caduca en ${diasMinimos} ${diasMinimos === 1 ? 'día' : 'días'}. ¡Descarga tus fotos antes de que expiren!`;
        infoAlert.style.display = 'flex';
    }
}

// ========================================
// MOSTRAR ÁLBUMES
// ========================================
function mostrarAlbums(albums) {
    const grid = document.getElementById('albumsGrid');
    grid.innerHTML = '';
    
    if (albums.length === 0) {
        grid.innerHTML = `
            <div class="loading-card">
                <p>No tienes álbumes disponibles en este momento.</p>
                <p style="font-size: 14px; color: #666; margin-top: 10px;">
                    Si realizaste una sesión de fotos recientemente, contacta con el estudio.
                </p>
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
// CREAR TARJETA DE ÁLBUM
// ========================================
function crearAlbumCard(album) {
    const card = document.createElement('div');
    card.className = 'album-card';
    
    const diasRestantes = album.DiasRestantes > 0 ? album.DiasRestantes : 0;
    const estaVencido = album.Estado === 'Vencido' || diasRestantes === 0;
    const estaProximoAVencer = diasRestantes > 0 && diasRestantes <= 7;
    
    if (estaVencido) {
        card.classList.add('vencido');
    }
    
    let alertHTML = '';
    if (estaProximoAVencer && !estaVencido) {
        alertHTML = `
            <div class="album-alert ${diasRestantes <= 3 ? 'danger' : ''}">
                <strong>⚠️ Atención:</strong> Este álbum vence en ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}. 
                Descarga tus fotos pronto.
            </div>
        `;
    } else if (estaVencido) {
        alertHTML = `
            <div class="album-alert danger">
                <strong>❌ Álbum vencido:</strong> Ya no puedes descargar estas fotos.
            </div>
        `;
    }
    
    card.innerHTML = `
        <div class="album-header">
            <h3 class="album-title">${album.Titulo}</h3>
            <div class="album-date">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Creado: ${formatearFecha(album.FechaSubida)}
            </div>
        </div>
        
        <div class="album-body">
            ${album.Descripcion ? '<p class="album-description">' + album.Descripcion + '</p>' : ''}
            
            ${alertHTML}
            
            <div class="album-stats">
                <div class="stat-item">
                    <div class="stat-label">Total de Fotos</div>
                    <div class="stat-value">${album.TotalFotos || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Días Restantes</div>
                    <div class="stat-value ${diasRestantes <= 3 ? 'danger' : diasRestantes <= 7 ? 'warning' : ''}">
                        ${diasRestantes}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="album-footer">
            <span class="album-estado ${estaVencido ? 'vencido' : 'activo'}">
                ${estaVencido ? 'Vencido' : 'Activo'}
            </span>
            <button class="btn-ver-album" onclick="verFotosAlbum(${album.ID_Album})" ${estaVencido ? 'disabled' : ''}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
                ${estaVencido ? 'Vencido' : 'Ver Fotos'}
            </button>
        </div>
    `;
    
    return card;
}

// ========================================
// VER FOTOS DEL ÁLBUM
// ========================================
function verFotosAlbum(idAlbum) {
    const album = albumsData.find(a => parseInt(a.ID_Album) === parseInt(idAlbum));
    
    if (!album) {
        mostrarModal('Álbum no encontrado', 'error');
        return;
    }
    
    albumActualId = idAlbum;
    fotosSeleccionadas.clear();
    
    document.getElementById('tituloAlbumFotos').textContent = album.Titulo;
    
    const diasRestantes = album.DiasRestantes > 0 ? album.DiasRestantes : 0;
    document.getElementById('diasRestantesInfo').textContent = 
        `Vence en ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}`;
    
    document.getElementById('modalVerFotos').classList.add('active');
    document.body.classList.add('modal-open');
    
    cargarFotosAlbum(idAlbum);
}

function closeModalVerFotos() {
    document.getElementById('modalVerFotos').classList.remove('active');
    document.body.classList.remove('modal-open');
    fotosSeleccionadas.clear();
    actualizarBotonDescargaSeleccionadas();
}

// ========================================
// CARGAR FOTOS DEL ÁLBUM
// ========================================
function cargarFotosAlbum(idAlbum) {
    const galeria = document.getElementById('galeriaPreviews');
    galeria.innerHTML = '<div class="loading-card"><div class="spinner"></div><p>Cargando fotos...</p></div>';
    
    fetch('../php/documentos.php', {
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
            fotosActuales = data.fotos;
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
    
    fotos.forEach((foto, index) => {
        const card = document.createElement('div');
        card.className = 'preview-card';
        card.dataset.fotoId = foto.ID_Foto;
        
        const rutaImagen = foto.RutaArchivo.replace('../', '../');
        const nombreEscapado = foto.NombreArchivo.replace(/'/g, "\\'");
        
        card.innerHTML = `
            <div class="preview-imagen">
                <div class="select-overlay">
                    <input type="checkbox" 
                           class="checkbox-custom" 
                           onchange="toggleSeleccion(${foto.ID_Foto})"
                           id="check-${foto.ID_Foto}">
                </div>
                <img src="${rutaImagen}" 
                     alt="${foto.NombreArchivo}" 
                     onclick="abrirLightbox(${index})">
            </div>
            <div class="preview-info">
                <div class="preview-nombre" title="${foto.NombreArchivo}">
                    ${foto.NombreArchivo}
                </div>
                <div class="preview-detalles">
                    <span>${formatearTamano(foto.TamanoBytes)}</span>
                </div>
            </div>
            <div class="preview-actions">
                <button class="btn-preview-action" 
                        onclick="descargarFoto('${rutaImagen}', '${nombreEscapado}', ${foto.ID_Foto})"
                        title="Descargar">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Descargar
                </button>
            </div>
        `;
        
        galeria.appendChild(card);
    });
}

// ========================================
// SISTEMA DE SELECCIÓN DE FOTOS
// ========================================
function toggleSeleccion(idFoto) {
    const checkbox = document.getElementById(`check-${idFoto}`);
    const card = document.querySelector(`[data-foto-id="${idFoto}"]`);
    
    if (checkbox.checked) {
        fotosSeleccionadas.add(idFoto);
        card.classList.add('selected');
    } else {
        fotosSeleccionadas.delete(idFoto);
        card.classList.remove('selected');
    }
    
    actualizarBotonDescargaSeleccionadas();
}

function actualizarBotonDescargaSeleccionadas() {
    const btnDownload = document.getElementById('btnDownloadSelected');
    const countSpan = document.getElementById('countSelected');
    
    if (fotosSeleccionadas.size > 0) {
        btnDownload.style.display = 'inline-flex';
        countSpan.textContent = fotosSeleccionadas.size;
    } else {
        btnDownload.style.display = 'none';
    }
}

// ========================================
// DESCARGAR FOTOS SELECCIONADAS
// ========================================
async function descargarSeleccionadas() {
    if (fotosSeleccionadas.size === 0) {
        mostrarModal('No has seleccionado ninguna foto', 'warning');
        return;
    }
    
    const cantidadSeleccionadas = fotosSeleccionadas.size;
    showLoadingModal();
    
    const user = checkSession();
    
    for (const idFoto of fotosSeleccionadas) {
        const foto = fotosActuales.find(f => parseInt(f.ID_Foto) === parseInt(idFoto));
        if (foto) {
            const rutaImagen = foto.RutaArchivo.replace('../', '../');
            await descargarFotoIndividual(rutaImagen, foto.NombreArchivo, foto.ID_Foto);
            
            // Pequeña pausa entre descargas
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
    
    hideLoadingModal();
    
    // Limpiar selección
    fotosSeleccionadas.clear();
    document.querySelectorAll('.checkbox-custom').forEach(cb => cb.checked = false);
    document.querySelectorAll('.preview-card').forEach(card => card.classList.remove('selected'));
    actualizarBotonDescargaSeleccionadas();
    
    mostrarModal(`${cantidadSeleccionadas} ${cantidadSeleccionadas === 1 ? 'foto descargada' : 'fotos descargadas'} correctamente`, 'success');
}

// ========================================
// DESCARGAR FOTO INDIVIDUAL
// ========================================
function descargarFoto(ruta, nombre, idFoto) {
    descargarFotoIndividual(ruta, nombre, idFoto);
    registrarDescarga(idFoto);
}

async function descargarFotoIndividual(ruta, nombre, idFoto) {
    const link = document.createElement('a');
    link.href = ruta;
    link.download = nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (idFoto) {
        registrarDescarga(idFoto);
    }
}

// ========================================
// REGISTRAR DESCARGA
// ========================================
function registrarDescarga(idFoto) {
    const user = checkSession();
    if (!user) return;
    
    fetch('../php/documentos.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'registrar_descarga',
            idFoto: idFoto,
            idCliente: user.id
        })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Error al registrar descarga:', data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// ========================================
// DESCARGAR TODAS LAS FOTOS (ZIP)
// ========================================
function descargarTodasLasFotos(event) {
    // Evitar que el click burbujee y algún handler global cierre el modal inmediatamente
    if (event && event.stopPropagation) event.stopPropagation();

    if (!albumActualId) {
        mostrarModal('No se pudo identificar el álbum', 'error');
        return;
    }

    const totalFotos = parseInt(document.getElementById('totalFotosAlbum').textContent);

    if (totalFotos === 0) {
        mostrarModal('No hay fotos para descargar', 'warning');
        return;
    }

    // Mostrar modal de confirmación personalizado
    abrirModalConfirmZip(totalFotos);
}

function abrirModalConfirmZip(totalFotos) {
    const dashboardModal = document.getElementById('modalConfirmacion');
    if (dashboardModal) {
        const title = document.getElementById('confirmTitle');
        const message = document.getElementById('confirmMessage');
        const inputContainer = document.getElementById('confirmInputContainer');
        const confirmBtn = document.getElementById('confirmBtn');

        title.textContent = 'Descargar álbum';
        message.textContent = `¿Descargar ${totalFotos} ${totalFotos === 1 ? 'foto' : 'fotos'} como archivo ZIP?`;
        if (inputContainer) inputContainer.style.display = 'none';

        if (confirmBtn) {
            confirmBtn.textContent = 'ACEPTAR';
            confirmBtn.style.background = ''; // use default primary style
            // Remove previous handlers and set to confirmarDescargaZip
            confirmBtn.onclick = function(e) {
                e.stopPropagation();
                confirmarDescargaZip();
            };
        }

        dashboardModal.classList.add('active');
        document.body.classList.add('modal-open');
        return;
    }

    const modal = document.getElementById('confirmZipModal');
    const message = document.getElementById('confirmZipMessage');
    
    message.textContent = `¿Descargar ${totalFotos} ${totalFotos === 1 ? 'foto' : 'fotos'} como archivo ZIP?`;
    
    modal.classList.add('active');
    document.body.classList.add('modal-open');
}

function cerrarModalConfirmacion() {
    const modal = document.getElementById('modalConfirmacion');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');

    // limpiar handler del botón para evitar referencias accidentales
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) confirmBtn.onclick = null;
}

function cerrarModalConfirmZip() {
    const modal = document.getElementById('confirmZipModal');
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
}

function confirmarDescargaZip() {
    cerrarModalConfirmZip();
    showLoadingModal();
    
    // Simular descarga con timeout para mostrar modal
    setTimeout(() => {
        window.location.href = '../php/download_album_zip.php?idAlbum=' + albumActualId;
        
        // Registrar descarga de todas las fotos
        fotosActuales.forEach(foto => {
            registrarDescarga(foto.ID_Foto);
        });
        
        hideLoadingModal();
        mostrarModal('Descarga iniciada correctamente', 'success');
    }, 500);
}

// ========================================
// LIGHTBOX (Ver imagen en pantalla completa)
// ========================================
function abrirLightbox(index) {
    currentImageIndex = index;
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    
    const foto = fotosActuales[currentImageIndex];
    const rutaImagen = foto.RutaArchivo.replace('../', '../');
    
    lightbox.classList.add('active');
    lightboxImage.src = rutaImagen;
    
    actualizarContadorLightbox();
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function cambiarImagen(direccion) {
    currentImageIndex += direccion;
    
    if (currentImageIndex >= fotosActuales.length) {
        currentImageIndex = 0;
    } else if (currentImageIndex < 0) {
        currentImageIndex = fotosActuales.length - 1;
    }
    
    const lightboxImage = document.getElementById('lightbox-image');
    const foto = fotosActuales[currentImageIndex];
    const rutaImagen = foto.RutaArchivo.replace('../', '../');
    
    lightboxImage.src = rutaImagen;
    actualizarContadorLightbox();
}

function actualizarContadorLightbox() {
    const counter = document.getElementById('image-counter');
    counter.textContent = `${currentImageIndex + 1} / ${fotosActuales.length}`;
}

// Navegación con teclado en lightbox
document.addEventListener('keydown', function(e) {
    const lightbox = document.getElementById('lightbox');
    if (lightbox.classList.contains('active')) {
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowRight') {
            cambiarImagen(1);
        } else if (e.key === 'ArrowLeft') {
            cambiarImagen(-1);
        }
    }
});

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
    mostrarModal(mensaje, 'error');
}

// ========================================
// MODAL DE RETROALIMENTACIÓN
// ========================================
function mostrarModal(mensaje, tipo = 'info') {
    const modal = document.getElementById('feedbackModal');
    const icon = document.getElementById('feedbackIcon');
    const messageEl = document.getElementById('feedbackMessage');
    
    // Definir íconos según el tipo
    const iconos = {
        success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        error: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        warning: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        info: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };
    
    // Configurar ícono y clase
    icon.className = 'feedback-icon ' + tipo;
    icon.innerHTML = iconos[tipo] || iconos.info;
    
    // Configurar mensaje
    messageEl.textContent = mensaje;
    
    // Mostrar modal
    modal.classList.remove('hiding');
    modal.classList.add('active');
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        cerrarModal();
    }, 3000);
}

function cerrarModal() {
    const modal = document.getElementById('feedbackModal');
    modal.classList.add('hiding');
    
    setTimeout(() => {
        modal.classList.remove('active', 'hiding');
    }, 300);
}

// ========================================
// CERRAR MODALES AL HACER CLIC FUERA
// ========================================
window.onclick = function(event) {
    const modales = document.querySelectorAll('.modal');
    modales.forEach(modal => {
        if (event.target === modal) {
            // No cerrar automáticamente el modal de confirmación ZIP
            if (modal.id === 'confirmZipModal') {
                return;
            }
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    });
    
    // Cerrar lightbox al hacer clic fuera
    const lightbox = document.getElementById('lightbox');
    if (event.target === lightbox) {
        closeLightbox();
    }
};