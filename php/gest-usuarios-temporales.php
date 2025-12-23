<?php
// php/gest-usuarios-temporales.php
// Gestión de usuarios temporales creados para álbumes

$host = 'localhost';
$dbname = 'u951150559_modricestudio';
$username = 'u951150559_modric';
$password = '|Fi|b~qQw7';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'get_usuarios_temporales':
            getUsuariosTemporales($pdo);
            break;
        
        case 'obtener_contrasena_actual':
            obtenerContrasenaActual($pdo, $input);
            break;
        
        case 'cambiar_contrasena_temporal':
            cambiarContrasenaUsuarioTemporal($pdo, $input);
            break;
        
        case 'eliminar_usuario_temporal':
            eliminarUsuarioTemporal($pdo, $input);
            break;
        
        case 'limpiar_usuarios_vencidos':
            limpiarUsuariosVencidos($pdo);
            break;
        
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
            break;
    }
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión: ' . $e->getMessage()
    ]);
}

// ========================================
// OBTENER USUARIOS TEMPORALES (CORREGIDO)
// ========================================
function getUsuariosTemporales($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT 
                u.ID_Usuario,
                u.NombreCompleto,
                u.Usuario,
                u.Correo,
                u.FechaCreacionTemp,
                COUNT(CASE WHEN a.Estado = 'Activo' THEN a.ID_Album END) as AlbumesActivos,
                COUNT(CASE WHEN a.Estado = 'Cerrado' THEN a.ID_Album END) as AlbumesCerrados,
                COUNT(CASE WHEN a.Estado = 'Vencido' THEN a.ID_Album END) as AlbumesVencidos,
                COUNT(a.ID_Album) as AlbumesTotal,
                DATEDIFF(CURDATE(), u.FechaCreacionTemp) as DiasDesdeCreacion
            FROM Usuario u
            LEFT JOIN AlbumCliente a ON u.ID_Usuario = a.ID_Cliente
            WHERE u.EsUsuarioTemporal = 1
            AND u.TipoUsuario = 'Cliente'
            GROUP BY u.ID_Usuario
            ORDER BY u.FechaCreacionTemp DESC
        ");
        
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'usuarios' => $usuarios
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// OBTENER CONTRASEÑA ACTUAL
// ========================================
function obtenerContrasenaActual($pdo, $data) {
    try {
        if (empty($data['id'])) {
            echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT ContrasenaTemporal, Contrasena 
            FROM usuario 
            WHERE ID_Usuario = :id 
            AND EsUsuarioTemporal = 1
        ");
        $stmt->execute([':id' => $data['id']]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$usuario) {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            return;
        }
        
        $contrasena = $usuario['ContrasenaTemporal'] ?: $usuario['Contrasena'];
        
        echo json_encode([
            'success' => true,
            'contrasena' => $contrasena
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// CAMBIAR CONTRASEÑA DE USUARIO TEMPORAL
// ========================================
function cambiarContrasenaUsuarioTemporal($pdo, $data) {
    try {
        if (empty($data['id']) || empty($data['nuevaContrasena'])) {
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            return;
        }
        
        if (strlen($data['nuevaContrasena']) < 6) {
            echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres']);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT ID_Usuario 
            FROM usuario 
            WHERE ID_Usuario = :id 
            AND EsUsuarioTemporal = 1
        ");
        $stmt->execute([':id' => $data['id']]);
        
        if (!$stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado o no es temporal']);
            return;
        }
        
        $stmt = $pdo->prepare("
            UPDATE Usuario 
            SET Contrasena = :contrasena,
                ContrasenaTemporal = :contrasena
            WHERE ID_Usuario = :id
        ");
        
        $stmt->execute([
            ':contrasena' => $data['nuevaContrasena'],
            ':id' => $data['id']
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Contraseña actualizada correctamente',
            'nuevaContrasena' => $data['nuevaContrasena']
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// ELIMINAR USUARIO TEMPORAL (CORREGIDO)
// ========================================
function eliminarUsuarioTemporal($pdo, $data) {
    try {
        if (empty($data['id'])) {
            echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
            return;
        }
        
        // Verificar si tiene álbumes ACTIVOS
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(CASE WHEN Estado = 'Activo' THEN 1 END) as activos,
                COUNT(CASE WHEN Estado = 'Cerrado' THEN 1 END) as cerrados,
                COUNT(CASE WHEN Estado = 'Vencido' THEN 1 END) as vencidos,
                COUNT(*) as total
            FROM albumcliente 
            WHERE ID_Cliente = :id
        ");
        $stmt->execute([':id' => $data['id']]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['activos'] > 0) {
            echo json_encode([
                'success' => false,
                'message' => 'No se puede eliminar: el usuario tiene ' . $result['activos'] . ' álbum(es) activo(s). Ciérralos o espera a que caduquen.'
            ]);
            return;
        }
        
        // Si llegamos aquí, no hay álbumes activos
        $pdo->beginTransaction();
        
        try {
            // Desvincular pedidos
            $stmt = $pdo->prepare("
                UPDATE Pedido 
                SET ID_Usuario = NULL 
                WHERE ID_Usuario = :id
            ");
            $stmt->execute([':id' => $data['id']]);
            
            // Eliminar álbumes cerrados/vencidos
            $stmt = $pdo->prepare("
                DELETE FROM albumcliente 
                WHERE ID_Cliente = :id 
                AND Estado IN ('Cerrado', 'Vencido')
            ");
            $stmt->execute([':id' => $data['id']]);
            $albumsEliminados = $stmt->rowCount();
            
            // Eliminar usuario temporal
            $stmt = $pdo->prepare("
                DELETE FROM usuario 
                WHERE ID_Usuario = :id 
                AND EsUsuarioTemporal = 1
            ");
            $stmt->execute([':id' => $data['id']]);
            
            if ($stmt->rowCount() > 0) {
                $pdo->commit();
                
                $mensaje = 'Usuario temporal eliminado correctamente.';
                if ($albumsEliminados > 0) {
                    $mensaje .= " Se eliminaron $albumsEliminados álbum(es) cerrado(s)/vencido(s).";
                }
                if ($result['total'] == 0) {
                    $mensaje .= ' No tenía álbumes asociados.';
                }
                
                echo json_encode([
                    'success' => true,
                    'message' => $mensaje
                ]);
            } else {
                $pdo->rollBack();
                echo json_encode([
                    'success' => false,
                    'message' => 'Usuario no encontrado o no es temporal'
                ]);
            }
            
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// LIMPIAR USUARIOS VENCIDOS (CORREGIDO)
// ========================================
function limpiarUsuariosVencidos($pdo) {
    try {
        $pdo->beginTransaction();
        
        // Encontrar usuarios temporales sin álbumes activos y con más de 60 días
        $stmt = $pdo->prepare("
            SELECT u.ID_Usuario,
                   COUNT(CASE WHEN a.Estado = 'Activo' THEN 1 END) as albumesActivos,
                   COUNT(a.ID_Album) as totalAlbumes
            FROM Usuario u
            LEFT JOIN AlbumCliente a ON u.ID_Usuario = a.ID_Cliente
            WHERE u.EsUsuarioTemporal = 1
            AND DATEDIFF(CURDATE(), u.FechaCreacionTemp) > 60
            GROUP BY u.ID_Usuario
            HAVING albumesActivos = 0
        ");
        $stmt->execute();
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($usuarios)) {
            $pdo->rollBack();
            echo json_encode([
                'success' => true,
                'message' => 'No hay usuarios temporales para eliminar (mayores a 60 días sin álbumes activos)',
                'eliminados' => 0
            ]);
            return;
        }
        
        $idsUsuarios = array_column($usuarios, 'ID_Usuario');
        $placeholders = implode(',', array_fill(0, count($idsUsuarios), '?'));
        
        // Desvincular pedidos
        $stmt = $pdo->prepare("
            UPDATE Pedido 
            SET ID_Usuario = NULL 
            WHERE ID_Usuario IN ($placeholders)
        ");
        $stmt->execute($idsUsuarios);
        
        // Eliminar álbumes cerrados/vencidos
        $stmt = $pdo->prepare("
            DELETE FROM AlbumCliente 
            WHERE ID_Cliente IN ($placeholders)
            AND Estado IN ('Cerrado', 'Vencido')
        ");
        $stmt->execute($idsUsuarios);
        
        // Eliminar usuarios temporales
        $stmt = $pdo->prepare("
            DELETE FROM Usuario 
            WHERE ID_Usuario IN ($placeholders)
            AND EsUsuarioTemporal = 1
        ");
        $stmt->execute($idsUsuarios);
        
        $eliminados = $stmt->rowCount();
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => $eliminados > 0 
                ? "Se eliminaron $eliminados usuario(s) temporal(es) sin álbumes activos (mayores a 60 días)" 
                : 'No hay usuarios temporales para eliminar',
            'eliminados' => $eliminados
        ]);
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}
?>