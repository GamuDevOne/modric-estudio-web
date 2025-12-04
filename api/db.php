<?php
// cambiar valores a futuro
$DB_HOST = 'localhost';
$DB_USER = 'TU_USUARIO_BD';
$DB_PASS = 'TU_PASSWORD_BD';
$DB_NAME = 'NOMBRE_DE_LA_BD';

$mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);

if ($mysqli->connect_errno) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error'  => 'Error conectando a MySQL',
        'detail' => $mysqli->connect_error
    ]);
    exit;
}

$mysqli->set_charset('utf8mb4');
?>