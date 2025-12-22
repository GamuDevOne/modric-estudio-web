<?php
// php/gest-usuarios-temporales.php
// Gestión de usuarios temporales creados para álbumes

$host = 'localhost';
$dbname = 'ModricEstudio00';
$username = 'root';
$password = '';

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
// OBTENER USUARIOS TEMPORALES
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
                COUNT(a.ID_Album) as AlbumesAsociados,
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
            FROM Usuario 
            WHERE ID_Usuario = :id 
            AND EsUsuarioTemporal = 1
        ");
        $stmt->execute([':id' => $data['id']]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$usuario) {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            return;
        }
        
        // Devolver la contraseña temporal o la contraseña normal
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
        
        // Verificar que el usuario existe y es temporal
        $stmt = $pdo->prepare("
            SELECT ID_Usuario 
            FROM Usuario 
            WHERE ID_Usuario = :id 
            AND EsUsuarioTemporal = 1
        ");
        $stmt->execute([':id' => $data['id']]);
        
        if (!$stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado o no es temporal']);
            return;
        }
        
        // Actualizar contraseña
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
// ELIMINAR USUARIO TEMPORAL (FUNCIÓN ACTUALIZADA)
// ========================================
function eliminarUsuarioTemporal($pdo, $data) {
    try {
        if (empty($data['id'])) {
            echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
            return;
        }
        
        // Verificar si tiene álbumes ACTIVOS (Cerrados o Vencidos están OK)
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as total 
            FROM AlbumCliente 
            WHERE ID_Cliente = :id 
            AND Estado = 'Activo'
        ");
        $stmt->execute([':id' => $data['id']]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['total'] > 0) {
            echo json_encode([
                'success' => false,
                'message' => 'No se puede eliminar: el usuario tiene ' . $result['total'] . ' álbum(es) activo(s). Espera a que caduquen o ciérralos manualmente.'
            ]);
            return;
        }
        
        // Los usuarios temporales son SOLO para álbumes
        // Los pedidos asociados permanecen en el historial con el nombre del cliente
        // NO eliminamos los pedidos, solo desvinculamos el usuario
        
        // Paso 1: Desvincular pedidos (cambiar FK a NULL o mantener referencia por nombre)
        $stmt = $pdo->prepare("
            UPDATE Pedido 
            SET ID_Usuario = NULL 
            WHERE ID_Usuario = :id
        ");
        $stmt->execute([':id' => $data['id']]);
        
        // Paso 2: Eliminar álbumes cerrados/vencidos del usuario
        $stmt = $pdo->prepare("
            DELETE FROM AlbumCliente 
            WHERE ID_Cliente = :id 
            AND Estado IN ('Cerrado', 'Vencido')
        ");
        $stmt->execute([':id' => $data['id']]);
        
        // Paso 3: Eliminar usuario temporal
        $stmt = $pdo->prepare("
            DELETE FROM Usuario 
            WHERE ID_Usuario = :id 
            AND EsUsuarioTemporal = 1
        ");
        $stmt->execute([':id' => $data['id']]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Usuario temporal eliminado correctamente. Los pedidos asociados se mantienen en el historial.'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Usuario no encontrado o no es temporal'
            ]);
        }
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// LIMPIAR USUARIOS VENCIDOS (FUNCIÓN ACTUALIZADA)
// ========================================
function limpiarUsuariosVencidos($pdo) {
    try {
        $pdo->beginTransaction();
        
        // Encontrar usuarios temporales sin álbumes activos
        $stmt = $pdo->prepare("
            SELECT DISTINCT u.ID_Usuario 
            FROM Usuario u
            LEFT JOIN AlbumCliente a ON u.ID_Usuario = a.ID_Cliente AND a.Estado = 'Activo'
            WHERE u.EsUsuarioTemporal = 1
            AND a.ID_Album IS NULL
            AND DATEDIFF(CURDATE(), u.FechaCreacionTemp) > 60
        ");
        $stmt->execute();
        $usuarios = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (empty($usuarios)) {
            $pdo->rollBack();
            echo json_encode([
                'success' => true,
                'message' => 'No hay usuarios temporales para eliminar',
                'eliminados' => 0
            ]);
            return;
        }
        
        $placeholders = implode(',', array_fill(0, count($usuarios), '?'));
        
        // Desvincular pedidos
        $stmt = $pdo->prepare("
            UPDATE Pedido 
            SET ID_Usuario = NULL 
            WHERE ID_Usuario IN ($placeholders)
        ");
        $stmt->execute($usuarios);
        
        // Eliminar álbumes cerrados/vencidos
        $stmt = $pdo->prepare("
            DELETE FROM AlbumCliente 
            WHERE ID_Cliente IN ($placeholders)
            AND Estado IN ('Cerrado', 'Vencido')
        ");
        $stmt->execute($usuarios);
        
        // Eliminar usuarios temporales
        $stmt = $pdo->prepare("
            DELETE FROM Usuario 
            WHERE ID_Usuario IN ($placeholders)
            AND EsUsuarioTemporal = 1
        ");
        $stmt->execute($usuarios);
        
        $eliminados = $stmt->rowCount();
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => $eliminados > 0 
                ? "Se eliminaron $eliminados usuario(s) temporal(es) sin álbumes activos" 
                : 'No hay usuarios temporales para eliminar',
            'eliminados' => $eliminados
        ]);
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}
?>