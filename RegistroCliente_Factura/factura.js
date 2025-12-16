// Este archivo recibe datos del formulario usando localStorage
document.addEventListener("DOMContentLoaded", () => {
  const datosFactura = JSON.parse(localStorage.getItem("facturaData"));

  // === 🗓️ Generar fecha automática ===
  const fechaActual = new Date();
  const formatoFecha = fechaActual.toLocaleDateString("es-PA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // === 🔢 Generar número de factura automático ===
  let ultimoNumero = localStorage.getItem("ultimoNumeroFactura");

  if (!ultimoNumero) {
    ultimoNumero = 1;
  } else {
    ultimoNumero = parseInt(ultimoNumero) + 1;
  }

  localStorage.setItem("ultimoNumeroFactura", ultimoNumero);

  const fechaHoy = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const numeroFactura = `F-${fechaHoy}-${String(ultimoNumero).padStart(
    3,
    "0"
  )}`;

  // === 🧾 Mostrar datos ===
  if (datosFactura) {
    document.getElementById("numeroFactura").textContent =
      datosFactura.numero || numeroFactura;
    document.getElementById("fechaFactura").textContent =
      datosFactura.fecha || formatoFecha;
    document.getElementById("clienteNombre").textContent =
      datosFactura.cliente.nombre || "";
    document.getElementById("clienteDireccion").textContent =
      datosFactura.cliente.direccion || "";
    document.getElementById("clienteCorreo").textContent =
      datosFactura.cliente.correo || "";
    document.getElementById("clienteTelefono").textContent =
      datosFactura.cliente.telefono || "";

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

    // Nuevo: comentario del cliente
    document.getElementById("comentarioCliente").textContent =
      datosFactura.comentario && datosFactura.comentario !== ""
        ? datosFactura.comentario
        : "Sin comentarios";

    document.getElementById("totalFactura").textContent =
      total.toFixed(2) + " €";
  } else {
    document.getElementById("numeroFactura").textContent = numeroFactura;
    document.getElementById("fechaFactura").textContent = formatoFecha;
  }

  // === 🧩 BOTÓN PARA GENERAR PDF ===
  const btnWhatsApp = document.getElementById("btnWhatsApp");

  // === 💬 BOTÓN PARA ENVIAR POR WHATSAPP ===
  if (btnWhatsApp) {
    btnWhatsApp.addEventListener("click", () => {
      PDFWhatsApp();
    });
    function PDFWhatsApp() {
      const facturaData = JSON.parse(localStorage.getItem("facturaData"));
      let totalFactura = 0;

      facturaData.productos.forEach((p) => {
        totalFactura += parseFloat(p.total);
      });
      let factura = {
        // Obtenemos todos los datos que ya están en pantalla
        numero: document.getElementById("numeroFactura").textContent,
        fecha: document.getElementById("fechaFactura").textContent,
        clienteNombre: document.getElementById("clienteNombre").textContent,
        clienteCorreo: document.getElementById("clienteCorreo").textContent,
        clienteTelefono: document.getElementById("clienteTelefono").textContent,
        metodoPago: facturaData.metodoPago,
        paquete: facturaData.paquete,
        total: totalFactura,
        comentario: facturaData.comentario,
      };
      // Enviamos los datos al PHP por POST
      console.log(factura);
      fetch("../php/facturas_pdf.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(factura),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.exito) {
            alert("Factura PDF generada correctamente");

        let url_completo = window.location.origin + "/" + data.url;
        let mensaje = `¡Hola ${ factura.clienteNombre }! \nAquí tienes tu factura digital de Modric Estudio:\n${ url_completo }`;
        console.log(factura.numero);
            const link = `https://wa.me/507${factura.clienteTelefono}?text=${encodeURIComponent(
              mensaje
            )}`;
            window.open(link, "_blank");
          } else {
            alert("Error al generar el PDF");
          }
        })
        .catch((error) => console.error("Error:", error));
    }
  }
});
