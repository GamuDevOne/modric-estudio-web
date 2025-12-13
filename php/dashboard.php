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

    // Log para debug
    error_log("Dashboard Action: " . $action);
    error_log("Dashboard Input: " . json_encode($input));

    switch ($action) {
        case 'get_dashboard_data':
            $response = [
                'success' => true,
                'estadisticas' => getEstadisticas($pdo),
                'graficos' => getGraficos($pdo),
                'pedidos' => getPedidos($pdo)
            ];
            echo json_encode($response);
            break;
            
        case 'marcar_completado':
            marcarCompletado($pdo, $input);
            break;
            
        case 'cancelar_pedido':
            cancelarPedido($pdo, $input);
            break;
            
        case 'get_all_pedidos':
            getAllPedidos($pdo);
            break;
            
        default:
            echo json_encode([
                'success' => false,
                'message' => 'Acción no válida: ' . $action
            ]);
    }
    
} catch (PDOException $e) {
    error_log("Dashboard PDO Error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Dashboard Error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

// ========================================
// FUNCIÓN: OBTENER ESTADÍSTICAS
// ========================================
function getEstadisticas($pdo) {
    $stats = [];
    
    //ACTUALIZADO: Ventas del mes CON abonos considerados (11/12/25)
    $stmt = $pdo->query("
        SELECT 
            COALESCE(SUM(
                CASE 
                    WHEN vi.EstadoPago = 'Abono' THEN vi.MontoAbonado
                    ELSE p.Total
                END
            ), 0) as ventasMes
        FROM Pedido p
        LEFT JOIN VentaInfo vi ON p.ID_Pedido = vi.ID_Pedido
        WHERE YEAR(p.Fecha) = YEAR(CURDATE()) 
        AND MONTH(p.Fecha) = MONTH(CURDATE())
        AND p.Estado != 'Cancelado'
    ");
    $stats['ventasMes'] = $stmt->fetch(PDO::FETCH_ASSOC)['ventasMes'];
    
    //ACTUALIZADO: Ventas del mes anterior (11/12/25)
    $stmt = $pdo->query("
        SELECT 
            COALESCE(SUM(
                CASE 
                    WHEN vi.EstadoPago = 'Abono' THEN vi.MontoAbonado
                    ELSE p.Total
                END
            ), 0) as ventasMesAnterior
        FROM Pedido p
        LEFT JOIN VentaInfo vi ON p.ID_Pedido = vi.ID_Pedido
        WHERE YEAR(p.Fecha) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        AND MONTH(p.Fecha) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        AND p.Estado != 'Cancelado'
    ");
    $ventasMesAnterior = $stmt->fetch(PDO::FETCH_ASSOC)['ventasMesAnterior'];
    
    // Calcular cambio porcentual
    if ($ventasMesAnterior > 0) {
        $stats['cambioVentas'] = round((($stats['ventasMes'] - $ventasMesAnterior) / $ventasMesAnterior) * 100, 2);
    } else {
        $stats['cambioVentas'] = 0;
    }
    
   // Pedidos activos (NO cancelados ni completados)
$stmt = $pdo->query("
    SELECT COUNT(*) as pedidosActivos
    FROM Pedido
    WHERE Estado NOT IN ('Cancelado', 'Completado')
");
$stats['pedidosActivos'] = $stmt->fetch(PDO::FETCH_ASSOC)['pedidosActivos'];

// Pedidos pendientes de pago (SOLO de los activos)
$stmt = $pdo->query("
    SELECT COUNT(DISTINCT p.ID_Pedido) as pedidosPendientes
    FROM Pedido p
    LEFT JOIN VentaInfo vi ON p.ID_Pedido = vi.ID_Pedido
    WHERE p.Estado NOT IN ('Cancelado', 'Completado')
    AND (
        vi.EstadoPago IS NULL 
        OR vi.EstadoPago = 'Pendiente'
        OR (vi.EstadoPago = 'Abono' AND vi.MontoAbonado < p.Total)
    )
");
$stats['pedidosPendientes'] = $stmt->fetch(PDO::FETCH_ASSOC)['pedidosPendientes'];
    
    // Total de clientes (igual)
    $stmt = $pdo->query("
        SELECT COUNT(*) as totalClientes
        FROM Usuario
        WHERE TipoUsuario = 'Cliente'
    ");
    $stats['totalClientes'] = $stmt->fetch(PDO::FETCH_ASSOC)['totalClientes'];
    
    // Clientes nuevos este mes (igual)
    $stmt = $pdo->query("
        SELECT COUNT(*) as clientesNuevos
        FROM Usuario
        WHERE TipoUsuario = 'Cliente'
        AND YEAR(CURDATE()) = YEAR(CURDATE())
        AND MONTH(CURDATE()) = MONTH(CURDATE())
    ");
    $stats['clientesNuevos'] = $stmt->fetch(PDO::FETCH_ASSOC)['clientesNuevos'];
    
    //ACTUALIZADO: Ingresos totales reales(11/12/25)
    $stmt = $pdo->query("
        SELECT 
            COALESCE(SUM(
                CASE 
                    WHEN vi.EstadoPago = 'Abono' THEN vi.MontoAbonado
                    ELSE p.Total
                END
            ), 0) as ingresosTotales
        FROM Pedido p
        LEFT JOIN VentaInfo vi ON p.ID_Pedido = vi.ID_Pedido
        WHERE p.Estado != 'Cancelado'
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
            COALESCE(SUM(Total), 0) as total
        FROM Pedido
        WHERE Fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        AND Estado != 'Cancelado'
        GROUP BY DATE_FORMAT(Fecha, '%Y-%m')
        ORDER BY mes ASC
    ");
    
    $ventasMensuales = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Si no hay datos, devolver arrays vacíos
    if (empty($ventasMensuales)) {
        $graficos['ventasMensuales'] = [
            'labels' => [],
            'data' => []
        ];
    } else {
        $graficos['ventasMensuales'] = [
            'labels' => array_column($ventasMensuales, 'mesTexto'),
            'data' => array_column($ventasMensuales, 'total')
        ];
    }
    
    // Top 5 servicios más vendidos
    $stmt = $pdo->query("
        SELECT 
            COALESCE(s.NombreServicio, pk.NombrePaquete, 'Sin especificar') as Servicio,
            COUNT(p.ID_Pedido) as cantidad
        FROM Pedido p
        LEFT JOIN Servicio s ON p.ID_Servicio = s.ID_Servicio
        LEFT JOIN Paquete pk ON p.ID_Paquete = pk.ID_Paquete
        WHERE p.Estado != 'Cancelado'
        GROUP BY COALESCE(s.ID_Servicio, pk.ID_Paquete, 0)
        ORDER BY cantidad DESC
        LIMIT 5
    ");
    
    $servicios = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($servicios)) {
        $graficos['servicios'] = [
            'labels' => [],
            'data' => []
        ];
    } else {
        $graficos['servicios'] = [
            'labels' => array_column($servicios, 'Servicio'),
            'data' => array_column($servicios, 'cantidad')
        ];
    }
    
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
            COALESCE(vi.NombreCliente, u.NombreCompleto) as Cliente,
            COALESCE(s.NombreServicio, pk.NombrePaquete, 'N/A') as Servicio,
            p.Fecha,
            p.Total,
            p.Estado,
            v.NombreCompleto as Vendedor
        FROM Pedido p
        INNER JOIN Usuario u ON p.ID_Usuario = u.ID_Usuario
        LEFT JOIN Usuario v ON p.ID_Vendedor = v.ID_Usuario
        LEFT JOIN Servicio s ON p.ID_Servicio = s.ID_Servicio
        LEFT JOIN Paquete pk ON p.ID_Paquete = pk.ID_Paquete
        LEFT JOIN VentaInfo vi ON p.ID_Pedido = vi.ID_Pedido
        ORDER BY p.Fecha DESC
        LIMIT 10
    ");
    $pedidos['ultimos'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    //FIX: Pedidos pendientes (EXCLUIR CANCELADOS) 12/12/25
    $stmt = $pdo->query("
        SELECT 
            p.ID_Pedido,
            COALESCE(vi.NombreCliente, u.NombreCompleto) as Cliente,
            p.Total,
            p.Estado,
            DATEDIFF(CURDATE(), p.Fecha) as DiasPendiente,
            v.NombreCompleto as Vendedor,
            COALESCE(vi.EstadoPago, 'Pendiente') as EstadoPago
        FROM Pedido p
        INNER JOIN Usuario u ON p.ID_Usuario = u.ID_Usuario
        LEFT JOIN Usuario v ON p.ID_Vendedor = v.ID_Usuario
        LEFT JOIN VentaInfo vi ON p.ID_Pedido = vi.ID_Pedido
        WHERE (
            (p.Estado = 'Pendiente' OR vi.EstadoPago = 'Abono')
            AND p.Estado != 'Cancelado'
        )
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
            throw new Exception('ID de pedido requerido');
        }
        
        $idPedido = intval($data['idPedido']);
        
        error_log("Marcando pedido como completado: " . $idPedido);
        
        // Actualizar estado del pedido
        $stmt = $pdo->prepare("UPDATE Pedido SET Estado = 'Completado' WHERE ID_Pedido = ?");
        $stmt->execute([$idPedido]);
        
        // Actualizar estado de pago si existe registro en VentaInfo
        $stmt = $pdo->prepare("UPDATE VentaInfo SET EstadoPago = 'Completo' WHERE ID_Pedido = ?");
        $stmt->execute([$idPedido]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Pedido #' . $idPedido . ' marcado como completado'
        ]);
    } catch (Exception $e) {
        error_log("Error en marcarCompletado: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
}

// ========================================
// FUNCIÓN: CANCELAR PEDIDO
// ========================================
function cancelarPedido($pdo, $data) {
    try {
        if (empty($data['idPedido'])) {
            throw new Exception('ID de pedido requerido');
        }
        
        $idPedido = intval($data['idPedido']);
        $motivo = $data['motivo'] ?? '';
        
        error_log("Cancelando pedido: " . $idPedido . " - Motivo: " . $motivo);
        
        // Actualizar estado del pedido
        $stmt = $pdo->prepare("UPDATE Pedido SET Estado = 'Cancelado' WHERE ID_Pedido = ?");
        $stmt->execute([$idPedido]);
        
        // Si hay motivo, actualizar notas en VentaInfo
        if (!empty($motivo)) {
            $stmt = $pdo->prepare("
                UPDATE VentaInfo 
                SET Notas = CONCAT(COALESCE(Notas, ''), '\n\nMotivo cancelación: ', ?)
                WHERE ID_Pedido = ?
            ");
            $stmt->execute([$motivo, $idPedido]);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Pedido #' . $idPedido . ' cancelado correctamente'
        ]);
    } catch (Exception $e) {
        error_log("Error en cancelarPedido: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
}

// ========================================
// FUNCIÓN: OBTENER TODOS LOS PEDIDOS
// ========================================
function getAllPedidos($pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                p.ID_Pedido,
                COALESCE(vi.NombreCliente, u.NombreCompleto) as Cliente,
                COALESCE(s.NombreServicio, pk.NombrePaquete, 'N/A') as Servicio,
                p.Fecha,
                p.Total,
                p.Estado
            FROM Pedido p
            LEFT JOIN Usuario u ON p.ID_Usuario = u.ID_Usuario
            LEFT JOIN Servicio s ON p.ID_Servicio = s.ID_Servicio
            LEFT JOIN Paquete pk ON p.ID_Paquete = pk.ID_Paquete
            LEFT JOIN VentaInfo vi ON p.ID_Pedido = vi.ID_Pedido
            ORDER BY p.Fecha DESC
            LIMIT 100
        ");
        $stmt->execute();
        $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'pedidos' => $pedidos
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
}
?>