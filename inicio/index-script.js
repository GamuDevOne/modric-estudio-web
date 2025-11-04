// ========================================
// ARRAY DE IMÁGENES PARA EL LIGHTBOX
// ========================================
// AQUÍ VAN LAS RUTAS DE LAS IMÁGENES DE LA GALERÍA
const galleryImages = [
    'imagenes/galeria/foto1.jpg',
    'imagenes/galeria/foto2.jpg',
    'imagenes/galeria/foto3.jpg',
    'imagenes/galeria/foto4.jpg',
    'imagenes/galeria/foto5.jpg',
    'imagenes/galeria/foto6.jpg'
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
    
    lightbox.classList.add('active');
    lightboxImage.src = galleryImages[currentImageIndex];
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
// ANIMACIONES AL HACER SCROLL (idea opcional de momento)
// ========================================
//animaciones al aparecer elementos

/*
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observar elementos que quieres animar
document.querySelectorAll('.about-content, .gallery-item, .contact-info').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});
*/

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