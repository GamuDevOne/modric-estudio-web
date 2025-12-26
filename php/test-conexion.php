<?php
require_once __DIR__ . '/../config.php';

echo "<h1>Test de Conexión (" . APP_ENV . ")</h1>";

try {
    $pdo = getDBConnection();
    echo "<p style='color: green;'>✅ Conexión exitosa</p>";
    
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM usuario");
    $result = $stmt->fetch();
    
    echo "<p>Total de usuarios: {$result['total']}</p>";
    
    // Listar usuarios
    $stmt = $pdo->query("SELECT ID_Usuario, NombreCompleto, Usuario, TipoUsuario FROM usuario");
    echo "<h3>Usuarios en la BD:</h3><ul>";
    while ($user = $stmt->fetch()) {
        echo "<li>ID: {$user['ID_Usuario']} - {$user['NombreCompleto']} ({$user['Usuario']}) - Tipo: {$user['TipoUsuario']}</li>";
    }
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
}
?>