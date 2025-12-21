<?php
// php/contacto.php - MODO DESARROLLO

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/contacto_errors.log');

ob_start();

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

ob_end_clean();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido. Solo POST.'
    ]);
    exit();
}

try {
    // CONFIGURACIÓN
    $destinatario = 'nayassef0326@gmail.com';
    
    //MODO DESARROLLO: Cambiar a false en producción
    $MODO_DESARROLLO = false; // ← CAMBIAR A false cuando se sube a producción
    
    $rawInput = file_get_contents('php://input');
    error_log("Input recibido: " . $rawInput);
    
    $input = json_decode($rawInput, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('JSON inválido: ' . json_last_error_msg());
    }
    
    // Validar campos
    if (empty($input['nombre']) || empty($input['email']) || empty($input['mensaje'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Por favor completa todos los campos obligatorios (Nombre, Email, Mensaje)'
        ]);
        exit();
    }
    
    // Sanitizar
    $nombre = htmlspecialchars(trim($input['nombre']), ENT_QUOTES, 'UTF-8');
    $email = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
    $telefono = isset($input['telefono']) ? htmlspecialchars(trim($input['telefono']), ENT_QUOTES, 'UTF-8') : 'No proporcionado';
    $mensaje = htmlspecialchars(trim($input['mensaje']), ENT_QUOTES, 'UTF-8');
    
    if (!$email) {
        echo json_encode([
            'success' => false,
            'message' => 'El email proporcionado no es válido'
        ]);
        exit();
    }
    
    error_log("Datos procesados - Nombre: $nombre, Email: $email");
    
    // Construir email HTML
    $asunto = "Nuevo mensaje de contacto - Modric Estudio";
    
    $cuerpo = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #333; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
            .field { margin-bottom: 15px; }
            .field strong { display: inline-block; min-width: 100px; color: #555; }
            .mensaje { background-color: white; padding: 15px; border-left: 4px solid #333; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>Nuevo Mensaje de Contacto</h2>
            </div>
            <div class='content'>
                <div class='field'>
                    <strong>Nombre:</strong> $nombre
                </div>
                <div class='field'>
                    <strong>Email:</strong> $email
                </div>
                <div class='field'>
                    <strong>Teléfono:</strong> $telefono
                </div>
                <div class='field'>
                    <strong>Mensaje:</strong>
                    <div class='mensaje'>$mensaje</div>
                </div>
            </div>
            <div class='footer'>
                <p>Enviado desde el formulario de contacto - Modric Estudio</p>
                <p>Fecha: " . date('d/m/Y H:i:s') . "</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: $nombre <$email>\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // MODO DESARROLLO: Guardar en archivo en lugar de enviar
    if ($MODO_DESARROLLO) {
        // Guardar email en archivo de texto para revisar
        $emailLog = __DIR__ . '/emails_guardados.html';
        $contenido = "
        <hr>
        <h3>Email capturado en desarrollo - " . date('Y-m-d H:i:s') . "</h3>
        <p><strong>Para:</strong> $destinatario</p>
        <p><strong>Asunto:</strong> $asunto</p>
        $cuerpo
        <hr>
        ";
        file_put_contents($emailLog, $contenido, FILE_APPEND);
        
        error_log("MODO DESARROLLO: Email guardado en emails_guardados.html");
        
        echo json_encode([
            'success' => true,
            'message' => '¡Mensaje enviado correctamente! Nos pondremos en contacto contigo pronto.',
            'dev_note' => 'Modo desarrollo activo. Email guardado en: php/emails_guardados.html'
        ]);
    } else {
        //MODO PRODUCCIÓN: Enviar email real
        error_log("Intentando enviar email a: $destinatario");
        $enviado = @mail($destinatario, $asunto, $cuerpo, $headers);
        
        if ($enviado) {
            error_log("Email enviado exitosamente");
            echo json_encode([
                'success' => true,
                'message' => '¡Mensaje enviado correctamente! Nos pondremos en contacto contigo pronto.'
            ]);
        } else {
            error_log("Error al enviar email con mail()");
            echo json_encode([
                'success' => false,
                'message' => 'Error al enviar el mensaje. Por favor, intenta más tarde o contáctanos directamente por teléfono: +507 6976-4758'
            ]);
        }
    }
    
} catch (Exception $e) {
    error_log("Excepción capturada: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Error al procesar el mensaje. Por favor, intenta nuevamente.'
    ]);
}
?>