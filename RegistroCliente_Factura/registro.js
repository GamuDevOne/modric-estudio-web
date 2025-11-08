// Formateo automático del teléfono
const telefonoInput = document.getElementById('telefono');
telefonoInput.addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) {
        value = value.slice(0, 4) + '-' + value.slice(4, 8);
    }
    e.target.value = value;
});

// Mostrar/ocultar sección de abono
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

// Formateo de cantidad de abono
cantidadAbonoInput.addEventListener('input', function (e) {
    let value = e.target.value.replace(/[^\d.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
    if (parts[1] && parts[1].length > 2) value = parts[0] + '.' + parts[1].slice(0, 2);
    e.target.value = value ? '$' + value : '';
});

// Validación del formulario
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

    const telefonoPattern = /^6\d{3}-\d{4}$/;

    if (!nombre.value.trim()) { showError('nombre'); isValid = false; } else hideError('nombre');
    if (!apellido.value.trim()) { showError('apellido'); isValid = false; } else hideError('apellido');
    if (!telefonoPattern.test(telefono.value)) { showError('telefono'); isValid = false; } else hideError('telefono');
    if (!escuela.value.trim()) { showError('escuela'); isValid = false; } else hideError('escuela');
    if (!paquete.value) { showError('paquete'); isValid = false; } else hideError('paquete');
    if (!metodoPago) { showError('metodoPago'); isValid = false; } else hideError('metodoPago');
    if (!tipoPago) { showError('tipoPago'); isValid = false; } else hideError('tipoPago');

    if (tipoPago && tipoPago.value === 'abono') {
        const cantidadAbono = document.getElementById('cantidadAbono');
        const abonoValue = parseFloat(cantidadAbono.value.replace('$', ''));
        if (!abonoValue || abonoValue <= 0) {
            showError('abono');
            isValid = false;
        } else hideError('abono');
    }

    if (isValid) {
        const formData = {
            nombre: nombre.value,
            apellido: apellido.value,
            grupo: document.getElementById('grupo').value,
            telefono: telefono.value,
            escuela: escuela.value,
            paquete: paquete.options[paquete.selectedIndex].text,
            metodoPago: metodoPago.value,
            tipoPago: tipoPago.value,
            cantidadAbono: tipoPago.value === 'abono' ? document.getElementById('cantidadAbono').value : 'N/A',
            comentario: comentario.value.trim() || "Sin comentarios"
        };

        localStorage.setItem('facturaData', JSON.stringify(formData));

        alert(`Factura generada exitosamente!\n\nCliente: ${formData.nombre} ${formData.apellido}\nEscuela: ${formData.escuela}\nPaquete: ${formData.paquete}\nMétodo: ${formData.metodoPago.toUpperCase()}`);

        window.location.href = "factura.html";
    }
});

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

document.querySelectorAll('input, select, textarea').forEach(element => {
    element.addEventListener('input', function () {
        hideError(this.id);
    });
});
