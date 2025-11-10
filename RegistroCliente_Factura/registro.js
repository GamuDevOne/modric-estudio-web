// === 📞 Formateo automático del teléfono ===
const telefonoInput = document.getElementById('telefono');
telefonoInput.addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) {
        value = value.slice(0, 4) + '-' + value.slice(4, 8);
    }
    e.target.value = value;
});

// === 💰 Mostrar/ocultar sección de abono ===
const tipoPagoRadios = document.querySelectorAll('input[name="tipoPago"]');
const abonoSection = document.getElementById('abonoSection');
const cantidadAbonoInput = document.getElementById('cantidadAbono');

tipoPagoRadios.forEach(radio => {
    radio.addEventListener('change', function () {
        if (this.value === 'abono') {
            abonoSection.style.display = 'block';
            cantidadAbonoInput.required = true;
        } else {
            abonoSection.style.display = 'none';
            cantidadAbonoInput.required = false;
            cantidadAbonoInput.value = '';
        }
    });
});

// === 💵 Formateo de cantidad de abono ===
cantidadAbonoInput.addEventListener('input', function (e) {
    let value = e.target.value.replace(/[^\d.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
    if (parts[1] && parts[1].length > 2) value = parts[0] + '.' + parts[1].slice(0, 2);
    e.target.value = value ? '$' + value : '';
});

// === ✅ Validación del formulario ===
document.getElementById('facturaForm').addEventListener('submit', function (e) {
    e.preventDefault();
    let isValid = true;

    const nombre = document.getElementById('nombre');
    const apellido = document.getElementById('apellido');
    const telefono = document.getElementById('telefono');
    const escuela = document.getElementById('escuela');
    const paquete = document.getElementById('paquete');
    const metodoPago = document.querySelector('input[name="metodoPago"]:checked');
    const tipoPago = document.querySelector('input[name="tipoPago"]:checked');
    const comentario = document.getElementById('comentario');
    const grupo = document.getElementById('grupo');

    const telefonoPattern = /^6\d{3}-\d{4}$/;

    // === Validaciones básicas ===
    if (!nombre.value.trim()) { showError('nombre'); isValid = false; } else hideError('nombre');
    if (!apellido.value.trim()) { showError('apellido'); isValid = false; } else hideError('apellido');
    if (!telefonoPattern.test(telefono.value)) { showError('telefono'); isValid = false; } else hideError('telefono');
    if (!escuela.value.trim()) { showError('escuela'); isValid = false; } else hideError('escuela');
    if (!paquete.value) { showError('paquete'); isValid = false; } else hideError('paquete');
    if (!metodoPago) { showError('metodoPago'); isValid = false; } else hideError('metodoPago');
    if (!tipoPago) { showError('tipoPago'); isValid = false; } else hideError('tipoPago');

    if (tipoPago && tipoPago.value === 'abono') {
        const abonoValue = parseFloat(cantidadAbonoInput.value.replace('$', ''));
        if (!abonoValue || abonoValue <= 0) {
            showError('abono');
            isValid = false;
        } else hideError('abono');
    }

    // === Si todo está bien, guardar datos ===
    if (isValid) {
        const formData = {
            cliente: {
                nombre: `${nombre.value} ${apellido.value}`,
                telefono: telefono.value.replace('-', ''),
                escuela: escuela.value,
                grupo: grupo ? grupo.value : '',
            },
            paquete: paquete.options[paquete.selectedIndex].text,
            metodoPago: metodoPago.value,
            tipoPago: tipoPago.value,
            cantidadAbono: tipoPago.value === 'abono' ? cantidadAbonoInput.value : 'N/A',
            comentario: comentario.value.trim() || "Sin comentarios",
            productos: [
                {
                    descripcion: paquete.options[paquete.selectedIndex].text,
                    base: "50.00",  // 🔧 Ajusta según tus precios
                    itbms: "3.50",
                    total: "53.50"
                }
            ]
        };

        // === 💾 Guardar datos de la factura en localStorage ===
        localStorage.setItem('facturaData', JSON.stringify(formData));

        // === 🔄 Redirigir automáticamente a factura.html ===
        window.location.href = "../RegistroCliente_Factura/factura.html";
    }
});

// === 🚨 Funciones de error ===
function showError(fieldName) {
    const field = document.getElementById(fieldName);
    const error = document.getElementById(fieldName + 'Error');
    if (field) field.classList.add('invalid');
    if (error) error.classList.add('active');
}

function hideError(fieldName) {
    const field = document.getElementById(fieldName);
    const error = document.getElementById(fieldName + 'Error');
    if (field) field.classList.remove('invalid');
    if (error) error.classList.remove('active');
}

// === ✏️ Ocultar error al escribir ===
document.querySelectorAll('input, select, textarea').forEach(element => {
    element.addEventListener('input', function () {
        hideError(this.id);
    });
});
