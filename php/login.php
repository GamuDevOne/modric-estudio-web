<?php
// ========================================
// LOGIN - USA CONFIG.PHP CON AUTO-DETECCIÓN
// FIX: Corregido error SQLSTATE[HY093]
// ========================================

// Incluir configuración (detecta automáticamente local/producción)
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');

// Iniciar sesión si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

try {
    // Log del entorno
    error_log("=== LOGIN - Entorno: " . APP_ENV . " ===");
    
    // Obtener datos del POST
    $input = json_decode(file_get_contents('php://input'), true);

    // Validación de entrada
    if (!isset($input['usuarioCorreo']) || !isset($input['contrasena'])) {
        logSeguridad('LOGIN_FAILED', ['reason' => 'Missing credentials']);
        echo json_encode([
            'success' => false,
            'message' => 'Usuario/Correo y contraseña son requeridos'
        ]);
        exit();
    }

    $usuarioCorreo = trim($input['usuarioCorreo']);
    $contrasena = $input['contrasena'];

    error_log("Buscando usuario: $usuarioCorreo");

    // Obtener conexión usando config.php
    $pdo = getDBConnection();

    // ========================================
    // FIX: Buscar usuario con parámetros correctos
    // ========================================
    $stmt = $pdo->prepare("
        SELECT 
            ID_Usuario, 
            NombreCompleto, 
            Correo, 
            Usuario, 
            TipoUsuario, 
            Foto, 
            Contrasena
        FROM usuario
        WHERE LOWER(TRIM(Usuario)) = LOWER(:usuario)
           OR LOWER(TRIM(Correo)) = LOWER(:correo)
        LIMIT 1
    ");

    // Pasar ambos parámetros con el mismo valor
    $stmt->execute([
        ':usuario' => $usuarioCorreo,
        ':correo' => $usuarioCorreo
    ]);
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        logSeguridad('LOGIN_FAILED', [
            'usuarioCorreo' => $usuarioCorreo,
            'reason' => 'User not found'
        ]);
        
        error_log("Usuario no encontrado: $usuarioCorreo");
        
        echo json_encode([
            'success' => false,
            'message' => 'Usuario/Correo o contraseña incorrectos'
        ]);
        exit();
    }

    error_log("Usuario encontrado: {$user['NombreCompleto']} (ID: {$user['ID_Usuario']})");

    // ========================================
    // VERIFICACIÓN DE CONTRASEÑA
    // ========================================
    $contrasenaDB = $user['Contrasena'];
    
    if ($contrasenaDB === $contrasena) {
        // Login exitoso
        $_SESSION['user_id'] = $user['ID_Usuario'];
        $_SESSION['user_nombre'] = $user['NombreCompleto'];
        $_SESSION['user_tipo'] = $user['TipoUsuario'];
        $_SESSION['user_correo'] = $user['Correo'];

        logSeguridad('LOGIN_SUCCESS', [
            'usuario' => $user['NombreCompleto'],
            'tipo' => $user['TipoUsuario']
        ]);

        error_log("Login exitoso para: {$user['NombreCompleto']}");

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
    logSeguridad('LOGIN_FAILED', [
        'usuarioCorreo' => $usuarioCorreo,
        'reason' => 'Invalid password'
    ]);

    error_log("Contraseña incorrecta para: $usuarioCorreo");

    echo json_encode([
        'success' => false,
        'message' => 'Usuario/Correo o contraseña incorrectos'
    ]);

} catch (Exception $e) {
    logSeguridad('LOGIN_ERROR', ['error' => $e->getMessage()]);
    error_log("Error en login: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Error en la autenticación',
        'debug' => APP_ENV === 'development' ? $e->getMessage() : null
    ]);
}