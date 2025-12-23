<?php
// php/documentos.php

// Configuración de la base de datos
$host = 'localhost';
$dbname = 'u951150559_modricestudio';
$username = 'u951150559_modric';
$password = '|Fi|b~qQw7';

// Headers para permitir CORS y JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Determinar acción
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        switch ($action) {
            case 'crear_album':
                crearAlbum($pdo, $input);
                break;
            
            case 'obtener_albums':
                obtenerAlbums($pdo);
                break;
            
            case 'obtener_albums_cliente':
                obtenerAlbumsCliente($pdo, $input);
                break;
            
            case 'cerrar_album':
                cerrarAlbum($pdo, $input);
                break;
            
            case 'editar_album':
                editarAlbum($pdo, $input);
                break;
            
            case 'eliminar_album':
                eliminarAlbum($pdo, $input);
                break;
            
            case 'obtener_fotos_album':
                obtenerFotosAlbum($pdo, $input);
                break;
            
            case 'registrar_descarga':
                registrarDescarga($pdo, $input);
                break;
            
            case 'crear_cliente_temporal':
                crearClienteTemporal($pdo, $input);
                break;
            
            case 'obtener_clientes':
                obtenerClientes($pdo);
                break;

            case 'eliminar_foto':
                eliminarFoto($pdo, $input);
                break;
            
            default:
                echo json_encode(['success' => false, 'message' => 'Acción no válida']);
        }
    }
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión: ' . $e->getMessage()
    ]);
}

// ========================================
// CREAR ÁLBUM
// ========================================
function crearAlbum($pdo, $data) {
    try {
        if (empty($data['idCliente']) || empty($data['titulo']) || empty($data['diasCaducidad'])) {
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            return;
        }
        
        // Calcular fecha de caducidad
        $fechaCaducidad = date('Y-m-d H:i:s', strtotime("+{$data['diasCaducidad']} days"));
        
        $stmt = $pdo->prepare("
            INSERT INTO AlbumCliente (ID_Cliente, Titulo, Descripcion, FechaCaducidad, Estado)
            VALUES (:idCliente, :titulo, :descripcion, :fechaCaducidad, 'Activo')
        ");
        
        $stmt->execute([
            ':idCliente' => $data['idCliente'],
            ':titulo' => $data['titulo'],
            ':descripcion' => $data['descripcion'] ?? '',
            ':fechaCaducidad' => $fechaCaducidad
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Álbum creado correctamente',
            'idAlbum' => $pdo->lastInsertId()
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// OBTENER TODOS LOS ÁLBUMES (ADMIN)
// ========================================
function obtenerAlbums($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT 
                a.ID_Album,
                a.Titulo,
                a.Descripcion,
                a.FechaSubida,
                a.FechaCaducidad,
                a.Estado,
                u.NombreCompleto as Cliente,
                u.ID_Usuario as ID_Cliente,
                COUNT(f.ID_Foto) as TotalFotos,
                CAST(TIMESTAMPDIFF(DAY, NOW(), a.FechaCaducidad) AS SIGNED) as DiasRestantes
            FROM AlbumCliente a
            INNER JOIN Usuario u ON a.ID_Cliente = u.ID_Usuario
            LEFT JOIN FotoAlbum f ON a.ID_Album = f.ID_Album
            GROUP BY a.ID_Album
            ORDER BY a.FechaSubida DESC
        ");
        
        $albums = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'albums' => $albums
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}


// ========================================
// OBTENER ÁLBUMES DE UN CLIENTE ESPECÍFICO
// ========================================
function obtenerAlbumsCliente($pdo, $data) {
    try {
        if (empty($data['idCliente'])) {
            echo json_encode(['success' => false, 'message' => 'ID de cliente requerido']);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                a.ID_Album,
                a.Titulo,
                a.Descripcion,
                a.FechaSubida,
                a.FechaCaducidad,
                a.Estado,
                COUNT(f.ID_Foto) as TotalFotos,
                CAST(TIMESTAMPDIFF(DAY, NOW(), a.FechaCaducidad) AS SIGNED) as DiasRestantes
            FROM AlbumCliente a
            LEFT JOIN FotoAlbum f ON a.ID_Album = f.ID_Album
            WHERE a.ID_Cliente = :idCliente
            AND a.Estado = 'Activo'
            GROUP BY a.ID_Album
            ORDER BY a.FechaSubida DESC
        ");
        
        $stmt->execute([':idCliente' => $data['idCliente']]);
        $albums = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'albums' => $albums
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// CERRAR ÁLBUM
// ========================================
function cerrarAlbum($pdo, $data) {
    try {
        if (empty($data['idAlbum'])) {
            echo json_encode(['success' => false, 'message' => 'ID de álbum requerido']);
            return;
        }
        
        $stmt = $pdo->prepare("
            UPDATE AlbumCliente 
            SET Estado = 'Cerrado'
            WHERE ID_Album = :idAlbum
        ");
        
        $stmt->execute([':idAlbum' => $data['idAlbum']]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Álbum cerrado correctamente'
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// EDITAR ÁLBUM
// ========================================
function editarAlbum($pdo, $data) {
    try {
        if (empty($data['idAlbum'])) {
            echo json_encode(['success' => false, 'message' => 'ID de álbum requerido']);
            return;
        }
        
        $stmt = $pdo->prepare("
            UPDATE AlbumCliente 
            SET Titulo = :titulo,
                Descripcion = :descripcion,
                FechaCaducidad = :fechaCaducidad
            WHERE ID_Album = :idAlbum
        ");
        
        $stmt->execute([
            ':titulo' => $data['titulo'],
            ':descripcion' => $data['descripcion'] ?? '',
            ':fechaCaducidad' => $data['fechaCaducidad'],
            ':idAlbum' => $data['idAlbum']
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Álbum actualizado correctamente'
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// ELIMINAR ÁLBUM
// ========================================
function eliminarAlbum($pdo, $data) {
    try {
        if (empty($data['idAlbum'])) {
            echo json_encode(['success' => false, 'message' => 'ID de álbum requerido']);
            return;
        }
        
        // Obtener fotos para eliminar archivos físicos
        $stmt = $pdo->prepare("SELECT RutaArchivo FROM fotoalbum WHERE ID_Album = :idAlbum");
        $stmt->execute([':idAlbum' => $data['idAlbum']]);
        $fotos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Eliminar archivos físicos
        foreach ($fotos as $foto) {
            if (file_exists($foto['RutaArchivo'])) {
                unlink($foto['RutaArchivo']);
            }
        }
        
        // Eliminar álbum (las fotos se eliminan en cascada)
        $stmt = $pdo->prepare("DELETE FROM albumcliente WHERE ID_Album = :idAlbum");
        $stmt->execute([':idAlbum' => $data['idAlbum']]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Álbum eliminado correctamente'
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// OBTENER FOTOS DE UN ÁLBUM
// ========================================
function obtenerFotosAlbum($pdo, $data) {
    try {
        if (empty($data['idAlbum'])) {
            echo json_encode(['success' => false, 'message' => 'ID de álbum requerido']);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                ID_Foto,
                NombreArchivo,
                RutaArchivo,
                TamanoBytes,
                FechaSubida,
                Descargada,
                FechaDescarga
            FROM fotoalbum
            WHERE ID_Album = :idAlbum
            ORDER BY FechaSubida DESC
        ");
        
        $stmt->execute([':idAlbum' => $data['idAlbum']]);
        $fotos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'fotos' => $fotos
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// REGISTRAR DESCARGA
// ========================================
function registrarDescarga($pdo, $data) {
    try {
        if (empty($data['idFoto']) || empty($data['idCliente'])) {
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            return;
        }
        
        // Actualizar estado de la foto
        $stmt = $pdo->prepare("
            UPDATE FotoAlbum 
            SET Descargada = TRUE, FechaDescarga = NOW()
            WHERE ID_Foto = :idFoto
        ");
        $stmt->execute([':idFoto' => $data['idFoto']]);
        
        // Registrar en log
        $stmt = $pdo->prepare("
            INSERT INTO LogDescarga (ID_Foto, ID_Cliente, IPCliente)
            VALUES (:idFoto, :idCliente, :ip)
        ");
        
        $stmt->execute([
            ':idFoto' => $data['idFoto'],
            ':idCliente' => $data['idCliente'],
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? null
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Descarga registrada'
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// CREAR CLIENTE TEMPORAL
// ========================================
function crearClienteTemporal($pdo, $data) {
    try {
        if (empty($data['nombreCompleto'])) {
            echo json_encode(['success' => false, 'message' => 'Nombre requerido']);
            return;
        }
        
        // Generar usuario temporal único
        $nombreLimpio = strtolower(str_replace(' ', '', $data['nombreCompleto']));
        $usuarioTemporal = $nombreLimpio . rand(100, 999);
        
        // Verificar que el usuario no exista
        $stmt = $pdo->prepare("SELECT ID_Usuario FROM usuario WHERE Usuario = :usuario");
        $stmt->execute([':usuario' => $usuarioTemporal]);
        
        while ($stmt->fetch()) {
            $usuarioTemporal = $nombreLimpio . rand(100, 999);
            $stmt->execute([':usuario' => $usuarioTemporal]);
        }
        
        // Generar contraseña temporal
        $contrasenaTemporal = 'temp' . rand(1000, 9999);
        
        $stmt = $pdo->prepare("
            INSERT INTO Usuario (
                NombreCompleto, 
                Usuario,
                Correo, 
                Contrasena, 
                TipoUsuario, 
                EsUsuarioTemporal, 
                ContrasenaTemporal,
                FechaCreacionTemp
            ) VALUES (
                :nombre,
                :usuario,
                :correo,
                :contrasena,
                'Cliente',
                TRUE,
                :contrasenaTemporal,
                NOW()
            )
        ");
        
        $correo = $data['correo'] ?? $usuarioTemporal . '@temp.com';
        
        $stmt->execute([
            ':nombre' => $data['nombreCompleto'],
            ':usuario' => $usuarioTemporal,
            ':correo' => $correo,
            ':contrasena' => $contrasenaTemporal,
            ':contrasenaTemporal' => $contrasenaTemporal
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Cliente temporal creado',
            'idCliente' => $pdo->lastInsertId(),
            'usuario' => $usuarioTemporal,
            'contrasena' => $contrasenaTemporal
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// OBTENER CLIENTES (PARA SELECCIÓN)
// ========================================
function obtenerClientes($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT 
                ID_Usuario,
                NombreCompleto,
                Correo,
                EsUsuarioTemporal,
                FechaCreacionTemp
            FROM usuario
            WHERE TipoUsuario = 'Cliente'
            ORDER BY EsUsuarioTemporal DESC, NombreCompleto ASC
        ");
        
        $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'clientes' => $clientes
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// ELIMINAR FOTO
// ========================================
function eliminarFoto($pdo, $data) {
    try {
        if (empty($data['idFoto'])) {
            echo json_encode(['success' => false, 'message' => 'ID de foto requerido']);
            return;
        }
        
        // Obtener ruta del archivo antes de eliminar
        $stmt = $pdo->prepare("SELECT RutaArchivo FROM FotoAlbum WHERE ID_Foto = :idFoto");
        $stmt->execute([':idFoto' => $data['idFoto']]);
        $foto = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$foto) {
            echo json_encode(['success' => false, 'message' => 'Foto no encontrada']);
            return;
        }
        
        // Eliminar archivo físico
        if (file_exists($foto['RutaArchivo'])) {
            unlink($foto['RutaArchivo']);
        }
        
        // Eliminar registro de BD (los logs se eliminan en cascada)
        $stmt = $pdo->prepare("DELETE FROM fotoalbum WHERE ID_Foto = :idFoto");
        $stmt->execute([':idFoto' => $data['idFoto']]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Foto eliminada correctamente'
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

?>