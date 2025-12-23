<?php
// ========================================
// LOGIN SIMPLE - CONEXIÓN DIRECTA
// ========================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

try {
    // CONEXIÓN DIRECTA A BD (sin config.php)
    $pdo = new PDO(
        "mysql:host=localhost;dbname=u951150559_modricestudio;charset=utf8mb4",
        "u951150559_modric",
        "|Fi|b~qQw7",
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );

    $input = json_decode(file_get_contents('php://input'), true);

    // Validación de entrada
    if (!isset($input['usuarioCorreo']) || !isset($input['contrasena'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Usuario/Correo y contraseña son requeridos'
        ]);
        exit();
    }

    $usuarioCorreo = trim($input['usuarioCorreo']);
    $contrasena = trim($input['contrasena']);

    // Buscar usuario
    $stmt = $pdo->prepare("
        SELECT ID_Usuario, NombreCompleto, Correo, Usuario, TipoUsuario, Foto, Contrasena
        FROM usuario
        WHERE Usuario = ? OR Correo = ?
    ");

    $stmt->execute([$usuarioCorreo, $usuarioCorreo]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode([
            'success' => false,
            'message' => 'Usuario/Correo o contraseña incorrectos'
        ]);
        exit();
    }

    // ========================================
    // VERIFICACIÓN DE CONTRASEÑA (TEXTO PLANO)
    // ========================================
    $contrasenaDB = trim($user['Contrasena']);

    if ($contrasenaDB === $contrasena) {
        // Login exitoso
        $_SESSION['user_id'] = $user['ID_Usuario'];
        $_SESSION['user_nombre'] = $user['NombreCompleto'];
        $_SESSION['user_tipo'] = $user['TipoUsuario'];
        $_SESSION['user_correo'] = $user['Correo'];

        echo json_encode([
            'success' => true,
            'message' => 'Login exitoso',
            'user' => [
                'ID_Usuario' => $user['ID_Usuario'],
                'NombreCompleto' => $user['NombreCompleto'],
                'Correo' => $user['Correo'],
                'Usuario' => $user['Usuario'],
                'TipoUsuario' => $user['TipoUsuario'],
                'Foto' => $user['Foto']
            ]
        ]);
        exit();
    }

    // Contraseña incorrecta
    echo json_encode([
        'success' => false,
        'message' => 'Usuario/Correo o contraseña incorrectos'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error en la autenticación',
        'debug' => $e->getMessage()
    ]);
}