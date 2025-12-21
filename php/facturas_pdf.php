<?php
// ========================================
// FACTURAS_PDF.PHP - VERSIÓN CORREGIDA
// FIX: Incluye detalles de abonos en el PDF
// ========================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

error_log("=== INICIO facturas_pdf.php ===");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        "exito" => false,
        "mensaje" => "Solo se permiten peticiones POST"
    ]);
    exit;
}

$host = 'localhost';
$dbname = 'ModricEstudio00';
$username = 'root';
$password = '';

require_once __DIR__ . '/vendor/autoload.php';

use Dompdf\Dompdf;
use Dompdf\Options;

$inputRaw = file_get_contents("php://input");
error_log("Datos recibidos RAW: " . $inputRaw);

$datos = json_decode($inputRaw, true);

if (!$datos) {
    error_log("ERROR: No se pudieron decodificar los datos JSON");
    echo json_encode([
        "exito" => false, 
        "mensaje" => "No se recibieron datos válidos"
    ]);
    exit;
}

error_log("Datos decodificados: " . print_r($datos, true));

// Validar campos requeridos
$camposRequeridos = ['numero', 'fecha', 'clienteNombre', 'paquete', 'total'];
foreach ($camposRequeridos as $campo) {
    if (!isset($datos[$campo]) || empty($datos[$campo])) {
        error_log("ERROR: Falta el campo requerido: $campo");
        echo json_encode([
            "exito" => false,
            "mensaje" => "Falta el campo requerido: $campo"
        ]);
        exit;
    }
}

// Extraer y sanitizar datos
$numeroOrden = htmlspecialchars($datos['numero']);
$fecha = htmlspecialchars($datos['fecha']);
$nombre = htmlspecialchars($datos['clienteNombre']);
$correo = htmlspecialchars($datos['clienteCorreo'] ?? 'No proporcionado');
$metodo = htmlspecialchars($datos['metodoPago'] ?? 'No especificado');
$paquete = htmlspecialchars($datos['paquete']);
$total = floatval($datos['total']);
$comentario = htmlspecialchars($datos['comentario'] ?? 'Sin comentarios');

// ==========================================
// NUEVO: Procesar información de abono
// ==========================================
$tipoPago = isset($datos['tipoPago']) ? strtolower($datos['tipoPago']) : 'completo';
$montoAbonado = isset($datos['montoAbonado']) ? floatval($datos['montoAbonado']) : 0;
$saldoPendiente = isset($datos['saldoPendiente']) ? floatval($datos['saldoPendiente']) : 0;

// Si no viene saldoPendiente pero sí montoAbonado, calcularlo
if ($saldoPendiente == 0 && $montoAbonado > 0) {
    $saldoPendiente = $total - $montoAbonado;
}

$esAbono = ($tipoPago === 'abono' && $montoAbonado > 0);

error_log("Tipo de pago: $tipoPago");
error_log("Es abono: " . ($esAbono ? 'SI' : 'NO'));
error_log("Monto abonado: $montoAbonado");
error_log("Saldo pendiente: $saldoPendiente");

// ==========================================
// GENERAR SECCIÓN DE DETALLES DE PAGO
// ==========================================
$seccionAbono = '';

if ($esAbono) {
    $seccionAbono = "
    <div style='margin-top: 20px; padding: 15px; background-color: #fff3e0; border-left: 4px solid #ff9800; border-radius: 5px;'>
        <h3 style='color: #e65100; margin: 0 0 10px 0; font-size: 16px;'>💰 Detalles de Pago (Abono)</h3>
        <table style='width: 100%; border-collapse: collapse;'>
            <tr>
                <td style='padding: 5px 0; font-weight: bold;'>Total del Pedido:</td>
                <td style='padding: 5px 0; text-align: right;'>\$" . number_format($total, 2) . "</td>
            </tr>
            <tr>
                <td style='padding: 5px 0; font-weight: bold; color: #4caf50;'>Monto Abonado:</td>
                <td style='padding: 5px 0; text-align: right; color: #4caf50;'>\$" . number_format($montoAbonado, 2) . "</td>
            </tr>
            <tr style='border-top: 2px solid #e65100;'>
                <td style='padding: 10px 0 5px 0; font-weight: bold; color: #e65100; font-size: 16px;'>Saldo Pendiente:</td>
                <td style='padding: 10px 0 5px 0; text-align: right; color: #e65100; font-weight: bold; font-size: 16px;'>\$" . number_format($saldoPendiente, 2) . "</td>
            </tr>
        </table>
        <p style='margin: 10px 0 0 0; font-size: 12px; color: #666;'>
            ⚠️ <strong>Nota:</strong> Este pedido tiene un saldo pendiente de pago. Por favor, comuníquese con nosotros para coordinar el pago del saldo restante.
        </p>
    </div>
    ";
} else {
    $seccionAbono = "
    <div style='margin-top: 20px; padding: 15px; background-color: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 5px;'>
        <h3 style='color: #2e7d32; margin: 0 0 10px 0; font-size: 16px;'>✅ Pago Completo</h3>
        <p style='margin: 0; font-size: 14px; color: #1b5e20;'>
            El monto total de <strong>\$" . number_format($total, 2) . "</strong> ha sido pagado en su totalidad.
        </p>
    </div>
    ";
}

error_log("Procesando factura: $numeroOrden para cliente: $nombre");

// ==========================================
// CREAR HTML CON DETALLES DE ABONO
// ==========================================
$html = "
<!DOCTYPE html>
<html lang='es'>
<head>
<meta charset='UTF-8'>
<style>
    body { 
        font-family: Arial, sans-serif; 
        margin: 30px; 
        color: #333; 
    }
    .factura-container { 
        border: 2px solid #444; 
        padding: 20px; 
        border-radius: 10px; 
    }
    h1 { 
        text-align: center; 
        color: #004aad; 
        margin-bottom: 20px;
    }
    .info { 
        margin-bottom: 20px; 
    }
    .info p { 
        margin: 5px 0; 
        line-height: 1.6;
    }
    table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-top: 20px; 
        margin-bottom: 20px;
    }
    th, td { 
        border: 1px solid #999; 
        padding: 12px; 
        text-align: left; 
    }
    th { 
        background-color: #f4f4f4; 
        font-weight: bold;
    }
    .total { 
        text-align: right; 
        font-weight: bold; 
        color: #004aad; 
        font-size: 18px;
        margin-top: 20px;
    }
    .comentario { 
        margin-top: 20px; 
        padding: 15px;
        background-color: #f9f9f9;
        border-left: 4px solid #004aad;
        font-style: italic; 
        color: #666; 
    }
    .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #ccc;
        text-align: center;
        font-size: 12px;
        color: #666;
    }
</style>
</head>
<body>
<div class='factura-container'>
    <h1>Factura No. $numeroOrden</h1>
    <div class='info'>
        <p><strong>Fecha:</strong> $fecha</p>
        <p><strong>Cliente:</strong> $nombre</p>
        <p><strong>Correo:</strong> $correo</p>
        <p><strong>Método de Pago:</strong> $metodo</p>
        <p><strong>Paquete:</strong> $paquete</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Concepto</th>
                <th style='text-align: right;'>Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>$paquete</td>
                <td style='text-align: right;'>\$" . number_format($total, 2) . "</td>
            </tr>
        </tbody>
    </table>

    <p class='total'>Total: \$" . number_format($total, 2) . "</p>

    $seccionAbono

    <div class='comentario'>
        <p><strong>Comentarios:</strong></p>
        <p>$comentario</p>
    </div>
    
    <div class='footer'>
        <p>Modric Estudio - Fotografía Profesional</p>
        <p>Panamá, La Chorrera | Tel: +507 6976-4758</p>
        <p>modricestudio@gmail.com</p>
    </div>
</div>
</body>
</html>
";

try {
    error_log("Configurando Dompdf...");
    
    $options = new Options();
    $options->set('isRemoteEnabled', true);
    $options->set('defaultFont', 'Arial');
    $options->set('isHtml5ParserEnabled', true);
    
    $dompdf = new Dompdf($options);
    $dompdf->loadHtml($html);
    $dompdf->setPaper('A4', 'portrait');
    
    error_log("Renderizando PDF...");
    $dompdf->render();

    $ruta = __DIR__ . "/../facturas/";
    if (!file_exists($ruta)) {
        error_log("Creando directorio: $ruta");
        mkdir($ruta, 0777, true);
    }

    $nombreArchivo = "Factura_" . preg_replace('/[^a-zA-Z0-9_-]/', '_', $numeroOrden) . ".pdf";
    $rutaCompleta = $ruta . $nombreArchivo;
    
    error_log("Guardando PDF en: $rutaCompleta");
    file_put_contents($rutaCompleta, $dompdf->output());
    
    if (!file_exists($rutaCompleta)) {
        throw new Exception("El archivo PDF no se guardó correctamente");
    }
    
    error_log("PDF guardado exitosamente");

    // Guardar en base de datos
    try {
        error_log("Conectando a base de datos...");
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $pdo->prepare("
            INSERT INTO factura (
                NumeroOrden,
                Fecha,
                MedioEnvio,
                ID_Pedido
            ) VALUES (
                :numeroOrden,
                NOW(),
                'PDF',
                (SELECT ID_Pedido FROM Pedido WHERE ID_Pedido = :idPedido LIMIT 1)
            )
        ");

        // Extraer ID_Pedido del número de orden si existe
        $idPedido = 1; // Valor por defecto
        if (strpos($numeroOrden, 'ORD-') === 0) {
            $idPedido = intval(str_replace('ORD-', '', $numeroOrden));
        }

        $stmt->execute([
            ':numeroOrden' => $numeroOrden,
            ':idPedido' => $idPedido
        ]);
        
        error_log("Factura registrada en BD con ID: " . $pdo->lastInsertId());
        
    } catch (PDOException $e) {
        error_log("ERROR BD: " . $e->getMessage());
    }

    $rutaRelativa = "facturas/" . $nombreArchivo;
    
    error_log("Respondiendo con éxito. URL: $rutaRelativa");
    
    echo json_encode([
        "exito" => true,
        "url" => $rutaRelativa,
        "mensaje" => "Factura generada correctamente"
    ]);
    
} catch (Exception $e) {
    error_log("ERROR CRÍTICO: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    echo json_encode([
        "exito" => false,
        "mensaje" => "Error al generar PDF: " . $e->getMessage()
    ]);
}

error_log("=== FIN facturas_pdf.php ===");
?>