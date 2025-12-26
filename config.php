<?php
// ========================================
// CONFIGURACIÓN GLOBAL - AUTO-DETECCIÓN
// Detecta automáticamente si está en local o producción
// ========================================

// ========================================
// DETECTAR ENTORNO
// ========================================
function detectarEntorno() {
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $esLocal = (
        strpos($host, 'localhost') !== false ||
        strpos($host, '127.0.0.1') !== false ||
        strpos($host, '::1') !== false ||
        strpos($host, '.local') !== false
    );
    
    return $esLocal ? 'local' : 'production';
}

$entorno = detectarEntorno();

// ========================================
// CONFIGURACIÓN SEGÚN ENTORNO
// ========================================
if ($entorno === 'local') {
    // ========================================
    // CONFIGURACIÓN LOCAL (XAMPP)
    // ========================================
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'u951150559_modricestudio');  // Tu BD local
    define('DB_USER', 'root');                       // Usuario XAMPP por defecto
    define('DB_PASS', '');                           // Sin contraseña en XAMPP
    define('APP_ENV', 'development');
    
    error_log("🟢 Entorno detectado: LOCAL (XAMPP)");
    
} else {
    // ========================================
    // CONFIGURACIÓN PRODUCCIÓN (HOSTINGER)
    // ========================================
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'u951150559_modricestudio');
    define('DB_USER', 'u951150559_modric');
    define('DB_PASS', '|Fi|b~qQw7');
    define('APP_ENV', 'production');
    
    error_log("🔴 Entorno detectado: PRODUCCIÓN (Hostinger)");
}

// Configuración común
define('JWT_SECRET', 'tu-clave-super-secreta-' . md5(__DIR__));
define('MAX_FILE_SIZE', 25 * 1024 * 1024); // 25MB
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('LOG_DIR', __DIR__ . '/logs/');

// Crear directorios si no existen
if (!file_exists(LOG_DIR)) {
    @mkdir(LOG_DIR, 0755, true);
}

// ========================================
// FUNCIÓN: CONEXIÓN A BASE DE DATOS
// ========================================
function getDBConnection() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = sprintf(
                "mysql:host=%s;dbname=%s;charset=utf8mb4",
                DB_HOST,
                DB_NAME
            );
            
            $pdo = new PDO(
                $dsn,
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
            
            error_log("Conexión a BD exitosa (" . APP_ENV . ")");
            
        } catch (PDOException $e) {
            logSeguridad('DB_CONNECTION_ERROR', ['error' => $e->getMessage()]);
            
            // En desarrollo, mostrar más info
            if (APP_ENV === 'development') {
                error_log("Error de conexión: " . $e->getMessage());
                error_log("   Host: " . DB_HOST);
                error_log("   DB: " . DB_NAME);
                error_log("   User: " . DB_USER);
            }
            
            http_response_code(500);
            die(json_encode([
                'success' => false,
                'message' => 'Error de conexión a la base de datos',
                'debug' => APP_ENV === 'development' ? $e->getMessage() : null
            ]));
        }
    }
    
    return $pdo;
}

// ========================================
// FUNCIÓN: LOGGING DE SEGURIDAD
// ========================================
function logSeguridad($evento, $detalles = []) {
    $logFile = LOG_DIR . 'security.log';
    $log = sprintf(
        "[%s] %s - IP: %s - Detalles: %s\n",
        date('Y-m-d H:i:s'),
        $evento,
        $_SERVER['REMOTE_ADDR'] ?? 'N/A',
        json_encode($detalles)
    );
    
    @file_put_contents($logFile, $log, FILE_APPEND);
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
// FUNCIÓN: VERIFICAR SESIÓN
// ========================================
function verificarSesion($tiposPermitidos = []) {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
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
function verificarRateLimit($accion, $limite = 50, $tiempo = 200) {
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
                unlink($archivo);
            }
        }
    }
    
    $intentos = file_exists($archivo) ? (int)file_get_contents($archivo) + 1 : 1;
    @file_put_contents($archivo, $intentos);
}

// ========================================
// HEADERS DE SEGURIDAD
// ========================================
function configurarHeadersSeguridad() {
    // CORS
    $allowedOrigins = ['http://localhost', 'http://127.0.0.1', 'https://modricestudio.com'];
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