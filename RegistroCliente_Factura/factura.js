// ========================================
// FACTURA.JS - VERSIÓN CORREGIDA
// FIX: Detección correcta de abonos y visualización
// NUEVO: Función para regresar según tipo de usuario
// ========================================

// ========================================
// FUNCIÓN: REGRESAR AL PANEL SEGÚN USUARIO
// ========================================
function regresarAPanel() {
  const facturaData = JSON.parse(localStorage.getItem("facturaData"));
  
  // Determinar si viene desde vendedor
  const desdeVendedor = facturaData && facturaData.desdeVendedor === true;
  
  console.log('🔙 Función regresarAPanel() ejecutada');
  console.log('  - desdeVendedor:', desdeVendedor);
  
  // Limpiar datos de factura
  localStorage.removeItem('facturaData');
  
  if (desdeVendedor) {
    // Regresar a vista de vendedor y recargar
    console.log('✓ Regresando a vista de vendedor...');
    window.location.href = '../administracion/vistaVendedor/vendedor.html';
  } else {
    // Verificar sesión para determinar destino
    const userSession = localStorage.getItem('userSession');
    
    if (userSession) {
      try {
        const user = JSON.parse(userSession);
        
        if (user.tipo === 'CEO') {
          console.log('✓ Regresando a panel de administración (CEO)...');
          window.location.href = '../administracion/administracion.html';
        } else if (user.tipo === 'Vendedor') {
          console.log('✓ Regresando a vista de vendedor...');
          window.location.href = '../administracion/vistaVendedor/vendedor.html';
        } else {
          // Cliente u otro tipo
          console.log('✓ Regresando al inicio...');
          window.location.href = '../index.html';
        }
      } catch (e) {
        console.error('Error al parsear sesión:', e);
        window.location.href = '../index.html';
      }
    } else {
      // Sin sesión, regresar al inicio
      console.log('⚠️ Sin sesión, regresando al inicio...');
      window.location.href = '../index.html';
    }
  }
}

// ========================================
// MODAL PERSONALIZADO
// ========================================
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

// ========================================
// CARGAR DATOS DE FACTURA
// ========================================
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

  // === Generar número de factura ===
  let numeroFactura = '';
  
  // Si viene desde guardar-venta.php, usar número de orden
  if (datosFactura && datosFactura.numeroOrden) {
    numeroFactura = datosFactura.numeroOrden;
    console.log('✓ Usando número de orden desde BD:', numeroFactura);
  } else {
    // Fallback: generar número local
    let ultimoNumero = localStorage.getItem("ultimoNumeroFactura");
    if (!ultimoNumero) {
      ultimoNumero = 1;
    } else {
      ultimoNumero = parseInt(ultimoNumero) + 1;
    }
    localStorage.setItem("ultimoNumeroFactura", ultimoNumero);
    
    const fechaHoy = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    numeroFactura = `F-${fechaHoy}-${String(ultimoNumero).padStart(3, "0")}`;
    console.log('⚠️ Generando número de factura local:', numeroFactura);
  }

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
    // FIX PRINCIPAL: DETECCIÓN Y VISUALIZACIÓN DE ABONOS
    // ==========================================
    console.log('🔍 Verificando tipo de pago...');
    console.log('  - tipoPago:', datosFactura.tipoPago);
    console.log('  - cantidadAbono:', datosFactura.cantidadAbono);
    
    // Normalizar tipoPago (puede venir como 'abono', 'Abono', o desde ventaInfo.estadoPago)
    let tipoPago = null;
    if (datosFactura.tipoPago) {
      tipoPago = datosFactura.tipoPago.toLowerCase();
    } else if (datosFactura.ventaInfo && datosFactura.ventaInfo.estadoPago) {
      tipoPago = datosFactura.ventaInfo.estadoPago.toLowerCase();
    }
    
    console.log('  - tipoPago normalizado:', tipoPago);
    
    // Detectar si es abono
    const esAbono = tipoPago === 'abono';
    
    // Obtener monto abonado
    let montoAbonado = 0;
    
    if (datosFactura.cantidadAbono && datosFactura.cantidadAbono !== 'N/A') {
      // Limpiar el valor (puede ser "$50.00", "50.00", o 50)
      const valorLimpio = datosFactura.cantidadAbono.toString().replace(/[$,\s]/g, '');
      montoAbonado = parseFloat(valorLimpio);
      console.log('  - cantidadAbono limpiado:', montoAbonado);
    } else if (datosFactura.ventaInfo && datosFactura.ventaInfo.montoAbonado) {
      // Fallback: usar montoAbonado de ventaInfo
      montoAbonado = parseFloat(datosFactura.ventaInfo.montoAbonado);
      console.log('  - montoAbonado desde ventaInfo:', montoAbonado);
    }
    
    console.log('✓ Detección completa:');
    console.log('  - esAbono:', esAbono);
    console.log('  - montoAbonado:', montoAbonado);
    console.log('  - total:', total);
    
    // Mostrar sección de abonos si aplica
    if (esAbono && montoAbonado > 0 && montoAbonado <= total) {
      const saldoPendiente = total - montoAbonado;
      
      const detallesPago = document.getElementById('detallesPago');
      if (detallesPago) {
        detallesPago.style.display = 'block';
        document.getElementById('pagoTotalPedido').textContent = '$' + total.toFixed(2);
        document.getElementById('montoAbonado').textContent = '$' + montoAbonado.toFixed(2);
        document.getElementById('saldoPendiente').textContent = '$' + saldoPendiente.toFixed(2);
        
        console.log('✅ Sección de abonos mostrada correctamente');
        console.log('  - Total del pedido: $' + total.toFixed(2));
        console.log('  - Monto abonado: $' + montoAbonado.toFixed(2));
        console.log('  - Saldo pendiente: $' + saldoPendiente.toFixed(2));
      } else {
        console.error('❌ Elemento #detallesPago no encontrado en el DOM');
      }
    } else {
      console.log('! No se muestra sección de abonos');
      if (!esAbono) {
        console.log('  → Razón: No es un abono (tipoPago=' + tipoPago + ')');
      } else if (montoAbonado <= 0) {
        console.log('  → Razón: Monto abonado es 0 o inválido');
      } else if (montoAbonado > total) {
        console.log('  → Razón: Monto abonado excede el total');
      }
    }
  } else {
    console.error('❌ No hay datos de factura en localStorage');
    document.getElementById("numeroFactura").textContent = numeroFactura;
    document.getElementById("fechaFactura").textContent = formatoFecha;
  }
});

// ========================================
// GENERAR PDF
// ========================================
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

  // Obtener información de abono
  let tipoPago = facturaData.tipoPago || 'completo';
  let montoAbonado = 0;
  
  if (facturaData.cantidadAbono && facturaData.cantidadAbono !== 'N/A') {
    const valorLimpio = facturaData.cantidadAbono.toString().replace(/[$,\s]/g, '');
    montoAbonado = parseFloat(valorLimpio);
  }

  const factura = {
    numero: document.getElementById("numeroFactura").textContent,
    fecha: document.getElementById("fechaFactura").textContent,
    clienteNombre: document.getElementById("clienteNombre").textContent,
    clienteCorreo: document.getElementById("clienteCorreo").textContent,
    metodoPago: facturaData.metodoPago,
    paquete: facturaData.paquete,
    total: totalFactura.toFixed(2),
    comentario: facturaData.comentario || "Sin comentarios",
    // NUEVO: Enviar info de abono al PDF
    tipoPago: tipoPago,
    montoAbonado: montoAbonado.toFixed(2),
    saldoPendiente: (totalFactura - montoAbonado).toFixed(2)
  };

  console.log("📄 Enviando factura al servidor:", factura);

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
        
         // Detectar la ruta base dinámicamente (funciona en localhost y Hostinger)
        const pathParts = window.location.pathname.split('/').filter(p => p !== '');
        let rutaBase = '';
        
        // Si la primera carpeta es "PaginaWebMS" (localhost), incluirla. Si no (Hostinger), usar raíz
        if (pathParts.length > 0 && pathParts[0] === 'PaginaWebMS') {
            rutaBase = '/PaginaWebMS/';
        } else {
            rutaBase = '/';
        }
        
        const urlCompleta = window.location.origin + rutaBase + data.url;
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

// ========================================
// ENVIAR POR WHATSAPP
// ========================================
function enviarPorWhatsApp() {
  const facturaData = JSON.parse(localStorage.getItem("facturaData"));
  
  console.log("📱 Preparando envío por WhatsApp:", facturaData);
  
  if (!facturaData) {
    mostrarNotificacion("No hay datos de factura disponibles", "error");
    return;
  }

  let totalFactura = 0;
  let detalleProductos = "";
  
  if (facturaData.productos && facturaData.productos.length > 0) {
    facturaData.productos.forEach((p) => {
      totalFactura += parseFloat(p.total);
      detalleProductos += `• ${p.descripcion}: $${parseFloat(p.total).toFixed(2)}\n`;
    });
  }

  // Obtener información de abono
  let tipoPago = facturaData.tipoPago || 'completo';
  let montoAbonado = 0;
  
  if (facturaData.cantidadAbono && facturaData.cantidadAbono !== 'N/A') {
    const valorLimpio = facturaData.cantidadAbono.toString().replace(/[$,\s]/g, '');
    montoAbonado = parseFloat(valorLimpio);
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
    tipoPago: tipoPago,
    montoAbonado: montoAbonado.toFixed(2),
    saldoPendiente: (totalFactura - montoAbonado).toFixed(2),
    comentario: facturaData.comentario || "Sin comentarios",
  };

  console.log("✓ Datos de factura preparados:", factura);

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
        
        if (tipoPago.toLowerCase() === 'abono' && montoAbonado > 0) {
          const saldoPendiente = totalFactura - montoAbonado;
          
          detallesPago = `\n💰 DETALLES DE PAGO (ABONO):\n• Total: $${totalFactura.toFixed(2)}\n• Abonado: $${montoAbonado.toFixed(2)}\n• Saldo Pendiente: $${saldoPendiente.toFixed(2)}`;
          
          console.log(`✓ Pago por abono - Abonado: $${montoAbonado.toFixed(2)}, Saldo: $${saldoPendiente.toFixed(2)}`);
        } else {
          detallesPago = `\n💰 DETALLES DE PAGO (PAGO COMPLETO):\n• Total a Cancelar: $${totalFactura.toFixed(2)}`;
          
          console.log(`✓ Pago completo - Total: $${totalFactura.toFixed(2)}`);
        }
        
        const mensaje = `¡Hola ${factura.clienteNombre}!\n\nAquí tienes tu factura digital de Modric Estudio:\n${urlCompleta}\n\n📋 FACTURA:\n• Número: ${factura.numero}\n• Fecha: ${factura.fecha}\n• Producto: ${factura.paquete}\n• Método de Pago: ${factura.metodoPago}${detallesPago}\n\n📝 ${factura.comentario}`;
        
        const telefonoLimpio = factura.clienteTelefono.replace(/[-\s]/g, '');
        const linkWhatsApp = `https://wa.me/507${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
        
        console.log("✓ Abriendo WhatsApp");
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