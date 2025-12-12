<?php
// php/gest-colegios.php

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
    
    // LOG DE DEBUG
    error_log("gest-colegios.php - Action: " . $action);
    error_log("gest-colegios.php - Input: " . json_encode($input));
    
    switch ($action) {
        case 'obtener_colegios':
            obtenerColegios($pdo);
            break;
        case 'crear_colegio':
            crearColegio($pdo, $input);
            break;
        case 'editar_colegio':
            editarColegio($pdo, $input);
            break;
        case 'cerrar_colegio':
            cerrarColegio($pdo, $input);
            break;
        case 'eliminar_colegio':
            eliminarColegio($pdo, $input);
            break;
        case 'obtener_vendedores_disponibles':
            obtenerVendedoresDisponibles($pdo);
            break;
        case 'obtener_asignaciones':
            obtenerAsignaciones($pdo, $input);
            break;
        case 'asignar_vendedor':
            asignarVendedor($pdo, $input);
            break;
        case 'quitar_asignacion':
            quitarAsignacion($pdo, $input);
            break;
        case 'obtener_asignacion_vendedor':
            obtenerAsignacionVendedor($pdo, $input);
            break;
        case 'obtener_estadisticas_colegio':
            obtenerEstadisticasColegio($pdo, $input);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
    
} catch (PDOException $e) {
    error_log("gest-colegios.php - Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

// ========================================
// OBTENER TODOS LOS COLEGIOS
// ========================================
function obtenerColegios($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT 
                c.ID_Colegio,
                c.NombreColegio,
                c.Direccion,
                c.Telefono,
                c.FechaCreacion,
                c.Estado,
                c.Notas,
                (SELECT COUNT(*) FROM AsignacionVendedor av 
                 WHERE av.ID_Colegio = c.ID_Colegio 
                 AND av.FechaAsignacion = CURDATE()
                 AND av.Estado = 'Activo') as VendedoresHoy,
                (SELECT COUNT(*) FROM Pedido p 
                 WHERE p.ID_Colegio = c.ID_Colegio) as TotalVentas
            FROM Colegio c
            ORDER BY c.Estado ASC, c.NombreColegio ASC
        ");
        
        echo json_encode([
            'success' => true,
            'colegios' => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// CREAR COLEGIO
// ========================================
function crearColegio($pdo, $data) {
    try {
        if (empty($data['nombreColegio'])) {
            echo json_encode(['success' => false, 'message' => 'Nombre del colegio requerido']);
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO Colegio (NombreColegio, Direccion, Telefono, Notas)
            VALUES (:nombre, :direccion, :telefono, :notas)
        ");
        
        $stmt->execute([
            ':nombre' => $data['nombreColegio'],
            ':direccion' => $data['direccion'] ?? null,
            ':telefono' => $data['telefono'] ?? null,
            ':notas' => $data['notas'] ?? null
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Colegio creado correctamente',
            'idColegio' => $pdo->lastInsertId()
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// EDITAR COLEGIO
// ========================================
function editarColegio($pdo, $data) {
    try {
        if (empty($data['idColegio']) || empty($data['nombreColegio'])) {
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            return;
        }
        
        $stmt = $pdo->prepare("
            UPDATE Colegio SET
                NombreColegio = :nombre,
                Direccion = :direccion,
                Telefono = :telefono,
                Notas = :notas
            WHERE ID_Colegio = :id
        ");
        
        $stmt->execute([
            ':nombre' => $data['nombreColegio'],
            ':direccion' => $data['direccion'] ?? null,
            ':telefono' => $data['telefono'] ?? null,
            ':notas' => $data['notas'] ?? null,
            ':id' => $data['idColegio']
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Colegio actualizado']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// CERRAR COLEGIO (Base)
// ========================================
function cerrarColegio($pdo, $data) {
    try {
        //FIX: Validación mejorada que acepta 0 y valores numéricos (11-12-25)
        if (!isset($data['idColegio']) || $data['idColegio'] === '' || $data['idColegio'] === null) {
            error_log("cerrarColegio - Error: ID no proporcionado. Data recibida: " . json_encode($data));
            echo json_encode(['success' => false, 'message' => 'ID requerido']);
            return;
        }
        
        $idColegio = intval($data['idColegio']);
        
        if ($idColegio <= 0) {
            error_log("cerrarColegio - Error: ID inválido ($idColegio). Data: " . json_encode($data));
            echo json_encode(['success' => false, 'message' => 'ID inválido']);
            return;
        }
        
        error_log("cerrarColegio - Procesando ID: $idColegio");
        
        $stmt = $pdo->prepare("UPDATE Colegio SET Estado = 'Cerrado' WHERE ID_Colegio = :id");
        $stmt->execute([':id' => $idColegio]);
        
        if ($stmt->rowCount() === 0) {
            error_log("cerrarColegio - Advertencia: No se encontró colegio con ID $idColegio");
            echo json_encode(['success' => false, 'message' => 'Colegio no encontrado']);
            return;
        }
        
        $stmt = $pdo->prepare("UPDATE AsignacionVendedor SET Estado = 'Finalizado' WHERE ID_Colegio = :id");
        $stmt->execute([':id' => $idColegio]);
        
        error_log("cerrarColegio - Éxito: Colegio $idColegio cerrado");
        echo json_encode(['success' => true, 'message' => 'Colegio cerrado correctamente']);
    } catch (PDOException $e) {
        error_log("cerrarColegio - Error PDO: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// ELIMINAR COLEGIO
// ========================================
function eliminarColegio($pdo, $data) {
    try {
        //FIX: Validación mejorada (11-12-25)
        if (!isset($data['idColegio']) || $data['idColegio'] === '' || $data['idColegio'] === null) {
            error_log("eliminarColegio - Error: ID no proporcionado. Data: " . json_encode($data));
            echo json_encode(['success' => false, 'message' => 'ID requerido']);
            return;
        }
        
        $idColegio = intval($data['idColegio']);
        
        if ($idColegio <= 0) {
            error_log("eliminarColegio - Error: ID inválido ($idColegio). Data: " . json_encode($data));
            echo json_encode(['success' => false, 'message' => 'ID inválido']);
            return;
        }
        
        error_log("eliminarColegio - Verificando ventas para ID: $idColegio");
        
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM Pedido WHERE ID_Colegio = :id");
        $stmt->execute([':id' => $idColegio]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['total'] > 0) {
            error_log("eliminarColegio - Advertencia: Colegio $idColegio tiene {$result['total']} ventas");
            echo json_encode(['success' => false, 'message' => 'No se puede eliminar: tiene ventas asociadas']);
            return;
        }
        
        error_log("eliminarColegio - Eliminando colegio ID: $idColegio");
        
        $stmt = $pdo->prepare("DELETE FROM Colegio WHERE ID_Colegio = :id");
        $stmt->execute([':id' => $idColegio]);
        
        if ($stmt->rowCount() === 0) {
            error_log("eliminarColegio - Advertencia: No se encontró colegio con ID $idColegio");
            echo json_encode(['success' => false, 'message' => 'Colegio no encontrado']);
            return;
        }
        
        error_log("eliminarColegio - Éxito: Colegio $idColegio eliminado");
        echo json_encode(['success' => true, 'message' => 'Colegio eliminado']);
    } catch (PDOException $e) {
        error_log("eliminarColegio - Error PDO: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// OBTENER VENDEDORES DISPONIBLES
// ========================================
function obtenerVendedoresDisponibles($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT ID_Usuario, NombreCompleto, Correo
            FROM Usuario
            WHERE TipoUsuario = 'Vendedor'
            ORDER BY NombreCompleto ASC
        ");
        
        echo json_encode([
            'success' => true,
            'vendedores' => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// OBTENER ASIGNACIONES DE UN COLEGIO
// ========================================
function obtenerAsignaciones($pdo, $data) {
    try {
        if (empty($data['idColegio'])) {
            echo json_encode(['success' => false, 'message' => 'ID de colegio requerido']);
            return;
        }
        
        $fecha = $data['fecha'] ?? date('Y-m-d');
        
        $stmt = $pdo->prepare("
            SELECT 
                av.ID_Asignacion,
                av.ID_Vendedor,
                av.FechaAsignacion,
                av.Estado,
                u.NombreCompleto,
                u.Correo,
                (SELECT COUNT(*) FROM Pedido p 
                WHERE p.ID_Vendedor = av.ID_Vendedor 
                AND p.ID_Colegio = av.ID_Colegio
                AND DATE(p.Fecha) = av.FechaAsignacion
                AND p.Estado != 'Cancelado') as VentasDelDia,
                (SELECT COALESCE(SUM(p.Total), 0) FROM Pedido p 
                 WHERE p.ID_Vendedor = av.ID_Vendedor 
                 AND p.ID_Colegio = av.ID_Colegio
                 AND DATE(p.Fecha) = av.FechaAsignacion) as TotalVendido
            FROM AsignacionVendedor av
            INNER JOIN Usuario u ON av.ID_Vendedor = u.ID_Usuario
            WHERE av.ID_Colegio = :idColegio
            AND av.FechaAsignacion = :fecha
            ORDER BY u.NombreCompleto ASC
        ");
        
        $stmt->execute([
            ':idColegio' => $data['idColegio'],
            ':fecha' => $fecha
        ]);
        
        echo json_encode([
            'success' => true,
            'asignaciones' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'fecha' => $fecha
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// ASIGNAR VENDEDOR A COLEGIO
// ========================================
function asignarVendedor($pdo, $data) {
    try {
        if (empty($data['idVendedor']) || empty($data['idColegio']) || empty($data['fecha'])) {
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            return;
        }
        
        // Verificar si ya existe asignación
        $stmt = $pdo->prepare("
            SELECT ID_Asignacion FROM AsignacionVendedor 
            WHERE ID_Vendedor = :idVendedor 
            AND ID_Colegio = :idColegio
            AND FechaAsignacion = :fecha
        ");
        $stmt->execute([
            ':idVendedor' => $data['idVendedor'],
            ':idColegio' => $data['idColegio'],
            ':fecha' => $data['fecha']
        ]);
        
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'El vendedor ya está asignado a este colegio en esa fecha']);
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO AsignacionVendedor (ID_Vendedor, ID_Colegio, FechaAsignacion)
            VALUES (:idVendedor, :idColegio, :fecha)
        ");
        
        $stmt->execute([
            ':idVendedor' => $data['idVendedor'],
            ':idColegio' => $data['idColegio'],
            ':fecha' => $data['fecha']
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Vendedor asignado correctamente']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// QUITAR ASIGNACIÓN
// ========================================
function quitarAsignacion($pdo, $data) {
    try {
        if (empty($data['idAsignacion'])) {
            echo json_encode(['success' => false, 'message' => 'ID de asignación requerido']);
            return;
        }
        
        $stmt = $pdo->prepare("DELETE FROM AsignacionVendedor WHERE ID_Asignacion = :id");
        $stmt->execute([':id' => $data['idAsignacion']]);
        
        echo json_encode(['success' => true, 'message' => 'Asignación eliminada']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// OBTENER ASIGNACIÓN DEL VENDEDOR (CORREGIDO)
// ========================================
function obtenerAsignacionVendedor($pdo, $data) {
    try {
        if (empty($data['idVendedor'])) {
            echo json_encode(['success' => false, 'message' => 'ID de vendedor requerido']);
            return;
        }
        
        // Usar fecha proporcionada o fecha actual
        $fecha = !empty($data['fecha']) ? $data['fecha'] : date('Y-m-d');
        
        // LOG DE DEBUG
        error_log("Buscando asignación para vendedor: " . $data['idVendedor'] . " en fecha: " . $fecha);
        
        $stmt = $pdo->prepare("
            SELECT 
                av.ID_Asignacion,
                av.FechaAsignacion,
                c.ID_Colegio,
                c.NombreColegio,
                c.Direccion
            FROM AsignacionVendedor av
            INNER JOIN Colegio c ON av.ID_Colegio = c.ID_Colegio
            WHERE av.ID_Vendedor = :idVendedor
            AND av.FechaAsignacion = :fecha
            AND av.Estado = 'Activo'
            AND c.Estado = 'Activo'
        ");
        
        $stmt->execute([
            ':idVendedor' => $data['idVendedor'],
            ':fecha' => $fecha
        ]);
        
        $asignaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // LOG DE DEBUG
        error_log("Asignaciones encontradas: " . count($asignaciones));
        error_log("Datos: " . json_encode($asignaciones));
        
        echo json_encode([
            'success' => true,
            'asignaciones' => $asignaciones,
            'fecha' => $fecha
        ]);
    } catch (PDOException $e) {
        error_log("Error en obtenerAsignacionVendedor: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// OBTENER ESTADÍSTICAS DE UN COLEGIO
// ========================================
function obtenerEstadisticasColegio($pdo, $data) {
    try {
        if (empty($data['idColegio'])) {
            echo json_encode(['success' => false, 'message' => 'ID de colegio requerido']);
            return;
        }
        
        // Total ventas
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as totalVentas,
                COALESCE(SUM(Total), 0) as totalMonto
            FROM Pedido
            WHERE ID_Colegio = :id AND Estado != 'Cancelado'
        ");
        $stmt->execute([':id' => $data['idColegio']]);
        $totales = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Ventas por vendedor
        $stmt = $pdo->prepare("
            SELECT 
                u.NombreCompleto,
                COUNT(p.ID_Pedido) as ventas,
                COALESCE(SUM(p.Total), 0) as monto
            FROM Pedido p
            INNER JOIN Usuario u ON p.ID_Vendedor = u.ID_Usuario
            WHERE p.ID_Colegio = :id AND p.Estado != 'Cancelado'
            GROUP BY p.ID_Vendedor
            ORDER BY monto DESC
        ");
        $stmt->execute([':id' => $data['idColegio']]);
        $porVendedor = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'estadisticas' => [
                'totalVentas' => $totales['totalVentas'],
                'totalMonto' => $totales['totalMonto'],
                'porVendedor' => $porVendedor
            ]
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}
?>