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

    if ($action === 'get_dashboard_data') {
        $response = [
            'success' => true,
            'estadisticas' => getEstadisticas($pdo),
            'graficos' => getGraficos($pdo),
            'pedidos' => getPedidos($pdo)
        ];
        
        echo json_encode($response);
    } elseif ($action === 'marcar_completado') {
        marcarCompletado($pdo, $input);
    } elseif ($action === 'cancelar_pedido') {
        cancelarPedido($pdo, $input);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Acción no válida'
        ]);
    }
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión: ' . $e->getMessage()
    ]);
}

// ========================================
// FUNCIÓN: OBTENER ESTADÍSTICAS
// ========================================
function getEstadisticas($pdo) {
    $stats = [];
    
    // Ventas del mes actual
    $stmt = $pdo->query("
        SELECT COALESCE(SUM(Total), 0) as ventasMes
        FROM Pedido
        WHERE YEAR(Fecha) = YEAR(CURDATE()) 
        AND MONTH(Fecha) = MONTH(CURDATE())
    ");
    $stats['ventasMes'] = $stmt->fetch(PDO::FETCH_ASSOC)['ventasMes'];
    
    // Ventas del mes anterior
    $stmt = $pdo->query("
        SELECT COALESCE(SUM(Total), 0) as ventasMesAnterior
        FROM Pedido
        WHERE YEAR(Fecha) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        AND MONTH(Fecha) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
    ");
    $ventasMesAnterior = $stmt->fetch(PDO::FETCH_ASSOC)['ventasMesAnterior'];
    
    // Calcular cambio porcentual
    if ($ventasMesAnterior > 0) {
        $stats['cambioVentas'] = round((($stats['ventasMes'] - $ventasMesAnterior) / $ventasMesAnterior) * 100, 2);
    } else {
        $stats['cambioVentas'] = 0;
    }
    
    // Pedidos activos (no cancelados)
    $stmt = $pdo->query("
        SELECT COUNT(*) as pedidosActivos
        FROM Pedido
        WHERE Estado != 'Cancelado'
    ");
    $stats['pedidosActivos'] = $stmt->fetch(PDO::FETCH_ASSOC)['pedidosActivos'];
    
    // Pedidos pendientes de pago
    $stmt = $pdo->query("
        SELECT 
            p.ID_Pedido,
            COALESCE(vi.NombreCliente, u.NombreCompleto) as Cliente,
            p.Total,
            DATEDIFF(CURDATE(), p.Fecha) as DiasPendiente,
            v.NombreCompleto as Vendedor,
            vi.EstadoPago
        FROM Pedido p
        INNER JOIN Usuario u ON p.ID_Usuario = u.ID_Usuario
        LEFT JOIN Usuario v ON p.ID_Vendedor = v.ID_Usuario
        LEFT JOIN VentaInfo vi ON p.ID_Pedido = vi.ID_Pedido
        WHERE p.Estado = 'Pendiente' OR (vi.EstadoPago = 'Abono')
        ORDER BY p.Fecha ASC
    ");
    $pedidos['pendientes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Total de clientes
    $stmt = $pdo->query("
        SELECT COUNT(*) as totalClientes
        FROM Usuario
        WHERE TipoUsuario = 'Cliente'
    ");
    $stats['totalClientes'] = $stmt->fetch(PDO::FETCH_ASSOC)['totalClientes'];
    
    // Clientes nuevos este mes
    $stmt = $pdo->query("
        SELECT COUNT(*) as clientesNuevos
        FROM Usuario
        WHERE TipoUsuario = 'Cliente'
        AND YEAR(CURDATE()) = YEAR(CURDATE())
        AND MONTH(CURDATE()) = MONTH(CURDATE())
    ");
    $stats['clientesNuevos'] = $stmt->fetch(PDO::FETCH_ASSOC)['clientesNuevos'];
    
    // Ingresos totales
    $stmt = $pdo->query("
        SELECT COALESCE(SUM(Total), 0) as ingresosTotales
        FROM Pedido
        WHERE Estado != 'Cancelado'
    ");
    $stats['ingresosTotales'] = $stmt->fetch(PDO::FETCH_ASSOC)['ingresosTotales'];
    
    return $stats;
}

// ========================================
// FUNCIÓN: OBTENER DATOS PARA GRÁFICOS
// ========================================
function getGraficos($pdo) {
    $graficos = [];
    
    // Ventas de los últimos 6 meses
    $stmt = $pdo->query("
        SELECT 
            DATE_FORMAT(Fecha, '%Y-%m') as mes,
            DATE_FORMAT(Fecha, '%b %Y') as mesTexto,
            SUM(Total) as total
        FROM Pedido
        WHERE Fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        AND Estado != 'Cancelado'
        GROUP BY DATE_FORMAT(Fecha, '%Y-%m')
        ORDER BY mes ASC
    ");
    
    $ventasMensuales = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $graficos['ventasMensuales'] = [
        'labels' => array_column($ventasMensuales, 'mesTexto'),
        'data' => array_column($ventasMensuales, 'total')
    ];
    
    // Top 5 servicios más vendidos
    $stmt = $pdo->query("
        SELECT 
            s.NombreServicio,
            COUNT(p.ID_Pedido) as cantidad
        FROM Pedido p
        INNER JOIN Servicio s ON p.ID_Servicio = s.ID_Servicio
        WHERE p.Estado != 'Cancelado'
        GROUP BY s.ID_Servicio
        ORDER BY cantidad DESC
        LIMIT 5
    ");
    
    $servicios = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $graficos['servicios'] = [
        'labels' => array_column($servicios, 'NombreServicio'),
        'data' => array_column($servicios, 'cantidad')
    ];
    
    return $graficos;
}

// ========================================
// FUNCIÓN: OBTENER PEDIDOS
// ========================================
function getPedidos($pdo) {
    $pedidos = [];
    
    // Últimos 10 pedidos
    $stmt = $pdo->query("
        SELECT 
            p.ID_Pedido,
            COALESCE(p.NombreCliente, u.NombreCompleto) as Cliente,
            s.NombreServicio as Servicio,
            p.Fecha,
            p.Total,
            p.Estado,
            v.NombreCompleto as Vendedor
        FROM Pedido p
        INNER JOIN Usuario u ON p.ID_Usuario = u.ID_Usuario
        LEFT JOIN Usuario v ON p.ID_Vendedor = v.ID_Usuario
        LEFT JOIN Servicio s ON p.ID_Servicio = s.ID_Servicio
        ORDER BY p.Fecha DESC
        LIMIT 10
    ");
    $pedidos['ultimos'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Pedidos pendientes de pago
    $stmt = $pdo->query("
        SELECT 
            p.ID_Pedido,
            COALESCE(p.NombreCliente, u.NombreCompleto) as Cliente,
            p.Total,
            DATEDIFF(CURDATE(), p.Fecha) as DiasPendiente,
            v.NombreCompleto as Vendedor
        FROM Pedido p
        INNER JOIN Usuario u ON p.ID_Usuario = u.ID_Usuario
        LEFT JOIN Usuario v ON p.ID_Vendedor = v.ID_Usuario
        WHERE p.Estado = 'Pendiente'
        ORDER BY p.Fecha ASC
    ");
    $pedidos['pendientes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return $pedidos;
}

// ========================================
// FUNCIÓN: MARCAR PEDIDO COMO COMPLETADO
// ========================================
function marcarCompletado($pdo, $data) {
    try {
        if (empty($data['idPedido'])) {
            echo json_encode(['success' => false, 'message' => 'ID de pedido requerido']);
            return;
        }
        
        // Actualizar estado del pedido
        $stmt = $pdo->prepare("UPDATE Pedido SET Estado = 'Completado' WHERE ID_Pedido = :id");
        $stmt->execute([':id' => $data['idPedido']]);
        
        // Actualizar estado de pago si existe
        $stmt = $pdo->prepare("UPDATE VentaInfo SET EstadoPago = 'Completo' WHERE ID_Pedido = :id");
        $stmt->execute([':id' => $data['idPedido']]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Pedido marcado como completado'
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// FUNCIÓN: CANCELAR PEDIDO
// ========================================
function cancelarPedido($pdo, $data) {
    try {
        if (empty($data['idPedido'])) {
            echo json_encode(['success' => false, 'message' => 'ID de pedido requerido']);
            return;
        }
        
        // Actualizar estado del pedido
        $stmt = $pdo->prepare("UPDATE Pedido SET Estado = 'Cancelado' WHERE ID_Pedido = :id");
        $stmt->execute([':id' => $data['idPedido']]);
        
        // Si hay motivo, actualizar notas en VentaInfo
        if (!empty($data['motivo'])) {
            $stmt = $pdo->prepare("
                UPDATE VentaInfo 
                SET Notas = CONCAT(COALESCE(Notas, ''), '\n\nMotivo cancelación: ', :motivo)
                WHERE ID_Pedido = :id
            ");
            $stmt->execute([
                ':id' => $data['idPedido'],
                ':motivo' => $data['motivo']
            ]);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Pedido cancelado correctamente'
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

if ($action === 'get_dashboard_data') {
        $response = [
            'success' => true,
            'estadisticas' => getEstadisticas($pdo),
            'graficos' => getGraficos($pdo),
            'pedidos' => getPedidos($pdo)
        ];
        
        echo json_encode($response);
    } elseif ($action === 'marcar_completado') {
        marcarCompletado($pdo, $input);
    } elseif ($action === 'cancelar_pedido') {
        cancelarPedido($pdo, $input);
    } elseif ($action === 'get_all_pedidos') {
        getAllPedidos($pdo);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Acción no válida'
        ]);
    }

// ========================================
// FUNCIÓN: OBTENER TODOS LOS PEDIDOS
// ========================================
function getAllPedidos($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT 
                p.ID_Pedido,
                COALESCE(vi.NombreCliente, u.NombreCompleto) as Cliente,
                s.NombreServicio as Servicio,
                p.Fecha,
                p.Total,
                p.Estado,
                v.NombreCompleto as Vendedor
            FROM Pedido p
            INNER JOIN Usuario u ON p.ID_Usuario = u.ID_Usuario
            LEFT JOIN Usuario v ON p.ID_Vendedor = v.ID_Usuario
            LEFT JOIN Servicio s ON p.ID_Servicio = s.ID_Servicio
            LEFT JOIN VentaInfo vi ON p.ID_Pedido = vi.ID_Pedido
            ORDER BY p.Fecha DESC
            LIMIT 100
        ");
        
        echo json_encode([
            'success' => true,
            'pedidos' => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}
?>