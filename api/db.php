<?php
// db.php - conexión a MySQL (adaptable a XAMPP o Railway/hosting)
$DB_HOST = getenv('DB_HOST') ?: 'localhost';
$DB_USER = getenv('DB_USER') ?: 'root';
$DB_PASS = getenv('DB_PASS') ?: '';
$DB_NAME = getenv('DB_NAME') ?: 'ModricEstudio00';
$DB_PORT = getenv('DB_PORT') ?: 3306;

$mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME, (int)$DB_PORT);

if ($mysqli->connect_errno) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error'  => 'Error de conexión a la base de datos',
        'detail' => $mysqli->connect_error,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
