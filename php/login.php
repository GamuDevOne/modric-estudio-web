<?php
// ========================================
// LOGIN SIMPLE - TEXTO PLANO
// ========================================
require_once '../config.php';

header('Content-Type: application/json');

// Iniciar sesión
session_start();

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

    // Buscar usuario
    $stmt = $pdo->prepare("
        SELECT ID_Usuario, NombreCompleto, Correo, Usuario, TipoUsuario, Foto, Contrasena
        FROM Usuario
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
    $contrasenaDB = $user['Contrasena'];

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
        'message' => 'Error en la autenticación'
    ]);
}