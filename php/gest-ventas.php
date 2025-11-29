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
        
        // Obtener ID del cliente (para ahora, usaremos el ID del vendedor como ID_Usuario temporal)
        // En el futuro, esto debería ser el ID real del cliente
        $idUsuario = $data['idVendedor']; // TEMPORAL - debería ser ID del cliente real
        
        // Insertar pedido
        $stmt = $pdo->prepare("
            INSERT INTO Pedido (
                ID_Usuario,
                ID_Vendedor,
                ID_Colegio,
                ID_Servicio,
                ID_Paquete,
                Total,
                Estado,
                Fecha
            ) VALUES (
                :idUsuario,
                :idVendedor,
                :idColegio,
                :idServicio,
                :idPaquete,
                :total,
                'Pendiente',
                NOW()
            )
        ");
        
        $stmt->execute([
            ':idUsuario' => $idUsuario,
            ':idVendedor' => $data['idVendedor'],
            ':idColegio' => $data['idColegio'],
            ':idServicio' => $data['idServicio'] ?? null,
            ':idPaquete' => $data['idPaquete'] ?? null,
            ':total' => $data['total']
        ]);
        
        $idPedido = $pdo->lastInsertId();
        
        // Registrar información adicional en una tabla auxiliar
        // (Crear tabla VentaInfo si no existe)
        try {
            $stmt = $pdo->prepare("
                INSERT INTO VentaInfo (
                    ID_Pedido,
                    NombreCliente,
                    MetodoPago,
                    EstadoPago,
                    Notas
                ) VALUES (
                    :idPedido,
                    :nombreCliente,
                    :metodoPago,
                    :estadoPago,
                    :notas
                )
            ");
            
            $stmt->execute([
                ':idPedido' => $idPedido,
                ':nombreCliente' => $data['nombreCliente'],
                ':metodoPago' => $data['metodoPago'] ?? null,
                ':estadoPago' => $data['estadoPago'] ?? 'Completo',
                ':notas' => $data['notas'] ?? null
            ]);
        } catch (PDOException $e) {
            // Si la tabla no existe, crearla
            if ($e->getCode() == '42S02') {
                $pdo->exec("
                    CREATE TABLE VentaInfo (
                        ID_VentaInfo INT AUTO_INCREMENT PRIMARY KEY,
                        ID_Pedido INT NOT NULL,
                        NombreCliente VARCHAR(200) NOT NULL,
                        MetodoPago VARCHAR(50) NULL,
                        EstadoPago VARCHAR(20) NOT NULL DEFAULT 'Completo',
                        Notas TEXT NULL,
                        FechaRegistro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        
                        CONSTRAINT FK_VentaInfo_Pedido FOREIGN KEY (ID_Pedido)
                            REFERENCES Pedido(ID_Pedido)
                            ON DELETE CASCADE
                            ON UPDATE CASCADE,
                        
                        INDEX IX_VentaInfo_Pedido (ID_Pedido)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                ");
                
                // Reintentar inserción
                $stmt->execute([
                    ':idPedido' => $idPedido,
                    ':nombreCliente' => $data['nombreCliente'],
                    ':metodoPago' => $data['metodoPago'] ?? null,
                    ':estadoPago' => $data['estadoPago'] ?? 'Completo',
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
        
        // Obtener ventas del día
        $stmt = $pdo->prepare("
            SELECT 
                p.ID_Pedido,
                p.Fecha,
                p.Total,
                vi.NombreCliente,
                vi.MetodoPago,
                vi.EstadoPago,
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
        
        // Calcular estadísticas
        $totalVentas = count($ventas);
        $totalMonto = 0;
        
        foreach ($ventas as $venta) {
            $totalMonto += floatval($venta['Total']);
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