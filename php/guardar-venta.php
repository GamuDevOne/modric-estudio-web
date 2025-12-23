<?php
// ========================================
// GUARDAR VENTA COMPLETA EN BASE DE DATOS
// FIX: NO crear usuarios temporales aquí
// Los usuarios temporales SOLO se crean desde documentos.php
// ========================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuración de la base de datos
$host = 'localhost';
$dbname = 'u951150559_modricestudio';
$username = 'u951150559_modric';
$password = '|Fi|b~qQw7';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Recibir datos JSON
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('No se recibieron datos válidos');
    }
    
    // Log de datos recibidos
    error_log("Datos recibidos para guardar venta: " . print_r($input, true));
    
    // Validar campos requeridos
    if (!isset($input['cliente']['nombre']) || !isset($input['paquete']) || !isset($input['metodoPago'])) {
        throw new Exception('Faltan campos obligatorios');
    }
    
    // Verificar si viene desde vendedor
    $desdeVendedor = isset($input['desdeVendedor']) && $input['desdeVendedor'] === true;
    
    // Iniciar transacción
    $pdo->beginTransaction();
    
    try {
        // ========================================
        // PASO 1: NO CREAR USUARIO TEMPORAL
        // Usar ID del CEO (1) como usuario por defecto
        // ========================================
        $idCliente = 1; // CEO por defecto
        
        $nombreCompleto = $input['cliente']['nombre'];
        $correo = isset($input['cliente']['correo']) ? $input['cliente']['correo'] : null;
        $telefono = isset($input['cliente']['telefono']) ? $input['cliente']['telefono'] : null;
        $escuela = isset($input['cliente']['escuela']) ? $input['cliente']['escuela'] : null;
        $grupo = isset($input['cliente']['grupo']) ? $input['cliente']['grupo'] : null;
        
        error_log("✓ Cliente: $nombreCompleto (asignado a ID_Usuario: $idCliente - CEO)");
        error_log("NO se creó usuario temporal - se creará cuando el CEO genere el álbum");
        
        // ========================================
        // PASO 2: OBTENER IDs DE SERVICIO/PAQUETE
        // ========================================
        $idServicio = null;
        $idPaquete = null;
        $precioTotal = 0;
        
        if ($desdeVendedor && isset($input['ventaInfo'])) {
            // Viene desde vendedor, usar sus datos
            $idServicio = $input['ventaInfo']['idServicio'] ?? null;
            $idPaquete = $input['ventaInfo']['idPaquete'] ?? null;
            
            // Calcular precio con ITBMS
            $precioBase = isset($input['productos'][0]['base']) ? floatval($input['productos'][0]['base']) : 0;
            $precioTotal = $precioBase;
        } else {
            // Viene del formulario directo, buscar el servicio/paquete
            $paqueteSeleccionado = $input['paquete'];
            
            // Intentar buscar como servicio primero
            $stmt = $pdo->prepare("SELECT ID_Servicio, Precio FROM servicio WHERE NombreServicio LIKE :nombre LIMIT 1");
            $stmt->execute([':nombre' => '%' . $paqueteSeleccionado . '%']);
            $servicio = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($servicio) {
                $idServicio = $servicio['ID_Servicio'];
                $precioTotal = floatval($servicio['Precio']);
            } else {
                // Buscar como paquete
                $stmt = $pdo->prepare("SELECT ID_Paquete, Precio FROM paquete WHERE NombrePaquete LIKE :nombre LIMIT 1");
                $stmt->execute([':nombre' => '%' . $paqueteSeleccionado . '%']);
                $paquete = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($paquete) {
                    $idPaquete = $paquete['ID_Paquete'];
                    $precioTotal = floatval($paquete['Precio']);
                } else {
                    // Si no se encuentra, usar precio de productos
                    $precioTotal = isset($input['productos'][0]['total']) ? floatval($input['productos'][0]['total']) : 0;
                }
            }
        }
        
        // ========================================
        // PASO 3: CREAR PEDIDO
        // ========================================
        $idVendedor = 1; // CEO por defecto
        $idColegio = null;
        
        if ($desdeVendedor && isset($input['ventaInfo'])) {
            $idVendedor = $input['ventaInfo']['idVendedor'];
            $idColegio = $input['ventaInfo']['idColegio'] ?? null;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO pedido (
                Fecha,
                Estado,
                Prioridad,
                ID_Usuario,
                NombreCliente,
                ID_Vendedor,
                ID_Servicio,
                ID_Paquete,
                ID_Colegio,
                Total
            ) VALUES (
                NOW(),
                'Pendiente',
                0,
                :idCliente,
                :nombreCliente,
                :idVendedor,
                :idServicio,
                :idPaquete,
                :idColegio,
                :total
            )
        ");
        
        $stmt->execute([
            ':idCliente' => $idCliente,
            ':nombreCliente' => $nombreCompleto,
            ':idVendedor' => $idVendedor,
            ':idServicio' => $idServicio,
            ':idPaquete' => $idPaquete,
            ':idColegio' => $idColegio,
            ':total' => $precioTotal
        ]);
        
        $idPedido = $pdo->lastInsertId();
        error_log("Pedido creado con ID: $idPedido");
        
        // ========================================
        // PASO 4: CREAR VENTAINFO
        // ========================================
        $metodoPago = $input['metodoPago'];
        $tipoPago = $input['tipoPago'] ?? 'completo';
        $estadoPago = ($tipoPago === 'abono') ? 'Abono' : 'Completo';
        $montoAbonado = null;
        
        // Extraer monto abonado si existe
        if ($tipoPago === 'abono' && isset($input['cantidadAbono'])) {
            $montoAbonado = floatval(str_replace(['$', ','], '', $input['cantidadAbono']));
        }
        
        $notas = $input['comentario'] ?? '';
        
        // Agregar info de cliente a las notas (para referencia futura)
        if ($escuela) {
            $notas .= "\nEscuela: " . $escuela;
        }
        if ($grupo) {
            $notas .= "\nGrupo: " . $grupo;
        }
        if ($telefono) {
            $notas .= "\nTeléfono: " . $telefono;
        }
        if ($correo) {
            $notas .= "\nCorreo: " . $correo;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO ventainfo (
                ID_Pedido,
                NombreCliente,
                MetodoPago,
                EstadoPago,
                MontoAbonado,
                Notas,
                FechaRegistro
            ) VALUES (
                :idPedido,
                :nombreCliente,
                :metodoPago,
                :estadoPago,
                :montoAbonado,
                :notas,
                NOW()
            )
        ");
        
        $stmt->execute([
            ':idPedido' => $idPedido,
            ':nombreCliente' => $nombreCompleto,
            ':metodoPago' => $metodoPago,
            ':estadoPago' => $estadoPago,
            ':montoAbonado' => $montoAbonado,
            ':notas' => trim($notas)
        ]);
        
        error_log("VentaInfo creada para pedido: $idPedido");
        
        // ========================================
        // PASO 5: REGISTRAR ABONO SI APLICA
        // ========================================
        if ($estadoPago === 'Abono' && $montoAbonado > 0) {
            $stmt = $pdo->prepare("
                INSERT INTO historialabonos (
                    ID_Pedido,
                    Monto,
                    MetodoPago,
                    Notas,
                    ID_RegistradoPor,
                    FechaRegistro
                ) VALUES (
                    :idPedido,
                    :monto,
                    :metodoPago,
                    'Abono inicial al registrar venta',
                    :idVendedor,
                    NOW()
                )
            ");
            
            $stmt->execute([
                ':idPedido' => $idPedido,
                ':monto' => $montoAbonado,
                ':metodoPago' => $metodoPago,
                ':idVendedor' => $idVendedor
            ]);
            
            error_log("Abono inicial registrado: $montoAbonado");
        }
        
        // Commit de la transacción
        $pdo->commit();
        
        // ========================================
        // RESPUESTA EXITOSA
        // ========================================
        echo json_encode([
            'success' => true,
            'message' => 'Venta registrada correctamente',
            'idPedido' => $idPedido,
            'idCliente' => $idCliente,
            'numeroOrden' => 'ORD-' . str_pad($idPedido, 6, '0', STR_PAD_LEFT)
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    error_log("Error PDO en guardar-venta.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Error general en guardar-venta.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>