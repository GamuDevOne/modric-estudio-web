// ========================================
// ARRAY DE IMÁGENES PARA EL LIGHTBOX
// ========================================
// IMPORTANTE: Las rutas deben coincidir EXACTAMENTE con las del HTML
const galleryImages = [
    './imagenes/SBN/IMG_0757.jpg',      // Foto 1
    './imagenes/SBN/_MG_0430.jpg',      // Foto 2
    './imagenes/SBN/_MG_0505.jpg',      // Foto 3
    './imagenes/SBN/_MG_9245.JPG',      // Foto 4
    './imagenes/SBN/IMG_0758.jpeg',     // Foto 5
    './imagenes/SBN/IMG_1571.jpeg'      // Foto 6
];

let currentImageIndex = 0;

// ========================================
// LIGHTBOX/CARRUSEL FUNCIONES
// ========================================

// Abrir lightbox
function openLightbox(index) {
    currentImageIndex = index;
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    
    // Verificar que la imagen existe
    console.log('Abriendo imagen:', galleryImages[currentImageIndex]);
    
    lightbox.classList.add('active');
    lightboxImage.src = galleryImages[currentImageIndex];
    
    // Agregar evento de error para debugging
    lightboxImage.onerror = function() {
        console.error('Error al cargar imagen:', this.src);
        alert('Error al cargar la imagen. Verifica que el archivo existe en: ' + this.src);
    };
    
    lightboxImage.onload = function() {
        console.log('Imagen cargada correctamente:', this.src);
    };
    
    updateCounter();
    
    // Prevenir scroll del body cuando el lightbox está abierto
    document.body.style.overflow = 'hidden';
}

// Cerrar lightbox
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    
    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
}

// Cambiar imagen (siguiente/anterior)
function changeImage(direction) {
    currentImageIndex += direction;
    
    // Loop: si llega al final, vuelve al inicio y viceversa
    if (currentImageIndex >= galleryImages.length) {
        currentImageIndex = 0;
    } else if (currentImageIndex < 0) {
        currentImageIndex = galleryImages.length - 1;
    }
    
    const lightboxImage = document.getElementById('lightbox-image');
    lightboxImage.src = galleryImages[currentImageIndex];
    updateCounter();
}

// Actualizar contador de imágenes
function updateCounter() {
    const counter = document.getElementById('image-counter');
    counter.textContent = `${currentImageIndex + 1} / ${galleryImages.length}`;
}

// Cerrar lightbox con tecla ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});

// Navegación con flechas del teclado
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

// Cerrar lightbox al hacer clic fuera de la imagen
document.getElementById('lightbox').addEventListener('click', function(e) {
    if (e.target === this) {
        closeLightbox();
    }
});

// ========================================
// FORMULARIO DE CONTACTO
// ========================================
function handleSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Aquí se implementará el envío del formulario
    // Por ejemplo, usando fetch para enviar a un servidor:
    /*
    fetch('tu-endpoint-de-servidor.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        alert('¡Mensaje enviado correctamente!');
        form.reset();
    })
    .catch(error => {
        alert('Error al enviar el mensaje. Por favor, intenta de nuevo.');
    });
    */
    
    // Por ahora, solo mostramos un mensaje de confirmación
    alert('¡Gracias por tu mensaje!\n\nTe contactaremos pronto.');
    form.reset();
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
    
    // Verificar que las imágenes existan
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