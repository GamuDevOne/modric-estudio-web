<?php
// ========================================
// CONFIGURACIÓN GLOBAL DE LA SEGURIDAD  
// se mantendra al mismo nivel de index principall
// ========================================


// Configuración de Base de Datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'ModricEstudio00');
define('DB_USER', 'root');
define('DB_PASS', '');

// Clave secreta para JWT (CAMBIAR ESTO en producción)
define('JWT_SECRET', 'tu-clave-super-secreta-cambiar-en-produccion-' . md5(__DIR__));

// Configuración de la aplicación
define('APP_ENV', 'development'); // 'production' en servidor real
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('LOG_DIR', __DIR__ . '/php/logs/');


// Crear directorios si no existen
if (!file_exists(LOG_DIR)) {
    mkdir(LOG_DIR, 0755, true);
}

// ========================================
// FUNCIÓN: CONEXIÓN A BASE DE DATOS
// ========================================
function getDBConnection() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            logSeguridad('DB_CONNECTION_ERROR', ['error' => $e->getMessage()]);
            http_response_code(500);
            die(json_encode(['error' => 'Error de conexión a la base de datos']));
        }
    }
    
    return $pdo;
}

// ========================================
// FUNCIÓN: LOGGING DE SEGURIDAD
// ========================================
function logSeguridad($evento, $detalles = []) {
    $log = sprintf(
        "[%s] %s - IP: %s - Detalles: %s\n",
        date('Y-m-d H:i:s'),
        $evento,
        $_SERVER['REMOTE_ADDR'] ?? 'N/A',
        json_encode($detalles)
    );
    
    @file_put_contents(LOG_DIR . 'security.log', $log, FILE_APPEND);
}

// ========================================
// FUNCIÓN: SANITIZAR HTML (Anti-XSS)
// ========================================
function sanitize($data) {
    if (is_array($data)) {
        return array_map('sanitize', $data);
    }
    return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
}

// ========================================
// FUNCIÓN: VALIDAR TOKEN SIMPLE (Sin JWT aún)
// ========================================
function verificarSesion($tiposPermitidos = []) {
    session_start();
    
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Sesión no válida']);
        exit();
    }
    
    if (!empty($tiposPermitidos) && !in_array($_SESSION['user_tipo'], $tiposPermitidos)) {
        logSeguridad('ACCESO_DENEGADO', [
            'usuario' => $_SESSION['user_nombre'],
            'tipo_requerido' => $tiposPermitidos
        ]);
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Acceso denegado']);
        exit();
    }
    
    return [
        'id' => $_SESSION['user_id'],
        'nombre' => $_SESSION['user_nombre'],
        'tipo' => $_SESSION['user_tipo']
    ];
}

// ========================================
// RATE LIMITING SIMPLE
// ========================================
function verificarRateLimit($accion, $limite = 20, $tiempo = 300) {
    $ip = $_SERVER['REMOTE_ADDR'];
    $archivo = LOG_DIR . "rate_{$accion}_{$ip}.txt";
    
    if (file_exists($archivo)) {
        $intentos = (int)file_get_contents($archivo);
        
        if ($intentos >= $limite) {
            $tiempoRestante = ($tiempo - (time() - filemtime($archivo)));
            
            if ($tiempoRestante > 0) {
                http_response_code(429);
                echo json_encode([
                    'success' => false,
                    'message' => "Demasiados intentos. Espera {$tiempoRestante} segundos."
                ]);
                exit();
            } else {
                // Reset después del tiempo
                unlink($archivo);
            }
        }
    }
    
    // Incrementar contador
    $intentos = file_exists($archivo) ? (int)file_get_contents($archivo) + 1 : 1;
    file_put_contents($archivo, $intentos);
}

// ========================================
// HEADERS DE SEGURIDAD
// ========================================
function configurarHeadersSeguridad() {
    // CORS - se debe ajustar segun el dominio (de momento taremos en localhost)
    $allowedOrigins = ['http://localhost', 'http://127.0.0.1'];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, $allowedOrigins) || APP_ENV === 'development') {
        header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
    }
    
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');
    
    // Headers de seguridad
    header('X-Frame-Options: DENY');
    header('X-Content-Type-Options: nosniff');
    header('X-XSS-Protection: 1; mode=block');
    
    // Solo HTTPS en producción
    if (APP_ENV === 'production') {
        header('Strict-Transport-Security: max-age=31536000');
    }
    
    // Manejar preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Aplicar headers automáticamente
configurarHeadersSeguridad();
?>