<?php
// Headers para permitir peticiones POST
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Log de inicio
error_log("=== INICIO facturas_pdf.php ===");

// Verificar que sea POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        "exito" => false,
        "mensaje" => "Solo se permiten peticiones POST"
    ]);
    exit;
}

// Configuración de la base de datos
$host = 'localhost';
$dbname = 'ModricEstudio00';
$username = 'root';
$password = '';

// Cargar autoload de Composer
require_once __DIR__ . '/vendor/autoload.php';

use Dompdf\Dompdf;
use Dompdf\Options;

// Recibir datos JSON
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
$total = htmlspecialchars($datos['total']);
$comentario = htmlspecialchars($datos['comentario'] ?? 'Sin comentarios');

error_log("Procesando factura: $numeroOrden para cliente: $nombre");

// Crear HTML con el diseño de la factura
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
                <td style='text-align: right;'>\$$total</td>
            </tr>
        </tbody>
    </table>

    <p class='total'>Total a Pagar: \$$total</p>

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
    
    // Configurar Dompdf
    $options = new Options();
    $options->set('isRemoteEnabled', true);
    $options->set('defaultFont', 'Arial');
    $options->set('isHtml5ParserEnabled', true);
    
    $dompdf = new Dompdf($options);
    $dompdf->loadHtml($html);
    $dompdf->setPaper('A4', 'portrait');
    
    error_log("Renderizando PDF...");
    $dompdf->render();

    // Crear carpeta si no existe
    $ruta = __DIR__ . "/../facturas/";
    if (!file_exists($ruta)) {
        error_log("Creando directorio: $ruta");
        mkdir($ruta, 0777, true);
    }

    // Guardar PDF
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
                RutaFacturacion,
                Fecha
            ) VALUES (
                :numeroOrden,
                :rutaFacturacion,
                NOW()
            )
        ");

        $stmt->execute([
            ':numeroOrden' => $numeroOrden,
            ':rutaFacturacion' => $rutaCompleta
        ]);
        
        error_log("Factura registrada en BD con ID: " . $pdo->lastInsertId());
        
    } catch (PDOException $e) {
        error_log("ERROR BD: " . $e->getMessage());
        // No detener el proceso, el PDF ya se generó
    }

    // Responder al frontend con la ruta relativa
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