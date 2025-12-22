// gest-usuarios-temporales.js
// Gestión de usuarios temporales creados para álbumes

let usuariosTemporalesData = [];
let tempUserIdEliminar = null;

// ========================================
// CARGAR USUARIOS TEMPORALES AL INICIO
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que carguen los vendedores primero
    setTimeout(() => {
        cargarUsuariosTemporales();
    }, 500);
});

// ========================================
// CARGAR USUARIOS TEMPORALES
// ========================================
function cargarUsuariosTemporales() {
    fetch('../../php/gest-usuarios-temporales.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'get_usuarios_temporales'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            usuariosTemporalesData = data.usuarios;
            mostrarUsuariosTemporales(usuariosTemporalesData);
        } else {
            console.error('Error:', data.message);
            document.getElementById('tablaUsuariosTemporales').innerHTML = 
                '<tr><td colspan="6" class="empty">Error al cargar usuarios temporales</td></tr>';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('tablaUsuariosTemporales').innerHTML = 
            '<tr><td colspan="6" class="empty">Error de conexión</td></tr>';
    });
}

// ========================================
// MOSTRAR USUARIOS TEMPORALES EN TABLA
// ========================================
function mostrarUsuariosTemporales(usuarios) {
    const tabla = document.getElementById('tablaUsuariosTemporales');
    tabla.innerHTML = '';
    
    if (usuarios.length === 0) {
        tabla.innerHTML = '<tr><td colspan="6" class="empty">No hay usuarios temporales registrados</td></tr>';
        return;
    }
    
    usuarios.forEach(usuario => {
        const row = document.createElement('tr');
        
        // Determinar clase según días
        let claseDias = '';
        if (parseInt(usuario.DiasDesdeCreacion) > 45) {
            claseDias = 'text-danger';
        } else if (parseInt(usuario.DiasDesdeCreacion) > 30) {
            claseDias = 'text-warning';
        }
        
        row.innerHTML = `
            <td>#${usuario.ID_Usuario}</td>
            <td>${usuario.NombreCompleto}</td>
            <td>${usuario.Usuario || 'N/A'}</td>
            <td><span class="badge-album">${usuario.AlbumesAsociados}</span></td>
            <td><span class="${claseDias}">${usuario.DiasDesdeCreacion} días</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon password" title="Cambiar contraseña">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
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
        
        // Asignar listeners
        const btnPassword = row.querySelector('.password');
        const btnDelete = row.querySelector('.delete');
        
        if (btnPassword) {
            btnPassword.addEventListener('click', () => 
                abrirModalCambiarContrasena(usuario.ID_Usuario, usuario.NombreCompleto, usuario.Usuario)
            );
        }
        
        if (btnDelete) {
            btnDelete.addEventListener('click', () => 
                eliminarUsuarioTemporal(usuario.ID_Usuario, usuario.NombreCompleto, usuario.AlbumesAsociados)
            );
        }
    });
}

// ========================================
// ABRIR MODAL CAMBIAR CONTRASEÑA
// ========================================
function abrirModalCambiarContrasena(id, nombre, usuario) {
    // Buscar usuario en el array para obtener datos completos
    const usuarioData = usuariosTemporalesData.find(u => parseInt(u.ID_Usuario) === parseInt(id));
    
    document.getElementById('tempUserId').value = id;
    document.getElementById('tempUserNombre').textContent = usuario || 'N/A';
    
    // Obtener contraseña actual
    obtenerContrasenaActual(id);
    
    document.getElementById('nuevaContrasena').value = '';
    document.getElementById('credencialesPreviewTemp').style.display = 'none';
    
    document.getElementById('modalCambiarContrasena').classList.add('active');
    document.body.classList.add('modal-open');
}

// ========================================
// OBTENER CONTRASEÑA ACTUAL
// ========================================
function obtenerContrasenaActual(id) {
    fetch('../../php/gest-usuarios-temporales.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'obtener_contrasena_actual',
            id: id
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('tempUserUsuario').textContent = data.contrasena || 'N/A';
        } else {
            document.getElementById('tempUserUsuario').textContent = 'No disponible';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('tempUserUsuario').textContent = 'Error al cargar';
    });
}

function closeModalCambiarContrasena() {
    document.getElementById('modalCambiarContrasena').classList.remove('active');
    document.getElementById('formCambiarContrasena').reset();
    document.getElementById('credencialesPreviewTemp').style.display = 'none';
    document.body.classList.remove('modal-open');
}

// ========================================
// CAMBIAR CONTRASEÑA USUARIO TEMPORAL
// ========================================
function cambiarContrasenaUsuarioTemporal(event) {
    event.preventDefault();
    
    const id = document.getElementById('tempUserId').value;
    const nuevaContrasena = document.getElementById('nuevaContrasena').value;
    
    if (nuevaContrasena.length < 6) {
        mostrarModal('La contraseña debe tener al menos 6 caracteres', 'warning');
        return;
    }
    
    showLoadingModal();
    
    fetch('../../php/gest-usuarios-temporales.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'cambiar_contrasena_temporal',
            id: id,
            nuevaContrasena: nuevaContrasena
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            // Actualizar la contraseña mostrada en el modal
            document.getElementById('tempUserUsuario').textContent = data.nuevaContrasena;
            
            // Mostrar la nueva contraseña en el preview
            document.getElementById('nuevaContrasenaGenerada').textContent = data.nuevaContrasena;
            document.getElementById('credencialesPreviewTemp').style.display = 'block';
            
            mostrarModal('Contraseña actualizada correctamente', 'success');
            
            // Cerrar modal después de 3 segundos
            setTimeout(() => {
                closeModalCambiarContrasena();
            }, 3000);
        } else {
            mostrarModal('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        mostrarModal('Error de conexión', 'error');
    });
}

// ========================================
// ELIMINAR USUARIO TEMPORAL
// ========================================
function eliminarUsuarioTemporal(id, nombre, albumesAsociados) {
    if (albumesAsociados > 0) {
        mostrarModal('No se puede eliminar: el usuario tiene ' + albumesAsociados + ' álbum(es) activo(s)', 'warning');
        return;
    }
    
    if (!confirm('¿Estás seguro de que deseas eliminar al usuario temporal "' + nombre + '"?')) {
        return;
    }
    
    tempUserIdEliminar = id;
    
    showLoadingModal();
    
    fetch('../../php/gest-usuarios-temporales.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'eliminar_usuario_temporal',
            id: id
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            mostrarModal('Usuario temporal eliminado correctamente', 'success');
            cargarUsuariosTemporales();
        } else {
            mostrarModal('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        mostrarModal('Error de conexión', 'error');
    });
}


// ========================================
// LIMPIAR USUARIOS VENCIDOS
// ========================================
function limpiarUsuariosVencidos() {
    if (!confirm('¿Deseas eliminar todos los usuarios temporales sin álbumes activos y con más de 60 días desde su creación?')) {
        return;
    }
    
    showLoadingModal();
    
    fetch('../../php/gest-usuarios-temporales.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'limpiar_usuarios_vencidos'
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.success) {
            mostrarModal(data.message, data.eliminados > 0 ? 'success' : 'info');
            if (data.eliminados > 0) {
                cargarUsuariosTemporales();
            }
        } else {
            mostrarModal('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Error:', error);
        mostrarModal('Error de conexión', 'error');
    });
}