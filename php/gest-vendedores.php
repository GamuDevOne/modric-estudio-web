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
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'get_all':
            getAllVendedores($pdo);
            break;
        
        case 'create':
            createVendedor($pdo, $input);
            break;
        
        case 'update':
            updateVendedor($pdo, $input);
            break;
        
        case 'delete':
            deleteVendedor($pdo, $input);
            break;
        
        case 'get_stats':
            getVendedorStats($pdo, $input);
            break;
        
        default:
            echo json_encode([
                'success' => false,
                'message' => 'Acción no válida'
            ]);
            break;
    }
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión: ' . $e->getMessage()
    ]);
}

// ========================================
// FUNCIÓN: OBTENER TODOS LOS VENDEDORES
// ========================================
function getAllVendedores($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT 
                u.ID_Usuario,
                u.NombreCompleto,
                u.Correo,
                u.CorreoCorporativo,
                u.GrupoGrado,
                u.Foto,
                COALESCE(SUM(p.Total), 0) as VentasTotales
            FROM Usuario u
            LEFT JOIN Pedido p ON u.ID_Usuario = p.ID_Vendedor AND p.Estado != 'Cancelado'
            WHERE u.TipoUsuario = 'Vendedor'
            GROUP BY u.ID_Usuario
            ORDER BY u.NombreCompleto ASC
        ");
        
        $vendedores = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'vendedores' => $vendedores
        ]);
        
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener vendedores: ' . $e->getMessage()
        ]);
    }
}

// ========================================
// FUNCIÓN: CREAR VENDEDOR
// ========================================
function createVendedor($pdo, $data) {
    try {
        // Validaciones
        if (empty($data['nombreCompleto'])) {
            echo json_encode([
                'success' => false,
                'message' => 'El nombre completo es requerido'
            ]);
            return;
        }
        
        if (empty($data['contrasena']) || strlen($data['contrasena']) < 6) {
            echo json_encode([
                'success' => false,
                'message' => 'La contraseña debe tener al menos 6 caracteres'
            ]);
            return;
        }
        
        // Verificar si el correo ya existe
        if (!empty($data['correo'])) {
            $stmt = $pdo->prepare("SELECT ID_Usuario FROM Usuario WHERE Correo = :correo");
            $stmt->execute([':correo' => $data['correo']]);
            if ($stmt->fetch()) {
                echo json_encode([
                    'success' => false,
                    'message' => 'El correo ya está registrado'
                ]);
                return;
            }
        }
        
        // Verificar si el correo corporativo ya existe
        if (!empty($data['correoCorporativo'])) {
            $stmt = $pdo->prepare("SELECT ID_Usuario FROM Usuario WHERE CorreoCorporativo = :correoCorp");
            $stmt->execute([':correoCorp' => $data['correoCorporativo']]);
            if ($stmt->fetch()) {
                echo json_encode([
                    'success' => false,
                    'message' => 'El correo corporativo ya está registrado'
                ]);
                return;
            }
        }
        
        // Insertar vendedor
        $stmt = $pdo->prepare("
            INSERT INTO Usuario (
                NombreCompleto, 
                Correo, 
                CorreoCorporativo, 
                Contrasena, 
                TipoUsuario, 
                GrupoGrado, 
                Foto
            ) VALUES (
                :nombreCompleto,
                :correo,
                :correoCorporativo,
                :contrasena,
                'Vendedor',
                :grupoGrado,
                :foto
            )
        ");
        
        $stmt->execute([
            ':nombreCompleto' => $data['nombreCompleto'],
            ':correo' => !empty($data['correo']) ? $data['correo'] : null,
            ':correoCorporativo' => !empty($data['correoCorporativo']) ? $data['correoCorporativo'] : null,
            ':contrasena' => $data['contrasena'], // TODO: Implementar hash
            ':grupoGrado' => !empty($data['grupoGrado']) ? $data['grupoGrado'] : null,
            ':foto' => !empty($data['foto']) ? $data['foto'] : null
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Vendedor creado correctamente',
            'id' => $pdo->lastInsertId()
        ]);
        
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al crear vendedor: ' . $e->getMessage()
        ]);
    }
}

// ========================================
// FUNCIÓN: ACTUALIZAR VENDEDOR
// ========================================
function updateVendedor($pdo, $data) {
    try {
        // Validaciones
        if (empty($data['id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'ID de vendedor es requerido'
            ]);
            return;
        }
        
        if (empty($data['nombreCompleto'])) {
            echo json_encode([
                'success' => false,
                'message' => 'El nombre completo es requerido'
            ]);
            return;
        }
        
        // Verificar que el vendedor existe
        $stmt = $pdo->prepare("SELECT ID_Usuario FROM Usuario WHERE ID_Usuario = :id AND TipoUsuario = 'Vendedor'");
        $stmt->execute([':id' => $data['id']]);
        if (!$stmt->fetch()) {
            echo json_encode([
                'success' => false,
                'message' => 'Vendedor no encontrado'
            ]);
            return;
        }
        
        // Verificar si el correo ya existe (excepto el actual)
        if (!empty($data['correo'])) {
            $stmt = $pdo->prepare("SELECT ID_Usuario FROM Usuario WHERE Correo = :correo AND ID_Usuario != :id");
            $stmt->execute([':correo' => $data['correo'], ':id' => $data['id']]);
            if ($stmt->fetch()) {
                echo json_encode([
                    'success' => false,
                    'message' => 'El correo ya está registrado'
                ]);
                return;
            }
        }
        
        // Verificar si el correo corporativo ya existe (excepto el actual)
        if (!empty($data['correoCorporativo'])) {
            $stmt = $pdo->prepare("SELECT ID_Usuario FROM Usuario WHERE CorreoCorporativo = :correoCorp AND ID_Usuario != :id");
            $stmt->execute([':correoCorp' => $data['correoCorporativo'], ':id' => $data['id']]);
            if ($stmt->fetch()) {
                echo json_encode([
                    'success' => false,
                    'message' => 'El correo corporativo ya está registrado'
                ]);
                return;
            }
        }
        
        // Actualizar vendedor
        if (!empty($data['contrasena'])) {
            // Actualizar con contraseña nueva
            $stmt = $pdo->prepare("
                UPDATE Usuario SET
                    NombreCompleto = :nombreCompleto,
                    Correo = :correo,
                    CorreoCorporativo = :correoCorporativo,
                    Contrasena = :contrasena,
                    GrupoGrado = :grupoGrado,
                    Foto = :foto
                WHERE ID_Usuario = :id
            ");
            
            $stmt->execute([
                ':nombreCompleto' => $data['nombreCompleto'],
                ':correo' => !empty($data['correo']) ? $data['correo'] : null,
                ':correoCorporativo' => !empty($data['correoCorporativo']) ? $data['correoCorporativo'] : null,
                ':contrasena' => $data['contrasena'], // TODO: Implementar hash
                ':grupoGrado' => !empty($data['grupoGrado']) ? $data['grupoGrado'] : null,
                ':foto' => !empty($data['foto']) ? $data['foto'] : null,
                ':id' => $data['id']
            ]);
        } else {
            // Actualizar sin cambiar contraseña
            $stmt = $pdo->prepare("
                UPDATE Usuario SET
                    NombreCompleto = :nombreCompleto,
                    Correo = :correo,
                    CorreoCorporativo = :correoCorporativo,
                    GrupoGrado = :grupoGrado,
                    Foto = :foto
                WHERE ID_Usuario = :id
            ");
            
            $stmt->execute([
                ':nombreCompleto' => $data['nombreCompleto'],
                ':correo' => !empty($data['correo']) ? $data['correo'] : null,
                ':correoCorporativo' => !empty($data['correoCorporativo']) ? $data['correoCorporativo'] : null,
                ':grupoGrado' => !empty($data['grupoGrado']) ? $data['grupoGrado'] : null,
                ':foto' => !empty($data['foto']) ? $data['foto'] : null,
                ':id' => $data['id']
            ]);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Vendedor actualizado correctamente'
        ]);
        
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al actualizar vendedor: ' . $e->getMessage()
        ]);
    }
}

// ========================================
// FUNCIÓN: ELIMINAR VENDEDOR
// ========================================
function deleteVendedor($pdo, $data) {
    try {
        if (empty($data['id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'ID de vendedor es requerido'
            ]);
            return;
        }
        
        // Verificar si el vendedor tiene pedidos asociados
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM Pedido WHERE ID_Vendedor = :id");
        $stmt->execute([':id' => $data['id']]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['total'] > 0) {
            echo json_encode([
                'success' => false,
                'message' => 'No se puede eliminar el vendedor porque tiene pedidos asociados'
            ]);
            return;
        }
        
        // Eliminar vendedor
        $stmt = $pdo->prepare("DELETE FROM Usuario WHERE ID_Usuario = :id AND TipoUsuario = 'Vendedor'");
        $stmt->execute([':id' => $data['id']]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Vendedor eliminado correctamente'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Vendedor no encontrado'
            ]);
        }
        
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al eliminar vendedor: ' . $e->getMessage()
        ]);
    }
}

// ========================================
// FUNCIÓN: OBTENER ESTADÍSTICAS DEL VENDEDOR
// ========================================
function getVendedorStats($pdo, $data) {
    try {
        if (empty($data['id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'ID de vendedor es requerido'
            ]);
            return;
        }
        
        // Total de ventas
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(Total), 0) as totalVentas
            FROM Pedido
            WHERE ID_Vendedor = :id AND Estado != 'Cancelado'
        ");
        $stmt->execute([':id' => $data['id']]);
        $totalVentas = $stmt->fetch(PDO::FETCH_ASSOC)['totalVentas'];
        
        // Pedidos completados
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as pedidosCompletados
            FROM Pedido
            WHERE ID_Vendedor = :id AND Estado = 'Completado'
        ");
        $stmt->execute([':id' => $data['id']]);
        $pedidosCompletados = $stmt->fetch(PDO::FETCH_ASSOC)['pedidosCompletados'];
        
        // Comisión estimada (10% de las ventas)
        $comisionEstimada = $totalVentas * 0.10;
        
        // Clientes únicos atendidos
        $stmt = $pdo->prepare("
            SELECT COUNT(DISTINCT ID_Usuario) as clientesAtendidos
            FROM Pedido
            WHERE ID_Vendedor = :id
        ");
        $stmt->execute([':id' => $data['id']]);
        $clientesAtendidos = $stmt->fetch(PDO::FETCH_ASSOC)['clientesAtendidos'];
        
        echo json_encode([
            'success' => true,
            'stats' => [
                'totalVentas' => $totalVentas,
                'pedidosCompletados' => $pedidosCompletados,
                'comisionEstimada' => $comisionEstimada,
                'clientesAtendidos' => $clientesAtendidos
            ]
        ]);
        
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener estadísticas: ' . $e->getMessage()
        ]);
    }
}
?>