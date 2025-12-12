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
        // Obtener vendedores
        $stmt = $pdo->query("
            SELECT 
                u.ID_Usuario,
                u.NombreCompleto,
                u.Usuario,
                u.Correo
            FROM Usuario u
            WHERE u.TipoUsuario = 'Vendedor'
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
        
        if (empty($data['correo'])) {
            echo json_encode([
                'success' => false,
                'message' => 'El correo es requerido'
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
        $stmt = $pdo->prepare("SELECT ID_Usuario FROM Usuario WHERE Correo = :correo");
        $stmt->execute([':correo' => $data['correo']]);
        if ($stmt->fetch()) {
            echo json_encode([
                'success' => false,
                'message' => 'El correo ya está registrado'
            ]);
            return;
        }
        
        // Insertar vendedor
        $stmt = $pdo->prepare("
            INSERT INTO Usuario (
                NombreCompleto, 
                Usuario,
                Correo, 
                Contrasena, 
                TipoUsuario, 
            ) VALUES (
                :nombreCompleto,
                :usuario,
                :correo,
                :contrasena,
                'Vendedor',
            )
        ");
        
        $stmt->execute([
            ':nombreCompleto' => $data['nombreCompleto'],
            ':usuario' => $data['usuario'],
            ':correo' => $data['correo'],
            ':contrasena' => $data['contrasena'], // all: Implementar hash
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
        
        if (empty($data['correo'])) {
            echo json_encode([
                'success' => false,
                'message' => 'El correo es requerido'
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
        $stmt = $pdo->prepare("SELECT ID_Usuario FROM Usuario WHERE Correo = :correo AND ID_Usuario != :id");
        $stmt->execute([':correo' => $data['correo'], ':id' => $data['id']]);
        if ($stmt->fetch()) {
            echo json_encode([
                'success' => false,
                'message' => 'El correo ya está registrado'
            ]);
            return;
        }

        // Verificar si el usuario ya existe (excepto el actual)
        $stmt = $pdo->prepare("
            SELECT ID_Usuario 
            FROM Usuario 
            WHERE Usuario = :usuario 
            AND ID_Usuario != :id
        ");
        $stmt->execute([
            ':usuario' => $data['usuario'], 
            ':id' => $data['id']
        ]);

        if ($stmt->fetch()) {
            echo json_encode([
                'success' => false,
                'message' => 'El nombre de usuario ya está registrado'
            ]);
            return;
        }
                
        // Actualizar vendedor
        if (!empty($data['contrasena'])) {
            // Actualizar con contraseña nueva
            $stmt = $pdo->prepare("
                UPDATE Usuario SET
                    NombreCompleto = :nombreCompleto,
                    Usuario = :usuario,
                    Correo = :correo,
                    Contrasena = :contrasena,
                WHERE ID_Usuario = :id
            ");
            
            $stmt->execute([
                ':nombreCompleto' => $data['nombreCompleto'],
                ':usuario' => $data['usuario'],
                ':correo' => $data['correo'],
                ':contrasena' => $data['contrasena'], // all: Implementar hash
                ':id' => $data['id']
            ]);
        } else {
            // Actualizar sin cambiar contraseña
            $stmt = $pdo->prepare("
                UPDATE Usuario SET
                    NombreCompleto = :nombreCompleto,
                    Usuario = :usuario,
                    Correo = :correo,
                WHERE ID_Usuario = :id
            ");
            
            $stmt->execute([
                ':nombreCompleto' => $data['nombreCompleto'],
                ':usuario' => $data['usuario'],
                ':correo' => $data['correo'],
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
        
        //FIX: Obtener asignación ACTUAL (del día de HOY) (12/12/25)
        $stmt = $pdo->prepare("
            SELECT c.NombreColegio 
            FROM AsignacionVendedor av
            INNER JOIN Colegio c ON av.ID_Colegio = c.ID_Colegio
            WHERE av.ID_Vendedor = :id 
            AND av.FechaAsignacion = CURDATE()
            AND av.Estado = 'Activo'
            LIMIT 1
        ");
        $stmt->execute([':id' => $data['id']]);
        $asignacionHoy = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Si tiene asignación hoy, usar ese nombre; si no, indicar que no tiene
        $lugarTrabajo = $asignacionHoy ? $asignacionHoy['NombreColegio'] : 'Sin asignación hoy';
        
        // Total de ventas (considerando abonos)
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(
                CASE 
                    WHEN vi.EstadoPago = 'Abono' THEN vi.MontoAbonado
                    ELSE p.Total
                END
            ), 0) as totalVentas
            FROM Pedido p
            LEFT JOIN VentaInfo vi ON p.ID_Pedido = vi.ID_Pedido
            WHERE p.ID_Vendedor = :id 
            AND p.Estado != 'Cancelado'
        ");
        $stmt->execute([':id' => $data['id']]);
        $totalVentas = $stmt->fetch(PDO::FETCH_ASSOC)['totalVentas'];
        
        // Pedidos activos (no completados ni cancelados)
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as pedidosActivos
            FROM Pedido
            WHERE ID_Vendedor = :id 
            AND Estado NOT IN ('Completado', 'Cancelado')
        ");
        $stmt->execute([':id' => $data['id']]);
        $pedidosActivos = $stmt->fetch(PDO::FETCH_ASSOC)['pedidosActivos'];
        
        // Último pedido
        $stmt = $pdo->prepare("
            SELECT 
                p.ID_Pedido,
                p.Fecha,
                COALESCE(vi.NombreCliente, u.NombreCompleto) as Cliente
            FROM Pedido p
            INNER JOIN Usuario u ON p.ID_Usuario = u.ID_Usuario
            LEFT JOIN VentaInfo vi ON p.ID_Pedido = vi.ID_Pedido
            WHERE p.ID_Vendedor = :id
            ORDER BY p.Fecha DESC
            LIMIT 1
        ");
        $stmt->execute([':id' => $data['id']]);
        $ultimoPedido = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $ultimoPedidoTexto = 'Sin pedidos';
        if ($ultimoPedido) {
            $fecha = date('d/m/Y', strtotime($ultimoPedido['Fecha']));
            $ultimoPedidoTexto = "Pedido #{$ultimoPedido['ID_Pedido']} - {$ultimoPedido['Cliente']} ({$fecha})";
        }
        
        // Estado de ventas por tipo
        $stmt = $pdo->prepare("
            SELECT 
                Estado,
                COUNT(*) as cantidad
            FROM Pedido
            WHERE ID_Vendedor = :id
            GROUP BY Estado
        ");
        $stmt->execute([':id' => $data['id']]);
        $estados = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $estadoPendientes = 0;
        $estadoProceso = 0;
        $estadoCompletados = 0;
        $estadoCancelados = 0;
        
        foreach ($estados as $estado) {
            switch ($estado['Estado']) {
                case 'Pendiente':
                    $estadoPendientes = $estado['cantidad'];
                    break;
                case 'En Proceso':
                case 'En_Proceso':
                    $estadoProceso = $estado['cantidad'];
                    break;
                case 'Completado':
                    $estadoCompletados = $estado['cantidad'];
                    break;
                case 'Cancelado':
                    $estadoCancelados = $estado['cantidad'];
                    break;
            }
        }
        
        echo json_encode([
            'success' => true,
            'stats' => [
                'totalVentas' => $totalVentas,
                'lugarTrabajo' => $lugarTrabajo, //Ahora muestra asignación del día (12/12/25)
                'pedidosActivos' => $pedidosActivos,
                'ultimoPedido' => $ultimoPedidoTexto,
                'estadoPendientes' => $estadoPendientes,
                'estadoProceso' => $estadoProceso,
                'estadoCompletados' => $estadoCompletados,
                'estadoCancelados' => $estadoCancelados
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