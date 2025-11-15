<?php
// php/download_album_zip.php

// Configuración de la base de datos
$host = 'localhost';
$dbname = 'ModricEstudio00';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Verificar parámetros
    if (!isset($_GET['idAlbum']) || empty($_GET['idAlbum'])) {
        throw new Exception('ID de álbum no proporcionado');
    }
    
    $idAlbum = intval($_GET['idAlbum']);
    
    // Obtener información del álbum
    $stmt = $pdo->prepare("
        SELECT a.Titulo, a.ID_Cliente
        FROM AlbumCliente a
        WHERE a.ID_Album = :idAlbum
    ");
    $stmt->execute([':idAlbum' => $idAlbum]);
    $album = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$album) {
        throw new Exception('Álbum no encontrado');
    }
    
    // Obtener fotos del álbum
    $stmt = $pdo->prepare("
        SELECT NombreArchivo, RutaArchivo
        FROM FotoAlbum
        WHERE ID_Album = :idAlbum
        ORDER BY FechaSubida ASC
    ");
    $stmt->execute([':idAlbum' => $idAlbum]);
    $fotos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($fotos) === 0) {
        throw new Exception('No hay fotos en este álbum');
    }
    
    // Crear archivo ZIP temporal
    $zipFilename = 'temp_' . uniqid() . '.zip';
    $zipPath = '../temp/' . $zipFilename;
    
    // Crear directorio temp si no existe
    if (!is_dir('../temp')) {
        mkdir('../temp', 0755, true);
    }
    
    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::CREATE) !== TRUE) {
        throw new Exception('No se pudo crear el archivo ZIP');
    }
    
    // Agregar fotos al ZIP
    $contador = 1;
    foreach ($fotos as $foto) {
        if (file_exists($foto['RutaArchivo'])) {
            // Usar nombre original o numerado si hay duplicados
            $extension = pathinfo($foto['NombreArchivo'], PATHINFO_EXTENSION);
            $nombreEnZip = $foto['NombreArchivo'];
            
            // Si ya existe, agregar número
            $temp_nombre = $nombreEnZip;
            $num = 1;
            while ($zip->locateName($temp_nombre) !== false) {
                $nombreSinExt = pathinfo($foto['NombreArchivo'], PATHINFO_FILENAME);
                $temp_nombre = $nombreSinExt . '_' . $num . '.' . $extension;
                $num++;
            }
            
            $zip->addFile($foto['RutaArchivo'], $temp_nombre);
        }
    }
    
    $zip->close();
    
    // Nombre del archivo para descarga
    $tituloLimpio = preg_replace('/[^A-Za-z0-9\-]/', '_', $album['Titulo']);
    $nombreDescarga = $tituloLimpio . '_' . date('Y-m-d') . '.zip';
    
    // Enviar archivo al navegador
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $nombreDescarga . '"');
    header('Content-Length: ' . filesize($zipPath));
    header('Cache-Control: no-cache, must-revalidate');
    header('Pragma: public');
    
    readfile($zipPath);
    
    // Eliminar archivo temporal
    unlink($zipPath);
    
    exit;
    
} catch (Exception $e) {
    header('Content-Type: text/html; charset=utf-8');
    echo '<h1>Error</h1>';
    echo '<p>' . htmlspecialchars($e->getMessage()) . '</p>';
    echo '<a href="javascript:history.back()">Volver</a>';
    exit;
}
?>