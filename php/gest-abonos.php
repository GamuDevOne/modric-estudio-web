<?php
// ========================================
// GEST-ABONOS.PHP - VERSIÓN CORREGIDA
// FIX: Validación correcta considerando decimales y redondeo
// ========================================

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
        
        // Calcular saldo pendiente con redondeo a 2 decimales
        $total = round(floatval($pedido['Total']), 2);
        $abonado = round(floatval($pedido['TotalAbonado']), 2);
        $saldoPendiente = round($total - $abonado, 2);
        
        // Asegurar que no haya valores negativos por errores de redondeo
        if ($saldoPendiente < 0.01) {
            $saldoPendiente = 0;
        }
        
        $pedido['SaldoPendiente'] = $saldoPendiente;
        
        error_log("Detalle pedido #{$data['idPedido']}: Total=$total, Abonado=$abonado, Saldo=$saldoPendiente");
        
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
// REGISTRAR NUEVO ABONO - VERSION CORREGIDA
// ========================================
function registrarNuevoAbono($pdo, $data) {
    try {
        if (empty($data['idPedido']) || empty($data['monto']) || empty($data['idUsuario'])) {
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            return;
        }
        
        // Convertir monto a float con 2 decimales
        $montoNuevo = round(floatval($data['monto']), 2);
        
        error_log("=== REGISTRAR NUEVO ABONO ===");
        error_log("ID Pedido: {$data['idPedido']}");
        error_log("Monto nuevo: $montoNuevo");
        
        // Validar monto positivo
        if ($montoNuevo <= 0) {
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
        
        // Redondear valores a 2 decimales
        $totalPedido = round(floatval($pedido['Total']), 2);
        $totalAbonado = round(floatval($pedido['TotalAbonado']), 2);
        $saldoPendiente = round($totalPedido - $totalAbonado, 2);
        $nuevoTotal = round($totalAbonado + $montoNuevo, 2);
        
        error_log("Total pedido: $totalPedido");
        error_log("Total abonado: $totalAbonado");
        error_log("Saldo pendiente: $saldoPendiente");
        error_log("Nuevo total: $nuevoTotal");
        
        // ==========================================
        // FIX CRÍTICO: Validación con margen de error
        // ==========================================
        // Permitir un margen de 0.01 centavos por errores de redondeo
        $margenError = 0.01;
        
        if ($nuevoTotal > ($totalPedido + $margenError)) {
            $diferencia = round($nuevoTotal - $totalPedido, 2);
            echo json_encode([
                'success' => false, 
                'message' => "El monto ($" . number_format($montoNuevo, 2) . ") excede el saldo pendiente ($" . number_format($saldoPendiente, 2) . "). Diferencia: $" . number_format($diferencia, 2)
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
                ':monto' => $montoNuevo,
                ':metodo' => $data['metodo'] ?? null,
                ':notas' => $data['notas'] ?? null,
                ':idUsuario' => $data['idUsuario']
            ]);
            
            error_log("Abono registrado en HistorialAbonos");
            
            $pagoCompletado = false;
            
            // ==========================================
            // FIX: Considerar pago completado con margen
            // ==========================================
            if ($nuevoTotal >= ($totalPedido - $margenError)) {
                // Ajustar el nuevo total al total exacto del pedido
                $nuevoTotalAjustado = $totalPedido;
                
                $stmt = $pdo->prepare("
                    UPDATE VentaInfo 
                    SET EstadoPago = 'Completo',
                        MontoAbonado = :nuevoTotal
                    WHERE ID_Pedido = :idPedido
                ");
                $stmt->execute([
                    ':nuevoTotal' => $nuevoTotalAjustado,
                    ':idPedido' => $data['idPedido']
                ]);
                
                error_log("VentaInfo actualizada - EstadoPago: Completo");
                
                // Actualizar estado del pedido
                $stmt = $pdo->prepare("
                    UPDATE Pedido 
                    SET Estado = 'Completado'
                    WHERE ID_Pedido = :idPedido
                ");
                $stmt->execute([':idPedido' => $data['idPedido']]);
                
                error_log("Pedido actualizado - Estado: Completado");
                
                $pagoCompletado = true;
                $saldoRestante = 0;
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
                
                error_log("VentaInfo actualizada - MontoAbonado: $nuevoTotal");
                
                $saldoRestante = round($totalPedido - $nuevoTotal, 2);
            }
            
            $pdo->commit();
            
            error_log("Transacción completada exitosamente");
            
            echo json_encode([
                'success' => true,
                'message' => $pagoCompletado 
                    ? '¡Pago completado! El pedido ha sido pagado en su totalidad.' 
                    : 'Abono registrado correctamente.',
                'completado' => $pagoCompletado,
                'nuevoTotal' => $nuevoTotal,
                'saldoRestante' => $saldoRestante
            ]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log("Error en transacción: " . $e->getMessage());
            throw $e;
        }
        
    } catch (PDOException $e) {
        error_log("Error registrarNuevoAbono: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}
?>