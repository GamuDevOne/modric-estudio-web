<?php
// ========================================
// LOGIN CON DEBUG MEJORADO
// ========================================
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../config.php';

header('Content-Type: application/json');

// Iniciar sesión ANTES de usarla
session_start();

// Rate limiting
verificarRateLimit('login', 5, 300);

try {
    $pdo = getDBConnection();
    
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
    
    // Log para debug (REMOVER EN PRODUCCIÓN)
    error_log("Intento de login: " . $usuarioCorreo);
    
    // Buscar usuario
    $stmt = $pdo->prepare("
        SELECT ID_Usuario, NombreCompleto, Correo, Usuario, TipoUsuario, Foto, Contrasena 
        FROM Usuario 
        WHERE Usuario = ? OR Correo = ?
    ");
    
    $stmt->execute([$usuarioCorreo, $usuarioCorreo]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Log para debug
    error_log("Usuario encontrado: " . ($user ? "SI" : "NO"));
    
    if (!$user) {
        logSeguridad('LOGIN_FALLIDO', ['intento_usuario' => $usuarioCorreo, 'razon' => 'Usuario no existe']);
        
        echo json_encode([
            'success' => false,
            'message' => 'Usuario/Correo o contraseña incorrectos'
        ]);
        exit();
    }
    
    // ========================================
    // VERIFICACIÓN DE CONTRASEÑA
    // ========================================
    $contrasenaDB = $user['Contrasena'];
    $loginExitoso = false;
    
    // Detectar si es hash o texto plano
    if (password_get_info($contrasenaDB)['algo'] === null) {
        // TEXTO PLANO (legacy)
        error_log("Contraseña en texto plano detectada");
        
        if ($contrasenaDB === $contrasena) {
            $loginExitoso = true;
            
            // Actualizar a hash
            $hashedPassword = password_hash($contrasena, PASSWORD_BCRYPT);
            $updateStmt = $pdo->prepare("UPDATE Usuario SET Contrasena = ? WHERE ID_Usuario = ?");
            $updateStmt->execute([$hashedPassword, $user['ID_Usuario']]);
            
            error_log("Contraseña actualizada a hash");
        }
    } else {
        // HASH BCRYPT
        error_log("Verificando contraseña hasheada");
        $loginExitoso = password_verify($contrasena, $contrasenaDB);
        error_log("Resultado verificación: " . ($loginExitoso ? "OK" : "FAIL"));
    }
    
    if ($loginExitoso) {
        // Iniciar sesión
        $_SESSION['user_id'] = $user['ID_Usuario'];
        $_SESSION['user_nombre'] = $user['NombreCompleto'];
        $_SESSION['user_tipo'] = $user['TipoUsuario'];
        $_SESSION['user_correo'] = $user['Correo'];
        
        logSeguridad('LOGIN_EXITOSO', [
            'usuario' => $user['Usuario'] ?: $user['Correo'],
            'tipo' => $user['TipoUsuario']
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Login exitoso',
            'user' => [
                'ID_Usuario' => $user['ID_Usuario'],
                'NombreCompleto' => sanitize($user['NombreCompleto']),
                'Correo' => sanitize($user['Correo']),
                'Usuario' => sanitize($user['Usuario']),
                'TipoUsuario' => $user['TipoUsuario'],
                'Foto' => $user['Foto']
            ]
        ]);
        exit();
    }
    
    // Credenciales incorrectas
    logSeguridad('LOGIN_FALLIDO', [
        'intento_usuario' => $usuarioCorreo,
        'razon' => 'Contraseña incorrecta'
    ]);
    
    echo json_encode([
        'success' => false,
        'message' => 'Usuario/Correo o contraseña incorrectos'
    ]);
    
} catch (PDOException $e) {
    error_log("ERROR PDO: " . $e->getMessage());
    logSeguridad('LOGIN_ERROR', ['error' => $e->getMessage()]);
    
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("ERROR GENERAL: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Error general: ' . $e->getMessage()
    ]);
}
?>