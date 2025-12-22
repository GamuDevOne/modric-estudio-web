<?php
/**
 * DIAGNÓSTICO DEL SERVIDOR
 * Verifica la configuración necesaria para subidas de 25MB
 * Acceder: http://localhost/PaginaWebMS/diagnostico-servidor.php
 */

// No requiere autenticación para propósitos de diagnóstico
header('Content-Type: text/html; charset=utf-8');

// Función para formatear bytes
function formatBytes($bytes) {
    $units = ['B', 'KB', 'MB', 'GB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= (1 << (10 * $pow));
    return round($bytes, 2) . ' ' . $units[$pow];
}

// Función para verificar si un valor es suficiente
function verificarSuficiente($actual, $requerido, $tipo = 'bytes') {
    if ($tipo === 'bytes') {
        return $actual >= $requerido ? '✅ OK' : '❌ INSUFICIENTE';
    }
    return 'N/A';
}

// Obtener información
$phpVersion = phpversion();
$postMaxSize = ini_get('post_max_size');
$uploadMaxFilesize = ini_get('upload_max_filesize');
$memoryLimit = ini_get('memory_limit');
$maxExecutionTime = ini_get('max_execution_time');

// Convertir a bytes para comparación
$postMaxSizeBytes = parseSize($postMaxSize);
$uploadMaxFilesizeBytes = parseSize($uploadMaxFilesize);
$memoryLimitBytes = parseSize($memoryLimit);

function parseSize($value) {
    $value = trim($value);
    if ($value === '-1') return PHP_INT_MAX;
    
    $unit = strtolower(substr($value, -1));
    $value = (int)$value;
    
    switch ($unit) {
        case 'g': $value *= 1024;
        case 'm': $value *= 1024;
        case 'k': $value *= 1024;
    }
    return $value;
}

// Información de carpetas
$uploadsDir = __DIR__ . '/uploads/';
$uploadsExists = is_dir($uploadsDir);
$uploadsPermissions = fileperms($uploadsDir);
$uploadsWritable = is_writable($uploadsDir);

// Espacio en disco
$diskTotal = disk_total_space(__DIR__);
$diskFree = disk_free_space(__DIR__);
$diskUsed = $diskTotal - $diskFree;
$diskPercentage = ($diskUsed / $diskTotal) * 100;

// Requerido
$requiredSize = 25 * 1024 * 1024; // 25MB

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnóstico del Servidor - Modric Estudio</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section h2 {
            font-size: 20px;
            margin-bottom: 20px;
            color: #333;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .info-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .info-value {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
        }
        
        .info-status {
            font-size: 14px;
            margin-top: auto;
            padding-top: 10px;
            border-top: 1px solid #dee2e6;
        }
        
        .status-ok {
            color: #28a745;
        }
        
        .status-warning {
            color: #ffc107;
        }
        
        .status-error {
            color: #dc3545;
        }
        
        .alert {
            padding: 16px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid;
        }
        
        .alert-success {
            background: #d4edda;
            border-color: #28a745;
            color: #155724;
        }
        
        .alert-warning {
            background: #fff3cd;
            border-color: #ffc107;
            color: #856404;
        }
        
        .alert-danger {
            background: #f8d7da;
            border-color: #dc3545;
            color: #721c24;
        }
        
        .alert-info {
            background: #d1ecf1;
            border-color: #17a2b8;
            color: #0c5460;
        }
        
        .permission-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            margin-bottom: 10px;
        }
        
        .permission-path {
            font-size: 14px;
            color: #495057;
            font-family: 'Courier New', monospace;
        }
        
        .permission-status {
            font-weight: 600;
        }
        
        .bar-chart {
            background: #e9ecef;
            height: 24px;
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: 600;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
        }
        
        .code-block {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 16px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            overflow-x: auto;
            margin-top: 10px;
        }
        
        .recommendations {
            background: #e7f3ff;
            border-left: 4px solid #2196f3;
            padding: 16px;
            border-radius: 6px;
            margin-top: 20px;
        }
        
        .recommendations h3 {
            color: #1976d2;
            margin-bottom: 10px;
            font-size: 14px;
        }
        
        .recommendations ul {
            margin-left: 20px;
            color: #0d47a1;
            font-size: 13px;
        }
        
        .recommendations li {
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Diagnóstico del Servidor</h1>
            <p>Verificación de configuración para Modric Estudio</p>
        </div>
        
        <div class="content">
            
            <!-- RESUMEN GENERAL -->
            <div class="section">
                <h2>📋 Resumen General</h2>
                
                <?php
                $issues = 0;
                $warnings = 0;
                
                if ($uploadMaxFilesizeBytes < $requiredSize) $issues++;
                if ($postMaxSizeBytes < $requiredSize) $issues++;
                if ($diskFree < ($requiredSize * 10)) $warnings++; // Menos de 10x el tamaño requerido
                if (!$uploadsWritable) $issues++;
                
                if ($issues === 0 && $warnings === 0) {
                    echo '<div class="alert alert-success">✅ <strong>Excelente:</strong> Tu servidor está correctamente configurado para subidas de 25MB</div>';
                } elseif ($issues === 0 && $warnings > 0) {
                    echo '<div class="alert alert-warning">⚠️ <strong>Advertencia:</strong> Tu servidor soporta 25MB pero hay algunas recomendaciones</div>';
                } else {
                    echo '<div class="alert alert-danger">❌ <strong>Error:</strong> Tu servidor NO está configurado para 25MB. Revisa los detalles abajo</div>';
                }
                ?>
            </div>
            
            <!-- CONFIGURACIÓN PHP -->
            <div class="section">
                <h2>⚙️ Configuración PHP</h2>
                <div class="info-grid">
                    <div class="info-card">
                        <div class="info-label">Versión PHP</div>
                        <div class="info-value"><?php echo $phpVersion; ?></div>
                    </div>
                    
                    <div class="info-card">
                        <div class="info-label">Upload Max Filesize</div>
                        <div class="info-value"><?php echo $uploadMaxFilesize; ?></div>
                        <div class="info-status <?php echo $uploadMaxFilesizeBytes >= $requiredSize ? 'status-ok' : 'status-error'; ?>">
                            <?php echo verificarSuficiente($uploadMaxFilesizeBytes, $requiredSize); ?> (Requerido: 25MB)
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <div class="info-label">Post Max Size</div>
                        <div class="info-value"><?php echo $postMaxSize; ?></div>
                        <div class="info-status <?php echo $postMaxSizeBytes >= $requiredSize ? 'status-ok' : 'status-error'; ?>">
                            <?php echo verificarSuficiente($postMaxSizeBytes, $requiredSize); ?> (Requerido: 25MB)
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <div class="info-label">Memory Limit</div>
                        <div class="info-value"><?php echo $memoryLimit; ?></div>
                        <div class="info-status <?php echo $memoryLimitBytes >= (128 * 1024 * 1024) ? 'status-ok' : 'status-warning'; ?>">
                            Recomendado: 128MB+
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <div class="info-label">Max Execution Time</div>
                        <div class="info-value"><?php echo $maxExecutionTime; ?>s</div>
                        <div class="info-status <?php echo intval($maxExecutionTime) >= 60 ? 'status-ok' : 'status-warning'; ?>">
                            Recomendado: 60+ segundos
                        </div>
                    </div>
                </div>
                
                <?php if ($uploadMaxFilesizeBytes < $requiredSize || $postMaxSizeBytes < $requiredSize): ?>
                <div class="recommendations">
                    <h3>⚠️ Cómo corregir en php.ini (XAMPP)</h3>
                    <p>Edita el archivo php.ini y busca estas líneas:</p>
                    <div class="code-block">
upload_max_filesize = 25M
post_max_size = 25M
memory_limit = 256M
max_execution_time = 300
                    </div>
                    <p style="margin-top: 10px; font-size: 12px;">
                        📍 XAMPP: <code>C:\xampp\php\php.ini</code><br>
                        Después de editar, reinicia Apache desde el panel de control de XAMPP.
                    </p>
                </div>
                <?php endif; ?>
            </div>
            
            <!-- PERMISOS DE CARPETAS -->
            <div class="section">
                <h2>🔐 Permisos de Carpetas</h2>
                
                <div class="permission-item">
                    <div>
                        <div class="permission-path"><?php echo realpath($uploadsDir); ?></div>
                        <div style="font-size: 12px; color: #6c757d; margin-top: 4px;">Directorio Principal</div>
                    </div>
                    <div class="permission-status <?php echo $uploadsWritable ? 'status-ok' : 'status-error'; ?>">
                        <?php echo $uploadsWritable ? '✅ Escribible' : '❌ NO Escribible'; ?>
                    </div>
                </div>
                
                <?php if (is_dir($uploadsDir . 'clientes/')): ?>
                <div class="permission-item">
                    <div>
                        <div class="permission-path"><?php echo realpath($uploadsDir . 'clientes/'); ?></div>
                        <div style="font-size: 12px; color: #6c757d; margin-top: 4px;">Subcarpeta Clientes</div>
                    </div>
                    <div class="permission-status <?php echo is_writable($uploadsDir . 'clientes/') ? 'status-ok' : 'status-error'; ?>">
                        <?php echo is_writable($uploadsDir . 'clientes/') ? '✅ Escribible' : '❌ NO Escribible'; ?>
                    </div>
                </div>
                <?php endif; ?>
                
                <div class="recommendations">
                    <h3>⚠️ Cómo corregir permisos en Linux/Hostinger</h3>
                    <p>Conecta por SSH y ejecuta:</p>
                    <div class="code-block">
chmod 755 uploads
chmod 755 uploads/clientes
chown nobody:nobody uploads
chown nobody:nobody uploads/clientes
                    </div>
                    <ul>
                        <li><strong>755:</strong> Permite lectura y escritura</li>
                        <li><strong>nobody:nobody:</strong> Usuario del servidor web</li>
                    </ul>
                </div>
            </div>
            
            <!-- ESPACIO EN DISCO -->
            <div class="section">
                <h2>💾 Espacio en Disco</h2>
                <div class="info-grid">
                    <div class="info-card">
                        <div class="info-label">Espacio Total</div>
                        <div class="info-value"><?php echo formatBytes($diskTotal); ?></div>
                    </div>
                    
                    <div class="info-card">
                        <div class="info-label">Espacio Disponible</div>
                        <div class="info-value <?php echo $diskFree > ($requiredSize * 10) ? 'status-ok' : 'status-warning'; ?>">
                            <?php echo formatBytes($diskFree); ?>
                        </div>
                        <div class="info-status <?php echo $diskFree > ($requiredSize * 10) ? 'status-ok' : 'status-warning'; ?>">
                            <?php echo $diskFree > ($requiredSize * 10) ? '✅ Suficiente' : '⚠️ Limitado'; ?>
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <div class="info-label">Espacio Usado</div>
                        <div class="info-value"><?php echo formatBytes($diskUsed); ?></div>
                        <div class="bar-chart">
                            <div class="bar-fill" style="width: <?php echo $diskPercentage; ?>%">
                                <?php echo round($diskPercentage, 1); ?>%
                            </div>
                        </div>
                    </div>
                </div>
                
                <?php if ($diskFree < ($requiredSize * 10)): ?>
                <div class="alert alert-warning">
                    ⚠️ <strong>Espacio bajo:</strong> Tienes menos de 10x el tamaño máximo de archivo. Considera liberar espacio.
                </div>
                <?php endif; ?>
            </div>
            
            <!-- PRUEBA DE SUBIDA -->
            <div class="section">
                <h2>✅ Checklist Antes de Hostinger</h2>
                <div class="info-grid">
                    <div class="info-card">
                        <div class="info-label">Paso 1</div>
                        <div class="info-value" style="font-size: 14px;">upload_max_filesize ≥ 25M</div>
                        <div class="info-status <?php echo $uploadMaxFilesizeBytes >= $requiredSize ? 'status-ok' : 'status-error'; ?>">
                            <?php echo $uploadMaxFilesizeBytes >= $requiredSize ? '✅ Listo' : '❌ Pendiente'; ?>
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <div class="info-label">Paso 2</div>
                        <div class="info-value" style="font-size: 14px;">post_max_size ≥ 25M</div>
                        <div class="info-status <?php echo $postMaxSizeBytes >= $requiredSize ? 'status-ok' : 'status-error'; ?>">
                            <?php echo $postMaxSizeBytes >= $requiredSize ? '✅ Listo' : '❌ Pendiente'; ?>
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <div class="info-label">Paso 3</div>
                        <div class="info-value" style="font-size: 14px;">Carpeta /uploads escribible</div>
                        <div class="info-status <?php echo $uploadsWritable ? 'status-ok' : 'status-error'; ?>">
                            <?php echo $uploadsWritable ? '✅ Listo' : '❌ Pendiente'; ?>
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <div class="info-label">Paso 4</div>
                        <div class="info-value" style="font-size: 14px;">Espacio disponible > 250MB</div>
                        <div class="info-status <?php echo $diskFree > ($requiredSize * 10) ? 'status-ok' : 'status-warning'; ?>">
                            <?php echo $diskFree > ($requiredSize * 10) ? '✅ Listo' : '⚠️ Revisar'; ?>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- INSTRUCCIONES HOSTINGER -->
            <div class="section">
                <h2>🚀 Configuración en Hostinger</h2>
                <div class="recommendations" style="background: #f0f8ff; border-color: #0066cc;">
                    <h3 style="color: #0066cc;">Pasos a seguir en Hostinger:</h3>
                    <ol style="margin-left: 20px; color: #0d47a1; font-size: 13px;">
                        <li><strong>Panel de Control → PHP:</strong> Configura upload_max_filesize y post_max_size a 25M</li>
                        <li><strong>File Manager:</strong> Sube la carpeta del proyecto a public_html</li>
                        <li><strong>Terminal SSH:</strong> Ejecuta los comandos chmod para permisos</li>
                        <li><strong>Backup:</strong> Antes de cualquier cambio, haz backup de tu base de datos</li>
                        <li><strong>Test:</strong> Prueba subir un archivo de 25MB desde la interfaz web</li>
                    </ol>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>🔧 Diagnóstico generado: <?php echo date('d/m/Y H:i:s'); ?></p>
            <p style="margin-top: 8px;">Para más información, visita el panel de Hostinger → Avanzado → PHP</p>
        </div>
    </div>
</body>
</html>
