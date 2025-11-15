<?php
// php/upload_fotos.php

// Configuración de la base de datos
$host = 'localhost';
$dbname = 'ModricEstudio00';
$username = 'root';
$password = '';

// Headers para permitir CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración de subida
define('UPLOAD_DIR', '../uploads/clientes/');
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
define('ALLOWED_TYPES', ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']);

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Verificar que sea una petición POST con archivos
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método no permitido');
    }
    
    if (!isset($_POST['idAlbum']) || empty($_POST['idAlbum'])) {
        throw new Exception('ID de álbum no proporcionado');
    }
    
    $idAlbum = intval($_POST['idAlbum']);
    
    // Verificar que el álbum existe y está activo
    $stmt = $pdo->prepare("
        SELECT a.ID_Album, a.ID_Cliente, a.Estado, u.ID_Usuario
        FROM AlbumCliente a
        INNER JOIN Usuario u ON a.ID_Cliente = u.ID_Usuario
        WHERE a.ID_Album = :idAlbum
    ");
    $stmt->execute([':idAlbum' => $idAlbum]);
    $album = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$album) {
        throw new Exception('Álbum no encontrado');
    }
    
    if ($album['Estado'] !== 'Activo') {
        throw new Exception('El álbum no está activo');
    }
    
    // Verificar que se enviaron archivos
    if (!isset($_FILES['fotos']) || empty($_FILES['fotos']['name'][0])) {
        throw new Exception('No se recibieron archivos');
    }
    
    // Crear directorio si no existe
    $clienteDir = UPLOAD_DIR . $album['ID_Cliente'] . '/';
    if (!is_dir($clienteDir)) {
        mkdir($clienteDir, 0755, true);
    }
    
    $albumDir = $clienteDir . 'album_' . $idAlbum . '/';
    if (!is_dir($albumDir)) {
        mkdir($albumDir, 0755, true);
    }
    
    // Procesar cada archivo
    $fotosSubidas = [];
    $errores = [];
    
    $totalArchivos = count($_FILES['fotos']['name']);
    
    for ($i = 0; $i < $totalArchivos; $i++) {
        $archivo = [
            'name' => $_FILES['fotos']['name'][$i],
            'type' => $_FILES['fotos']['type'][$i],
            'tmp_name' => $_FILES['fotos']['tmp_name'][$i],
            'error' => $_FILES['fotos']['error'][$i],
            'size' => $_FILES['fotos']['size'][$i]
        ];
        
        // Validar archivo
        $validacion = validarArchivo($archivo);
        if ($validacion !== true) {
            $errores[] = $archivo['name'] . ': ' . $validacion;
            continue;
        }
        
        // Generar nombre único
        $extension = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
        $nombreUnico = uniqid('foto_', true) . '.' . $extension;
        $rutaDestino = $albumDir . $nombreUnico;
        
        // Mover archivo
        if (move_uploaded_file($archivo['tmp_name'], $rutaDestino)) {
            // Guardar en base de datos
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO FotoAlbum (
                        ID_Album, 
                        NombreArchivo, 
                        RutaArchivo, 
                        TamanoBytes
                    ) VALUES (
                        :idAlbum,
                        :nombreArchivo,
                        :rutaArchivo,
                        :tamanoBytes
                    )
                ");
                
                $stmt->execute([
                    ':idAlbum' => $idAlbum,
                    ':nombreArchivo' => $archivo['name'],
                    ':rutaArchivo' => $rutaDestino,
                    ':tamanoBytes' => $archivo['size']
                ]);
                
                $fotosSubidas[] = [
                    'id' => $pdo->lastInsertId(),
                    'nombre' => $archivo['name'],
                    'nombreUnico' => $nombreUnico,
                    'tamano' => $archivo['size']
                ];
                
            } catch (PDOException $e) {
                // Si falla la BD, eliminar archivo
                unlink($rutaDestino);
                $errores[] = $archivo['name'] . ': Error al guardar en BD';
            }
        } else {
            $errores[] = $archivo['name'] . ': Error al mover archivo';
        }
    }
    
    // Respuesta
    $response = [
        'success' => true,
        'fotosSubidas' => count($fotosSubidas),
        'fotos' => $fotosSubidas,
        'errores' => $errores
    ];
    
    if (count($errores) > 0) {
        $response['message'] = count($fotosSubidas) . ' fotos subidas correctamente. ' . count($errores) . ' errores.';
    } else {
        $response['message'] = 'Todas las fotos se subieron correctamente';
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

// ========================================
// FUNCIÓN: VALIDAR ARCHIVO
// ========================================
function validarArchivo($archivo) {
    // Verificar errores de subida
    if ($archivo['error'] !== UPLOAD_ERR_OK) {
        return 'Error al subir archivo (código: ' . $archivo['error'] . ')';
    }
    
    // Verificar tamaño
    if ($archivo['size'] > MAX_FILE_SIZE) {
        return 'Archivo supera el tamaño máximo de 10MB';
    }
    
    if ($archivo['size'] === 0) {
        return 'Archivo vacío';
    }
    
    // Verificar tipo MIME
    if (!in_array($archivo['type'], ALLOWED_TYPES)) {
        return 'Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF, WEBP)';
    }
    
    // Verificación adicional: comprobar que realmente es una imagen
    $imageInfo = @getimagesize($archivo['tmp_name']);
    if ($imageInfo === false) {
        return 'El archivo no es una imagen válida';
    }
    
    return true;
}
?>