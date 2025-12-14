<?php
// php/reportes-excel.php
// Generación de reportes en formato Excel usando PhpSpreadsheet

$host = 'localhost';
$dbname = 'ModricEstudio00';
$username = 'root';
$password = '';

// Para Excel necesitamos headers diferentes
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar si PhpSpreadsheet está instalado
if (!class_exists('PhpOffice\PhpSpreadsheet\Spreadsheet')) {
    // Si no está instalado, retornar JSON con error
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'PhpSpreadsheet no está instalado. Usa composer require phpoffice/phpspreadsheet'
    ]);
    exit();
}

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    $tipo = $input['tipo'] ?? '';
    
    error_log("Reportes Excel Action: " . $action . " - Tipo: " . $tipo);
    
    if ($action === 'generar_excel') {
        switch ($tipo) {
            case 'ventas':
                generarExcelVentas($pdo, $input);
                break;
            case 'abonos':
                generarExcelAbonos($pdo, $input);
                break;
            case 'documentos':
                generarExcelDocumentos($pdo, $input);
                break;
            default:
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Tipo de reporte no válido']);
        }
    } else {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
    
} catch (Exception $e) {
    error_log("Reportes Excel Error: " . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

// ========================================
// EXCEL: REPORTE DE VENTAS
// ========================================
function generarExcelVentas($pdo, $data) {
    try {
        $fechaInicio = $data['fechaInicio'] ?? date('Y-m-01');
        $fechaFin = $data['fechaFin'] ?? date('Y-m-t');
        
        // Obtener datos (reutilizamos la query de reportes.php)
        $query = "
            SELECT 
                p.ID_Pedido,
                DATE_FORMAT(p.Fecha, '%d/%m/%Y') as Fecha,
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
                p.Estado as EstadoPedido
            FROM Pedido p
            LEFT JOIN Usuario u ON p.ID_Usuario = u.ID_Usuario
            LEFT JOIN Usuario v ON p.ID_Vendedor = v.ID_Usuario
            LEFT JOIN Colegio c ON p.ID_Colegio = c.ID_Colegio
            LEFT JOIN Servicio s ON p.ID_Servicio = s.ID_Servicio
            LEFT JOIN Paquete pk ON p.ID_Paquete = pk.ID_Paquete
            LEFT JOIN VentaInfo vi ON p.ID_Pedido = vi.ID_Pedido
            WHERE p.Fecha BETWEEN :fechaInicio AND :fechaFin
            AND p.Estado != 'Cancelado'
            ORDER BY p.Fecha DESC
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([':fechaInicio' => $fechaInicio, ':fechaFin' => $fechaFin]);
        $ventas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calcular totales
        $totalVentas = count($ventas);
        $montoTotal = 0;
        $montoPendiente = 0;
        
        foreach ($ventas as $venta) {
            $montoTotal += floatval($venta['MontoReal']);
            $montoPendiente += floatval($venta['SaldoPendiente']);
        }
        
        // Crear Excel
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Reporte de Ventas');
        
        // SECCIÓN 1: TÍTULO
        $sheet->setCellValue('A1', 'REPORTE DE VENTAS');
        $sheet->mergeCells('A1:L1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        
        // SECCIÓN 2: RESUMEN
        $row = 3;
        $sheet->setCellValue('A' . $row, 'Período:');
        $sheet->setCellValue('B' . $row, date('d/m/Y', strtotime($fechaInicio)) . ' - ' . date('d/m/Y', strtotime($fechaFin)));
        $row++;
        $sheet->setCellValue('A' . $row, 'Total Ventas:');
        $sheet->setCellValue('B' . $row, $totalVentas);
        $row++;
        $sheet->setCellValue('A' . $row, 'Monto Total:');
        $sheet->setCellValue('B' . $row, '$' . number_format($montoTotal, 2));
        $row++;
        $sheet->setCellValue('A' . $row, 'Monto Pendiente:');
        $sheet->setCellValue('B' . $row, '$' . number_format($montoPendiente, 2));
        
        // Estilo resumen
        $sheet->getStyle('A3:A' . $row)->getFont()->setBold(true);
        
        // SECCIÓN 3: DETALLE
        $row += 2;
        $headerRow = $row;
        $headers = ['ID', 'Fecha', 'Cliente', 'Vendedor', 'Colegio', 'Servicio', 'Total', 'Estado Pago', 'Abonado', 'Monto Real', 'Saldo', 'Estado'];
        
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . $headerRow, $header);
            $col++;
        }
        
        // Estilo encabezados
        $sheet->getStyle('A' . $headerRow . ':L' . $headerRow)->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4CAF50']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
        ]);
        
        // Datos
        $row++;
        foreach ($ventas as $venta) {
            $sheet->setCellValue('A' . $row, $venta['ID_Pedido']);
            $sheet->setCellValue('B' . $row, $venta['Fecha']);
            $sheet->setCellValue('C' . $row, $venta['Cliente']);
            $sheet->setCellValue('D' . $row, $venta['Vendedor']);
            $sheet->setCellValue('E' . $row, $venta['Colegio']);
            $sheet->setCellValue('F' . $row, $venta['Servicio']);
            $sheet->setCellValue('G' . $row, '$' . number_format($venta['TotalPedido'], 2));
            $sheet->setCellValue('H' . $row, $venta['EstadoPago'] ?? 'Pendiente');
            $sheet->setCellValue('I' . $row, '$' . number_format($venta['MontoAbonado'], 2));
            $sheet->setCellValue('J' . $row, '$' . number_format($venta['MontoReal'], 2));
            $sheet->setCellValue('K' . $row, '$' . number_format($venta['SaldoPendiente'], 2));
            $sheet->setCellValue('L' . $row, $venta['EstadoPedido']);
            $row++;
        }
        
        // Ajustar anchos
        foreach (range('A', 'L') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
        
        // Bordes
        $sheet->getStyle('A' . $headerRow . ':L' . ($row - 1))->applyFromArray([
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]
            ]
        ]);
        
        // Generar archivo
        $filename = 'Reporte_Ventas_' . date('Y-m-d') . '.xlsx';
        
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        header('Cache-Control: max-age=0');
        
        $writer = new Xlsx($spreadsheet);
        $writer->save('php://output');
        exit();
        
    } catch (Exception $e) {
        error_log("Error generarExcelVentas: " . $e->getMessage());
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// EXCEL: REPORTE DE ABONOS
// ========================================
function generarExcelAbonos($pdo, $data) {
    try {
        $fechaInicio = $data['fechaInicio'] ?? date('Y-m-01');
        $fechaFin = $data['fechaFin'] ?? date('Y-m-t');
        
        $query = "
            SELECT 
                ha.ID_Abono,
                DATE_FORMAT(ha.FechaRegistro, '%d/%m/%Y %H:%i') as Fecha,
                p.ID_Pedido,
                COALESCE(vi.NombreCliente, u.NombreCompleto) as Cliente,
                v.NombreCompleto as Vendedor,
                ha.Monto,
                ha.MetodoPago,
                reg.NombreCompleto as RegistradoPor,
                p.Total as TotalPedido,
                (SELECT SUM(Monto) 
                 FROM HistorialAbonos 
                 WHERE ID_Pedido = p.ID_Pedido 
                 AND FechaRegistro <= ha.FechaRegistro) as Acumulado,
                (p.Total - (SELECT SUM(Monto) 
                            FROM HistorialAbonos 
                            WHERE ID_Pedido = p.ID_Pedido 
                            AND FechaRegistro <= ha.FechaRegistro)) as Saldo
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
        
        $totalAbonos = count($abonos);
        $montoTotal = array_sum(array_column($abonos, 'Monto'));
        
        // Crear Excel
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Reporte de Abonos');
        
        // Título
        $sheet->setCellValue('A1', 'REPORTE DE ABONOS');
        $sheet->mergeCells('A1:K1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        
        // Resumen
        $row = 3;
        $sheet->setCellValue('A' . $row, 'Período:');
        $sheet->setCellValue('B' . $row, date('d/m/Y', strtotime($fechaInicio)) . ' - ' . date('d/m/Y', strtotime($fechaFin)));
        $row++;
        $sheet->setCellValue('A' . $row, 'Total Abonos:');
        $sheet->setCellValue('B' . $row, $totalAbonos);
        $row++;
        $sheet->setCellValue('A' . $row, 'Monto Total:');
        $sheet->setCellValue('B' . $row, '$' . number_format($montoTotal, 2));
        
        $sheet->getStyle('A3:A' . $row)->getFont()->setBold(true);
        
        // Encabezados
        $row += 2;
        $headerRow = $row;
        $headers = ['ID', 'Fecha', 'Pedido', 'Cliente', 'Vendedor', 'Monto', 'Método', 'Acumulado', 'Saldo', 'Total Pedido', 'Registrado Por'];
        
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . $headerRow, $header);
            $col++;
        }
        
        $sheet->getStyle('A' . $headerRow . ':K' . $headerRow)->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FF9800']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
        ]);
        
        // Datos
        $row++;
        foreach ($abonos as $abono) {
            $sheet->setCellValue('A' . $row, $abono['ID_Abono']);
            $sheet->setCellValue('B' . $row, $abono['Fecha']);
            $sheet->setCellValue('C' . $row, $abono['ID_Pedido']);
            $sheet->setCellValue('D' . $row, $abono['Cliente']);
            $sheet->setCellValue('E' . $row, $abono['Vendedor']);
            $sheet->setCellValue('F' . $row, '$' . number_format($abono['Monto'], 2));
            $sheet->setCellValue('G' . $row, $abono['MetodoPago'] ?? 'N/A');
            $sheet->setCellValue('H' . $row, '$' . number_format($abono['Acumulado'], 2));
            $sheet->setCellValue('I' . $row, '$' . number_format($abono['Saldo'], 2));
            $sheet->setCellValue('J' . $row, '$' . number_format($abono['TotalPedido'], 2));
            $sheet->setCellValue('K' . $row, $abono['RegistradoPor']);
            $row++;
        }
        
        // Ajustar anchos
        foreach (range('A', 'K') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
        
        $sheet->getStyle('A' . $headerRow . ':K' . ($row - 1))->applyFromArray([
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]
            ]
        ]);
        
        $filename = 'Reporte_Abonos_' . date('Y-m-d') . '.xlsx';
        
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        header('Cache-Control: max-age=0');
        
        $writer = new Xlsx($spreadsheet);
        $writer->save('php://output');
        exit();
        
    } catch (Exception $e) {
        error_log("Error generarExcelAbonos: " . $e->getMessage());
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ========================================
// EXCEL: REPORTE DE DOCUMENTOS
// ========================================
function generarExcelDocumentos($pdo, $data) {
    try {
        $fechaInicio = $data['fechaInicio'] ?? date('Y-m-01');
        $fechaFin = $data['fechaFin'] ?? date('Y-m-t');
        
        $query = "
            SELECT 
                a.ID_Album,
                a.Titulo,
                DATE_FORMAT(a.FechaSubida, '%d/%m/%Y') as FechaSubida,
                DATE_FORMAT(a.FechaCaducidad, '%d/%m/%Y') as FechaCaducidad,
                a.Estado,
                u.NombreCompleto as Cliente,
                u.Correo,
                COUNT(DISTINCT f.ID_Foto) as TotalFotos,
                COUNT(DISTINCT CASE WHEN f.Descargada = 1 THEN f.ID_Foto END) as Descargadas,
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
        $stmt->execute([':fechaInicio' => $fechaInicio, ':fechaFin' => $fechaFin]);
        $albumes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $totalAlbumes = count($albumes);
        $totalFotos = array_sum(array_column($albumes, 'TotalFotos'));
        $totalDescargas = array_sum(array_column($albumes, 'TotalDescargas'));
        
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Reporte Documentos');
        
        $sheet->setCellValue('A1', 'REPORTE DE DOCUMENTOS');
        $sheet->mergeCells('A1:K1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        
        $row = 3;
        $sheet->setCellValue('A' . $row, 'Período:');
        $sheet->setCellValue('B' . $row, date('d/m/Y', strtotime($fechaInicio)) . ' - ' . date('d/m/Y', strtotime($fechaFin)));
        $row++;
        $sheet->setCellValue('A' . $row, 'Total Álbumes:');
        $sheet->setCellValue('B' . $row, $totalAlbumes);
        $row++;
        $sheet->setCellValue('A' . $row, 'Total Fotos:');
        $sheet->setCellValue('B' . $row, $totalFotos);
        $row++;
        $sheet->setCellValue('A' . $row, 'Total Descargas:');
        $sheet->setCellValue('B' . $row, $totalDescargas);
        
        $sheet->getStyle('A3:A' . $row)->getFont()->setBold(true);
        
        $row += 2;
        $headerRow = $row;
        $headers = ['ID', 'Título', 'Fecha Subida', 'Caducidad', 'Estado', 'Cliente', 'Correo', 'Fotos', 'Descargadas', 'Descargas', 'Días Rest.'];
        
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . $headerRow, $header);
            $col++;
        }
        
        $sheet->getStyle('A' . $headerRow . ':K' . $headerRow)->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2196F3']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
        ]);
        
        $row++;
        foreach ($albumes as $album) {
            $sheet->setCellValue('A' . $row, $album['ID_Album']);
            $sheet->setCellValue('B' . $row, $album['Titulo']);
            $sheet->setCellValue('C' . $row, $album['FechaSubida']);
            $sheet->setCellValue('D' . $row, $album['FechaCaducidad']);
            $sheet->setCellValue('E' . $row, $album['Estado']);
            $sheet->setCellValue('F' . $row, $album['Cliente']);
            $sheet->setCellValue('G' . $row, $album['Correo']);
            $sheet->setCellValue('H' . $row, $album['TotalFotos']);
            $sheet->setCellValue('I' . $row, $album['Descargadas']);
            $sheet->setCellValue('J' . $row, $album['TotalDescargas']);
            $sheet->setCellValue('K' . $row, $album['DiasRestantes']);
            $row++;
        }
        
        foreach (range('A', 'K') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
        
        $sheet->getStyle('A' . $headerRow . ':K' . ($row - 1))->applyFromArray([
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]
            ]
        ]);
        
        $filename = 'Reporte_Documentos_' . date('Y-m-d') . '.xlsx';
        
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        header('Cache-Control: max-age=0');
        
        $writer = new Xlsx($spreadsheet);
        $writer->save('php://output');
        exit();
        
    } catch (Exception $e) {
        error_log("Error generarExcelDocumentos: " . $e->getMessage());
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}
?>