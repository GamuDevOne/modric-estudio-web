<?php
// ========================================
// DASHBOARD - SOLO CEO MEJORA DE SEGURIDAD HECHA(12/15/25)
// ========================================
require_once '../config.php';

header('Content-Type: application/json');

//AUTORIZACIÓN: Solo CEO puede acceder
$user = verificarSesion(['CEO']);

try {
    $pdo = getDBConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    logSeguridad('DASHBOARD_ACCESS', [
        'usuario' => $user['nombre'],
        'action' => $action
    ]);

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
            marcarCompletado($pdo, $input, $user);
            break;
            
        case 'cancelar_pedido':
            cancelarPedido($pdo, $input, $user);
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
    logSeguridad('DASHBOARD_ERROR', ['error' => $e->getMessage()]);
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    logSeguridad('DASHBOARD_ERROR', ['error' => $e->getMessage()]);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

// ========================================
// FUNCIONES 
// ========================================
function getEstadisticas($pdo) {
    $stats = [];
    
    $stmt = $pdo->query("
        SELECT 
            COALESCE(SUM(
                CASE 
                    WHEN vi.EstadoPago = 'Abono' THEN vi.MontoAbonado
                    ELSE p.Total
                END
            ), 0) as ventasMes
        FROM pedido p
        LEFT JOIN ventainfo vi ON p.ID_Pedido = vi.ID_Pedido
        WHERE YEAR(p.Fecha) = YEAR(CURDATE()) 
        AND MONTH(p.Fecha) = MONTH(CURDATE())
        AND p.Estado != 'Cancelado'
    ");
    $stats['ventasMes'] = $stmt->fetch(PDO::FETCH_ASSOC)['ventasMes'];
    
    $stmt = $pdo->query("
        SELECT 
            COALESCE(SUM(
                CASE 
                    WHEN vi.EstadoPago = 'Abono' THEN vi.MontoAbonado
                    ELSE p.Total
                END
            ), 0) as ventasMesAnterior
        FROM pedido p
        LEFT JOIN ventainfo vi ON p.ID_Pedido = vi.ID_Pedido
        WHERE YEAR(p.Fecha) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        AND MONTH(p.Fecha) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        AND p.Estado != 'Cancelado'
    ");
    $ventasMesAnterior = $stmt->fetch(PDO::FETCH_ASSOC)['ventasMesAnterior'];
    
    if ($ventasMesAnterior > 0) {
        $stats['cambioVentas'] = round((($stats['ventasMes'] - $ventasMesAnterior) / $ventasMesAnterior) * 100, 2);
    } else {
        $stats['cambioVentas'] = 0;
    }
    
    $stmt = $pdo->query("
        SELECT COUNT(*) as pedidosActivos
        FROM pedido
        WHERE Estado NOT IN ('Cancelado', 'Completado')
    ");
    $stats['pedidosActivos'] = $stmt->fetch(PDO::FETCH_ASSOC)['pedidosActivos'];

    $stmt = $pdo->query("
        SELECT COUNT(DISTINCT p.ID_Pedido) as pedidosPendientes
        FROM pedido p
        LEFT JOIN ventainfo vi ON p.ID_Pedido = vi.ID_Pedido
        WHERE p.Estado NOT IN ('Cancelado', 'Completado')
        AND (
            vi.EstadoPago IS NULL 
            OR vi.EstadoPago = 'Pendiente'
            OR (vi.EstadoPago = 'Abono' AND vi.MontoAbonado < p.Total)
        )
    ");
    $stats['pedidosPendientes'] = $stmt->fetch(PDO::FETCH_ASSOC)['pedidosPendientes'];
    
    $stmt = $pdo->query("
        SELECT COUNT(*) as totalClientes
        FROM usuario
        WHERE TipoUsuario = 'Cliente'
    ");
    $stats['totalClientes'] = $stmt->fetch(PDO::FETCH_ASSOC)['totalClientes'];
    
    $stmt = $pdo->query("
        SELECT COUNT(*) as clientesNuevos
        FROM usuario
        WHERE TipoUsuario = 'Cliente'
        AND YEAR(CURDATE()) = YEAR(CURDATE())
        AND MONTH(CURDATE()) = MONTH(CURDATE())
    ");
    $stats['clientesNuevos'] = $stmt->fetch(PDO::FETCH_ASSOC)['clientesNuevos'];
    
    $stmt = $pdo->query("
        SELECT 
            COALESCE(SUM(
                CASE 
                    WHEN vi.EstadoPago = 'Abono' THEN vi.MontoAbonado
                    ELSE p.Total
                END
            ), 0) as ingresosTotales
        FROM pedido p
        LEFT JOIN ventainfo vi ON p.ID_Pedido = vi.ID_Pedido
        WHERE p.Estado != 'Cancelado'
    ");
    $stats['ingresosTotales'] = $stmt->fetch(PDO::FETCH_ASSOC)['ingresosTotales'];
    
    return $stats;
}

function getGraficos($pdo) {
    $graficos = [];
    
    $stmt = $pdo->query("
        SELECT 
            DATE_FORMAT(Fecha, '%Y-%m') as mes,
            DATE_FORMAT(Fecha, '%b %Y') as mesTexto,
            COALESCE(SUM(Total), 0) as total
        FROM pedido
        WHERE Fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        AND Estado != 'Cancelado'
        GROUP BY DATE_FORMAT(Fecha, '%Y-%m')
        ORDER BY mes ASC
    ");
    
    $ventasMensuales = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
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
    
    $stmt = $pdo->query("
        SELECT 
            COALESCE(s.NombreServicio, pk.NombrePaquete, 'Sin especificar') as Servicio,
            COUNT(p.ID_Pedido) as cantidad
        FROM pedido p
        LEFT JOIN servicio s ON p.ID_Servicio = s.ID_Servicio
        LEFT JOIN paquete pk ON p.ID_Paquete = pk.ID_Paquete
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

function getPedidos($pdo) {
    $pedidos = [];
    
    // ÚLTIMOS 10 PEDIDOS (sin filtrar)
    $stmt = $pdo->query("
        SELECT 
            p.ID_Pedido,
            COALESCE(vi.NombreCliente, u.NombreCompleto) as Cliente,
            COALESCE(s.NombreServicio, pk.NombrePaquete, 'N/A') as Servicio,
            p.Fecha,
            p.Total,
            p.Estado,
            v.NombreCompleto as Vendedor
        FROM pedido p
        INNER JOIN usuario u ON p.ID_Usuario = u.ID_Usuario
        LEFT JOIN usuario v ON p.ID_Vendedor = v.ID_Usuario
        LEFT JOIN servicio s ON p.ID_Servicio = s.ID_Servicio
        LEFT JOIN paquete pk ON p.ID_Paquete = pk.ID_Paquete
        LEFT JOIN ventainfo vi ON p.ID_Pedido = vi.ID_Pedido
        ORDER BY p.Fecha DESC
        LIMIT 10
    ");
    $pedidos['ultimos'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // ==========================================
    // PEDIDOS PENDIENTES - CONSULTA CORREGIDA
    // ==========================================
    // MOSTRAR: Todos los pedidos que NO estén Completados ni Cancelados
    // Esto incluye:
    // - Estado = 'Pendiente' con cualquier EstadoPago (Pendiente/Abono/Completo)
    // - Estado = 'En_Proceso' con cualquier EstadoPago
    // - Cualquier otro estado que no sea Completado o Cancelado
    // ==========================================
    $stmt = $pdo->query("
        SELECT 
            p.ID_Pedido,
            COALESCE(vi.NombreCliente, u.NombreCompleto) as Cliente,
            p.Total,
            p.Estado,
            DATEDIFF(CURDATE(), p.Fecha) as DiasPendiente,
            v.NombreCompleto as Vendedor,
            COALESCE(vi.EstadoPago, 'Pendiente') as EstadoPago,
            COALESCE(vi.MontoAbonado, 0) as MontoAbonado
        FROM pedido p
        INNER JOIN usuario u ON p.ID_Usuario = u.ID_Usuario
        LEFT JOIN usuario v ON p.ID_Vendedor = v.ID_Usuario
        LEFT JOIN ventainfo vi ON p.ID_Pedido = vi.ID_Pedido
        WHERE p.Estado NOT IN ('Completado', 'Cancelado')
        ORDER BY p.Fecha ASC
    ");
    $pedidos['pendientes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return $pedidos;
}

function marcarCompletado($pdo, $data, $user) {
    try {
        if (empty($data['idPedido'])) {
            throw new Exception('ID de pedido requerido');
        }
        
        $idPedido = intval($data['idPedido']);
        
        logSeguridad('PEDIDO_COMPLETADO', [
            'id_pedido' => $idPedido,
            'usuario' => $user['nombre']
        ]);
        
        $stmt = $pdo->prepare("UPDATE pedido SET Estado = 'Completado' WHERE ID_Pedido = ?");
        $stmt->execute([$idPedido]);
        
        $stmt = $pdo->prepare("UPDATE ventainfo SET EstadoPago = 'Completo' WHERE ID_Pedido = ?");
        $stmt->execute([$idPedido]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Pedido #' . $idPedido . ' marcado como completado'
        ]);
    } catch (Exception $e) {
        logSeguridad('ERROR_MARCAR_COMPLETADO', ['error' => $e->getMessage()]);
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
}

function cancelarPedido($pdo, $data, $user) {
    try {
        if (empty($data['idPedido'])) {
            throw new Exception('ID de pedido requerido');
        }
        
        $idPedido = intval($data['idPedido']);
        $motivo = $data['motivo'] ?? '';
        
        logSeguridad('PEDIDO_CANCELADO', [
            'id_pedido' => $idPedido,
            'usuario' => $user['nombre'],
            'motivo' => $motivo
        ]);
        
        $stmt = $pdo->prepare("UPDATE pedido SET Estado = 'Cancelado' WHERE ID_Pedido = ?");
        $stmt->execute([$idPedido]);
        
        if (!empty($motivo)) {
            $stmt = $pdo->prepare("
                UPDATE ventainfo 
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
        logSeguridad('ERROR_CANCELAR_PEDIDO', ['error' => $e->getMessage()]);
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
}

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
            FROM pedido p
            LEFT JOIN usuario u ON p.ID_Usuario = u.ID_Usuario
            LEFT JOIN servicio s ON p.ID_Servicio = s.ID_Servicio
            LEFT JOIN paquete pk ON p.ID_Paquete = pk.ID_Paquete
            LEFT JOIN ventainfo vi ON p.ID_Pedido = vi.ID_Pedido
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