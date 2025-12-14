<?php
// reportes.php
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
    
    error_log("Reportes Action: " . $action);
    
    switch ($action) {
        case 'generar_reporte_ventas':
            generarReporteVentas($pdo, $input);
            break;
        
        case 'generar_reporte_abonos':
            generarReporteAbonos($pdo, $input);
            break;
        
        case 'generar_reporte_documentos':
            generarReporteDocumentos($pdo, $input);
            break;
        
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida: ' . $action]);
    }
    
} catch (PDOException $e) {
    error_log("Reportes Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

// ========================================
// REPORTE DE VENTAS
// ========================================
function generarReporteVentas($pdo, $data) {
    try {
        $fechaInicio = $data['fechaInicio'] ?? date('Y-m-01');
        $fechaFin = $data['fechaFin'] ?? date('Y-m-t');
        $idVendedor = $data['idVendedor'] ?? null;
        $idColegio = $data['idColegio'] ?? null;
        
        // Query base
        $query = "
            SELECT 
                p.ID_Pedido,
                p.Fecha,
                COALESCE(vi.NombreCliente, u.NombreCompleto) as Cliente,
                v.NombreCompleto as Vendedor,
                COALESCE(c.NombreColegio, 'Sin colegio') as Colegio,
                COALESCE(s.NombreServicio, pk.NombrePaquete, 'N/A') as Servicio,
                p.Total as TotalPedido,
                vi.EstadoPago,
                COALESCE(vi.MontoAbonado, 0) as MontoAbonado,
                CASE 
                    WHEN vi.EstadoPago = 'Abono' THEN vi.MontoAbonado
                    WHEN vi.EstadoPago = 'Completo' THEN p.Total
                    ELSE 0
                END as MontoReal,
                (p.Total - COALESCE(vi.MontoAbonado, 0)) as SaldoPendiente,
                p.Estado as EstadoPedido,
                p.Prioridad
            FROM Pedido p
            LEFT JOIN Usuario u ON p.ID_Usuario = u.ID_Usuario
            LEFT JOIN Usuario v ON p.ID_Vendedor = v.ID_Usuario
            LEFT JOIN Colegio c ON p.ID_Colegio = c.ID_Colegio
            LEFT JOIN Servicio s ON p.ID_Servicio = s.ID_Servicio
            LEFT JOIN Paquete pk ON p.ID_Paquete = pk.ID_Paquete
            LEFT JOIN VentaInfo vi ON p.ID_Pedido = vi.ID_Pedido
            WHERE p.Fecha BETWEEN :fechaInicio AND :fechaFin
            AND p.Estado != 'Cancelado'
        ";
        
        $params = [
            ':fechaInicio' => $fechaInicio,
            ':fechaFin' => $fechaFin
        ];
        
        // Filtros opcionales
        if ($idVendedor) {
            $query .= " AND p.ID_Vendedor = :idVendedor";
            $params[':idVendedor'] = $idVendedor;
        }
        
        if ($idColegio) {
            $query .= " AND p.ID_Colegio = :idColegio";
            $params[':idColegio'] = $idColegio;
        }
        
        $query .= " ORDER BY p.Fecha DESC";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $ventas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calcular totales
        $totalVentas = count($ventas);
        $montoTotal = 0;
        $montoPendiente = 0;
        $ventasCompletas = 0;
        $ventasAbono = 0;
        
        foreach ($ventas as $venta) {
            $montoTotal += floatval($venta['MontoReal']);
            $montoPendiente += floatval($venta['SaldoPendiente']);
            
            if ($venta['EstadoPago'] === 'Completo') {
                $ventasCompletas++;
            } elseif ($venta['EstadoPago'] === 'Abono') {
                $ventasAbono++;
            }
        }
        
        echo json_encode([
            'success' => true,
            'reporte' => [
                'tipo' => 'ventas',
                'periodo' => [
                    'inicio' => $fechaInicio,
                    'fin' => $fechaFin
                ],
                'resumen' => [
                    'totalVentas' => $totalVentas,
                    'montoTotal' => $montoTotal,
                    'montoPendiente' => $montoPendiente,
                    'ventasCompletas' => $ventasCompletas,
                    'ventasAbono' => $ventasAbono
                ],
                'ventas' => $ventas
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Error generarReporteVentas: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// REPORTE DE ABONOS
// ========================================
function generarReporteAbonos($pdo, $data) {
    try {
        $fechaInicio = $data['fechaInicio'] ?? date('Y-m-01');
        $fechaFin = $data['fechaFin'] ?? date('Y-m-t');
        
        $query = "
            SELECT 
                ha.ID_Abono,
                ha.FechaRegistro,
                p.ID_Pedido,
                COALESCE(vi.NombreCliente, u.NombreCompleto) as Cliente,
                v.NombreCompleto as Vendedor,
                ha.Monto,
                ha.MetodoPago,
                ha.Notas,
                reg.NombreCompleto as RegistradoPor,
                p.Total as TotalPedido,
                (SELECT SUM(Monto) 
                 FROM HistorialAbonos 
                 WHERE ID_Pedido = p.ID_Pedido 
                 AND FechaRegistro <= ha.FechaRegistro) as AcumuladoHasta,
                (p.Total - (SELECT SUM(Monto) 
                            FROM HistorialAbonos 
                            WHERE ID_Pedido = p.ID_Pedido 
                            AND FechaRegistro <= ha.FechaRegistro)) as SaldoRestante
            FROM HistorialAbonos ha
            INNER JOIN Pedido p ON ha.ID_Pedido = p.ID_Pedido
            LEFT JOIN Usuario u ON p.ID_Usuario = u.ID_Usuario
            LEFT JOIN Usuario v ON p.ID_Vendedor = v.ID_Usuario
            LEFT JOIN Usuario reg ON ha.ID_RegistradoPor = reg.ID_Usuario
            LEFT JOIN VentaInfo vi ON p.ID_Pedido = vi.ID_Pedido
            WHERE ha.FechaRegistro BETWEEN :fechaInicio AND :fechaFin
            ORDER BY ha.FechaRegistro DESC
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            ':fechaInicio' => $fechaInicio . ' 00:00:00',
            ':fechaFin' => $fechaFin . ' 23:59:59'
        ]);
        $abonos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calcular totales
        $totalAbonos = count($abonos);
        $montoTotalAbonos = 0;
        $abonosPorMetodo = [];
        
        foreach ($abonos as $abono) {
            $montoTotalAbonos += floatval($abono['Monto']);
            
            $metodo = $abono['MetodoPago'] ?? 'No especificado';
            if (!isset($abonosPorMetodo[$metodo])) {
                $abonosPorMetodo[$metodo] = [
                    'cantidad' => 0,
                    'monto' => 0
                ];
            }
            $abonosPorMetodo[$metodo]['cantidad']++;
            $abonosPorMetodo[$metodo]['monto'] += floatval($abono['Monto']);
        }
        
        echo json_encode([
            'success' => true,
            'reporte' => [
                'tipo' => 'abonos',
                'periodo' => [
                    'inicio' => $fechaInicio,
                    'fin' => $fechaFin
                ],
                'resumen' => [
                    'totalAbonos' => $totalAbonos,
                    'montoTotal' => $montoTotalAbonos,
                    'abonosPorMetodo' => $abonosPorMetodo
                ],
                'abonos' => $abonos
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Error generarReporteAbonos: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// REPORTE DE DOCUMENTOS (ÁLBUMES)
// ========================================
function generarReporteDocumentos($pdo, $data) {
    try {
        $fechaInicio = $data['fechaInicio'] ?? date('Y-m-01');
        $fechaFin = $data['fechaFin'] ?? date('Y-m-t');
        
        $query = "
            SELECT 
                a.ID_Album,
                a.Titulo,
                a.FechaSubida,
                a.FechaCaducidad,
                a.Estado,
                u.NombreCompleto as Cliente,
                u.Correo as CorreoCliente,
                COUNT(DISTINCT f.ID_Foto) as TotalFotos,
                COUNT(DISTINCT CASE WHEN f.Descargada = 1 THEN f.ID_Foto END) as FotosDescargadas,
                COUNT(DISTINCT ld.ID_Log) as TotalDescargas,
                DATEDIFF(a.FechaCaducidad, NOW()) as DiasRestantes
            FROM AlbumCliente a
            INNER JOIN Usuario u ON a.ID_Cliente = u.ID_Usuario
            LEFT JOIN FotoAlbum f ON a.ID_Album = f.ID_Album
            LEFT JOIN LogDescarga ld ON f.ID_Foto = ld.ID_Foto
            WHERE a.FechaSubida BETWEEN :fechaInicio AND :fechaFin
            GROUP BY a.ID_Album
            ORDER BY a.FechaSubida DESC
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            ':fechaInicio' => $fechaInicio,
            ':fechaFin' => $fechaFin
        ]);
        $albumes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calcular totales
        $totalAlbumes = count($albumes);
        $totalFotosSubidas = 0;
        $totalFotosDescargadas = 0;
        $totalDescargas = 0;
        $albumesActivos = 0;
        $albumesCerrados = 0;
        $albumesVencidos = 0;
        
        foreach ($albumes as $album) {
            $totalFotosSubidas += intval($album['TotalFotos']);
            $totalFotosDescargadas += intval($album['FotosDescargadas']);
            $totalDescargas += intval($album['TotalDescargas']);
            
            switch ($album['Estado']) {
                case 'Activo':
                    $albumesActivos++;
                    break;
                case 'Cerrado':
                    $albumesCerrados++;
                    break;
                case 'Vencido':
                    $albumesVencidos++;
                    break;
            }
        }
        
        echo json_encode([
            'success' => true,
            'reporte' => [
                'tipo' => 'documentos',
                'periodo' => [
                    'inicio' => $fechaInicio,
                    'fin' => $fechaFin
                ],
                'resumen' => [
                    'totalAlbumes' => $totalAlbumes,
                    'albumesActivos' => $albumesActivos,
                    'albumesCerrados' => $albumesCerrados,
                    'albumesVencidos' => $albumesVencidos,
                    'totalFotosSubidas' => $totalFotosSubidas,
                    'totalFotosDescargadas' => $totalFotosDescargadas,
                    'totalDescargas' => $totalDescargas
                ],
                'albumes' => $albumes
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Error generarReporteDocumentos: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}
?>