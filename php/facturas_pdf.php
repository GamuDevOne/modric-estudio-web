<?php
// Headers para permitir peticiones POST
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
// Configuración de la base de datos
$host = 'localhost';
$dbname = 'ModricEstudio00';
$username = 'root';
$password = '';

// Verificar que sea POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        "exito" => false,
        "mensaje" => "Solo se permiten peticiones POST"
    ]);
    exit;
}
require_once __DIR__ . '/vendor/autoload.php';

use Dompdf\Dompdf;
use Dompdf\Options;
// Recibir datos del formulario (JSON)
$datos = json_decode(file_get_contents("php://input"), true);

if (!$datos) {
    echo json_encode(["exito" => false, "mensaje" => "No se recibieron datos"]);
    exit;
}

// Extraer datos
$numeroOrden = htmlspecialchars($datos['numero']);
$fecha = htmlspecialchars($datos['fecha']);
$nombre = htmlspecialchars($datos['clienteNombre']);
$correo = htmlspecialchars($datos['clienteCorreo']);
$metodo = htmlspecialchars($datos['metodoPago']);
$paquete = htmlspecialchars($datos['paquete']);
$total = htmlspecialchars($datos['total']);
$comentario = htmlspecialchars($datos['comentario']);

// Creacion HTML con el mismo diseño que factura.html
$html = "
<!DOCTYPE html>
<html lang='es'>
<head>
<meta charset='UTF-8'>
<style>
    body { font-family: Arial, sans-serif; margin: 30px; color: #333; }
    .factura-container { border: 2px solid #444; padding: 20px; border-radius: 10px; }
    h1 { text-align: center; color: #004aad; }
    .info { margin-bottom: 20px; }
    .info p { margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #999; padding: 8px; text-align: left; }
    th { background-color: #f4f4f4; }
    .total { text-align: right; font-weight: bold; color: #004aad; }
    .comentario { margin-top: 20px; font-style: italic; color: #666; }
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
        <tr>
            <th>Concepto</th>
            <th>Total</th>
        </tr>
        <tr>
            <td>$paquete</td>
            <td>$total</td>
        </tr>
    </table>

    <p class='total'>Total a Pagar: $total</p>

    <div class='comentario'>
        <p><strong>Comentario del Cliente:</strong> $comentario</p>
    </div>
</div>
</body>
</html>
";

// Configurar Dompdf
$options = new Options();
$options->set('isRemoteEnabled', true);
$dompdf = new Dompdf($options);
$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();

// Crear carpeta si no existe
$ruta = "../facturas/";
if (!file_exists($ruta)) {
    mkdir($ruta, 0777, true);
}

// Guardar PDF
$nombreArchivo = "Factura_" . $numeroOrden . ".pdf";
$rutaCompleta = $ruta . $nombreArchivo;
file_put_contents($rutaCompleta, $dompdf->output());

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Insertar cotización
    $stmt = $pdo->prepare("
            INSERT INTO factura (
                NumeroOrden,
                RutaFacturacion
            ) VALUES (
                :numeroOrden,
                :rutaFacturacion
            )
        ");

    $stmt->execute([
        ':numeroOrden' => $numeroOrden,
        ':rutaFacturacion' => $rutaCompleta
    ]);
} catch (PDOException $e) {
    echo json_encode(["exito" => false, "mensaje" => "Error de conexión a la base de datos: " . $e->getMessage()]);
    exit;
}
// Responder al frontend
echo json_encode([
    "exito" => true,
    "url" => $rutaCompleta
]);
