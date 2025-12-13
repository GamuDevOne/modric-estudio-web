<?php

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
    
    error_log("Gest-Abonos Action: " . $action);
    
    switch ($action) {
        case 'obtener_detalle_pedido':
            obtenerDetallePedido($pdo, $input);
            break;
        case 'obtener_historial_abonos':
            obtenerHistorialAbonos($pdo, $input);
            break;
        case 'registrar_nuevo_abono':
            registrarNuevoAbono($pdo, $input);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida: ' . $action]);
    }
    
} catch (PDOException $e) {
    error_log("Gest-Abonos Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

// ========================================
// OBTENER DETALLE COMPLETO DEL PEDIDO
// ========================================
function obtenerDetallePedido($pdo, $data) {
    try {
        if (empty($data['idPedido'])) {
            echo json_encode(['success' => false, 'message' => 'ID de pedido requerido']);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                p.ID_Pedido,
                p.Fecha,
                p.Total,
                p.Estado,
                COALESCE(vi.NombreCliente, u.NombreCompleto) as Cliente,
                COALESCE(s.NombreServicio, pk.NombrePaquete, 'N/A') as Servicio,
                v.NombreCompleto as Vendedor,
                COALESCE(c.NombreColegio, 'Sin asignar') as Colegio,
                vi.EstadoPago,
                vi.MetodoPago as MetodoPagoInicial,
                vi.Notas,
                COALESCE((
                    SELECT SUM(Monto) 
                    FROM HistorialAbonos 
                    WHERE ID_Pedido = p.ID_Pedido
                ), 0) as TotalAbonado
            FROM Pedido p
            INNER JOIN Usuario u ON p.ID_Usuario = u.ID_Usuario
            LEFT JOIN Usuario v ON p.ID_Vendedor = v.ID_Usuario
            LEFT JOIN Servicio s ON p.ID_Servicio = s.ID_Servicio
            LEFT JOIN Paquete pk ON p.ID_Paquete = pk.ID_Paquete
            LEFT JOIN Colegio c ON p.ID_Colegio = c.ID_Colegio
            LEFT JOIN VentaInfo vi ON p.ID_Pedido = vi.ID_Pedido
            WHERE p.ID_Pedido = :idPedido
        ");
        
        $stmt->execute([':idPedido' => $data['idPedido']]);
        $pedido = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$pedido) {
            echo json_encode(['success' => false, 'message' => 'Pedido no encontrado']);
            return;
        }
        
        // Calcular saldo pendiente
        $pedido['SaldoPendiente'] = max(0, $pedido['Total'] - $pedido['TotalAbonado']);
        
        echo json_encode([
            'success' => true,
            'pedido' => $pedido
        ]);
        
    } catch (PDOException $e) {
        error_log("Error obtenerDetallePedido: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// OBTENER HISTORIAL DE ABONOS
// ========================================
function obtenerHistorialAbonos($pdo, $data) {
    try {
        if (empty($data['idPedido'])) {
            echo json_encode(['success' => false, 'message' => 'ID de pedido requerido']);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                ha.ID_Abono,
                ha.Monto,
                ha.MetodoPago,
                ha.Notas,
                ha.FechaRegistro,
                u.NombreCompleto as RegistradoPor
            FROM HistorialAbonos ha
            LEFT JOIN Usuario u ON ha.ID_RegistradoPor = u.ID_Usuario
            WHERE ha.ID_Pedido = :idPedido
            ORDER BY ha.FechaRegistro ASC
        ");
        
        $stmt->execute([':idPedido' => $data['idPedido']]);
        $abonos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'abonos' => $abonos
        ]);
        
    } catch (PDOException $e) {
        error_log("Error obtenerHistorialAbonos: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// REGISTRAR NUEVO ABONO
// ========================================
function registrarNuevoAbono($pdo, $data) {
    try {
        if (empty($data['idPedido']) || empty($data['monto']) || empty($data['idUsuario'])) {
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            return;
        }
        
        // Validar monto positivo
        if ($data['monto'] <= 0) {
            echo json_encode(['success' => false, 'message' => 'El monto debe ser mayor a 0']);
            return;
        }
        
        // Obtener total del pedido y total abonado
        $stmt = $pdo->prepare("
            SELECT 
                p.Total,
                COALESCE((
                    SELECT SUM(Monto) 
                    FROM HistorialAbonos 
                    WHERE ID_Pedido = p.ID_Pedido
                ), 0) as TotalAbonado
            FROM Pedido p
            WHERE p.ID_Pedido = :idPedido
        ");
        $stmt->execute([':idPedido' => $data['idPedido']]);
        $pedido = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$pedido) {
            echo json_encode(['success' => false, 'message' => 'Pedido no encontrado']);
            return;
        }
        
        $saldoPendiente = $pedido['Total'] - $pedido['TotalAbonado'];
        $nuevoTotal = $pedido['TotalAbonado'] + $data['monto'];
        
        // Validar que no exceda el total
        if ($nuevoTotal > $pedido['Total']) {
            echo json_encode([
                'success' => false, 
                'message' => 'El monto ($' . number_format($data['monto'], 2) . ') excede el saldo pendiente ($' . number_format($saldoPendiente, 2) . ')'
            ]);
            return;
        }
        
        // Iniciar transacción
        $pdo->beginTransaction();
        
        try {
            // Registrar nuevo abono
            $stmt = $pdo->prepare("
                INSERT INTO HistorialAbonos (ID_Pedido, Monto, MetodoPago, Notas, ID_RegistradoPor)
                VALUES (:idPedido, :monto, :metodo, :notas, :idUsuario)
            ");
            
            $stmt->execute([
                ':idPedido' => $data['idPedido'],
                ':monto' => $data['monto'],
                ':metodo' => $data['metodo'] ?? null,
                ':notas' => $data['notas'] ?? null,
                ':idUsuario' => $data['idUsuario']
            ]);
            
            $pagoCompletado = false;
            
            // Si completó el pago, actualizar estado
            if ($nuevoTotal >= $pedido['Total']) {
                $stmt = $pdo->prepare("
                    UPDATE VentaInfo 
                    SET EstadoPago = 'Completo',
                        MontoAbonado = :nuevoTotal
                    WHERE ID_Pedido = :idPedido
                ");
                $stmt->execute([
                    ':nuevoTotal' => $nuevoTotal,
                    ':idPedido' => $data['idPedido']
                ]);
                
                $pagoCompletado = true;
            } else {
                // Actualizar monto abonado
                $stmt = $pdo->prepare("
                    UPDATE VentaInfo 
                    SET MontoAbonado = :nuevoTotal
                    WHERE ID_Pedido = :idPedido
                ");
                $stmt->execute([
                    ':nuevoTotal' => $nuevoTotal,
                    ':idPedido' => $data['idPedido']
                ]);
            }
            
            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => $pagoCompletado 
                    ? '¡Pago completado! El pedido ha sido pagado en su totalidad.' 
                    : 'Abono registrado correctamente.',
                'completado' => $pagoCompletado,
                'nuevoTotal' => $nuevoTotal,
                'saldoRestante' => $pedido['Total'] - $nuevoTotal
            ]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        
    } catch (PDOException $e) {
        error_log("Error registrarNuevoAbono: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}
?>