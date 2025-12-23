<?php
// ========================================
// GEST-ABONOS.PHP - VERSIÓN CORREGIDA
// FIX CRÍTICO: NO cambiar estado del pedido al completar el pago
// 
// FLUJO CORRECTO:
// 1. Abono parcial → EstadoPago = 'Abono', Estado = 'Pendiente'
// 2. Pago completo → EstadoPago = 'Completo', Estado = 'Pendiente' ✓
// 3. CEO marca completado → Estado = 'Completado' (desaparece de pendientes)
// 4. CEO cancela → Estado = 'Cancelado' (desaparece de pendientes)
// ========================================


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
// OBTENER DETALLE COMPLETO DEL PEDIDO - CORREGIDO
// ========================================
function obtenerDetallePedido($pdo, $data) {
    try {
        if (empty($data['idPedido'])) {
            echo json_encode(['success' => false, 'message' => 'ID de pedido requerido']);
            return;
        }
        
        // ========================================
        // PASO 1: Obtener datos del pedido
        // ========================================
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
                vi.Notas
            FROM pedido p
            INNER JOIN usuario u ON p.ID_Usuario = u.ID_Usuario
            LEFT JOIN usuario v ON p.ID_Vendedor = v.ID_Usuario
            LEFT JOIN servicio s ON p.ID_Servicio = s.ID_Servicio
            LEFT JOIN paquete pk ON p.ID_Paquete = pk.ID_Paquete
            LEFT JOIN colegio c ON p.ID_Colegio = c.ID_Colegio
            LEFT JOIN ventainfo vi ON p.ID_Pedido = vi.ID_Pedido
            WHERE p.ID_Pedido = :idPedido
        ");
        
        $stmt->execute([':idPedido' => $data['idPedido']]);
        $pedido = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$pedido) {
            echo json_encode(['success' => false, 'message' => 'Pedido no encontrado']);
            return;
        }
        
        // ========================================
        // PASO 2: Calcular total abonado CORRECTAMENTE
        // ========================================
        // LÓGICA:
        // - Si EstadoPago = 'Completo' → Total abonado = Total del pedido
        // - Si hay abonos en HistorialAbonos → Usar SUM de esos
        // - Si EstadoPago = 'Abono' sin historial → Usar VentaInfo.MontoAbonado
        // ========================================
        
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(Monto), 0) as TotalHistorial
            FROM historialabonos 
            WHERE ID_Pedido = :idPedido
        ");
        $stmt->execute([':idPedido' => $data['idPedido']]);
        $resultHistorial = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalHistorial = round(floatval($resultHistorial['TotalHistorial']), 2);
        
        // Determinar total abonado según el caso
        $totalAbonado = 0;
        
        if ($pedido['EstadoPago'] === 'Completo' && $totalHistorial == 0) {
            // Caso 1: Pago completo directo
            $totalAbonado = round(floatval($pedido['Total']), 2);
            
        } elseif ($totalHistorial > 0) {
            // Caso 2: Hay abonos registrados en historial
            // Usar la suma del historial
            $totalAbonado = $totalHistorial;
            error_log("  Tipo: Con historial de abonos");
            
        } else {
            // Caso 3: Sin historial, verificar VentaInfo por si acaso
            $totalAbonado = 0;
            error_log("  Tipo: Sin abonos registrados");
        }
        
        // ========================================
        // PASO 3: Calcular saldo pendiente
        // ========================================
        $total = round(floatval($pedido['Total']), 2);
        $saldoPendiente = round($total - $totalAbonado, 2);
        
        // Asegurar que no haya valores negativos
        if ($saldoPendiente < 0) {
            $saldoPendiente = 0;
        }
        
        // Agregar datos calculados al array
        $pedido['TotalAbonado'] = $totalAbonado;
        $pedido['SaldoPendiente'] = $saldoPendiente;
        
        error_log("✓ Detalle pedido #{$data['idPedido']}:");
        error_log("  Total: $total");
        error_log("  Abonado: $totalAbonado");
        error_log("  Saldo: $saldoPendiente");
        error_log("  EstadoPago: " . ($pedido['EstadoPago'] ?? 'null'));
        
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
            FROM historialabonos ha
            LEFT JOIN usuario u ON ha.ID_RegistradoPor = u.ID_Usuario
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
// FIX: NO CAMBIAR ESTADO DEL PEDIDO
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
                    FROM historialabonos 
                    WHERE ID_Pedido = p.ID_Pedido
                ), 0) as TotalAbonado
            FROM pedido p
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
        // Validación con margen de error
        // ==========================================
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
                INSERT INTO historialabonos (ID_Pedido, Monto, MetodoPago, Notas, ID_RegistradoPor)
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
            // FIX CRÍTICO: NO CAMBIAR ESTADO DEL PEDIDO
            // Solo actualizar VentaInfo
            // ==========================================
            if ($nuevoTotal >= ($totalPedido - $margenError)) {
                // Ajustar el nuevo total al total exacto del pedido
                $nuevoTotalAjustado = $totalPedido;
                
                // SOLO actualizar VentaInfo, NO el estado del pedido
                $stmt = $pdo->prepare("
                    UPDATE ventainfo 
                    SET EstadoPago = 'Completo',
                        MontoAbonado = :nuevoTotal
                    WHERE ID_Pedido = :idPedido
                ");
                $stmt->execute([
                    ':nuevoTotal' => $nuevoTotalAjustado,
                    ':idPedido' => $data['idPedido']
                ]);
                
                error_log("✅ Pago completado - VentaInfo actualizada");
                error_log("ℹ️ El pedido sigue en estado 'Pendiente' hasta que el CEO lo marque como Completado");
                
                $pagoCompletado = true;
                $saldoRestante = 0;
            } else {
                // Actualizar monto abonado
                $stmt = $pdo->prepare("
                    UPDATE ventainfo 
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
                    ? '¡Pago completado! El pedido permanecerá en "Pendientes" hasta que se marque como Completado.' 
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