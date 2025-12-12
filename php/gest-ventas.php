<?php
// php/gest-ventas.php

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
        case 'obtener_servicios':
            obtenerServicios($pdo);
            break;
        case 'obtener_paquetes':
            obtenerPaquetes($pdo);
            break;
        case 'registrar_venta':
            registrarVenta($pdo, $input);
            break;
        case 'obtener_ventas_vendedor_hoy':
            obtenerVentasVendedorHoy($pdo, $input);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

// ========================================
// OBTENER SERVICIOS
// ========================================
function obtenerServicios($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT ID_Servicio, NombreServicio, Precio
            FROM Servicio
            WHERE Estado = 'Activo'
            ORDER BY NombreServicio ASC
        ");
        
        echo json_encode([
            'success' => true,
            'servicios' => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// OBTENER PAQUETES
// ========================================
function obtenerPaquetes($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT ID_Paquete, NombrePaquete, Precio
            FROM Paquete
            ORDER BY NombrePaquete ASC
        ");
        
        echo json_encode([
            'success' => true,
            'paquetes' => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// REGISTRAR VENTA
// ========================================
function registrarVenta($pdo, $data) {
    try {
        // Validar datos requeridos
        if (empty($data['idVendedor']) || empty($data['idColegio']) || 
            empty($data['nombreCliente']) || empty($data['total'])) {
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            return;
        }
        
        //NUEVO: Validar abono si es necesario (11/12/25)
        if ($data['estadoPago'] === 'Abono') {
            if (empty($data['montoAbonado']) || $data['montoAbonado'] <= 0) {
                echo json_encode(['success' => false, 'message' => 'Monto abonado inválido']);
                return;
            }
            
            if ($data['montoAbonado'] > $data['total']) {
                echo json_encode(['success' => false, 'message' => 'El abono no puede ser mayor al total']);
                return;
            }
        }
        
        // Obtener ID del cliente
        $idUsuario = $data['idVendedor']; // TEMPORAL
        
                //Calcular prioridad ANTES de insertar (11/12/25)
        $prioridad = ($data['total'] >= 300) ? 1 : 2; // 1=Alta, 2=Baja

        $stmt = $pdo->prepare("
            INSERT INTO Pedido (
                ID_Usuario,
                ID_Vendedor,
                ID_Colegio,
                NombreCliente,
                ID_Servicio,
                ID_Paquete,
                Total,
                Prioridad,
                Estado,
                Fecha
            ) VALUES (
                :idUsuario,
                :idVendedor,
                :idColegio,
                :nombreCliente,
                :idServicio,
                :idPaquete,
                :total,
                :prioridad,
                'Pendiente',
                NOW()
            )
        ");

        $stmt->execute([
            ':idUsuario' => $idUsuario,
            ':idVendedor' => $data['idVendedor'],
            ':idColegio' => $data['idColegio'],
            ':nombreCliente' => $data['nombreCliente'],
            ':idServicio' => $data['idServicio'] ?? null,
            ':idPaquete' => $data['idPaquete'] ?? null,
            ':total' => $data['total'],
            ':prioridad' => $prioridad
        ]);
        
        $idPedido = $pdo->lastInsertId();
        
        // ACTUALIZADO: Registrar información de venta CON monto abonado (11/12/25)
        try {
            $stmt = $pdo->prepare("
                INSERT INTO VentaInfo (
                    ID_Pedido,
                    NombreCliente,
                    MetodoPago,
                    EstadoPago,
                    MontoAbonado,
                    Notas
                ) VALUES (
                    :idPedido,
                    :nombreCliente,
                    :metodoPago,
                    :estadoPago,
                    :montoAbonado,
                    :notas
                )
            ");
            
            $montoAbonado = null;
            if ($data['estadoPago'] === 'Abono') {
                $montoAbonado = $data['montoAbonado'];
            }
            
            $stmt->execute([
                ':idPedido' => $idPedido,
                ':nombreCliente' => $data['nombreCliente'],
                ':metodoPago' => $data['metodoPago'] ?? null,
                ':estadoPago' => $data['estadoPago'] ?? 'Completo',
                ':montoAbonado' => $montoAbonado, // ✅ NUEVO
                ':notas' => $data['notas'] ?? null
            ]);
        } catch (PDOException $e) {
            // Si la columna no existe, agregarla
            if (strpos($e->getMessage(), 'Unknown column') !== false) {
                $pdo->exec("ALTER TABLE VentaInfo ADD COLUMN MontoAbonado DECIMAL(10,2) NULL AFTER EstadoPago");
                
                // Reintentar inserción
                $stmt->execute([
                    ':idPedido' => $idPedido,
                    ':nombreCliente' => $data['nombreCliente'],
                    ':metodoPago' => $data['metodoPago'] ?? null,
                    ':estadoPago' => $data['estadoPago'] ?? 'Completo',
                    ':montoAbonado' => $montoAbonado,
                    ':notas' => $data['notas'] ?? null
                ]);
            } else {
                throw $e;
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Venta registrada correctamente',
            'idPedido' => $idPedido
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// OBTENER VENTAS DEL VENDEDOR HOY
// ========================================
function obtenerVentasVendedorHoy($pdo, $data) {
    try {
        if (empty($data['idVendedor'])) {
            echo json_encode(['success' => false, 'message' => 'ID de vendedor requerido']);
            return;
        }
        
        // ✅ ACTUALIZADO: Incluir MontoAbonado en SELECT
        $stmt = $pdo->prepare("
            SELECT 
                p.ID_Pedido,
                p.Fecha,
                p.Total,
                vi.NombreCliente,
                vi.MetodoPago,
                vi.EstadoPago,
                vi.MontoAbonado,
                vi.Notas,
                COALESCE(s.NombreServicio, pk.NombrePaquete) as Servicio
            FROM Pedido p
            LEFT JOIN VentaInfo vi ON p.ID_Pedido = vi.ID_Pedido
            LEFT JOIN Servicio s ON p.ID_Servicio = s.ID_Servicio
            LEFT JOIN Paquete pk ON p.ID_Paquete = pk.ID_Paquete
            WHERE p.ID_Vendedor = :idVendedor
            AND DATE(p.Fecha) = CURDATE()
            ORDER BY p.Fecha DESC
        ");
        
        $stmt->execute([':idVendedor' => $data['idVendedor']]);
        $ventas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // ✅ ACTUALIZADO: Calcular estadísticas considerando abonos
        $totalVentas = count($ventas);
        $totalMonto = 0;
        
        foreach ($ventas as $venta) {
            if ($venta['EstadoPago'] === 'Abono' && !empty($venta['MontoAbonado'])) {
                $totalMonto += floatval($venta['MontoAbonado']);
            } else {
                $totalMonto += floatval($venta['Total']);
            }
        }
        
        echo json_encode([
            'success' => true,
            'ventas' => $ventas,
            'estadisticas' => [
                'totalVentas' => $totalVentas,
                'totalMonto' => $totalMonto
            ]
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}
?>