// ========================================
// ARRAY DE IMÁGENES PARA EL LIGHTBOX
// ========================================
const galleryImages = [
    './imagenes/SBN/IMG_0757.jpg',
    './imagenes/SBN/_MG_0430.jpg',
    './imagenes/SBN/_MG_0505.jpg',
    './imagenes/SBN/_MG_9245.JPG',
    './imagenes/SBN/IMG_0758.jpeg',
    './imagenes/SBN/IMG_1571.jpeg'
];

let currentImageIndex = 0;

// ========================================
// LIGHTBOX/CARRUSEL FUNCIONES
// ========================================
function openLightbox(index) {
    currentImageIndex = index;
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    
    console.log('Abriendo imagen:', galleryImages[currentImageIndex]);
    
    lightbox.classList.add('active');
    lightboxImage.src = galleryImages[currentImageIndex];
    
    lightboxImage.onerror = function() {
        console.error('Error al cargar imagen:', this.src);
        alert('Error al cargar la imagen. Verifica que el archivo existe en: ' + this.src);
    };
    
    lightboxImage.onload = function() {
        console.log('Imagen cargada correctamente:', this.src);
    };
    
    updateCounter();
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function changeImage(direction) {
    currentImageIndex += direction;
    
    if (currentImageIndex >= galleryImages.length) {
        currentImageIndex = 0;
    } else if (currentImageIndex < 0) {
        currentImageIndex = galleryImages.length - 1;
    }
    
    const lightboxImage = document.getElementById('lightbox-image');
    lightboxImage.src = galleryImages[currentImageIndex];
    updateCounter();
}

function updateCounter() {
    const counter = document.getElementById('image-counter');
    counter.textContent = `${currentImageIndex + 1} / ${galleryImages.length}`;
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});

document.addEventListener('keydown', function(e) {
    const lightbox = document.getElementById('lightbox');
    if (lightbox.classList.contains('active')) {
        if (e.key === 'ArrowRight') {
            changeImage(1);
        } else if (e.key === 'ArrowLeft') {
            changeImage(-1);
        }
    }
});

document.getElementById('lightbox').addEventListener('click', function(e) {
    if (e.target === this) {
        closeLightbox();
    }
});

// ========================================
// FORMULARIO DE CONTACTO - FIX COMPLETO
// ========================================
function handleSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnOriginalText = submitBtn.textContent;
    
    // Obtener valores del formulario
    const nombre = form.querySelector('input[name="nombre"]').value.trim();
    const email = form.querySelector('input[name="email"]').value.trim();
    const telefono = form.querySelector('input[name="telefono"]').value.trim();
    const mensaje = form.querySelector('textarea[name="mensaje"]').value.trim();

    // Validación básica
    if (!nombre || !email || !mensaje) {
        mostrarModal('Por favor completa los campos obligatorios (Nombre, Email y Mensaje).', 'warning');
        return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        mostrarModal('Por favor ingresa un email válido.', 'warning');
        return;
    }

    // Deshabilitar botón y mostrar carga
    submitBtn.disabled = true;
    submitBtn.textContent = 'ENVIANDO...';

    // Preparar datos
    const payload = {
        nombre: nombre,
        email: email,
        telefono: telefono || '',
        mensaje: mensaje
    };

    // Enviar al servidor
    fetch('./php/contacto.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error del servidor: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.textContent = btnOriginalText;

        if (data.success) {
            mostrarModal(data.message || '¡Mensaje enviado correctamente!', 'success');
            form.reset();
        } else {
            mostrarModal(data.message || 'Error al enviar el mensaje.', 'error');
        }
    })
    .catch(error => {
        console.error('Error al enviar contacto:', error);
        
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.textContent = btnOriginalText;
        
        if (error.name === 'TypeError') {
            mostrarModal('Error de conexión. Verifica que XAMPP esté activo.', 'error');
        } else {
            mostrarModal('Error al enviar el mensaje. Por favor, intenta de nuevo.', 'error');
        }
    });
}

// ========================================
// SCROLL A SECCIÓN CONTACTO
// ========================================
function scrollToContacto() {
    const contactoSection = document.getElementById('contacto');
    const headerHeight = document.getElementById('header').offsetHeight;
    const targetPosition = contactoSection.offsetTop - headerHeight;
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

// ========================================
// VERIFICACIÓN AL CARGAR LA PÁGINA
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Verificando imágenes de la galería...');
    console.log('Rutas definidas:', galleryImages);
    
    galleryImages.forEach((img, index) => {
        const testImg = new Image();
        testImg.src = img;
        testImg.onload = function() {
            console.log(`✓ Imagen ${index + 1} encontrada:`, img);
        };
        testImg.onerror = function() {
            console.error(`✗ Imagen ${index + 1} NO encontrada:`, img);
        };
    });
});