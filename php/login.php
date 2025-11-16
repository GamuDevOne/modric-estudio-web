<?php
// Configuración de la base de datos
$host = 'localhost';
$dbname = 'ModricEstudio00';
$username = 'root';
$password = '';

// Headers para permitir CORS y JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Conectar a la base de datos
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Obtener datos del POST
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['usuarioCorreo']) || !isset($input['contrasena'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Usuario/Correo y contraseña son requeridos'
        ]);
        exit();
    }
    
    $usuarioCorreo = trim($input['usuarioCorreo']);
    $contrasena = trim($input['contrasena']);
    
    // Buscar usuario por USUARIO o CORREO
    $stmt = $pdo->prepare("
        SELECT ID_Usuario, NombreCompleto, Correo, Usuario, TipoUsuario, Foto 
        FROM Usuario 
        WHERE (Usuario = :usuarioCorreo OR Correo = :usuarioCorreo) 
        AND Contrasena = :contrasena
    ");
    
    $stmt->execute([
        ':usuarioCorreo' => $usuarioCorreo,
        ':contrasena' => $contrasena
    ]);
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        // Login exitoso
        echo json_encode([
            'success' => true,
            'message' => 'Login exitoso',
            'user' => $user
        ]);
    } else {
        // Credenciales incorrectas
        echo json_encode([
            'success' => false,
            'message' => 'Usuario/Correo o contraseña incorrectos'
        ]);
    }
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión: ' . $e->getMessage()
    ]);
}
?>