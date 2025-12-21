// Este archivo recibe datos del formulario usando localStorage
document.addEventListener("DOMContentLoaded", () => {
  const datosFactura = JSON.parse(localStorage.getItem("facturaData"));

  console.log('✓ Datos de factura cargados:', datosFactura);

  // === Generar fecha automática ===
  const fechaActual = new Date();
  const formatoFecha = fechaActual.toLocaleDateString("es-PA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // === Generar número de factura automático ===
  let ultimoNumero = localStorage.getItem("ultimoNumeroFactura");

  if (!ultimoNumero) {
    ultimoNumero = 1;
  } else {
    ultimoNumero = parseInt(ultimoNumero) + 1;
  }

  localStorage.setItem("ultimoNumeroFactura", ultimoNumero);

  const fechaHoy = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const numeroFactura = `F-${fechaHoy}-${String(ultimoNumero).padStart(3, "0")}`;

  // === Mostrar datos ===
  if (datosFactura) {
    document.getElementById("numeroFactura").textContent = numeroFactura;
    document.getElementById("fechaFactura").textContent = formatoFecha;
    document.getElementById("clienteNombre").textContent = datosFactura.cliente.nombre || "";
    document.getElementById("clienteDireccion").textContent = datosFactura.cliente.direccion || "";
    document.getElementById("clienteCorreo").textContent = datosFactura.cliente.correo || "";
    document.getElementById("clienteTelefono").textContent = datosFactura.cliente.telefono || "";

    const tabla = document.getElementById("tablaProductos");
    let total = 0;

    if (datosFactura.productos && datosFactura.productos.length > 0) {
      datosFactura.productos.forEach((p) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td>${p.descripcion}</td>
          <td>$${parseFloat(p.base).toFixed(2)}</td>
          <td>$${parseFloat(p.itbms).toFixed(2)}</td>
          <td>$${parseFloat(p.total).toFixed(2)}</td>
        `;
        tabla.appendChild(fila);
        total += parseFloat(p.total);
      });
      
      console.log('✓ Productos agregados a la tabla, total:', total);
    } else {
      console.warn('⚠️ No hay productos en los datos de factura');
    }

    document.getElementById("comentarioCliente").textContent =
      datosFactura.comentario && datosFactura.comentario !== ""
        ? datosFactura.comentario
        : "Sin comentarios";

    document.getElementById("totalFactura").textContent = total.toFixed(2) + " $";
    
    // ==========================================
    // MOSTRAR DETALLES DE PAGO SI ES ABONO
    // ==========================================
    console.log('Verificando tipoPago:', datosFactura.tipoPago, 'cantidadAbono:', datosFactura.cantidadAbono);
    
    // Detectar y mostrar detalles de pago si es abono
    const esAbono = datosFactura.tipoPago && datosFactura.tipoPago.toLowerCase() === 'abono';
    const tieneAbono = datosFactura.cantidadAbono && datosFactura.cantidadAbono !== 'N/A';
    
    console.log('Verificando abono - tipoPago:', datosFactura.tipoPago, '| cantidadAbono:', datosFactura.cantidadAbono);
    
    if (esAbono && tieneAbono) {
      // Extraer el valor numérico del monto abonado (puede ser "$5.00" o "5.00" o "5")
      let montoAbonado = parseFloat(datosFactura.cantidadAbono.toString().replace(/[$,]/g, ''));
      
      // Validar que el monto sea válido y menor o igual al total
      if (!isNaN(montoAbonado) && montoAbonado > 0 && montoAbonado <= total) {
        const saldoPendiente = total - montoAbonado;
        
        // Mostrar sección de detalles de pago
        const detallesPago = document.getElementById('detallesPago');
        if (detallesPago) {
          detallesPago.style.display = 'block';
          document.getElementById('montoAbonado').textContent = '$' + montoAbonado.toFixed(2);
          document.getElementById('saldoPendiente').textContent = '$' + saldoPendiente.toFixed(2);
          
          console.log('✓ Abono detectado correctamente - Monto: $' + montoAbonado.toFixed(2) + ', Saldo: $' + saldoPendiente.toFixed(2));
        } else {
          console.warn('⚠️ Elemento detallesPago no encontrado en el DOM');
        }
      } else {
        console.warn('⚠️ Monto abonado inválido:', montoAbonado, '(total:', total, ')');
      }
    } else {
      console.log('⚠️ No se detectó abono - esAbono:', esAbono, '| tieneAbono:', tieneAbono);
    }
  } else {
    console.error('❌ No hay datos de factura en localStorage');
    document.getElementById("numeroFactura").textContent = numeroFactura;
    document.getElementById("fechaFactura").textContent = formatoFecha;
  }
});

// === MODAL PERSONALIZADO SIMPLE ===
function mostrarNotificacion(mensaje, tipo = 'success') {
  let modal = document.getElementById('notificacionFactura');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'notificacionFactura';
    modal.className = 'notificacion-factura';
    document.body.appendChild(modal);
  }
  
  modal.className = 'notificacion-factura ' + tipo;
  modal.textContent = mensaje;
  modal.style.display = 'block';
  
  setTimeout(() => {
    modal.style.display = 'none';
  }, 3000);
}

// === GENERAR PDF ===
function generarPDF() {
  const facturaData = JSON.parse(localStorage.getItem("facturaData"));
  
  if (!facturaData) {
    mostrarNotificacion("No hay datos de factura disponibles", "error");
    return;
  }

  let totalFactura = 0;
  facturaData.productos.forEach((p) => {
    totalFactura += parseFloat(p.total);
  });

  const factura = {
    numero: document.getElementById("numeroFactura").textContent,
    fecha: document.getElementById("fechaFactura").textContent,
    clienteNombre: document.getElementById("clienteNombre").textContent,
    clienteCorreo: document.getElementById("clienteCorreo").textContent,
    metodoPago: facturaData.metodoPago,
    paquete: facturaData.paquete,
    total: totalFactura.toFixed(2),
    comentario: facturaData.comentario || "Sin comentarios",
  };

  console.log("Enviando factura:", factura);

  fetch("../php/facturas_pdf.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(factura),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Respuesta del servidor:", data);
      
      if (data.exito) {
        mostrarNotificacion("✓ Factura PDF descargada correctamente", "success");
        
        // Descargar el PDF
        const urlCompleta = window.location.origin + "/PaginaWebMS/" + data.url;
        const link = document.createElement("a");
        link.href = urlCompleta;
        link.download = `Factura_${factura.numero}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        mostrarNotificacion("✗ Error al generar el PDF: " + (data.mensaje || "Error desconocido"), "error");
      }
    })
    .catch((error) => {
      console.error("Error completo:", error);
      mostrarNotificacion("✗ Error de conexión al generar PDF", "error");
    });
}

// === ENVIAR POR WHATSAPP ===
function enviarPorWhatsApp() {
  const facturaData = JSON.parse(localStorage.getItem("facturaData"));
  
  console.log("📱 Preparando envío por WhatsApp:", facturaData);
  
  if (!facturaData) {
    mostrarNotificacion("No hay datos de factura disponibles", "error");
    return;
  }

  // Calcular el total desde los productos
  let totalFactura = 0;
  let detalleProductos = "";
  
  if (facturaData.productos && facturaData.productos.length > 0) {
    facturaData.productos.forEach((p) => {
      totalFactura += parseFloat(p.total);
      detalleProductos += `• ${p.descripcion}: $${parseFloat(p.total).toFixed(2)}\n`;
    });
  } else {
    console.warn('⚠️ No hay productos en facturaData');
  }

  const factura = {
    numero: document.getElementById("numeroFactura").textContent,
    fecha: document.getElementById("fechaFactura").textContent,
    clienteNombre: document.getElementById("clienteNombre").textContent,
    clienteCorreo: document.getElementById("clienteCorreo").textContent,
    clienteTelefono: document.getElementById("clienteTelefono").textContent,
    metodoPago: facturaData.metodoPago,
    paquete: facturaData.paquete,
    total: totalFactura.toFixed(2),
    tipoPago: facturaData.tipoPago,
    montoAbonado: facturaData.cantidadAbono,
    comentario: facturaData.comentario || "Sin comentarios",
  };

  console.log("✓ Datos de factura calculados:", factura);

  fetch("../php/facturas_pdf.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(factura),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Respuesta del servidor:", data);
      
      if (data.exito) {
        mostrarNotificacion("✓ Factura enviada por WhatsApp correctamente", "success");

        const urlCompleta = window.location.origin + "/PaginaWebMS/" + data.url;
        
        // ==========================================
        // CONSTRUIR MENSAJE SEGÚN TIPO DE PAGO
        // ==========================================
        let detallesPago = "";
        
        if (factura.tipoPago && factura.tipoPago.toLowerCase() === 'abono') {
          // Extraer el monto abonado (quitar el símbolo $)
          const montoAbonado = factura.montoAbonado === 'N/A' ? 0 : parseFloat(factura.montoAbonado.replace('$', ''));
          const saldoPendiente = parseFloat(factura.total) - montoAbonado;
          
          detallesPago = `\n💰 DETALLES DE PAGO (ABONO):\n• Total: $${factura.total}\n• Abonado: $${montoAbonado.toFixed(2)}\n• Saldo Pendiente: $${saldoPendiente.toFixed(2)}`;
          
          console.log(`✓ Pago por abono - Abonado: $${montoAbonado.toFixed(2)}, Saldo: $${saldoPendiente.toFixed(2)}`);
        } else {
          detallesPago = `\n💰 DETALLES DE PAGO (PAGO COMPLETO):\n• Total a Cancelar: $${factura.total}`;
          
          console.log(`✓ Pago completo - Total: $${factura.total}`);
        }
        
        // Construir mensaje completo
        const mensaje = `¡Hola ${factura.clienteNombre}!\n\nAquí tienes tu factura digital de Modric Estudio:\n${urlCompleta}\n\n📋 FACTURA:\n• Número: ${factura.numero}\n• Fecha: ${factura.fecha}\n• Producto: ${factura.paquete}\n• Método de Pago: ${factura.metodoPago}${detallesPago}\n\n📝 ${factura.comentario}`;
        
        // Limpiar el teléfono (quitar guiones)
        const telefonoLimpio = factura.clienteTelefono.replace(/[-\s]/g, '');
        
        const linkWhatsApp = `https://wa.me/507${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
        
        console.log("✓ Abriendo WhatsApp con información completa");
        window.open(linkWhatsApp, "_blank");
      } else {
        mostrarNotificacion("✗ Error al generar el PDF: " + (data.mensaje || "Error desconocido"), "error");
      }
    })
    .catch((error) => {
      console.error("Error completo:", error);
      mostrarNotificacion("✗ Error de conexión al generar PDF", "error");
    });
}