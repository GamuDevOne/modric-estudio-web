<?php
// php/cotizaciones.php
// API REST para el sistema de cotizaciones

$host = 'localhost';
$dbname = 'u951150559_modricestudio';
$username = 'u951150559_modric';
$password = '|Fi|b~qQw7';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, DELETE');
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
    
    error_log("Cotizaciones Action: " . $action);
    
    switch ($action) {
        // ===== ENDPOINTS PARA CLIENTE =====
        case 'obtener_fechas_disponibles':
            obtenerFechasDisponibles($pdo, $input);
            break;
        
        case 'crear_cotizacion':
            crearCotizacion($pdo, $input);
            break;
        
        case 'obtener_cotizacion_cliente':
            obtenerCotizacionCliente($pdo, $input);
            break;
        
        // ===== ENDPOINTS PARA ADMIN =====
        case 'obtener_todas_cotizaciones':
            obtenerTodasCotizaciones($pdo);
            break;
        
        case 'obtener_cotizaciones_pendientes':
            obtenerCotizacionesPendientes($pdo);
            break;
        
        case 'revisar_cotizacion':
            revisarCotizacion($pdo, $input);
            break;
        
        case 'aprobar_cotizacion':
            aprobarCotizacion($pdo, $input);
            break;
        
        case 'rechazar_cotizacion':
            rechazarCotizacion($pdo, $input);
            break;
        
        case 'bloquear_fecha':
            bloquearFecha($pdo, $input);
            break;
        
        case 'obtener_bloqueos':
            obtenerBloqueos($pdo);
            break;
        
        default:
            echo json_encode([
                'success' => false,
                'message' => 'Acción no válida: ' . $action
            ]);
    }
    
} catch (PDOException $e) {
    error_log("Cotizaciones Error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

// ========================================
// CLIENTE: Obtener fechas disponibles para el calendario
// ========================================
function obtenerFechasDisponibles($pdo, $data) {
    try {
        $mesInicio = $data['mesInicio'] ?? date('Y-m-01');
        $mesFin = $data['mesFin'] ?? date('Y-m-t');
        
        // Obtener fechas ocupadas y su estado
        $stmt = $pdo->prepare("
            SELECT 
                Fecha,
                Estado,
                SUM(CantidadSesiones) as TotalSesiones
            FROM V_FechasOcupadas
            WHERE Fecha BETWEEN ? AND ?
            GROUP BY Fecha, Estado
        ");
        $stmt->execute([$mesInicio, $mesFin]);
        $fechasOcupadas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Obtener fechas bloqueadas
        $stmt = $pdo->prepare("
            SELECT 
                FechaInicio,
                FechaFin,
                Motivo
            FROM BloqueoFecha
            WHERE Estado = 'Activo'
            AND (
                (FechaInicio BETWEEN ? AND ?)
                OR (FechaFin BETWEEN ? AND ?)
                OR (FechaInicio <= ? AND FechaFin >= ?)
            )
        ");
        $stmt->execute([$mesInicio, $mesFin, $mesInicio, $mesFin, $mesInicio, $mesFin]);
        $fechasBloqueadas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'fechasOcupadas' => $fechasOcupadas,
            'fechasBloqueadas' => $fechasBloqueadas
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
}

// ========================================
// CLIENTE: Crear nueva cotización
// ========================================
function crearCotizacion($pdo, $data) {
    try {
        // Validaciones
        if (empty($data['nombreCliente']) || empty($data['correoCliente']) || 
            empty($data['tipoSesion']) || empty($data['descripcion']) || 
            empty($data['fechaSolicitada'])) {
            throw new Exception('Datos incompletos');
        }
        
        // Verificar que la fecha no esté bloqueada
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as bloqueada
            FROM BloqueoFecha
            WHERE ? BETWEEN FechaInicio AND FechaFin
            AND Estado = 'Activo'
        ");
        $stmt->execute([$data['fechaSolicitada']]);
        $bloqueada = $stmt->fetch(PDO::FETCH_ASSOC)['bloqueada'];
        
        if ($bloqueada > 0) {
            throw new Exception('La fecha seleccionada no está disponible');
        }
        
        // Verificar si ya hay muchas sesiones ese día (máximo 3)
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as total
            FROM Pedido
            WHERE FechaSesion = ?
            AND Estado IN ('Confirmado', 'En_Proceso')
        ");
        $stmt->execute([$data['fechaSolicitada']]);
        $totalSesiones = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        if ($totalSesiones >= 3) {
            throw new Exception('La fecha está completamente reservada. Por favor, elige otra fecha.');
        }
        
        // Insertar cotización
        $stmt = $pdo->prepare("
            INSERT INTO Cotizacion (
                ID_Cliente,
                NombreCliente,
                CorreoCliente,
                TelefonoCliente,
                TipoSesion,
                DescripcionSesion,
                FechaSolicitada,
                HoraSolicitada,
                Estado
            ) VALUES (
                :idCliente,
                :nombreCliente,
                :correoCliente,
                :telefonoCliente,
                :tipoSesion,
                :descripcion,
                :fechaSolicitada,
                :horaSolicitada,
                'Pendiente'
            )
        ");
        
        $stmt->execute([
            ':idCliente' => $data['idCliente'] ?? null,
            ':nombreCliente' => $data['nombreCliente'],
            ':correoCliente' => $data['correoCliente'],
            ':telefonoCliente' => $data['telefonoCliente'] ?? null,
            ':tipoSesion' => $data['tipoSesion'],
            ':descripcion' => $data['descripcion'],
            ':fechaSolicitada' => $data['fechaSolicitada'],
            ':horaSolicitada' => $data['horaSolicitada'] ?? null
        ]);
        
        $idCotizacion = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'message' => '¡Cotización enviada correctamente! Te contactaremos pronto.',
            'idCotizacion' => $idCotizacion
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

// ========================================
// CLIENTE: Obtener cotización por correo
// ========================================
function obtenerCotizacionCliente($pdo, $data) {
    try {
        if (empty($data['correoCliente'])) {
            throw new Exception('Correo requerido');
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                ID_Cotizacion,
                NombreCliente,
                TipoSesion,
                DescripcionSesion,
                FechaSolicitada,
                HoraSolicitada,
                Estado,
                PrecioEstimado,
                NotasAdmin,
                FechaCreacion
            FROM Cotizacion
            WHERE CorreoCliente = ?
            ORDER BY FechaCreacion DESC
        ");
        
        $stmt->execute([$data['correoCliente']]);
        $cotizaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'cotizaciones' => $cotizaciones
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

// ========================================
// ADMIN: Obtener todas las cotizaciones
// ========================================
function obtenerTodasCotizaciones($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT 
                c.ID_Cotizacion,
                c.NombreCliente,
                c.CorreoCliente,
                c.TelefonoCliente,
                c.TipoSesion,
                c.DescripcionSesion,
                c.FechaSolicitada,
                c.HoraSolicitada,
                c.Estado,
                c.PrecioEstimado,
                c.NotasAdmin,
                c.Prioridad,
                c.FechaCreacion,
                c.FechaRespuesta,
                DATEDIFF(c.FechaSolicitada, CURDATE()) as DiasHasta
            FROM Cotizacion c
            ORDER BY 
                CASE c.Estado
                    WHEN 'Pendiente' THEN 1
                    WHEN 'En_Revision' THEN 2
                    WHEN 'Aprobada' THEN 3
                    ELSE 4
                END,
                c.FechaSolicitada ASC
        ");
        
        $cotizaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'cotizaciones' => $cotizaciones
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

// ========================================
// ADMIN: Obtener cotizaciones pendientes
// ========================================
function obtenerCotizacionesPendientes($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT 
                c.ID_Cotizacion,
                c.NombreCliente,
                c.CorreoCliente,
                c.TelefonoCliente,
                c.TipoSesion,
                c.DescripcionSesion,
                c.FechaSolicitada,
                c.HoraSolicitada,
                c.Estado,
                c.FechaCreacion,
                DATEDIFF(c.FechaSolicitada, CURDATE()) as DiasHasta
            FROM Cotizacion c
            WHERE c.Estado IN ('Pendiente', 'En_Revision')
            ORDER BY c.FechaSolicitada ASC
        ");
        
        $cotizaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'cotizaciones' => $cotizaciones,
            'total' => count($cotizaciones)
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

// ========================================
// ADMIN: Marcar cotización como "En Revisión"
// ========================================
function revisarCotizacion($pdo, $data) {
    try {
        if (empty($data['idCotizacion'])) {
            throw new Exception('ID de cotización requerido');
        }
        
        $stmt = $pdo->prepare("
            UPDATE Cotizacion
            SET Estado = 'En_Revision'
            WHERE ID_Cotizacion = ?
        ");
        $stmt->execute([$data['idCotizacion']]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Cotización marcada como en revisión'
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

// ========================================
// ADMIN: Aprobar cotización y crear pedido
// ========================================
function aprobarCotizacion($pdo, $data) {
    try {
        if (empty($data['idCotizacion']) || empty($data['precioEstimado'])) {
            throw new Exception('Datos incompletos');
        }
        
        $pdo->beginTransaction();
        
        // Obtener datos de la cotización
        $stmt = $pdo->prepare("SELECT * FROM Cotizacion WHERE ID_Cotizacion = ?");
        $stmt->execute([$data['idCotizacion']]);
        $cotizacion = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$cotizacion) {
            throw new Exception('Cotización no encontrada');
        }
        
        // Actualizar cotización
        $stmt = $pdo->prepare("
            UPDATE Cotizacion
            SET Estado = 'Aprobada',
                PrecioEstimado = ?,
                NotasAdmin = ?,
                FechaRespuesta = NOW()
            WHERE ID_Cotizacion = ?
        ");
        $stmt->execute([
            $data['precioEstimado'],
            $data['notasAdmin'] ?? null,
            $data['idCotizacion']
        ]);
        
        // Crear pedido automáticamente
        $stmt = $pdo->prepare("
            INSERT INTO Pedido (
                ID_Usuario,
                ID_Vendedor,
                Total,
                FechaSesion,
                HoraSesion,
                Estado,
                Prioridad
            ) VALUES (
                ?,
                ?,
                ?,
                ?,
                ?,
                'Confirmado',
                ?
            )
        ");
        
        // Determinar prioridad según precio
        $prioridad = ($data['precioEstimado'] >= 300) ? 1 : 2;
        
        $stmt->execute([
            $cotizacion['ID_Cliente'] ?? 1, // Si no hay cliente, usar usuario temporal
            $data['idVendedor'] ?? 1, // ID del admin/vendedor que aprueba
            $data['precioEstimado'],
            $cotizacion['FechaSolicitada'],
            $cotizacion['HoraSolicitada'],
            $prioridad
        ]);
        
        $idPedido = $pdo->lastInsertId();
        
        // Vincular cotización con pedido
        $stmt = $pdo->prepare("
            UPDATE Cotizacion
            SET ID_Pedido = ?
            WHERE ID_Cotizacion = ?
        ");
        $stmt->execute([$idPedido, $data['idCotizacion']]);
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Cotización aprobada y pedido creado',
            'idPedido' => $idPedido
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

// ========================================
// ADMIN: Rechazar cotización
// ========================================
function rechazarCotizacion($pdo, $data) {
    try {
        if (empty($data['idCotizacion']) || empty($data['motivo'])) {
            throw new Exception('ID y motivo requeridos');
        }
        
        $stmt = $pdo->prepare("
            UPDATE Cotizacion
            SET Estado = 'Rechazada',
                NotasAdmin = ?,
                FechaRespuesta = NOW()
            WHERE ID_Cotizacion = ?
        ");
        $stmt->execute([
            $data['motivo'],
            $data['idCotizacion']
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Cotización rechazada'
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

// ========================================
// ADMIN: Bloquear fecha(s)
// ========================================
function bloquearFecha($pdo, $data) {
    try {
        if (empty($data['fechaInicio']) || empty($data['fechaFin'])) {
            throw new Exception('Fechas requeridas');
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO BloqueoFecha (FechaInicio, FechaFin, Motivo)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([
            $data['fechaInicio'],
            $data['fechaFin'],
            $data['motivo'] ?? 'Bloqueado por administrador'
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Fecha(s) bloqueada(s) correctamente'
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

// ========================================
// ADMIN: Obtener bloqueos activos
// ========================================
function obtenerBloqueos($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT 
                ID_Bloqueo,
                FechaInicio,
                FechaFin,
                Motivo,
                Estado,
                FechaCreacion
            FROM BloqueoFecha
            WHERE Estado = 'Activo'
            ORDER BY FechaInicio ASC
        ");
        
        $bloqueos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'bloqueos' => $bloqueos
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}
?>