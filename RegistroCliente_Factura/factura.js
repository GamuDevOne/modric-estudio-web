// Este archivo recibe datos del formulario usando localStorage
document.addEventListener("DOMContentLoaded", () => {
  const datosFactura = JSON.parse(localStorage.getItem("facturaData"));

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

    datosFactura.productos.forEach((p) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${p.descripcion}</td>
        <td>${p.base}</td>
        <td>${p.itbms}</td>
        <td>${p.total}</td>
      `;
      tabla.appendChild(fila);
      total += parseFloat(p.total);
    });

    document.getElementById("comentarioCliente").textContent =
      datosFactura.comentario && datosFactura.comentario !== ""
        ? datosFactura.comentario
        : "Sin comentarios";

    document.getElementById("totalFactura").textContent = total.toFixed(2) + " $";
  } else {
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
    clienteTelefono: document.getElementById("clienteTelefono").textContent,
    metodoPago: facturaData.metodoPago,
    paquete: facturaData.paquete,
    total: totalFactura.toFixed(2),
    comentario: facturaData.comentario || "Sin comentarios",
  };

  console.log("Generando PDF para WhatsApp:", factura);

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
        const mensaje = `¡Hola ${factura.clienteNombre}!\n\nAquí tienes tu factura digital de Modric Estudio:\n${urlCompleta}\n\nFactura: ${factura.numero}\nTotal: $${factura.total}`;
        
        // Limpiar el teléfono (quitar guiones)
        const telefonoLimpio = factura.clienteTelefono.replace(/[-\s]/g, '');
        
        const linkWhatsApp = `https://wa.me/507${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
        
        console.log("Abriendo WhatsApp:", linkWhatsApp);
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